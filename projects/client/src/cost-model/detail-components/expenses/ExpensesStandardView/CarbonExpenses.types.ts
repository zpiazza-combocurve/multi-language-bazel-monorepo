export enum CarbonExpensesKey {
	'co2e' = 'co2e',
	'co2' = 'co2',
	'ch4' = 'ch4',
	'n2o' = 'n2o',
}

export interface CarbonExpensesProps {
	carbon_expenses: CarbonExpensesInterface;
	onSelect;
	selected;
	setCarbonExpenses;
	fields: CarbonExpenseFields;
}

export type CarbonExpensesInterface = {
	[key in CarbonExpensesKey]: {
		subItems: CarbonExpenseSubItem;
	};
} & {
	category: {
		label: string;
		value: string;
	};
};

interface CarbonExpenseSubItem {
	affect_econ_limit: CarbonExpenseLabelAndValue;
	calculation: CarbonExpenseLabelAndValue;
	cap: string;
	deal_terms: number;
	deduct_before_ad_val_tax: CarbonExpenseLabelAndValue;
	deduct_before_severance_tax: CarbonExpenseLabelAndValue;
	description: string;
	escalation_model: CarbonExpenseLabelAndValue;
	rate_type: CarbonExpenseLabelAndValue;
	rows_calculation_method: CarbonExpenseLabelAndValue;
	row_view: {
		headers: {
			carbon_expense: string;
			criteria: CarbonExpenseRowHeaderCriteria;
		};
		rows: {
			carbon_expense: number;
			criteria:
				| string
				| {
						start: number;
						end: number;
						period: number;
				  };
		}[];
	};
}

interface CarbonExpenseLabelAndValue {
	label: string;
	value: string;
	disabled?: boolean;
}

type CarbonExpenseRowHeaderCriteria = CarbonExpenseLabelAndValue | string;

interface CarbonExpenseFields {
	category: {
		Default: CarbonExpenseLabelAndValue;
		fieldName: string;
		fieldType: string;
		menuItems: CarbonExpenseLabelAndValue[];
		placeholder: string;
		required?: boolean;
		valType: string;
	};
}

export interface CarbonExpenseRenderData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	category: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: boolean | null | any[];
}
