import { countBy, omit, pick } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import {
	IS_NESTED_ROW_KEY,
	LOOKUP_BY_FIELDS_KEY,
	PERIOD_DATA_KEY,
	ROW_ID_KEY,
	SCHEMA_DESCRIBE_KEY,
} from '@/components/AdvancedTable/constants';
import {
	advancedModelStateIsValid,
	getDefaultShortcutsInfo,
	isNestedRowOnPaste,
	useContextMenuItems,
} from '@/components/AdvancedTable/shared';
import {
	addTreeDataInfo,
	addValidationInfo,
	adjustDataSeriesRanges,
	concatenateKeyCategory,
	organizeRows as expensesOrganizeRows,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { assert } from '@/helpers/utilities';
import {
	fields as DEFAULT_EXPENSES_TEMPLATE,
	extra as EXTRA_EXPENSES_TEMPLATE_DATA,
} from '@/inpt-shared/display-templates/cost-model-dialog/expenses.json';
import { EmbeddedLookupTableContext } from '@/lookup-tables/embedded-lookup-tables/context/EmbeddedLookupTableContext';
import {
	getFieldFromLookupByKey,
	getLineByLookupByKey,
	getParentLineByLookupByKey,
	mapToELTColumnsDef,
} from '@/lookup-tables/embedded-lookup-tables/shared';
import { AssumptionModelELTDependencies } from '@/lookup-tables/embedded-lookup-tables/types';

import {
	COLUMN_LABELS_WITHOUT_SHRINKAGE_CONDITION,
	ELT_LOOKUP_BY_COLUMNS_ORDERED,
	EXPENSES_CATEGORIES_LABELS,
	EXPENSES_KEYS_LABELS,
	FIXED_EXPENSES_COLUMNS,
	NON_APPLICABLE_WATER_DISPOSAL_COLUMNS,
	NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS,
	NUMERICAL_COLUMNS,
	RATE_COLUMNS,
	RATE_KEYS,
	RATE_LABELS,
} from '../constants';
import { MAX_CATEGORY_COUNT, useTemplate } from '../schemaValidation';
import {
	ALL_KEY_CATEGORIES,
	ExpensesTemplate,
	getColumnsDef as expensesGetColumnsDef,
	getColumnLabel,
	getExtraLabel,
	getExtraValue,
	getGroupKey,
	getTemplateCategory,
	getValues,
	validationOptions,
} from '../shared';
import { ExpenseRow } from '../types';
import { getRestRowObject, getUnitValueOrDefaultForKey } from './helpers';
import { labelToValueExpensesPOJO } from './parser';

const elts = [];
const addRowLabel = 'Key';
const enableCollapsibleRows = true;
const nestedLineFieldsAllowedToHaveValue = ['period', 'value'];
const nestedLineFieldsAllowedForLookupBy = ['value'];
const shortcutsInfo = getDefaultShortcutsInfo({
	isELT: true,
	showRunEconomics: false,
	enableOrganizeByKey: true,
	enableTimeSeries: true,
});
const ltColumnsOrdered = ELT_LOOKUP_BY_COLUMNS_ORDERED;
const allowNestedRows = true;

const organizeRows = {
	label: 'Organize by Key',
	onClick: (rows: ExpenseRow[]) =>
		expensesOrganizeRows(rows, EXPENSES_KEYS_LABELS, EXPENSES_CATEGORIES_LABELS) as ExpenseRow[],
};

const getTemplateColumnLabel = (colId: string) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getColumnLabel(DEFAULT_EXPENSES_TEMPLATE as any as ExpensesTemplate, colId);
const getLookupByValueHeaderExtraText = (row: ExpenseRow) => `(${row.key}, ${row.category})`;
const getLookupByOnColumnError = (lookupByField: string, parentData: ExpenseRow) => {
	const label = getTemplateColumnLabel(lookupByField);

	if (NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS.includes(lookupByField)) {
		return `Can't lookup by on "${label}"`;
	}

	if (!RATE_LABELS.includes(parentData.criteria ?? '') && RATE_COLUMNS.includes(lookupByField)) {
		return `${label} can only be used for rate criteria (${RATE_LABELS.join(', ')}`;
	}

	if (parentData.key !== 'Fixed Expenses' && FIXED_EXPENSES_COLUMNS.includes(lookupByField)) {
		return `${label} can only be used for Fixed Expenses`;
	}

	if (parentData.key === 'Water Disposal' && NON_APPLICABLE_WATER_DISPOSAL_COLUMNS.includes(lookupByField)) {
		return `${label} cannot be used for Water Disposal`;
	}

	if (
		lookupByField === 'shrinkage_condition' &&
		COLUMN_LABELS_WITHOUT_SHRINKAGE_CONDITION.includes(parentData.key ?? '')
	) {
		return `Shrinkage condition cannot be used for ${parentData.key}`;
	}

	return '';
};

const getColumnsDef = () =>
	mapToELTColumnsDef(expensesGetColumnsDef(false), NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS, (params) => ({
		start: params.data?.[PERIOD_DATA_KEY]?.start,
		end: params.data?.[PERIOD_DATA_KEY]?.end,
	}));

const isLookupRuleValueColumnNumerical = (_, lookupByKey: string) => {
	const field = getFieldFromLookupByKey(lookupByKey);
	return field && NUMERICAL_COLUMNS.includes(field);
};

const useExpensesELTDependencies = (
	elt: Inpt.EmbeddedLookupTable
): Partial<AssumptionModelELTDependencies<ExpenseRow>> => {
	const { linesRef, setLinesAreValid } = useContext(EmbeddedLookupTableContext);

	const {
		insertTimeSeriesItem,
		deleteSelectedRowsItem,
		deleteSelectedRowsAndTimeSeriesItem,
		toggleRowsItem,
		toggleOtherColumnsItem,
		copyRowsItem,
	} = useContextMenuItems(linesRef);
	const { template, expensesRowSchema: rowSchema, timeSeriesSchema } = useTemplate(elt.project, elts);

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

	const handleAddRow = useCallback(() => {
		const keyCategoryCount = countBy(linesRef.current?.rowData, concatenateKeyCategory);
		const next =
			ALL_KEY_CATEGORIES.find(({ key, category = '' }) => {
				const type = concatenateKeyCategory({
					key: getExtraLabel('key', key),
					category: getExtraLabel('category', category),
				} as ExpenseRow);
				if (keyCategoryCount[type] >= MAX_CATEGORY_COUNT[type]) return false;
				return true;
			}) ?? ALL_KEY_CATEGORIES[0];
		linesRef.current?.setRowData((p) => [
			...p,
			{
				[ROW_ID_KEY]: uuidv4(),
				key: getExtraLabel('key', next.key),
				category: getExtraLabel('category', next.category),
				criteria: 'Flat',
				period: 'Flat',
			} as ExpenseRow,
		]);
	}, [linesRef]);

	const adjustRowsWithoutUnit = useCallback((rows: ExpenseRow[]) => {
		return rows.map((row) => {
			if (row.unit || !!row[IS_NESTED_ROW_KEY] || row[LOOKUP_BY_FIELDS_KEY]?.unit) return row;
			const defaultUnit =
				row[SCHEMA_DESCRIBE_KEY]?.unit.meta?.default ??
				row[SCHEMA_DESCRIBE_KEY]?.unit.meta?.template?.Default?.label;
			return { ...row, unit: defaultUnit };
		});
	}, []);

	const adjustELTLinesRowData = useCallback(
		(rows: ExpenseRow[], validationCheck = true) => {
			const rowsState = addTreeDataInfo(adjustDataSeriesRanges({ rowData: rows, rateLabels: RATE_LABELS }));
			const getExpenseRowSchema = (row) => {
				const lookupRowSchema = rowSchema.concat(
					yup.object({
						...Object.keys(row[LOOKUP_BY_FIELDS_KEY] ?? {}).reduce((acc, key) => {
							// use original schema for rate columns, fixed expense columns, and columns that should be disabled
							// for water disposal key selection
							if (
								RATE_COLUMNS.includes(key) ||
								FIXED_EXPENSES_COLUMNS.includes(key) ||
								NON_APPLICABLE_WATER_DISPOSAL_COLUMNS.includes(key)
							) {
								return acc;
							}
							acc[key] = yup.mixed();
							return acc;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						}, {} as any),
					})
				);

				// value must be switched from number to mixed as this would cause an error when you lookup by
				const lookupTimeSeriesSchema = row[LOOKUP_BY_FIELDS_KEY]?.value
					? timeSeriesSchema?.concat(
							yup.object({
								value: yup.mixed(),
							})
					  )
					: timeSeriesSchema;

				const modelSchema = !row[IS_NESTED_ROW_KEY] ? lookupRowSchema : lookupTimeSeriesSchema;

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				return modelSchema!;
			};

			const withValidationInfo = addValidationInfo<ExpenseRow>(rowsState, getExpenseRowSchema, validationOptions);

			if (validationCheck) {
				setLinesAreValid(advancedModelStateIsValid(withValidationInfo)); //TODO: should not be here
			}

			const rowsWithoutUnit = withValidationInfo.find(
				(row) => !row[IS_NESTED_ROW_KEY] && !row.unit && !row[LOOKUP_BY_FIELDS_KEY]?.unit
			);

			return rowsWithoutUnit ? adjustRowsWithoutUnit(withValidationInfo) : withValidationInfo;
		},
		[adjustRowsWithoutUnit, rowSchema, timeSeriesSchema, setLinesAreValid]
	);

	const addValidationToTheRuleVirtualLines = useCallback(
		(rows: ExpenseRow[]) => {
			const getExpenseRowSchemaToTheRuleVirtualLines = (row) => {
				const modelSchema = !row[IS_NESTED_ROW_KEY] ? rowSchema : timeSeriesSchema;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				return modelSchema!;
			};
			const withValidationInfo = addValidationInfo<ExpenseRow>(
				rows,
				getExpenseRowSchemaToTheRuleVirtualLines,
				validationOptions
			);
			return withValidationInfo;
		},
		[rowSchema, timeSeriesSchema]
	);

	const applyLineToRowTransformation = useCallback(
		(line: ExpenseRow): ExpenseRow => {
			const getValueWithLabel = (key, value) => {
				if (EXTRA_EXPENSES_TEMPLATE_DATA[key] !== undefined) {
					return getExtraLabel(key, value);
				}

				return value;
			};

			if (line[IS_NESTED_ROW_KEY]) {
				return {
					...line,
					period: getValueWithLabel('period', line['period']),
					value: line[LOOKUP_BY_FIELDS_KEY]?.['value'] ? '' : line['value'],
				};
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const { key, category, criteria, unit, description, ...rest } = line as Record<string, any>;
			const groupKey = getGroupKey(key);

			assert(groupKey);

			const templateCategory = getTemplateCategory(
				groupKey,
				key === 'fixed_expenses' ? 'monthly_well_cost' : key,
				category,
				template
			);

			const rateColumns = pick(rest, RATE_COLUMNS);
			const nonRateColumns = omit(rest, RATE_COLUMNS);

			const nonRate = getValues(nonRateColumns, templateCategory);

			const parent = {
				key: getExtraLabel('key', key),
				category: getExtraLabel('category', category),
				criteria: getExtraLabel('criteria', criteria),
				...(unit ? { unit: getExtraLabel('unit', unit) } : {}),
				period: getValueWithLabel('period', line['period']),
				value: line[LOOKUP_BY_FIELDS_KEY]?.['value'] ?? line['value'],
				description: description ?? '',
				...nonRate,
				...(RATE_KEYS.includes(criteria)
					? Object.entries(getValues(rateColumns, templateCategory)).reduce((acc, [key, value]) => {
							acc[key] = value;
							if (value?.toString() === '0') acc[key] = template[key].Default.label;
							return acc;
					  }, {})
					: {}),
			};

			// omit unit if label returns back as empty string so it can be shown as default in table
			if (line.unit === '') delete line.unit;

			return { ...line, ...parent };
		},
		[template]
	);

	const applyRowToLineTransformation = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		(row: ExpenseRow): ExpenseRow => labelToValueExpensesPOJO(row as any, template!) as any, // TODO: deal with types later
		[template]
	);

	const applyRuleValuesToLookupRuleRowValuesTransformation = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(rawRuleValues: Record<string, any>, lineRows: ExpenseRow[]): Record<string, any> => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const transformedRuleValues: Record<string, any> = {};

			Object.entries(rawRuleValues).forEach(([lookupByKey, rawValue]) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				const field = getFieldFromLookupByKey(lookupByKey)!;
				const parentRow = getParentLineByLookupByKey(lookupByKey, lineRows);

				const parentKey = getExtraValue('key', parentRow?.['key'] ?? '');
				const parentCategory = getExtraValue('category', parentRow?.['category'] ?? '');

				const groupKey = getGroupKey(parentKey);

				const templateCategory = getTemplateCategory(
					groupKey,
					parentKey === 'fixed_expenses' ? 'monthly_well_cost' : parentKey,
					parentCategory,
					template
				);

				const valueToDisplay = getValues({ [field]: rawValue }, templateCategory)?.[field] || rawValue;

				//null was causing an error with validation
				transformedRuleValues[lookupByKey] = valueToDisplay === null ? undefined : valueToDisplay;
			});

			return transformedRuleValues;
		},
		[template]
	);

	const applyLookupRuleRowValueToRuleValueTransformation = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(lookupByKey: string, value: any, lineRows: ExpenseRow[]): any => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			let valueToReturn: any = value;

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const field = getFieldFromLookupByKey(lookupByKey)!;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const row = getLineByLookupByKey(lookupByKey, lineRows)! as ExpenseRow;

			if (!row[IS_NESTED_ROW_KEY] && field !== 'value') {
				const { key: keyLabel, category: categoryLabel } = row;

				const key = getExtraValue('key', keyLabel);
				const category = getExtraValue('category', categoryLabel);

				const restRow = getRestRowObject(
					key,
					category,
					{
						[field]: valueToReturn,
					},
					template
				);

				valueToReturn = field === 'unit' ? getUnitValueOrDefaultForKey(valueToReturn, key) : restRow[field];
			}

			// converts value to number if applicable.
			valueToReturn = valueToReturn !== '' && !isNaN(valueToReturn) ? Number(valueToReturn) : valueToReturn;

			// converts value to string if field schema expects a string
			valueToReturn = rowSchema.fields?.[field].type === 'string' ? valueToReturn?.toString() : valueToReturn;

			return valueToReturn;
		},
		[rowSchema, template]
	);

	return useMemo(
		() =>
			({
				addRowLabel,
				enableCollapsibleRows,
				shortcutsInfo,
				rowSchema,
				nestedLineFieldsAllowedToHaveValue,
				nestedLineFieldsAllowedForLookupBy,
				ltColumnsOrdered,
				organizeRows,
				contextMenuItems,
				allowNestedRows,
				getTemplateColumnLabel,
				handleAddRow,
				getLookupByValueHeaderExtraText,
				getLookupByOnColumnError,
				getColumnsDef,
				adjustELTLinesRowData,
				addValidationToTheRuleVirtualLines,
				applyLineToRowTransformation,
				applyRowToLineTransformation,
				applyRuleValuesToLookupRuleRowValuesTransformation,
				applyLookupRuleRowValueToRuleValueTransformation,
				isLookupRuleValueColumnNumerical,
				isNestedRowOnPaste,
			} as Partial<AssumptionModelELTDependencies<ExpenseRow>>),
		[
			addValidationToTheRuleVirtualLines,
			adjustELTLinesRowData,
			applyLineToRowTransformation,
			applyLookupRuleRowValueToRuleValueTransformation,
			applyRowToLineTransformation,
			applyRuleValuesToLookupRuleRowValuesTransformation,
			contextMenuItems,
			handleAddRow,
			rowSchema,
		]
	);
};

export default useExpensesELTDependencies;
