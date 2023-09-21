import countBy from 'lodash/countBy';
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
import { RowStructure } from '@/cost-model/detail-components/AdvancedModelView/extra-components/price-deck/types';
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
	COMPOSITIONAL_PRICING_CATEGORIES_CONF,
	FULL_PRICING_KEYS_COLUMNS,
	PRICING_CRITERIA,
	PRICING_KEYS,
	PRICING_KEYS_CATEGORIES,
	PRICING_KEYS_COLUMNS,
	PRICING_UNITS,
	PRICING_UNITS_MAPPINGS,
	pricingProductNameToKey,
} from '@/cost-model/detail-components/pricing/PricingAdvancedView/constants';
import {
	getMaxKeyCategoryCount,
	useTemplate,
} from '@/cost-model/detail-components/pricing/PricingAdvancedView/schemaValidation';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';

import { assumptionToRows, getPricingColumnsDef, rowsToAssumption } from './shared';
import { PriceDeckProduct, PricingRow } from './types';

const PRICING_KEYS_ARRAY = Object.values(PRICING_KEYS);
const PRICING_UNITS_ARRAY = Object.values(PRICING_UNITS);
const COMPOSITIONAL_ECONOMIC_CATEGORIES = Object.values(COMPOSITIONAL_PRICING_CATEGORIES_CONF).map(
	({ label }) => label
);
const organizeRowsOptions = { categoryAttributeName: 'category' };

