import { IBaseEconModel } from './econ-models';

export const CAPEX_KEY = 'capex';
export const CAPEX_NAME = 'Capex';

export type CapexKey = typeof CAPEX_KEY;
type CapexName = typeof CAPEX_NAME;

export interface ICapex extends IBaseEconModel {
	assumptionKey: CapexKey;
	assumptionName: CapexName;
	econ_function: {
		other_capex: IOtherCapexEconFunction;
		drilling_cost?: IDrillingCostEconFunction;
		completion_cost?: ICompletionCostEconFunction;
		recompletion_workover?: IRecompletionWorkoverEconFunction;
	};
}

export interface ICompletionCostEconFunction {
	dollar_per_ft_of_vertical: number;
	dollar_per_ft_of_horizontal: IDollarPerFtRowField;
	fixed_cost: number;
	tangible_pct: number;
	calculation: 'net' | 'gross' | string;
	escalation_model: 'none' | string;
	depreciation_model: 'none' | string;
	deal_terms: number;
	rows: ICompletionCostRow[];
}

export interface IOtherCapexEconFunction {
	rows: IOtherCapexRowField[];
	probCapex?: boolean | null;
}

export interface IDrillingCostEconFunction {
	dollar_per_ft_of_vertical: number;
	dollar_per_ft_of_horizontal: number;
	fixed_cost: number;
	tangible_pct: number;
	calculation: 'net' | 'gross' | string;
	escalation_model: 'none' | string;
	depreciation_model: 'none' | string;
	deal_terms: number;
	rows: IDrillingCostRow[];
}

export interface IDrillingCostRow {
	pct_of_total_cost: number;
	offset_to_fpd: number;
	offset_to_as_of_date: number;
	offset_to_discount_date: number;
	offset_to_first_segment: number;
	schedule_start: number;
	schedule_end: number;
	date: string;
}

export interface ICompletionCostRow {
	pct_of_total_cost: number;
	offset_to_fpd: number;
	offset_to_as_of_date: number;
	offset_to_discount_date: number;
	offset_to_first_segment: number;
	schedule_start: number;
	schedule_end: number;
	date: string;
}

export interface IDollarPerFtRowField {
	rows: IDollarPerFtHorizontalRow[];
}

export interface IOtherCapexRowField {
	category: string;
	description: string;
	tangible: number;
	intangible: number;
	capex_expense: 'capex' | string;
	after_econ_limit: string;
	calculation: 'net' | 'gross' | string;
	escalation_model: 'none' | string;
	escalation_start: IOtherCapexEscalationStart;
	depreciation_model: 'none' | string;
	deal_terms: number;
	//Probabilistic capex
	distribution_type?: string;
	mean?: number;
	standard_deviation?: number;
	lower_bound?: number;
	upper_bound?: number;
	mode?: number;
	seed?: number;
	// criteria
	offset_to_fpd?: number;
	offset_to_as_of_date?: number;
	offset_to_discount_date?: number;
	offset_to_first_segment?: number;
	offset_to_econ_limit?: number;
	date?: string;
	oil_rate?: number;
	gas_rate?: number;
	water_rate?: number;
	total_fluid_rate?: number;
	// FROM SCHEDULE PROPERTIES
	fromSchedule?: string;
	offset_to_pad_preparation_mob_start?: number;
	offset_to_pad_preparation_mob_end?: number;
	offset_to_pad_preparation_start?: number;
	offset_to_pad_preparation_end?: number;
	offset_to_pad_preparation_demob_start?: number;
	offset_to_pad_preparation_demob_end?: number;
	offset_to_spud_mob_start?: number;
	offset_to_spud_mob_end?: number;
	offset_to_spud_start?: number;
	offset_to_spud_end?: number;
	offset_to_spud_demob_start?: number;
	offset_to_spud_demob_end?: number;
	offset_to_drill_mob_start?: number;
	offset_to_drill_mob_end?: number;
	offset_to_drill_start?: number;
	offset_to_drill_end?: number;
	offset_to_drill_demob_start?: number;
	offset_to_drill_demob_end?: number;
	offset_to_completion_mob_start?: number;
	offset_to_completion_mob_end?: number;
	offset_to_completion_start?: number;
	offset_to_completion_end?: number;
	offset_to_completion_demob_start?: number;
	offset_to_completion_demob_end?: number;
	// FROM HEADERS PROPERTIES
	fromHeaders?: string;
	offset_to_refrac_date?: number;
	offset_to_completion_end_date?: number;
	offset_to_completion_start_date?: number;
	offset_to_date_rig_release?: number;
	offset_to_drill_end_date?: number;
	offset_to_drill_start_date?: number;
	offset_to_first_prod_date?: number;
	offset_to_permit_date?: number;
	offset_to_spud_date?: number;
	offset_to_til?: number;
	offset_to_custom_date_0?: number;
	offset_to_custom_date_1?: number;
	offset_to_custom_date_2?: number;
	offset_to_custom_date_3?: number;
	offset_to_custom_date_4?: number;
	offset_to_custom_date_5?: number;
	offset_to_custom_date_6?: number;
	offset_to_custom_date_7?: number;
	offset_to_custom_date_8?: number;
	offset_to_custom_date_9?: number;
	offset_to_first_prod_date_daily_calc?: number;
	offset_to_first_prod_date_monthly_calc?: number;
	offset_to_last_prod_date_daily?: number;
	offset_to_last_prod_date_monthly?: number;
}

export interface IDollarPerFtHorizontalRow {
	unit_cost: number;
	prop_ll: number;
}

export interface IEscalationStart {
	date: string;
	apply_to_criteria: number;
	fpd: number;
	as_of_date: number;
	econ_limit: number;
}

export type IOtherCapexEscalationStart = Record<keyof IEscalationStart, string | number>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IRecompletionWorkoverEconFunction {}
