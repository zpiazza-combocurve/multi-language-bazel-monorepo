import { GetGroupRowAggParams } from 'ag-grid-community';
import { isEqual, noop, partition } from 'lodash';
import {
	ForwardedRef,
	RefObject,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import { CTRL_OR_COMMAND_KEY, withErrorBoundary } from '@/components';
import AdvancedTable from '@/components/AdvancedTable';
import { ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { getDefaultShortcutsInfo, useContextMenuItems } from '@/components/AdvancedTable/shared';
import { AdvancedTableRef } from '@/components/AdvancedTable/types';
import advancedTableStyles from '@/components/AgGrid.module.scss';
import { tryCatchFalse, useHotkey, useSetHotkeyScope } from '@/components/hooks';
import { useDraggingResize } from '@/components/hooks/useDraggingResize';
import { Divider, Stack } from '@/components/v2';
import { AdvancedModelViewRef } from '@/cost-model/detail-components/AdvancedModelView';
import AdvancedModelToolbar from '@/cost-model/detail-components/AdvancedModelView/AdvancedModelToolbar';
import advancedModelViewStyles from '@/cost-model/detail-components/AdvancedModelView/advanced-model-view.module.scss';
import {
	addTreeDataInfo,
	addValidationInfo,
	adjustDataSeriesRanges,
	concatenateKeyCategory,
	getKeyCategoryCount,
	organizeRows,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { EconModelV2Ref } from '@/cost-model/detail-components/EconModelV2';
import { camelizeObjectKeys } from '@/helpers/text';
import { AssumptionKey } from '@/inpt-shared/constants';

import { StreamPropertiesRow } from '../types';
import {
	BTU_VALUES,
	COMPOSITIONAL_ECONOMICS_CATEGORIES,
	COMPOSITIONAL_ECONOMICS_COMPONENTS,
	COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS,
	COMPOSITIONAL_ECONOMICS_KEY,
	COMPOSITIONAL_ECONOMICS_SOURCES,
	GAL_PER_LB_MOL_FACTORS,
} from './constants';
import { MAX_KEY_CATEGORY_COUNT, useTemplate } from './schemaValidation';
import {
	calculateGroupRowAggState,
	computePlantEfficiency,
	computePostExtraction,
	computeRemainingMolPercentage,
	computeShrinkPercentRemaining,
	computeYield,
	getCompEconColumnsDef,
	validationOptions,
} from './shared';
import { CompositionalEconomicsRow, CompositionalEconomicsRowAgg } from './types';

interface CompositionalEconomicsProps {
	compEconRows?: CompositionalEconomicsRow[];
	handleHasValidationErrors(
		key: 'streamProperties' | 'compositionalEconomics',
		rowData: StreamPropertiesRow[] | CompositionalEconomicsRow[]
	): void;
	groupRowAggState?: { groupRowAgg: CompositionalEconomicsRowAgg; rowsLength: number };
	setGroupRowAggState(groupRowAggState: { groupRowAgg: CompositionalEconomicsRowAgg; rowsLength: number }): void;
	econModelRef?: RefObject<EconModelV2Ref>;
}

const CompositionalEconomics = forwardRef(function CompositionalEconomics(
	props: CompositionalEconomicsProps,
	ref: ForwardedRef<AdvancedModelViewRef<CompositionalEconomicsRow>>
) {
	const { compEconRows, handleHasValidationErrors, econModelRef, groupRowAggState, setGroupRowAggState } = props;

	const [, setEditing] = useState(false);
	const [{ canUndo, canRedo }, setUndoState] = useState({ canUndo: false, canRedo: false });
	const [addRowButtonDisabled, setAddRowButtonDisabled] = useState(false);
	const [adjustedRowData, setAdjustedRowData] = useState<CompositionalEconomicsRow[]>([]);

	const shortcutsInfo = getDefaultShortcutsInfo({
		isELT: false,
		enableTimeSeries: false,
		enableOrganizeByKey: true,
	});

	const advancedTableRef = useRef<AdvancedTableRef<CompositionalEconomicsRow>>(null);

	useImperativeHandle(ref, () => ({ advancedTableRef }));

	const modelHotkeysScope = useMemo(() => 'advanced-model-hotkeys-scope-' + uuidv4(), []);

	const { deleteSelectedRowsItem } = useContextMenuItems(advancedTableRef);

	const contextMenuItems = useMemo(() => [deleteSelectedRowsItem], [deleteSelectedRowsItem]);

	const { compositionalEconomicsRowSchema } = useTemplate();
	const { dividerRef, boxARef, wrapperRef } = useDraggingResize({});
	const setHotkeysScope = useSetHotkeyScope(false);

	const handleRowCalculations = (rowData: CompositionalEconomicsRow[]): CompositionalEconomicsRow[] => {
		// 1st we get the row indexes to replace them in the correct place afterwards:
		const rowsWithPosition = rowData.map((row, index) => ({ ...row, _rowPosition: index })).filter((row) => !!row);

		// Now we split between remaining rows and components rows:
		const [remainingRows, componentsRows] = partition(
			rowsWithPosition,
			({ category }) => category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING
		);

		// We then partition into manual rows and calculated rows:
		const [manualRows, calculatedRows] = partition(
			componentsRows,
			({ source }) => source === COMPOSITIONAL_ECONOMICS_SOURCES.MANUAL
		);

		// We calculate the plant efficiency for the rows with "manual" source:
		const manualRowsWithComputedPlantEfficiency = manualRows.map((row) => ({
			...row,
			plantEfficiency: computePlantEfficiency(row),
		}));

		// We calculate the yield for the rows with "calculated" source and set 0 as default value
		// for plant efficiency when it is undefined and not remaining category:
		const rowsWithComputedYield = calculatedRows.map((row) => ({
			...row,
			value: computeYield(row),
			plantEfficiency:
				row.category !== COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING && row.plantEfficiency === undefined
					? 0
					: row.plantEfficiency,
		}));

		// We calculate the shrink for all rows:
		const calculatedComponentsRows = [...manualRowsWithComputedPlantEfficiency, ...rowsWithComputedYield].map(
			(row) => ({
				...row,
				shrink: computeShrinkPercentRemaining(row),
			})
		);

		// We now set all rows into a single array and set the remaining rows plant efficiency to undefined
		// and the mol percentage to the remaining mol percentage:
		const allRows = [
			...calculatedComponentsRows,
			...remainingRows.map((row) => ({
				...row,
				plantEfficiency: undefined,
				molPercentage: computeRemainingMolPercentage(componentsRows),
				shrink: row.shrink ?? 0,
			})),
		];

		// We calculate the post extraction for all rows:
		const subtotalShrink = allRows.reduce((acc, { shrink }) => Number(acc) + Number(shrink ?? 0), 0);

		const allRowsWithPostExtraction = allRows.map((row) => ({
			...row,
			postExtraction: computePostExtraction(row, subtotalShrink),
		}));

		// Now we order all the rows by the original position, and then we remove the position property:
		return allRowsWithPostExtraction
			.sort((a, b) => a._rowPosition - b._rowPosition)
			.map(({ _rowPosition, ...rest }) => rest);
	};

	const handleRowButtonDisable = useCallback(
		(rowData: CompositionalEconomicsRow[]) => {
			if (rowData.length < COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS.length) {
				if (addRowButtonDisabled) setAddRowButtonDisabled(false);
				return;
			}

			const allKeyCategoriesAreAdded = COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS.every(({ key, category }) =>
				rowData.find(({ key: rowKey, category: rowCategory }) => key === rowKey && category === rowCategory)
			);
			if (allKeyCategoriesAreAdded && !addRowButtonDisabled) setAddRowButtonDisabled(true);
			if (!allKeyCategoriesAreAdded && addRowButtonDisabled) setAddRowButtonDisabled(false);
		},
		[addRowButtonDisabled]
	);

	const getRowDataOnAdd = useCallback(() => {
		const keyCategoryCount = getKeyCategoryCount(advancedTableRef?.current?.rowData);
		const firstKeyCategory = COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS[0];
		const tableIsEmpty = !Object.keys(keyCategoryCount).length;

		if (tableIsEmpty) return firstKeyCategory;

		const next = COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS.find(({ key, category = '' }) => {
			const keyCategoryPair = concatenateKeyCategory({
				key,
				category,
			});
			if (keyCategoryCount[keyCategoryPair] >= MAX_KEY_CATEGORY_COUNT[keyCategoryPair]) return false;
			return true;
		});

		return next;
	}, []);

	const handleAddRow = useCallback(() => {
		if (addRowButtonDisabled) return;
		advancedTableRef.current?.setRowData((currentRows) => {
			const eltIndex = currentRows.findIndex(({ isELTRow }) => isELTRow);
			const indexOfFirstELTRowIfExists = Math.max(eltIndex, 0);
			const sliceIndex = eltIndex >= 0 ? indexOfFirstELTRowIfExists : currentRows.length;

			return [
				...currentRows.slice(0, sliceIndex),
				{
					[ROW_ID_KEY]: uuidv4(),
					...getRowDataOnAdd(),
				},
				...currentRows.slice(sliceIndex),
			];
		});
	}, [addRowButtonDisabled, getRowDataOnAdd]);

	const handleAdjustDateSeriesRanges = (rowData: CompositionalEconomicsRow[]) =>
		adjustDataSeriesRanges({
			rowData,
			nonDataSeriesKeys: [COMPOSITIONAL_ECONOMICS_KEY],
		});

	const setDefaultValuesForChangedCategories = useCallback(
		(rowData: CompositionalEconomicsRow[]) => {
			const rowsWithDefaultValues = rowData.map((row) => {
				const categoryHasChanged = adjustedRowData.find(
					({ [ROW_ID_KEY]: rowId, category }) => rowId === row[ROW_ID_KEY] && category !== row.category
				);
				if (!categoryHasChanged) return row;
				return {
					...row,
					molFactor: GAL_PER_LB_MOL_FACTORS[row.category ?? ''],
					btu: BTU_VALUES[row.category ?? ''],
				};
			});
			return rowsWithDefaultValues;
		},
		[adjustedRowData]
	);

	const adjustRowData = useCallback(
		(rows: CompositionalEconomicsRow[]) => {
			handleRowButtonDisable(rows);
			const rowsWithDefaultValues = setDefaultValuesForChangedCategories(rows);
			const rowDataWithCalculations = handleRowCalculations(rowsWithDefaultValues);
			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowDataWithCalculations);
			const rowsWithValidationInfo = addValidationInfo<CompositionalEconomicsRow>(
				rowsWithDataSeriesRangesAdjusted,
				() => compositionalEconomicsRowSchema,
				validationOptions
			);
			setAdjustedRowData(rowsWithValidationInfo);
			advancedTableRef?.current?.agGrid?.api?.refreshCells({ force: true });
			return addTreeDataInfo(rowsWithValidationInfo);
		},
		[handleRowButtonDisable, setDefaultValuesForChangedCategories, compositionalEconomicsRowSchema]
	);

	const handleClearData = useCallback(() => {
		advancedTableRef.current?.setRowData([]);
	}, []);

	const organizeByKey = useMemo(
		() => ({
			label: 'Organize by Key',
			onClick: (rows: CompositionalEconomicsRow[]) =>
				organizeRows<CompositionalEconomicsRow>(
					rows,
					[COMPOSITIONAL_ECONOMICS_KEY],
					COMPOSITIONAL_ECONOMICS_COMPONENTS
				),
		}),
		[]
	);

	useEffect(() => {
		handleHasValidationErrors('compositionalEconomics', adjustedRowData);
	}, [adjustedRowData, handleHasValidationErrors]);

	useEffect(() => {
		if (compEconRows?.length) {
			const camelizedRows = compEconRows.map((row) => {
				const camelizedRow = camelizeObjectKeys(row) as CompositionalEconomicsRow;
				return { ...camelizedRow, [ROW_ID_KEY]: uuidv4() };
			});
			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(camelizedRows);
			const rowsWithValidationInfo = addValidationInfo<CompositionalEconomicsRow>(
				rowsWithDataSeriesRangesAdjusted,
				() => compositionalEconomicsRowSchema,
				validationOptions
			);
			const rowsWithTreeDataInfo = addTreeDataInfo(rowsWithValidationInfo);
			advancedTableRef.current?.setRowData(rowsWithTreeDataInfo);
		} else {
			handleClearData();
		}
	}, [compEconRows, compositionalEconomicsRowSchema, handleClearData]);

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+s`,
		modelHotkeysScope,
		tryCatchFalse(econModelRef?.current ? econModelRef.current.handleSaveModel : noop)
	);

	const handleGetGroupRowAgg = (params: GetGroupRowAggParams): CompositionalEconomicsRowAgg => {
		const newGroupRowAggState = calculateGroupRowAggState(params);

		if (
			!isEqual(groupRowAggState?.groupRowAgg, newGroupRowAggState.groupRowAgg) ||
			groupRowAggState?.rowsLength !== newGroupRowAggState.rowsLength
		) {
			setGroupRowAggState(newGroupRowAggState);
		}

		return newGroupRowAggState.groupRowAgg;
	};

	return (
		<div ref={wrapperRef} className={advancedModelViewStyles['wrapper']} style={{ flex: 1, width: '100%' }}>
			<div
				ref={boxARef}
				className={advancedModelViewStyles['box']}
				onClick={() => {
					setHotkeysScope(modelHotkeysScope);
					return false;
				}}
				style={{ flex: '0.4 1 auto' }}
			>
				<Stack style={{ flex: 1, marginBottom: '8px' }} spacing={1}>
					<AdvancedModelToolbar
						addRowLabel='Compositional'
						addRowButtonDisabled={addRowButtonDisabled}
						assumptionKey={AssumptionKey.streamProperties}
						tableRef={advancedTableRef}
						econModelRef={econModelRef}
						canUndo={canUndo}
						canRedo={canRedo}
						handleAddRow={handleAddRow}
						shortcutsInfo={shortcutsInfo}
						hotkeysScope={modelHotkeysScope}
						hideLookupRows
						onClearData={handleClearData}
						enableCollapsibleRows={false}
						organizeRows={organizeByKey}
					/>
					<AdvancedTable<CompositionalEconomicsRow>
						ref={advancedTableRef}
						className={advancedTableStyles['selected-cell-out-of-focus']}
						css={{ flex: 1 }}
						adjustRowData={adjustRowData}
						getColumnsDef={getCompEconColumnsDef}
						onEditingChange={setEditing}
						onUndoChange={setUndoState}
						hotkeysScope={modelHotkeysScope}
						contextMenuItems={contextMenuItems}
						groupIncludeTotalFooter
						getGroupRowAgg={handleGetGroupRowAgg}
					/>
				</Stack>
			</div>
			<div ref={dividerRef} className={advancedModelViewStyles['handler']}>
				<Divider style={{ padding: '1px 0 1px 0' }} />
			</div>
		</div>
	);
} as React.ForwardRefRenderFunction<AdvancedModelViewRef<CompositionalEconomicsRow>, CompositionalEconomicsProps>);

export default withErrorBoundary(CompositionalEconomics);
