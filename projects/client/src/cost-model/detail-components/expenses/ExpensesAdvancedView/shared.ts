// TODO make sure the error messages are good if want to keep them
import { ColDef, ColGroupDef } from 'ag-grid-community';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { CellRendererRowGroup, eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { IS_NESTED_ROW_KEY, OTHERS_COL_GROUP_ID, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { formatDateRangeValue, parseDateValue } from '@/components/AdvancedTable/shared';
import {
	TemplateAny,
	TemplateHeaderSelect,
	TemplateHeaderSelectItem,
	TemplateRowView,
	TemplateTable,
} from '@/components/AdvancedTable/types';
import {
	ValidationInfoOptions,
	mapTemplateFieldToColDef,
	parseAssumptionOptionsRowsCriteria,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { getUnitValueOrDefaultForKey } from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/embedded-lookup-table/helpers';
import { GenerateNewModelHeaders, createEconFunction } from '@/cost-model/detail-components/gen-data';
import { DT_QUERY_BASE } from '@/cost-model/detail-components/shared';
import { assert } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';
import {
	fields as DEFAULT_EXPENSES_TEMPLATE,
	extra as EXTRA_EXPENSES_TEMPLATE_DATA,
} from '@/inpt-shared/display-templates/cost-model-dialog/expenses.json';
import { CarbonEmissionProduct } from '@/inpt-shared/econ-models/emissions';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';

import { ALL_COLUMNS, FIXED_LABELS, RATE_COLUMNS, RATE_KEYS, RATE_LABELS } from './constants';
import { ExpenseRow } from './types';

export type ExpensesVariablePhase = 'oil' | 'gas' | 'ngl' | 'drip_condensate';
export type ExpensesVariableCategory = 'gathering' | 'processing' | 'transportation' | 'marketing' | 'other';
export type ExpensesFixedCategory = 'monthly_well_cost' | 'other_monthly_cost_1' | 'other_monthly_cost_2';
export type ExpensesCarbonCategory =
	| CarbonEmissionProduct.co2e
	| CarbonEmissionProduct.co2
	| CarbonEmissionProduct.ch4
	| CarbonEmissionProduct.n2o;

export type ExpensesTemplate = typeof DEFAULT_EXPENSES_TEMPLATE & {
	variable_expenses: {
		phase: TemplateHeaderSelect;
		category: TemplateHeaderSelect;
	} & Record<ExpensesVariablePhase, { subItems: Record<ExpensesVariableCategory, { subItems: TemplateTable }> }>;
	fixed_expenses: { category: TemplateHeaderSelect } & Record<ExpensesFixedCategory, { subItems: TemplateTable }>;
	water_disposal: TemplateTable;
	carbon_expenses: { category: TemplateHeaderSelect } & Record<ExpensesCarbonCategory, { subItems: TemplateTable }>;
};

type AssumptionOptionMenuItem = { label: string; value: string };
type AssumptionOptionNumberRange = {
	end_date?: 'Econ Limit';
	end: number;
	period: number;
	start: number;
	value?: never; // needed to differentiate between menu item
};
type AssumptionOptionCell = string | number | AssumptionOptionMenuItem | AssumptionOptionNumberRange;
type AssumptionOptionRowView<K extends string = string> = {
	headers: Record<K, AssumptionOptionMenuItem | string>;
	rows: Record<K, AssumptionOptionCell>[];
};

type AssumptionOptionTable = Record<string, AssumptionOptionCell> & { row_view: AssumptionOptionRowView };

interface Assumption {
	econ_function;
	options: {
		variable_expenses: Record<
			ExpensesVariablePhase,
			{ subItems: Record<ExpensesVariableCategory, { subItems: AssumptionOptionTable }> }
		> & { phase: AssumptionOptionCell; category: AssumptionOptionMenuItem };
		fixed_expenses: Record<ExpensesFixedCategory, { subItems: AssumptionOptionTable }> & {
			category: AssumptionOptionCell;
		};
		carbon_expenses: Record<ExpensesCarbonCategory, { subItems: AssumptionOptionTable }> & {
			category: AssumptionOptionCell;
		};
		water_disposal: AssumptionOptionTable;
	};
	embeddedLookupTables?: Inpt.ObjectId<'embedded-lookup-table'>[];
}

/**
 * @param option Eg `assumption.options.water_disposal.calculation`
 * @returns Value for assumption entry in a table other than row_view. Located in `options`
 */
export function getAssumptionOptionValue(
	option: AssumptionOptionCell,
	template: TemplateAny | TemplateHeaderSelectItem
) {
	switch (template.fieldType) {
		case 'number':
			if (option === '') return null;
			assert(typeof option === 'number', 'Expected number', () => ({ option, template }));
			return option;
		case 'text':
			assert(typeof option === 'string', 'Expected string', () => ({ option, template }));
			return option;
		case 'select': {
			assert(_.isObject(option) && option.value, 'Expected menu item', () => ({ option, template }));
			const item = _.find(template.menuItems, { value: option.value });
			assert(item, 'Expected item in menuItems', () => ({ option, template }));
			return item.value;
		}
		case 'header-select':
			if (_.isObject(option)) {
				return option.value;
			}
			if (typeof option === 'string') {
				const item = _.find(template.menuItems, { label: option });
				assert(item, `Expected item ${JSON.stringify(option)} in ${JSON.stringify(template.menuItems)}`);
				return item.value;
			}
			throw new Error(
				`Unexpected template field type: ${JSON.stringify(template.fieldType)}, template ${JSON.stringify(
					template
				)}, value: ${JSON.stringify(option)} `
			);
		case 'static':
			return template.value;
		case 'date-range':
			return option;
		case 'number-range':
			return option;
		case 'number-range-rate':
			return option;
		default:
			throw new Error(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				`Unexpected template field type: ${JSON.stringify(template.fieldType)}, template ${JSON.stringify(
					template
				)}, value: ${JSON.stringify(option)} `
			);
	}
}

/**
 * @param option Eg `assumption.options.water_disposal.row_view`
 * @returns Value for assumption `row_view` in a table. Located in `options`
 */
export function getAssumptionOptionRowViewValue<K extends string = string>(
	option: AssumptionOptionRowView<K>,
	template: TemplateRowView<K>
) {
	const headers: Record<K, string> = {} as never;

	const headersKeys = Object.keys(template.columns) as K[];
	headersKeys.forEach((key) => {
		if (template.columns[key].fieldType === FieldType.headerSelect) {
			headers[key] = getAssumptionOptionValue(option.headers[key], template.columns[key]) as string; // TODO assert instead of casting
		} else {
			headers[key] = key;
		}
	});

	const rows = option.rows.map((row) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const result: Record<K, any> = {} as never;

		headersKeys.forEach((key) => {
			const column = template.columns[key];

			if (column.fieldType !== FieldType.headerSelect) {
				result[key] = row[key];
				return;
			}

			const colTemplate =
				_.find(column.menuItems, {
					value: headers[key] ? headers[key] : column?.Default?.value,
				}) ?? column.menuItems[0];

			assert(colTemplate, 'Expected colTemplate for header', () => ({ column, headers, key }));

			result[key] = getAssumptionOptionValue(row[key], colTemplate);
		});

		return result;
	});

	return { headers, rows };
}

export const VARIABLE_EXPENSES_PHASES = _.map(DEFAULT_EXPENSES_TEMPLATE.variable_expenses.phase.menuItems, 'value');

export const CARBON_KEY = 'carbon_expenses';

export const VARIABLE_EXPENSES_CATEGORIES = _.map(
	DEFAULT_EXPENSES_TEMPLATE.variable_expenses.category.menuItems,
	'value'
);

export const CARBON_EXPENSES_CATEGORIES = _.map(DEFAULT_EXPENSES_TEMPLATE.carbon_expenses.category.menuItems, 'value');

export const FIXED_EXPENSES_CATEGORIES = [
	'monthly_well_cost',
	..._.range(1, 9).map((i) => `other_monthly_cost_${i}`),
] as const;

export const FIXED_EXPENSES_KEY = 'fixed_expenses' as const;
export const WATER_DISPOSAL_KEY = 'water_disposal' as const;

export type ExpenseRowKey = (typeof VARIABLE_EXPENSES_PHASES)[number] | 'fixed_expenses' | 'water_disposal';

export function getExtraMenuItems(column: keyof typeof EXTRA_EXPENSES_TEMPLATE_DATA) {
	return EXTRA_EXPENSES_TEMPLATE_DATA[column]?.menuItems;
}

/**
 * Returns expense column (located in the extra key in the display template) corresponding to either of the provided
 * value or label
 *
 * @example
 * 	getExtraMenuItem('key', { value: 'oil' }); // { value: 'oil', label: 'Oil' }
 * 	getExtraMenuItem('category', { label: 'G & P' });
 */
export function getExtraMenuItem(
	column: keyof typeof EXTRA_EXPENSES_TEMPLATE_DATA,
	{ value, label }: { value?: string | null; label?: string | null }
): // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
{ value?: any; label?: any } {
	return (
		getExtraMenuItems(column)?.find(
			(item) =>
				(typeof value === 'string' && value?.toLowerCase() === item.value?.toLowerCase()) ||
				(typeof label === 'string' && label?.toLowerCase() === item.label?.toLowerCase())
		) ?? {}
	);
}

export function getExtraLabel(column: keyof typeof EXTRA_EXPENSES_TEMPLATE_DATA, value?: string | null) {
	return getExtraMenuItem(column, { value })?.label ?? value ?? '';
}

export function getExtraValue(column: keyof typeof EXTRA_EXPENSES_TEMPLATE_DATA, label?: string | null) {
	return getExtraMenuItem(column, { label }).value ?? label ?? '';
}

/** @returns `true` If table is empty aka all values are the default values */
function isAssumptionTableEmpty(table: AssumptionOptionTable, template: TemplateTable) {
	const { headers, rows } = getAssumptionOptionRowViewValue(table.row_view, template.row_view);
	// HACK checking for "flat 0", TODO check for all properties to make sure none were modified from the default values
	if (
		headers.criteria === 'entire_well_life' &&
		rows.length === 1 &&
		rows[0].criteria === 'entire_well_life' &&
		(rows[0].unit_cost === 0 || rows[0].fixed_expense === 0 || rows[0].carbon_expense === 0)
	)
		return true;
	return false;
}

export const EXPENSES_KEYS = {
	variable: 'variable_expenses',
	fixed: 'fixed_expenses',
	water: 'water_disposal',
	carbon: 'carbon_expenses',
} as const;

export const UNIT_KEYS = {
	[EXPENSES_KEYS.fixed]: 'fixed_expense',
	[EXPENSES_KEYS.carbon]: 'carbon_expense',
};

export const getValues = (val, template: TemplateTable) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return _.mapValues(val, (v: any, k) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const temp = template[k] as any;
		const found = temp?.menuItems?.find(({ value }) => value === (v?.value ?? v));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		return found?.label ?? getExtraLabel(k as any, v) ?? v?.value ?? v;
	});
};

