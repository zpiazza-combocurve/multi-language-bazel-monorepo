export const ALL_COLUMNS = [
	'description',
	'shrinkage_condition',
	'escalation_model',
	'cap',
	'calculation',
	'affect_econ_limit',
	'deduct_before_severance_tax',
	'deduct_before_ad_val_tax',
	'deal_terms',
	'rate_type',
	'rows_calculation_method',
	'stop_at_econ_limit',
	'expense_before_fpd',
];

export const NUMERICAL_COLUMNS = ['value', 'cap', 'deal_terms'];

export const ELT_LOOKUP_BY_COLUMNS_ORDERED = ['value', 'unit', ...ALL_COLUMNS];
export const NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS = ['key', 'category', 'criteria', 'period'];

export const FIXED_LABELS = {
	key: 'Key',
	category: 'Category',
	unit: 'Unit',
	criteria: 'Criteria',
	value: 'Value',
	period: 'Period',
};

export const RATE_KEYS = ['oil_rate', 'gas_rate', 'water_rate', 'total_fluid_rate'];
export const RATE_LABELS = ['Oil Rate', 'Gas Rate', 'Water Rate', 'Total Fluid Rate (Oil + Water)'];
export const RATE_COLUMNS = ['rate_type', 'rows_calculation_method'];
export const FIXED_EXPENSES_COLUMNS = ['stop_at_econ_limit', 'expense_before_fpd'];
export const NON_APPLICABLE_WATER_DISPOSAL_COLUMNS = ['description', 'shrinkage_condition'];

export const COLUMN_LABELS_WITHOUT_SHRINKAGE_CONDITION = [
	'Drip Cond',
	'NGL',
	'Fixed Expenses',
	'Carbon Expenses',
	'Water Disposal',
];

export const OTHERS_COL_GROUP_ID = 'others';

export const EXPENSES_KEYS = {
	OIL: { label: 'Oil', periodDisabled: false, optionsKey: 'oil', key: 'OIL' },
	GAS: { label: 'Gas', periodDisabled: false, optionsKey: 'gas', key: 'GAS' },
	NGL: { label: 'NGL', periodDisabled: false, optionsKey: 'ngl', key: 'NGL' },
	DRIP_COND: { label: 'Drip Cond', periodDisabled: false, optionsKey: 'drip_condensate', key: 'DRIP_COND' },
	FIXED_EXPENSES: {
		label: 'Fixed Expenses',
		periodDisabled: true,
		optionsKey: 'fixed_expenses',
		key: 'FIXED_EXPENSES',
	},
	WATER_DISPOSAL: {
		label: 'Water Disposal',
		periodDisabled: true,
		optionsKey: 'water_disposal',
		key: 'WATER_DISPOSAL',
	},
	CARBON_EXPENSES: {
		label: 'Carbon Expenses',
		periodDisabled: true,
		optionsKey: 'carbon_expenses',
		key: 'CARBON_EXPENSES',
	},
};

export const EXPENSES_KEYS_LABELS = Object.values(EXPENSES_KEYS).map((item) => item.label);

export const EXPENSES_CATEGORIES = {
	G_AND_P: { label: 'G & P', optionsKey: 'gathering', helpText: 'Gathering and Processing' },
	OPC: { label: 'OPC', optionsKey: 'processing', helpText: 'Operating Cost' },
	TRN: { label: 'TRN', optionsKey: 'transportation', helpText: 'Transportation' },
	MKT: { label: 'MKT', optionsKey: 'marketing', helpText: 'Marketing Fees' },
	OTHER: { label: 'Other', optionsKey: 'other' },
	CO2E: { label: 'CO2e', optionsKey: 'co2e' },
	CO2: { label: 'CO2', optionsKey: 'co2' },
	CH4: { label: 'CH4', optionsKey: 'ch4' },
	N2O: { label: 'N2O', optionsKey: 'n2o' },
};

export const EXPENSES_CATEGORIES_LABELS = Object.values(EXPENSES_CATEGORIES).map((item) => item.label);
