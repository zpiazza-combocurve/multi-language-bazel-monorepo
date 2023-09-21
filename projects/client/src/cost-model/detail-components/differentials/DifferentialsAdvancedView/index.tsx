import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { withErrorBoundary } from '@/components';
import { IS_NESTED_ROW_KEY, ROW_ID_KEY, TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { getDefaultShortcutsInfo, isNestedRowOnPaste, useContextMenuItems } from '@/components/AdvancedTable/shared';
import AdvancedModelView, { AdvancedModelViewRef } from '@/cost-model/detail-components/AdvancedModelView';
import { AdvancedModelViewWrapper } from '@/cost-model/detail-components/AdvancedModelView/extra-components/AdvancedModelViewWrapper';
import {
	ApplyPriceDecksButton,
	PriceDeckType,
} from '@/cost-model/detail-components/AdvancedModelView/extra-components/price-deck/PriceDeckButton';
import { priceDecksToRows } from '@/cost-model/detail-components/AdvancedModelView/extra-components/price-deck/shared';
import {
	DeckProduct,
	RowStructure,
} from '@/cost-model/detail-components/AdvancedModelView/extra-components/price-deck/types';
import {
	addTreeDataInfo,
	addValidationInfo,
	adjustDataSeriesRanges,
	concatenateKeyCategory,
	getKeyCategoryCount,
	organizeRows,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { AdvancedEconModelProps } from '@/cost-model/detail-components/EconModelV2';
import {
	assumptionToRows,
	getDifferentialsgColumnsDef,
	rowsToAssumption,
} from '@/cost-model/detail-components/differentials/DifferentialsAdvancedView/shared';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';

import {
	DIFFERENTIALS_CATEGORIES,
	DIFFERENTIALS_CRITERIA,
	DIFFERENTIALS_KEYS,
	DIFFERENTIALS_KEYS_COLUMNS,
	DIFFERENTIALS_KEYS_CONFIG,
	DIFFERENTIALS_UNITS,
} from './constants';
import { MAX_KEY_CATEGORY_COUNT, useTemplate } from './schemaValidation';
import { DifferentialsRow } from './types';

const DIFFERENTIALS_KEYS_ARRAY = Object.values(DIFFERENTIALS_KEYS);
const DIFFERENTIALS_CATEGORIES_ARRAY = Object.values(DIFFERENTIALS_CATEGORIES);
const organizeRowsOptions = {
	sortByCategoryKey: true,
};

function DifferentialsAdvancedView(econModelProps: AdvancedEconModelProps) {
	const { project } = useAlfa();

	assert(project, 'Expected project to be in context');

	const shortcutsConfig = {
		isELT: false,
		showRunEconomics: !!econModelProps?.wellAssignment,
		enableTimeSeries: true,
		enableOrganizeByKey: true,
	};

	const [addRowButtonDisabled, setAddRowButtonDisabled] = useState(false);
	const [localAdvancedModelViewRef, setLocalAdvancedModelViewRef] = useState(
		useRef<AdvancedModelViewRef<DifferentialsRow>>(null)
	);

	const advancedModelViewRef = useRef<AdvancedModelViewRef<DifferentialsRow>>(null);

	useEffect(() => {
		setLocalAdvancedModelViewRef(advancedModelViewRef);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [advancedModelViewRef?.current]);

	const { templateQuery, timeSeriesSchema, differentialsRowSchema } = useTemplate(project._id);

	const organizeByKey = useMemo(
		() => ({
			label: 'Organize by Key',
			onClick: (rows: DifferentialsRow[]) =>
				organizeRows<DifferentialsRow>(
					rows,
					DIFFERENTIALS_KEYS_ARRAY,
					DIFFERENTIALS_CATEGORIES_ARRAY,
					organizeRowsOptions
				),
		}),
		[]
	);

	const getRowDataOnAdd = useCallback(() => {
		const keyCategoryCount = getKeyCategoryCount(advancedModelViewRef.current?.advancedTableRef?.current?.rowData);
		const firstKeyCategory = DIFFERENTIALS_KEYS_COLUMNS[0];
		const tableIsEmpty = !Object.keys(keyCategoryCount).length;

		if (tableIsEmpty) return firstKeyCategory;

		const next = DIFFERENTIALS_KEYS_COLUMNS.find(({ key, category = '' }) => {
			const type = concatenateKeyCategory({
				key,
				category,
			});
			if (keyCategoryCount[type] >= MAX_KEY_CATEGORY_COUNT[type]) return false;
			return true;
		});

		return next;
	}, []);

	const handleAdjustDateSeriesRanges = (rowData: DifferentialsRow[]) =>
		adjustDataSeriesRanges({
			rowData,
		});

	const getStateFromAssumption = useCallback(
		(assumption) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const rowsFromAssumption = assumptionToRows(assumption, templateQuery.data.template.fields.differentials);
			if (!rowsFromAssumption.length) return [];
			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(
				organizeRows<DifferentialsRow>(
					rowsFromAssumption,
					DIFFERENTIALS_KEYS_ARRAY,
					DIFFERENTIALS_CATEGORIES_ARRAY,
					organizeRowsOptions
				)
			);
			return rowsWithDataSeriesRangesAdjusted;
		},
		[templateQuery.data]
	);

	const getAssumptionFromState = useCallback(
		(rows) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const rowsWithoutLookupLines = rows.filter((r) => !r.isFromELTDataLines);

			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowsWithoutLookupLines);

			return rowsToAssumption(rowsWithDataSeriesRangesAdjusted, templateQuery.data.template.fields);
		},
		[templateQuery.data]
	);

	const getRowSchema = useCallback(
		(row) => (row[IS_NESTED_ROW_KEY] ? timeSeriesSchema : differentialsRowSchema),
		[timeSeriesSchema, differentialsRowSchema]
	);

	const adjustRowData = useCallback(
		(rowData: DifferentialsRow[]) => {
			const rowWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowData);
			return addValidationInfo<DifferentialsRow>(rowWithDataSeriesRangesAdjusted, getRowSchema, {
				includeInContext: { rowData: true, keyCategoryCount: true },
				matchKeyCasing: true,
			});
		},
		[getRowSchema]
	);

	const handleRowButtonDisable = (rowData: DifferentialsRow[]) => {
		if (rowData.length < DIFFERENTIALS_KEYS_COLUMNS.length) {
			if (addRowButtonDisabled) setAddRowButtonDisabled(false);
			return;
		}

		const allKeyCategoriesAreAdded = DIFFERENTIALS_KEYS_COLUMNS.every(({ key, category }) =>
			rowData.find(({ key: rowKey, category: rowCategory }) => key === rowKey && category === rowCategory)
		);

		if (allKeyCategoriesAreAdded && !addRowButtonDisabled) setAddRowButtonDisabled(true);
		if (!allKeyCategoriesAreAdded && addRowButtonDisabled) setAddRowButtonDisabled(false);
	};

	const onRowDataChange = (rowData: DifferentialsRow[]) => {
		handleRowButtonDisable(rowData);
	};

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

	const applyDifferentialsDecks = async (products: DeckProduct[]) => {
		const currentRows = advancedModelViewRef.current?.advancedTableRef?.current?.rowData ?? [];
		const headerRowStructure: RowStructure = {
			key: DIFFERENTIALS_KEYS_CONFIG.OIL.label,
			category: DIFFERENTIALS_CATEGORIES.firstDiff,
			criteria: DIFFERENTIALS_CRITERIA.DATES,
			unit: DIFFERENTIALS_UNITS.PER_BBL,
			escalation: 'None',
		};
		const rowsToAdd: DifferentialsRow[] = priceDecksToRows(products, [headerRowStructure]);
		const rowsToAddKeys = rowsToAdd.filter((row) => !!row.key).map((row) => row.key);
		const adjustedRows = adjustRowData(rowsToAdd);

		const rowIdsToReplace = currentRows
			.filter((row) => rowsToAddKeys.includes(row.key))
			.map((row) => row[ROW_ID_KEY]);
		if (!rowIdsToReplace.length) {
			advancedModelViewRef.current?.advancedTableRef.current?.setRowData([...currentRows, ...adjustedRows]);
			return;
		}

		const unchangedRows = currentRows.filter(
			(row) => !rowIdsToReplace.some((id) => row[TREE_DATA_KEY]?.includes(id))
		);
		advancedModelViewRef.current?.advancedTableRef.current?.setRowData([...unchangedRows, ...adjustedRows]);
	};

	return (
		<AdvancedModelView<DifferentialsRow>
			ref={advancedModelViewRef}
			addTreeDataInfo={addTreeDataInfo}
			project={project._id}
			assumptionKey={AssumptionKey.differentials}
			econModelProps={econModelProps}
			getColumnsDef={getDifferentialsgColumnsDef}
			getRowDataOnAdd={getRowDataOnAdd}
			addRowButtonDisabled={addRowButtonDisabled}
			onRowDataChange={onRowDataChange}
			adjustRowData={adjustRowData}
			getStateFromAssumption={getStateFromAssumption}
			getAssumptionFromState={getAssumptionFromState}
			// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
			onELTsQueryDataChanged={() => {}}
			addRowLabel='Key'
			contextMenuItems={contextMenuItems}
			getShortcutsInfo={() => getDefaultShortcutsInfo(shortcutsConfig)}
			organizeRows={organizeByKey}
			extraActions={
				<ApplyPriceDecksButton applyCME={applyDifferentialsDecks} priceDeckType={PriceDeckType.differentials} />
			}
			allowNestedRows
			hideLookupRows
			isNestedRowOnPaste={isNestedRowOnPaste}
			invalidateModelTemplateQuery={templateQuery.invalidate}
			fetchingModelTemplate={templateQuery.isFetching}
		/>
	);
}

function DifferentialsAdvancedViewWrapper(econModelProps: AdvancedEconModelProps) {
	return (
		<AdvancedModelViewWrapper useTemplate={useTemplate}>
			<DifferentialsAdvancedView {...econModelProps} />
		</AdvancedModelViewWrapper>
	);
}

export default withErrorBoundary(DifferentialsAdvancedViewWrapper);