// TODO Use template
export const getDefaultUnit = (key) => {
	if (key === 'gas') return 'dollar_per_mcf';
	if (key === 'monthly_well_cost' || key.includes('other_monthly_cost')) return 'fixed_expense';
	return 'dollar_per_bbl';
};

/**
 * Will convert from data saved in the db to rows used by ag grid
 *
 * @todo Return type
 */
export function assumptionToRows(
	assumption: Assumption,
	template: ExpensesTemplate,
	elts: ModuleListEmbeddedLookupTableItem[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): any[] {
	const getRows = (params: {
		key: string;
		category: string | null;
		table: AssumptionOptionTable;
		template: TemplateTable;
	}) => {
		const { key, category, table, template } = params;

		if (isAssumptionTableEmpty(table, template)) return [];

		const { row_view, ...rest } = table;
		const rateColumns = _.pick(rest, RATE_COLUMNS);
		const nonRateColumns = _.omit(rest, RATE_COLUMNS);
		const { headers, rows } = getAssumptionOptionRowViewValue(row_view, template.row_view);

		assert(rows.length > 0, 'Expected at least one row', () => ({ table, template, headers, rows })); // TODO improve message

		const result = rows.map((row, i) => {
			const period = (() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const criteria = (table.row_view.headers?.criteria as any).value;

				if (criteria === 'entire_well_life') return 'Flat';
				if (criteria === 'dates') return formatDateRangeValue(parseDateValue(row.criteria?.start_date));
				if (RATE_KEYS.includes(criteria)) return row.criteria?.start;

				return row.criteria?.period ?? row.criteria?.end - row.criteria?.start;
			})();
			const unitCostKey = UNIT_KEYS[key] ?? 'unit_cost';
			const value = row[unitCostKey];

			if (i === 0) {
				const { description, ...menuItemValues } = getValues(nonRateColumns, template);

				return {
					[ROW_ID_KEY]: uuidv4(),
					key: getExtraLabel('key', key),
					category: getExtraLabel('category', category),
					criteria: getExtraLabel('criteria', headers.criteria),
					unit: getExtraLabel('unit', headers[unitCostKey]),
					period,
					value,
					description: description ?? '',
					...menuItemValues,
					...(RATE_KEYS.includes(headers.criteria)
						? Object.entries(getValues(rateColumns, template)).reduce((acc, [key, value]) => {
								acc[key] = value;
								if (value?.toString() === '0') acc[key] = template[key].Default.label;
								return acc;
						  }, {})
						: {}),
				};
			}

			return {
				[ROW_ID_KEY]: uuidv4(),
				period,
				value,
				[IS_NESTED_ROW_KEY]: true,
			};
		});
		return result;
	};

	return [
		...FIXED_EXPENSES_CATEGORIES.flatMap((category) =>
			getRows({
				key: 'fixed_expenses',
				category: null,
				table: assumption.options.fixed_expenses[category].subItems,
				template: getTemplateCategory(EXPENSES_KEYS.fixed, category, '', template),
			})
		),
		...VARIABLE_EXPENSES_PHASES.flatMap((phase) =>
			VARIABLE_EXPENSES_CATEGORIES.flatMap((category) =>
				getRows({
					key: phase,
					category,
					table: assumption.options.variable_expenses[phase].subItems[category].subItems,
					template: getTemplateCategory(EXPENSES_KEYS.variable, phase, category, template),
				})
			)
		),
		...CARBON_EXPENSES_CATEGORIES.flatMap((category) =>
			getRows({
				key: CARBON_KEY,
				category,
				table: assumption.options[CARBON_KEY]?.[category].subItems,
				template: getTemplateCategory(EXPENSES_KEYS.carbon, '', category, template),
			})
		),
		...getRows({
			key: 'water_disposal',
			category: null,
			table: assumption.options.water_disposal,
			template: getTemplateCategory(EXPENSES_KEYS.water, '', '', template),
		}),
		...(assumption.embeddedLookupTables ?? ([] as Inpt.ObjectId<'embedded-lookup-table'>[])).map((_id) => {
			return {
				[ROW_ID_KEY]: uuidv4(),
				isELTRow: true,
				eltId: _id,
				eltName: elts.find((elt) => elt._id === _id)?.name,
			};
		}),
	];
}

