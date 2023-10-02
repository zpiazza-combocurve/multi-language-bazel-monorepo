import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { Calculation, RateTypes, RowsCalculationMethod, Shrinkage, YesNo } from './shared';
import { IBaseEconModel } from './econ-models';

export const Expenses_KEY = 'expenses';
export const Expenses_NAME = 'Expenses';

export type ExpensesKey = typeof Expenses_KEY;
type ExpensesName = typeof Expenses_NAME;

export interface IExpenses extends IBaseEconModel {
	assumptionKey: ExpensesKey;
	assumptionName: ExpensesName;
	econ_function: {
		variable_expenses: IVariableExpensesEconFunction;
		fixed_expenses: IFixedExpensesEconFunction;
		water_disposal: IExpensesFields;
		carbon_expenses: ICarbonExpensesEconFunction;
	};
}

export interface IVariableExpensesEconFunction {
	oil: IVariableExpensesPhase;
	gas: IVariableExpensesPhase;
	ngl: IVariableExpensesPhase;
	drip_condensate: IVariableExpensesPhase;
}
export interface IVariableExpensesPhase {
	gathering: IVariableExpensesPhaseFields;
	processing: IVariableExpensesPhaseFields;
	transportation: IVariableExpensesPhaseFields;
	marketing: IVariableExpensesPhaseFields;
	other: IVariableExpensesPhaseFields;
}

export interface IShrinkageCondition {
	shrinkage_condition: Shrinkage | string;
}

export interface IVariableExpensesPhaseFields extends IExpensesFields, IShrinkageCondition {}

export interface IFixedExpensesEconFunction {
	monthly_well_cost: IFixedExpensesFields;
	other_monthly_cost_1: IFixedExpensesFields;
	other_monthly_cost_2: IFixedExpensesFields;
	other_monthly_cost_3: IFixedExpensesFields;
	other_monthly_cost_4: IFixedExpensesFields;
	other_monthly_cost_5: IFixedExpensesFields;
	other_monthly_cost_6: IFixedExpensesFields;
	other_monthly_cost_7: IFixedExpensesFields;
	other_monthly_cost_8: IFixedExpensesFields;
}

export interface IFixedExpensesFields extends IExpensesFields {
	stop_at_econ_limit: YesNo | string;
	expense_before_fpd: YesNo | string;
}

export interface ICarbonExpensesEconFunction {
	category: string;
	co2e: IExpensesFields;
	co2: IExpensesFields;
	ch4: IExpensesFields;
	n2o: IExpensesFields;
}

export interface IExpensesFields extends IRowField {
	description: string;
	escalation_model: 'none' | string;
	calculation: Calculation | string;
	affect_econ_limit: YesNo | string;
	deduct_before_severance_tax: YesNo | string;
	deduct_before_ad_val_tax: YesNo | string;
	cap: string | number;
	deal_terms: number;
	rate_type: RateTypes | string;
	rows_calculation_method: RowsCalculationMethod;
}
