export const CAPEX_OTHER_COLUMNS = [
	'category',
	'description',
	'tangible',
	'intangible',
	'criteria_option',
	'criteria_from_option',
	'criteria_value',
	'capex_expense',
	'after_econ_limit',
	'calculation',
	'escalation_model',
	'escalation_start_option',
	'escalation_start_value',
	'depreciation_model',
	'deal_terms',
];

export const CAPEX_COLUMNS_WITH_DEFAULT = [
	'category',
	'tangible',
	'intangible',
	'criteria_option',
	'criteria_value',
	'capex_expense',
	'after_econ_limit',
	'calculation',
	'escalation_model',
	'escalation_start_option',
	'depreciation_model',
	'deal_terms',
];

export const NUMERICAL_COLUMNS = ['tangible', 'intangible', 'deal_terms'];

export const CAPEX_COLUMNS_WITH_DATES = ['criteria_value', 'escalation_start_value'];

export const CAPEX_TEMPLATE_QUERY_KEY = 'capex-display-template';

export const CRITERIA_SPECIAL_OPTIONS = ['fromSchedule', 'fromHeaders'];
export const CAPEX_OPTIONS_COMPLEX_ROWS = ['criteria', 'escalation_start'];

export const CAPEX_DATE_FORMAT = ['MM/dd/yyyy', 'M/d/yyyy', 'MM/d/yyyy', 'M/dd/yyyy'];
export const CAPEX_RATES_LABELS = ['Oil Rate', 'Gas Rate', 'Water Rate', 'Total Fluid Rate (Oil + Water)'];

export const ELT_LOOKUP_BY_COLUMNS_ORDERED = CAPEX_OTHER_COLUMNS.filter((column) => column !== 'category');
export const NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS = ['category'];

export enum CapexColumn {
	category = 'category',
	description = 'description',
	tangible = 'tangible',
	intangible = 'intangible',
	criteriaOption = 'criteria_option',
	criteriaFromOption = 'criteria_from_option',
	criteriaValue = 'criteria_value',
	capexExpense = 'capex_expense',
	afterEconLimt = 'after_econ_limit',
	calculation = 'calculation',
	escalationModel = 'escalation_model',
	escalationStartOption = 'escalation_start_option',
	escalationStartValue = 'escalation_start_value',
	depreciationModel = 'depreciation_model',
	dealTerms = 'deal_terms',
}

export const CAPEX_LOOKUP_BY_FIELDS_DEPENDENCIES = {
	[CapexColumn.criteriaOption]: [CapexColumn.criteriaFromOption, CapexColumn.criteriaValue],
	[CapexColumn.criteriaFromOption]: [CapexColumn.criteriaValue],
};

export const DEFAULT_NUMBER_VALUE = 0;
export const FALLBACK_NUMBER_MIN_VALUE = -10000000000;
export const FALLBACK_NUMBER_MAX_VALUE = 10000000000;
