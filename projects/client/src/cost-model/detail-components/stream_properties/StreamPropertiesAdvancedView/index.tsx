import { RowNode } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { withErrorBoundary } from '@/components';
import {
	IS_NESTED_ROW_KEY,
	ROW_ID_KEY,
	TOOLTIP_MESSAGE_KEY,
	TREE_DATA_KEY,
} from '@/components/AdvancedTable/constants';
import {
	advancedModelStateIsValid,
	getDefaultShortcutsInfo,
	isNestedRowOnPaste,
	useContextMenuItems,
} from '@/components/AdvancedTable/shared';
import advancedTableStyles from '@/components/AgGrid.module.scss';
import AdvancedModelView, { AdvancedModelViewRef } from '@/cost-model/detail-components/AdvancedModelView';
import { AdvancedModelViewWrapper } from '@/cost-model/detail-components/AdvancedModelView/extra-components/AdvancedModelViewWrapper';
import {
	TooltipsByColumnAndValue,
	addTooltipInfo,
	addTreeDataInfo,
	addValidationInfo,
	adjustDataSeriesRanges,
	concatenateKeyCategory,
	getKeyCategoryCount,
	organizeRows,
	rehydrateRateAndRowColumnValues,
	titleCase,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { AdvancedEconModelProps } from '@/cost-model/detail-components/EconModelV2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';

import CompositionalEconomics from './CompositionalEconomics';
import { CompositionalEconomicsRow, CompositionalEconomicsRowAgg } from './CompositionalEconomics/types';
import {
	GAS_SHRINK_SOURCES,
	STREAM_PROPERTIES_CATEGORIES,
	STREAM_PROPERTIES_KEYS,
	STREAM_PROPERTIES_KEY_CATEGORIES,
	STREAM_PROPERTIES_RATE_LABELS,
} from './constants';
import { MAX_KEY_CATEGORY_COUNT, useTemplate } from './schemaValidation';
import { assumptionToRows, getStreamPropertiesColumnsDef, rowsToAssumption } from './shared';
import { StreamPropertiesRow } from './types';

const STREAM_PROPERTIES_KEYS_ARRAY = Object.values(STREAM_PROPERTIES_KEYS);
const STREAM_PROPERTIES_CATEGORIES_ARRAY = Object.values(STREAM_PROPERTIES_CATEGORIES);

function StreamPropertiesAdvancedView(econModelProps: AdvancedEconModelProps) {
	const { project } = useAlfa();
	assert(project, 'Expected project to be in context');
	const shortcutsConfig = {
		isELT: false,
		showRunEconomics: !!econModelProps?.wellAssignment,
		enableTimeSeries: true,
		enableOrganizeByKey: true,
	};

	const [groupRowAggState, setGroupRowAggState] = useState<{
		groupRowAgg: CompositionalEconomicsRowAgg;
		rowsLength: number;
	}>();

	const [addRowButtonDisabled, setAddRowButtonDisabled] = useState(false);
	const [compEconRows, setCompEconRows] = useState<CompositionalEconomicsRow[]>([]);
	const [hasValidationErrors, setHasValidationErrors] = useState<Record<string, boolean>>({
		streamProperties: false,
		compositionalEconomics: false,
	});
	const [localAdvancedModelViewRef, setLocalAdvancedModelViewRef] = useState(
		useRef<AdvancedModelViewRef<StreamPropertiesRow>>(null)
	);

	const advancedModelViewRef = useRef<AdvancedModelViewRef<StreamPropertiesRow>>(null);
	const compEconTableRef = useRef<AdvancedModelViewRef<CompositionalEconomicsRow>>(null);

	useEffect(() => {
		setLocalAdvancedModelViewRef(advancedModelViewRef);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [advancedModelViewRef?.current]);

	const { templateQuery, timeSeriesSchema, streamPropertiesRowSchema } = useTemplate(
		project._id,
		groupRowAggState?.rowsLength
	);

	const { isCompositionalEconomicsEnabled } = useLDFeatureFlags();

	const handleHasValidationErrors = useCallback(
		(
			key: 'streamProperties' | 'compositionalEconomics',
			rowData: StreamPropertiesRow[] | CompositionalEconomicsRow[]
		) => {
			const stateHasErrors = !advancedModelStateIsValid(rowData);
			if (stateHasErrors === hasValidationErrors[key]) return;
			setHasValidationErrors({ ...hasValidationErrors, [key]: stateHasErrors });
		},
		[hasValidationErrors]
	);

	const organizeByKey = useMemo(
		() => ({
			label: 'Organize by Key',
			onClick: (rows: StreamPropertiesRow[]) =>
				organizeRows<StreamPropertiesRow>(
					rows,
					STREAM_PROPERTIES_KEYS_ARRAY,
					STREAM_PROPERTIES_CATEGORIES_ARRAY
				),
		}),
		[]
	);

	const getRowDataOnAdd = useCallback(() => {
		const keyCategoryCount = getKeyCategoryCount(advancedModelViewRef.current?.advancedTableRef?.current?.rowData);
		const firstKeyCategory = STREAM_PROPERTIES_KEY_CATEGORIES[0];
		const tableIsEmpty = !Object.keys(keyCategoryCount).length;

		if (tableIsEmpty) return firstKeyCategory;

		const next = STREAM_PROPERTIES_KEY_CATEGORIES.find(({ key, category = '' }) => {
			const keyCategoryPair = concatenateKeyCategory({
				key,
				category,
			});
			if (keyCategoryCount[keyCategoryPair] >= MAX_KEY_CATEGORY_COUNT[keyCategoryPair]) return false;
			return true;
		});

		return next;
	}, []);

	const handleAdjustDateSeriesRanges = (rowData: StreamPropertiesRow[]) =>
		adjustDataSeriesRanges({
			rowData,
			nonDataSeriesKeys: [STREAM_PROPERTIES_KEYS.BTU],
			rateLabels: STREAM_PROPERTIES_RATE_LABELS,
		});

	const getAssumptionFromState = useCallback(
		(rows) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const rowsWithoutLookupLines = rows.filter((r) => !r.isFromELTDataLines);

			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowsWithoutLookupLines);

			return rowsToAssumption(
				rowsWithDataSeriesRangesAdjusted,
				templateQuery.data.template.fields,
				compEconTableRef.current?.advancedTableRef?.current?.rowData
			);
		},
		[templateQuery.data]
	);

	const getRowSchema = useCallback(
		(row) => (row[IS_NESTED_ROW_KEY] ? timeSeriesSchema : streamPropertiesRowSchema),
		[timeSeriesSchema, streamPropertiesRowSchema]
	);

	const fixRowsWithDivergentCategoryGroup = (rowData: StreamPropertiesRow[]) => {
		if (!rowData.length) return rowData;
		const rowsWithDivergentCategoryGroup = rowData.filter((row) => {
			//returns rows with nullish category_group
			if (!row.category_group) return row;

			//return rows with category_group different than expected
			const categoryGroup = STREAM_PROPERTIES_KEY_CATEGORIES.find(
				({ key, category }) => key === row.key && category === row.category
			)?.category_group;
			if (row.category_group !== categoryGroup) return row;

			return undefined;
		});

		//if there are not any divergencies then nothing is done
		if (!rowsWithDivergentCategoryGroup.length) return rowData;

		//if there are divergencies then We map all rows with their correct row_groups and update the table
		const rowDataWithCategoryGroup = rowData.map((row) => {
			const categoryGroup = STREAM_PROPERTIES_KEY_CATEGORIES.find(
				({ key, category }) => key === row.key && category === row.category
			)?.category_group;
			if (categoryGroup) row.category_group = categoryGroup;
			return row;
		});
		return rowDataWithCategoryGroup;
	};

	const adjustGasShrinkValue = useCallback(
		(rowData: StreamPropertiesRow[]) => {
			if (!isCompositionalEconomicsEnabled) return undefined;

			const calculatedShrink = groupRowAggState?.groupRowAgg?.shrink;

			const gasShrinkRow = rowData.find(
				({ key, category }) =>
					key === STREAM_PROPERTIES_KEYS.GAS && category === STREAM_PROPERTIES_CATEGORIES.SHRINK
			);

			if (!!gasShrinkRow && !groupRowAggState?.rowsLength) {
				return rowData.map((row) =>
					row.key === STREAM_PROPERTIES_KEYS.GAS && row.category === STREAM_PROPERTIES_CATEGORIES.SHRINK
						? { ...row, source: undefined }
						: row
				);
			}

			if (!gasShrinkRow && !!groupRowAggState?.rowsLength) {
				const defaultGasShrinkRow = STREAM_PROPERTIES_KEY_CATEGORIES.filter(
					({ key, category = '' }) =>
						key === STREAM_PROPERTIES_KEYS.GAS && category === STREAM_PROPERTIES_CATEGORIES.SHRINK
				).map((row) => {
					const rowId = uuidv4();
					return {
						...row,
						[ROW_ID_KEY]: rowId,
						[TREE_DATA_KEY]: [rowId],
						source: GAS_SHRINK_SOURCES.FROM_COMP,
						value: Number(calculatedShrink),
					};
				})[0] as StreamPropertiesRow;
				return [...rowData, defaultGasShrinkRow];
			}

			if (gasShrinkRow?.source !== GAS_SHRINK_SOURCES.FROM_COMP || gasShrinkRow.value !== calculatedShrink) {
				return rowData.map((row) => {
					if (
						row.key === STREAM_PROPERTIES_KEYS.GAS &&
						row.category === STREAM_PROPERTIES_CATEGORIES.SHRINK
					) {
						row.source = GAS_SHRINK_SOURCES.FROM_COMP;
						row.value = calculatedShrink;
					}
					return row;
				});
			}
			return undefined;
		},
		[groupRowAggState?.groupRowAgg?.shrink, groupRowAggState?.rowsLength, isCompositionalEconomicsEnabled]
	);

	const getRowCellTooltips = useCallback(() => {
		let tooltipsByColumnAndValue = {} as TooltipsByColumnAndValue;

		if (Number(groupRowAggState?.groupRowAgg?.value) > 0) {
			tooltipsByColumnAndValue = {
				...tooltipsByColumnAndValue,
				key: {
					NGL: 'Warning: with NGL Yield and Compositional inputs you are potentially double dipping.',
				},
			};
		}

		return tooltipsByColumnAndValue;
	}, [groupRowAggState?.groupRowAgg?.value]);

	const adjustRowData = useCallback(
		(streamPropertiesRows: StreamPropertiesRow[]) => {
			// Here, we are upper/title casing the key values for the rows
			// before adjusting for gas shrink values as if we do so
			// at the validation step, there's a chance a new Gas Shrink
			// row from being created due to the casing.
			const streamPropertiesRowsToAdjust = streamPropertiesRows.map((row) => ({
				...row,
				key: row.key
					? ['ngl', 'btu'].includes(row.key.toLowerCase())
						? row.key.toUpperCase()
						: titleCase(row.key)
					: row.key,
			}));
			const rowsWithGasShrinkAdjusted = adjustGasShrinkValue(streamPropertiesRowsToAdjust);
			const updatedRowValues = rehydrateRateAndRowColumnValues({
				rowData: rowsWithGasShrinkAdjusted ?? streamPropertiesRowsToAdjust,
				rateLabels: STREAM_PROPERTIES_RATE_LABELS,
			});
			const rowsWithCategoryGroupFixed = fixRowsWithDivergentCategoryGroup(updatedRowValues);
			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowsWithCategoryGroupFixed);
			const rowsWithValidation = addValidationInfo<StreamPropertiesRow>(
				rowsWithDataSeriesRangesAdjusted,
				getRowSchema,
				{ includeInContext: { keyCategoryCount: true, rowData: true } }
			);
			handleHasValidationErrors('streamProperties', rowsWithValidation);
			const tooltipsByColumnAndValue = getRowCellTooltips();
			const rowsWithValidationAndTooltips = addTooltipInfo(rowsWithValidation, tooltipsByColumnAndValue);
			return rowsWithValidationAndTooltips;
		},
		[adjustGasShrinkValue, getRowSchema, handleHasValidationErrors, getRowCellTooltips]
	);

	const handleRowButtonDisable = (rowData: StreamPropertiesRow[]) => {
		if (rowData.length < STREAM_PROPERTIES_KEY_CATEGORIES.length) {
			if (addRowButtonDisabled) setAddRowButtonDisabled(false);
			return;
		}

		const allKeyCategoriesAreAdded = STREAM_PROPERTIES_KEY_CATEGORIES.every(({ key, category }) =>
			rowData.find(({ key: rowKey, category: rowCategory }) => key === rowKey && category === rowCategory)
		);
		if (allKeyCategoriesAreAdded && !addRowButtonDisabled) setAddRowButtonDisabled(true);
		if (!allKeyCategoriesAreAdded && addRowButtonDisabled) setAddRowButtonDisabled(false);
	};

	const onRowDataChange = (rowData: StreamPropertiesRow[]) => {
		handleRowButtonDisable(rowData);
	};

	const getStateFromAssumption = useCallback(
		(assumption) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const assumptionCompEconRows = assumption.options?.compositional_economics?.rows || [];
			setCompEconRows(assumptionCompEconRows);

			const rowsFromAssumption = assumptionToRows(assumption);
			if (!rowsFromAssumption.length) return [];
			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(
				organizeRows<StreamPropertiesRow>(
					rowsFromAssumption,
					STREAM_PROPERTIES_KEYS_ARRAY,
					STREAM_PROPERTIES_CATEGORIES_ARRAY
				)
			);
			return rowsWithDataSeriesRangesAdjusted;
		},
		[templateQuery.data]
	);

	const {
		insertTimeSeriesItem,
		deleteSelectedRowsItem,
		deleteSelectedRowsAndTimeSeriesItem,
		toggleRowsItem,
		copyRowsItem,
	} = useContextMenuItems(localAdvancedModelViewRef.current?.advancedTableRef);

	const contextMenuItems = useMemo(
		() => [
			insertTimeSeriesItem,
			deleteSelectedRowsItem,
			deleteSelectedRowsAndTimeSeriesItem,
			toggleRowsItem,
			copyRowsItem,
		],
		[
			insertTimeSeriesItem,
			deleteSelectedRowsItem,
			deleteSelectedRowsAndTimeSeriesItem,
			toggleRowsItem,
			copyRowsItem,
		]
	);

	const handleGetContextMenuItems = useCallback(
		(node: RowNode) => {
			if (
				isCompositionalEconomicsEnabled &&
				node.data.key === STREAM_PROPERTIES_KEYS.GAS &&
				node.data.category === STREAM_PROPERTIES_CATEGORIES.SHRINK &&
				!!groupRowAggState?.rowsLength
			) {
				return [];
			}
			return contextMenuItems;
		},
		[contextMenuItems, groupRowAggState?.rowsLength, isCompositionalEconomicsEnabled]
	);

	const isStateValid = useCallback(() => Object.values(hasValidationErrors).every((v) => !v), [hasValidationErrors]);

	useEffect(() => {
		const streamPropertiesRows = advancedModelViewRef.current?.advancedTableRef?.current?.rowData || [];
		const updatedGasShrinkRows = adjustGasShrinkValue(streamPropertiesRows);
		if (updatedGasShrinkRows && updatedGasShrinkRows?.length) {
			advancedModelViewRef?.current?.advancedTableRef?.current?.setRowData(updatedGasShrinkRows);
		}
	}, [adjustGasShrinkValue]);

	useEffect(() => {
		const streamPropertiesRows = advancedModelViewRef.current?.advancedTableRef?.current?.rowData || [];
		const tooltipsByColumnAndValue = getRowCellTooltips();
		const rowsWithTooltips = addTooltipInfo(streamPropertiesRows, tooltipsByColumnAndValue);

		const currentRowData = advancedModelViewRef?.current?.advancedTableRef?.current?.rowData;
		const currentRowDataHasTooltip = currentRowData?.filter((row) => row[TOOLTIP_MESSAGE_KEY]) || [];

		const newRowsHasTooltip = rowsWithTooltips?.filter((row) => row[TOOLTIP_MESSAGE_KEY]) || [];

		if (newRowsHasTooltip.length || currentRowDataHasTooltip?.length) {
			advancedModelViewRef?.current?.advancedTableRef?.current?.setRowData(rowsWithTooltips);
			// This transaction is required for rows with tooltip changes to be properly
			// re-rendered through the CellRendererRowGroup without performing a major
			// table update.
			advancedModelViewRef?.current?.advancedTableRef?.current?.agGrid?.api?.applyTransaction({
				remove: [...currentRowDataHasTooltip, ...newRowsHasTooltip],
			});
		}
	}, [getRowCellTooltips]);

	return (
		<AdvancedModelView<StreamPropertiesRow>
			ref={advancedModelViewRef}
			project={project._id}
			assumptionKey={AssumptionKey.streamProperties}
			econModelProps={econModelProps}
			getColumnsDef={getStreamPropertiesColumnsDef}
			getRowDataOnAdd={getRowDataOnAdd}
			adjustRowData={adjustRowData}
			getStateFromAssumption={getStateFromAssumption}
			getAssumptionFromState={getAssumptionFromState}
			// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
			onELTsQueryDataChanged={() => {}}
			contextMenuItems={contextMenuItems}
			handleGetContextMenuItems={handleGetContextMenuItems}
			getShortcutsInfo={() => getDefaultShortcutsInfo(shortcutsConfig)}
			organizeRows={organizeByKey}
			addRowLabel='Key'
			addTreeDataInfo={addTreeDataInfo}
			addRowButtonDisabled={addRowButtonDisabled}
			onRowDataChange={onRowDataChange}
			allowNestedRows
			isNestedRowOnPaste={isNestedRowOnPaste}
			invalidateModelTemplateQuery={templateQuery.invalidate}
			fetchingModelTemplate={templateQuery.isFetching}
			hideLookupRows
			advancedTableClassName={advancedTableStyles['selected-cell-out-of-focus']}
			isStateValid={isStateValid}
		>
			{isCompositionalEconomicsEnabled && (
				<CompositionalEconomics
					ref={compEconTableRef}
					compEconRows={compEconRows}
					handleHasValidationErrors={handleHasValidationErrors}
					groupRowAggState={groupRowAggState}
					setGroupRowAggState={setGroupRowAggState}
				/>
			)}
		</AdvancedModelView>
	);
}

function StreamPropertiesAdvancedViewWrapper(econModelProps: AdvancedEconModelProps) {
	return (
		<AdvancedModelViewWrapper useTemplate={useTemplate}>
			<StreamPropertiesAdvancedView {...econModelProps} />
		</AdvancedModelViewWrapper>
	);
}

export default withErrorBoundary(StreamPropertiesAdvancedViewWrapper);
