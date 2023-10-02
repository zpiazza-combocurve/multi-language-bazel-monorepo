import { IBaseEconModel } from './econ-models';
import { YesNo } from './shared';

export const DateSettings_KEY = 'dates';
export const DateSettings_Name = 'Dates';

export type DateSettingsKey = typeof DateSettings_KEY;
type DateSettingsName = typeof DateSettings_Name;

export interface IDateSettings extends IBaseEconModel {
	assumptionKey: DateSettingsKey;
	assumptionName: DateSettingsName;
	econ_function: {
		date_setting: IDateSettingEconFunction;
		cut_off: ICutOffEconFunction;
	};
}

export interface IDateSettingEconFunction {
	max_well_life: number;
	as_of_date: IDateSettingDiscountOrAsOf;
	discount_date: IDateSettingDiscountOrAsOf;
	cash_flow_prior_to_as_of_date: YesNo | string;
	production_data_resolution: 'same_as_forecast' | 'monthly' | 'daily' | string;
	fpd_source_hierarchy: IDateSettingsSourceHierarchyUseForecast;
}

export interface IDateSettingsSourceHierarchyUseForecast {
	use_forecast_schedule_when_no_prod: YesNo | string;
}
export type IDateSettingDiscountOrAsOf = Record<
	keyof IAsOfDateOrDiscountDate,
	string | IDynamicDiscountDate | undefined | boolean
>;

export interface IFPDSourceHierarchies {
	first_fpd_source: IDateSettingFPDSourceHierarchy;
	second_fpd_source: IDateSettingFPDSourceHierarchy;
	third_fpd_source: IDateSettingFPDSourceHierarchy;
	fourth_fpd_source: IDateSettingFPDSourceHierarchy;
}

export type IDateSettingFPDSourceHierarchy = Record<keyof IFPDSourceHierarchy, string | boolean | undefined>;

export interface IFPDSourceHierarchy {
	well_header?: string | boolean;
	production_data?: string | boolean;
	forecast?: string | boolean;
	not_used?: string | boolean;
	date?: string;
	link_to_wells_ecl?: string;
}
export interface IAsOfDateOrDiscountDate {
	date?: string;
	maj_seg?: string;
	fpd?: string;
	dynamic?: string | IDynamicDiscountDate;
}

export interface IDynamicDiscountDate {
	label: string;
	value: string;
}

export interface ICutOffEconFunction {
	max_cum_cash_flow?: string | boolean;
	first_negative_cash_flow?: string | boolean;
	last_positive_cash_flow?: string | boolean;
	no_cut_off?: string | boolean;
	oil_rate?: number;
	gas_rate?: number;
	water_rate?: number;
	date?: string;
	years_from_as_of?: number;
	link_to_wells_ecl?: string;
	min_cut_off: ICutOffMinLife;
	capex_offset_to_ecl: YesNo | string;
	include_capex: YesNo | string;
	discount: number;
	consecutive_negative?: number;
	econ_limit_delay: number;
	side_phase_end: YesNo | string;
}

export type ICutOffMinLife = Record<keyof IMinCutOff, string | number | boolean | undefined>;

export interface IMinCutOff {
	none?: string | boolean;
	date?: string;
	as_of?: number;
	end_hist?: string | boolean;
}