export const VARIABLE_EXPENSES_KEYS = ['oil', 'gas', 'ngl', 'drip_condensate'] as const;

export function getGroupKey(key) {
	if (VARIABLE_EXPENSES_KEYS.includes(key)) return EXPENSES_KEYS.variable;
	if (key === EXPENSES_KEYS.fixed) return EXPENSES_KEYS.fixed;
	if (key === EXPENSES_KEYS.water) return EXPENSES_KEYS.water;
	if (key === EXPENSES_KEYS.carbon) return EXPENSES_KEYS.carbon;
	throw new Error(`Invalid key ${key}`);
}

export function getTemplateCategory(groupKey: string, key: string, category: string, template: ExpensesTemplate) {
	const templateCategory = (() => {
		switch (groupKey) {
			case EXPENSES_KEYS.variable:
				return template?.[groupKey]?.[key]?.subItems?.[category]?.subItems;
			case EXPENSES_KEYS.fixed:
				return template[groupKey]?.[key]?.subItems;
			case EXPENSES_KEYS.water:
				return template[groupKey];
			case EXPENSES_KEYS.carbon:
				return template[groupKey]?.[category]?.subItems;
		}

		throw new Error('Invalid group key');
	})();

	assert(templateCategory);

	return templateCategory;
}

export function rowsToAssumption(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rows: any[],
	template: ExpensesTemplate,
	elts: ModuleListEmbeddedLookupTableItem[]
): Assumption {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const options = GenerateNewModelHeaders(template) as Assumption['options'];

	const embeddedLookupTables: Inpt.ObjectId<'embedded-lookup-table'>[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let parentRow: null | any = null;
	let fixedCount = 0;

	for (const row of rows) {
		if (row.eltName) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			embeddedLookupTables.push(elts.find((elt) => row.eltName === elt.name)!._id);
			continue;
		}

		const isParentRow = !!row?.key;
		parentRow = isParentRow ? row : parentRow;
		assert(parentRow);

		const { key: keyLabel, category: categoryLabel, unit: unitLabel, criteria: criteriaLabel, ...rest } = parentRow;

		const _key = getExtraValue('key', keyLabel);
		const category = getExtraValue('category', categoryLabel);
		const criteria = getExtraValue('criteria', criteriaLabel);

		const subItemsValues = _.omit(rest, ['value', 'period']);
		const { value } = row;
		const groupKey = getGroupKey(_key);

		const key = (() => {
			if (groupKey === EXPENSES_KEYS.fixed && !!row.key) {
				// if is fixed expenses and not a time serie we adjust the category
				fixedCount++;
			}
			if (groupKey === EXPENSES_KEYS.fixed) {
				if (fixedCount === 1) return 'monthly_well_cost';
				return `other_monthly_cost_${fixedCount - 1}`;
			}
			return _key;
		})() as ExpensesVariablePhase | ExpensesVariableCategory | ExpensesFixedCategory;

		const templateCategory = getTemplateCategory(groupKey, key, category, template);
		const unit = getUnitValueOrDefaultForKey(unitLabel, key);

		const subItems = (() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			options[groupKey] ??= {} as any;
			if (EXPENSES_KEYS.water === groupKey) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				if (isParentRow) options[groupKey] = {} as any;
				return options[groupKey];
			}
			if (EXPENSES_KEYS.carbon === groupKey) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				if (isParentRow) options[groupKey][category].subItems = {} as any;
				return options[groupKey][category].subItems;
			}
			options[groupKey][key] ??= {};
			options[groupKey][key].subItems ??= {};
			if (EXPENSES_KEYS.fixed === groupKey) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				if (isParentRow) options[groupKey][key].subItems = {} as any;
				return options[groupKey][key].subItems;
			}
			if (isParentRow) options[groupKey][key].subItems[category].subItems = { row_view: {} };
			return options[groupKey][key].subItems[category].subItems;
		})();

		const isRateKey = RATE_LABELS.includes(getExtraLabel('criteria', criteria));

		for (const key of Object.keys(templateCategory)) {
			if (key === 'row_view') continue;

			const value =
				templateCategory[key]?.menuItems?.find(({ label }) => label === subItemsValues[key]) ??
				subItemsValues[key] ??
				templateCategory[key]?.Default ??
				(RATE_COLUMNS.includes(key) ? 0 : '');

			subItems[key] =
				templateCategory[key]?.fieldType === FieldType.number && value !== '' ? Number(value) : value;
		}

		const unitCostKey =
			{
				[EXPENSES_KEYS.fixed]: 'fixed_expense',
				[EXPENSES_KEYS.carbon]: 'carbon_expense',
			}[groupKey] ?? 'unit_cost';

		const headers = {
			...{
				[groupKey]: { [unitCostKey]: { value: unit, label: unitLabel } },
				[EXPENSES_KEYS.fixed]: {
					[unitCostKey]: {
						label: unitLabel,
						value: unit,
					},
				},
				[EXPENSES_KEYS.carbon]: {}, // HACK: carbon doesn't have unit ¯\_(ツ)_/¯
			}[groupKey],
			criteria: {
				label: criteriaLabel,
				value: criteria,
				disabled: false,
			},
		};

		subItems.row_view ??= {};
		subItems.row_view.headers = headers;
		subItems.row_view.rows = subItems.row_view.rows ?? [];
		subItems.row_view.rows.push({
			[unitCostKey]: Number(value),
			criteria: (() =>
				parseAssumptionOptionsRowsCriteria({
					row,
					isDateCriteria: criteria === 'dates',
					isRateCriteria: isRateKey,
				}))(),
		});
	}

	return {
		options: options as Assumption['options'],
		econ_function: createEconFunction(options, Object.keys(template)),
		embeddedLookupTables,
	};
}

