import { TemplateSelect } from '@/components/AdvancedTable/types';
import { RATE_COLUMNS, RATE_KEYS } from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/constants';
import {
	ExpensesCarbonCategory,
	ExpensesFixedCategory,
	ExpensesTemplate,
	ExpensesVariableCategory,
	ExpensesVariablePhase,
	getExtraValue,
	getGroupKey,
	getTemplateCategory,
} from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/shared';
import { FieldType } from '@/inpt-shared/constants';

export interface ExpensesLabelsPOJO {
	key: string;
	category: string;
	unit: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	criteria: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	period: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	description: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	shrinkage_condition: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	escalation_model: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	cap: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	calculation: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	affect_econ_limit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	deduct_before_severance_tax: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	deduct_before_ad_val_tax: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	deal_terms: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rate_type: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rows_calculation_method: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	stop_at_econ_limit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	expense_before_fpd: any;
}

export interface ExpensesPOJO {
	groupKey: 'variable_expenses' | 'fixed_expenses' | 'water_disposal' | 'carbon_expenses';

	key: ExpensesVariablePhase | ExpensesVariableCategory | ExpensesFixedCategory | ExpensesCarbonCategory;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	category: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	unit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	criteria: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	period: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	description: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	shrinkage_condition: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	escalation_model: any;

	cap?: number;
	deal_terms?: number;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	calculation: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	affect_econ_limit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	deduct_before_severance_tax: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	deduct_before_ad_val_tax: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rate_type: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rows_calculation_method: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	stop_at_econ_limit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	expense_before_fpd: any;
}

const convertToNumberIfNotEmpty = (value) => {
	if (value === '0') return 0;
	return (value !== '' && Number(value)) || value;
};

// Copied from expenses and embedded
const getValue = (column: string, label: string, templateCategory: TemplateSelect) => {
	const valueFromTemplate = templateCategory[column]?.menuItems?.find((item) => item.label === label)?.value;
	const defaultValueFromTemplate = templateCategory[column]?.Default?.value;

	const value = valueFromTemplate ?? label ?? defaultValueFromTemplate ?? (RATE_COLUMNS.includes(column) ? 0 : '');

	return templateCategory?.[column]?.fieldType === FieldType.number && value !== '' ? Number(value) : value;
};

// Saving doc to the DB
// Shrunk => shrunk
export const labelToValueExpensesPOJO = (pojo: ExpensesLabelsPOJO, template: ExpensesTemplate): ExpensesPOJO => {
	const {
		key: keyLabel,
		category: categoryLabel,
		unit: unitLabel,
		criteria: criteriaLabel,
		description,
		escalation_model: escalationModelName,

		value,
		period,

		// Number
		cap,
		deal_terms,

		// Rate Columns
		rate_type,
		rows_calculation_method,

		shrinkage_condition,
		calculation,
		affect_econ_limit,
		deduct_before_severance_tax,
		deduct_before_ad_val_tax,
		stop_at_econ_limit,
		expense_before_fpd,
	} = pojo;

	const category = getExtraValue('category', categoryLabel);
	const criteria = getExtraValue('criteria', criteriaLabel);
	const key = getExtraValue('key', keyLabel);
	const unit = getExtraValue('unit', unitLabel);

	const groupKey = getGroupKey(key);

	const isRateKey = RATE_KEYS.includes(criteria);
	const isFixedExpenses = key === 'fixed_expenses';

	const templateCategory = getTemplateCategory(
		groupKey,
		// ELT has 'fixed_expenses' as key instead of 'monthly_well_cost' since there's no limit
		key === 'fixed_expenses' ? 'monthly_well_cost' : key,
		category,
		template
	);

	const escalationModelId = getValue('escalation_model', escalationModelName, templateCategory);

	const results: ExpensesPOJO = {
		category,
		criteria,
		description: description ?? '',
		key,
		unit,

		cap: convertToNumberIfNotEmpty(cap),
		deal_terms: convertToNumberIfNotEmpty(deal_terms),

		value: convertToNumberIfNotEmpty(value),
		period: criteria === 'entire_well_life' ? 'Flat' : period,

		escalation_model: escalationModelId,

		groupKey,

		calculation: getValue('calculation', calculation, templateCategory),
		affect_econ_limit: getValue('affect_econ_limit', affect_econ_limit, templateCategory),
		deduct_before_severance_tax: getValue(
			'deduct_before_severance_tax',
			deduct_before_severance_tax,
			templateCategory
		),
		deduct_before_ad_val_tax: getValue('deduct_before_ad_val_tax', deduct_before_ad_val_tax, templateCategory),

		// Only for rate keys
		rate_type: isRateKey ? getValue('rate_type', rate_type, templateCategory) : '',
		rows_calculation_method: isRateKey
			? getValue('rows_calculation_method', rows_calculation_method, templateCategory)
			: '',

		// Not for fixed expenses
		shrinkage_condition: isFixedExpenses
			? ''
			: getValue('shrinkage_condition', shrinkage_condition, templateCategory),

		// Only for fixed expenses
		stop_at_econ_limit: isFixedExpenses ? getValue('stop_at_econ_limit', stop_at_econ_limit, templateCategory) : '',
		expense_before_fpd: isFixedExpenses ? getValue('expense_before_fpd', expense_before_fpd, templateCategory) : '',
	};

	return results;
};
