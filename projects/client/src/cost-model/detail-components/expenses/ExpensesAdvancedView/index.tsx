import { countBy } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { withErrorBoundary } from '@/components';
import { IS_NESTED_ROW_KEY } from '@/components/AdvancedTable/constants';
import { getDefaultShortcutsInfo, isNestedRowOnPaste, useContextMenuItems } from '@/components/AdvancedTable/shared';
import AdvancedModelView, { AdvancedModelViewRef } from '@/cost-model/detail-components/AdvancedModelView';
import { AdvancedModelViewWrapper } from '@/cost-model/detail-components/AdvancedModelView/extra-components/AdvancedModelViewWrapper';
import {
	addTreeDataInfo,
	addValidationInfo,
	adjustDataSeriesRanges,
	concatenateKeyCategory,
	organizeRows,
	rehydrateRateAndRowColumnValues,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { AdvancedEconModelProps } from '@/cost-model/detail-components/EconModelV2';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';
import { FilterResult } from '@/module-list/types';

import { EXPENSES_CATEGORIES_LABELS, EXPENSES_KEYS_LABELS, RATE_LABELS } from './constants';
import { MAX_CATEGORY_COUNT, useTemplate } from './schemaValidation';
import {
	ALL_KEY_CATEGORIES,
	assumptionToRows,
	getColumnsDef,
	getExtraLabel,
	rowsToAssumption,
	validationOptions,
} from './shared';
import { ExpenseRow } from './types';

function ExpensesAdvancedViewWrapper(econModelProps: AdvancedEconModelProps) {
	return (
		<AdvancedModelViewWrapper useTemplate={useTemplate}>
			<ExpensesAdvancedView {...econModelProps} />
		</AdvancedModelViewWrapper>
	);
}

function ExpensesAdvancedView(econModelProps: AdvancedEconModelProps) {
	const { project } = useAlfa();
	assert(project, 'Expected project to be in context');
	const shortcutsConfig = {
		isELT: false,
		showRunEconomics: !!econModelProps?.wellAssignment,
		enableTimeSeries: true,
		enableOrganizeByKey: true,
	};

	const [eltsQueryData, setELTsQueryData] = useState<FilterResult<ModuleListEmbeddedLookupTableItem> | undefined>(
		undefined
	);
	const [localAdvancedModelViewRef, setLocalAdvancedModelViewRef] = useState(
		useRef<AdvancedModelViewRef<ExpenseRow>>(null)
	);

	const advancedModelViewRef = useRef<AdvancedModelViewRef<ExpenseRow>>(null);

	useEffect(() => {
		setLocalAdvancedModelViewRef(advancedModelViewRef);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [advancedModelViewRef?.current]);

	const { templateQuery, expensesRowSchema, timeSeriesSchema } = useTemplate(project._id, eltsQueryData?.items ?? []);

	const {
		insertTimeSeriesItem,
		deleteSelectedRowsItem,
		deleteSelectedRowsAndTimeSeriesItem,
		toggleRowsItem,
		toggleOtherColumnsItem,
		copyRowsItem,
	} = useContextMenuItems(localAdvancedModelViewRef.current?.advancedTableRef);

	const contextMenuItems = useMemo(
		() => [
			insertTimeSeriesItem,
			deleteSelectedRowsItem,
			deleteSelectedRowsAndTimeSeriesItem,
			toggleRowsItem,
			toggleOtherColumnsItem,
			copyRowsItem,
		],
		[
			insertTimeSeriesItem,
			deleteSelectedRowsItem,
			deleteSelectedRowsAndTimeSeriesItem,
			toggleRowsItem,
			toggleOtherColumnsItem,
			copyRowsItem,
		]
	);

	const getRowDataOnAdd = useCallback(() => {
		const keyCategoryCount = countBy(
			advancedModelViewRef.current?.advancedTableRef?.current?.rowData.filter(
				({ isELTRow, isFromELTDataLines }) => !isELTRow && !isFromELTDataLines
			),
			concatenateKeyCategory
		);
		const next =
			ALL_KEY_CATEGORIES.find(({ key, category = '' }) => {
				const type = concatenateKeyCategory({
					key: getExtraLabel('key', key),
					category: getExtraLabel('category', category),
				} as ExpenseRow);
				if (keyCategoryCount[type] >= MAX_CATEGORY_COUNT[type]) return false;
				return true;
			}) ?? ALL_KEY_CATEGORIES[0];

		return {
			key: getExtraLabel('key', next.key),
			category: getExtraLabel('category', next.category),
			criteria: 'Flat',
			period: 'Flat',
		};
	}, []);

	const handleAdjustDateSeriesRanges = (rowData: ExpenseRow[]) =>
		adjustDataSeriesRanges({ rowData, rateLabels: RATE_LABELS });

	const getStateFromAssumption = useCallback(
		(assumption) => {
			assert(templateQuery.data, 'Expected template to be loaded');
			assert(eltsQueryData, 'Expected embedded lookup tables to be loaded');

			return handleAdjustDateSeriesRanges(
				organizeRows<ExpenseRow>(
					assumptionToRows(assumption, templateQuery.data.template.fields, eltsQueryData.items),
					EXPENSES_KEYS_LABELS,
					EXPENSES_CATEGORIES_LABELS
				)
			);
		},
		[eltsQueryData, templateQuery.data]
	);

	const getAssumptionFromState = useCallback(
		(rows) => {
			assert(templateQuery.data, 'Expected template to be loaded');
			assert(eltsQueryData, 'Expected embedded lookup tables to be loaded');

			const rowsWithoutLookupLines = rows.filter((r) => !r.isFromELTDataLines);

			return rowsToAssumption(
				handleAdjustDateSeriesRanges(rowsWithoutLookupLines),
				templateQuery.data.template.fields,
				eltsQueryData.items
			);
		},
		[templateQuery.data, eltsQueryData]
	);

	const getRowSchema = useCallback(
		(row) => (row[IS_NESTED_ROW_KEY] ? timeSeriesSchema : expensesRowSchema),
		[expensesRowSchema, timeSeriesSchema]
	);

	const adjustRowData = useCallback(
		(withoutAdjustedELTRows: ExpenseRow[]) => {
			const updatedRowValues = rehydrateRateAndRowColumnValues({
				rowData: withoutAdjustedELTRows,
				rateLabels: RATE_LABELS,
			});
			const rowsState = handleAdjustDateSeriesRanges(updatedRowValues);
			return addValidationInfo<ExpenseRow>(rowsState, getRowSchema, validationOptions);
		},
		[getRowSchema]
	);

	const organizeByKey = useMemo(
		() => ({
			label: 'Organize by Key',
			onClick: (rows: ExpenseRow[]) =>
				organizeRows<ExpenseRow>(rows, EXPENSES_KEYS_LABELS, EXPENSES_CATEGORIES_LABELS),
		}),
		[]
	);

	return (
		<AdvancedModelView<ExpenseRow>
			ref={advancedModelViewRef}
			project={project._id}
			assumptionKey={AssumptionKey.expenses}
			econModelProps={econModelProps}
			getColumnsDef={getColumnsDef}
			getRowDataOnAdd={getRowDataOnAdd}
			adjustRowData={adjustRowData}
			getStateFromAssumption={getStateFromAssumption}
			getAssumptionFromState={getAssumptionFromState}
			onELTsQueryDataChanged={setELTsQueryData}
			contextMenuItems={contextMenuItems}
			getShortcutsInfo={() => getDefaultShortcutsInfo(shortcutsConfig)}
			addRowLabel='Key'
			organizeRows={organizeByKey}
			invalidateModelTemplateQuery={templateQuery.invalidate}
			fetchingModelTemplate={templateQuery.isFetching}
			allowNestedRows
			isNestedRowOnPaste={isNestedRowOnPaste}
			addTreeDataInfo={addTreeDataInfo}
		/>
	);
}

export default withErrorBoundary(ExpensesAdvancedViewWrapper);