export const EXPENSES_TEMPLATE_QUERY_KEY = [DT_QUERY_BASE, 'expenses-display-template'];

export function getExpensesTable(params: {
	template: ExpensesTemplate;
	key: ExpenseRowKey;
	category?: ExpensesVariableCategory | ExpensesCarbonCategory;
}) {
	const { template, key: _key, category: _category } = params;
	const key = getExtraValue('key', _key);
	const category = getExtraValue('category', _category);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	if (VARIABLE_EXPENSES_PHASES.includes(key as any) && VARIABLE_EXPENSES_CATEGORIES.includes(category)) {
		return template.variable_expenses[key as ExpensesVariablePhase].subItems[category]?.subItems;
	}

	if (CARBON_KEY === key && CARBON_EXPENSES_CATEGORIES.includes(category)) {
		return template.carbon_expenses[category as ExpensesCarbonCategory].subItems;
	}

	if (FIXED_EXPENSES_KEY === key) {
		return template.fixed_expenses.monthly_well_cost.subItems;
	}

	if (WATER_DISPOSAL_KEY === key) {
		return template.water_disposal;
	}

	return undefined;
}

export function getColumnLabel(template: ExpensesTemplate, column: string) {
	if (column in FIXED_LABELS) return FIXED_LABELS[column];

	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...getExpensesTable({ template, key: 'oil', category: 'gathering' })!,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...getExpensesTable({ template, key: 'fixed_expenses' })!,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...getExpensesTable({ template, key: 'water_disposal' })!,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...getExpensesTable({ template, key: 'co2e' })!,
	}?.[column]?.fieldName;
}