function PricingAdvancedView(econModelProps: AdvancedEconModelProps) {
	const { isCompositionalEconomicsEnabled } = useLDFeatureFlags();
	const { project } = useAlfa();

	assert(project, 'Expected project to be in context');

	const [addRowButtonDisabled, setAddRowButtonDisabled] = useState(false);
	const [localAdvancedModelViewRef, setLocalAdvancedModelViewRef] = useState(
		useRef<AdvancedModelViewRef<PricingRow>>(null)
	);

	const shortcutsConfig = {
		isELT: false,
		showRunEconomics: !!econModelProps?.wellAssignment,
		enableTimeSeries: true,
		enableOrganizeByKey: true,
	};

	const organizeByKey = useMemo(
		() => ({
			label: 'Organize by Key',
			onClick: (rows: PricingRow[]) =>
				organizeRows<PricingRow>(rows, PRICING_KEYS_ARRAY, PRICING_UNITS_ARRAY, organizeRowsOptions),
		}),
		[]
	);

	const advancedModelViewRef = useRef<AdvancedModelViewRef<PricingRow>>(null);

	useEffect(() => {
		setLocalAdvancedModelViewRef(advancedModelViewRef);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [advancedModelViewRef?.current]);

	const { templateQuery, pricingRowSchema, timeSeriesSchema } = useTemplate(
		project._id,
		isCompositionalEconomicsEnabled
	);

	const getRowSchema = useCallback(
		(row) => (row[IS_NESTED_ROW_KEY] ? timeSeriesSchema : pricingRowSchema),
		[timeSeriesSchema, pricingRowSchema]
	);

	const handleAdjustDateSeriesRanges = (rowData: PricingRow[]) =>
		adjustDataSeriesRanges({
			rowData,
			nonDataSeriesKeys: [PRICING_KEYS.BREAK_EVEN],
		});

	const adjustRowData = useCallback(
		(rowData: PricingRow[]) => {
			const rowWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowData);
			return addValidationInfo<PricingRow>(rowWithDataSeriesRangesAdjusted, getRowSchema, {
				includeInContext: { keyCount: true, rowData: true },
				addCategoryToKeyCount: isCompositionalEconomicsEnabled,
				matchKeyCasing: true,
			});
		},
		[getRowSchema, isCompositionalEconomicsEnabled]
	);

	const getRowDataOnAdd = useCallback(() => {
		const keyCount = isCompositionalEconomicsEnabled
			? getKeyCategoryCount(advancedModelViewRef.current?.advancedTableRef?.current?.rowData)
			: countBy(advancedModelViewRef.current?.advancedTableRef?.current?.rowData, (row) => row.key);

		const firstKey = FULL_PRICING_KEYS_COLUMNS[0];
		const tableIsEmpty = !Object.keys(keyCount).length;

		if (tableIsEmpty) return firstKey;

		const maxKeyCategoryCount = getMaxKeyCategoryCount(isCompositionalEconomicsEnabled);

		return isCompositionalEconomicsEnabled
			? FULL_PRICING_KEYS_COLUMNS.find(({ key, category = '' }) => {
					const type = concatenateKeyCategory({ key, category });
					if (keyCount[type] >= maxKeyCategoryCount[type]) return false;
					return true;
			  })
			: PRICING_KEYS_COLUMNS.find(({ key }) => {
					if (keyCount[key] === undefined) return true;
					return keyCount[key] < 1;
			  });
	}, [isCompositionalEconomicsEnabled]);

	const getStateFromAssumption = useCallback(
		(assumption) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const { breakEvenAndPriceModelRows, compositionalEconomicModelRows } = assumptionToRows(
				assumption,
				templateQuery.data.template.fields,
				isCompositionalEconomicsEnabled
			);

			const breakEvenAndPriceModelRowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(
				organizeRows<PricingRow>(
					breakEvenAndPriceModelRows || [],
					PRICING_KEYS_ARRAY,
					PRICING_UNITS_ARRAY,
					organizeRowsOptions
				)
			);

			const compositionalEconomicModelRowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(
				organizeRows<PricingRow>(
					compositionalEconomicModelRows || [],
					PRICING_KEYS_ARRAY,
					COMPOSITIONAL_ECONOMIC_CATEGORIES,
					organizeRowsOptions
				)
			);
			return [
				...breakEvenAndPriceModelRowsWithDataSeriesRangesAdjusted,
				...compositionalEconomicModelRowsWithDataSeriesRangesAdjusted,
			];
		},
		[templateQuery.data, isCompositionalEconomicsEnabled]
	);

	const handleRowButtonDisable = (rowData: PricingRow[]) => {
		const maxLength = isCompositionalEconomicsEnabled
			? FULL_PRICING_KEYS_COLUMNS.length
			: PRICING_KEYS_COLUMNS.length;
		if (!rowData || !rowData.length || rowData.length < maxLength) {
			if (addRowButtonDisabled) setAddRowButtonDisabled(false);
			return;
		}

		const allKeysAdded = isCompositionalEconomicsEnabled
			? FULL_PRICING_KEYS_COLUMNS.every(({ key, category }) =>
					// We don't worry if it is null or undefined, so === won't help it.
					// eslint-disable-next-line eqeqeq
					rowData.some((row) => row.key === key && row.category == category)
			  )
			: PRICING_KEYS_COLUMNS.every(({ key }) => rowData.some((row) => row.key === key));
		if (allKeysAdded && !addRowButtonDisabled) setAddRowButtonDisabled(true);
		if (!allKeysAdded && addRowButtonDisabled) setAddRowButtonDisabled(false);
	};

	const getAssumptionFromState = useCallback(
		(rows) => {
			assert(templateQuery.data, 'Expected template to be loaded');

			const rowsWithoutLookupLines = rows.filter((r) => !r.isFromELTDataLines);

			const rowsWithDataSeriesRangesAdjusted = handleAdjustDateSeriesRanges(rowsWithoutLookupLines);

			return rowsToAssumption(
				rowsWithDataSeriesRangesAdjusted,
				templateQuery.data.template.fields,
				isCompositionalEconomicsEnabled
			);
		},
		[templateQuery.data, isCompositionalEconomicsEnabled]
	);

	const onRowDataChange = (rowData: PricingRow[]) => {
		handleRowButtonDisable(rowData);
	};

	const applyPriceDecks = async (products: PriceDeckProduct[]) => {
		const currentRows = advancedModelViewRef.current?.advancedTableRef?.current?.rowData ?? [];
		const rowStructures: RowStructure[] = [];
		for (const product of products) {
			const productKey = pricingProductNameToKey[product.product];
			const defaultCategory = isCompositionalEconomicsEnabled
				? PRICING_KEYS_CATEGORIES[PRICING_KEYS[productKey]][0].label
				: undefined;
			const rowsStructure: RowStructure = {
				key: PRICING_KEYS[productKey],
				category: defaultCategory === 'N/A' ? null : defaultCategory,
				criteria: PRICING_CRITERIA.DATES,
				unit: PRICING_UNITS_MAPPINGS[PRICING_KEYS[productKey]][0],
				escalation: 'None',
			};
			rowStructures.push(rowsStructure);
		}
		const rowsToAdd: PricingRow[] = priceDecksToRows(products, rowStructures);
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

	return (
		<AdvancedModelView<PricingRow>
			ref={advancedModelViewRef}
			addTreeDataInfo={addTreeDataInfo}
			project={project._id}
			assumptionKey={AssumptionKey.pricing}
			econModelProps={econModelProps}
			getColumnsDef={() => getPricingColumnsDef(false, isCompositionalEconomicsEnabled)}
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
			allowNestedRows
			hideLookupRows
			organizeRows={organizeByKey}
			extraActions={<ApplyPriceDecksButton applyCME={applyPriceDecks} priceDeckType={PriceDeckType.price} />}
			isNestedRowOnPaste={isNestedRowOnPaste}
			invalidateModelTemplateQuery={templateQuery.invalidate}
			fetchingModelTemplate={templateQuery.isFetching}
		/>
	);
}

function PricingAdvancedViewWrapper(econModelProps: AdvancedEconModelProps) {
	return (
		<AdvancedModelViewWrapper useTemplate={useTemplate}>
			<PricingAdvancedView {...econModelProps} />
		</AdvancedModelViewWrapper>
	);
}

export default withErrorBoundary(PricingAdvancedViewWrapper);