export const ALL_KEY_CATEGORIES = [
	...VARIABLE_EXPENSES_PHASES.flatMap((phase) =>
		VARIABLE_EXPENSES_CATEGORIES.map((category) => ({ key: phase, category }))
	),
	...Array.from({ length: 9 }).map(() => ({ key: FIXED_EXPENSES_KEY, category: '' })),
	{ key: WATER_DISPOSAL_KEY, category: '' },
	...CARBON_EXPENSES_CATEGORIES.map((category) => ({ key: CARBON_KEY, category })),
];

export const getColumnsDef = (enableELTColumn: boolean): ColGroupDef[] => {
	const expensesChildren: ColDef[] = [];

	if (enableELTColumn) {
		expensesChildren.push(eltColumnDefinition);
	}

	expensesChildren.push(
		...[
			{
				field: 'key',
				cellRenderer: CellRendererRowGroup,
			},
			{ field: 'category' },
			{ field: 'criteria', minWidth: 130 },
			{ field: 'period', minWidth: 240 },
			{ field: 'value' },
			{ field: 'unit' },
			{ field: 'description' },
		]
	);

	return [
		{
			headerName: 'Expenses',
			children: expensesChildren,
		},
		{
			headerName: 'Others',
			groupId: OTHERS_COL_GROUP_ID,
			children: _.without(ALL_COLUMNS, 'description').map((field) => ({
				...mapTemplateFieldToColDef(
					field,
					DEFAULT_EXPENSES_TEMPLATE.variable_expenses.oil.subItems.gathering.subItems[field] ??
						DEFAULT_EXPENSES_TEMPLATE.fixed_expenses.monthly_well_cost.subItems[field] ??
						DEFAULT_EXPENSES_TEMPLATE.water_disposal[field]
				),
			})),
		},
	];
};

export const validationOptions: ValidationInfoOptions<ExpenseRow> = {
	includeInContext: { eltsCount: true, keyCategoryCount: true, parentRow: true },
	matchKeyCasing: true,
};
