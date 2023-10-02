import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

export const GENERAL_OPTIONS_KEY = 'general_options';
export const GENERAL_OPTIONS_NAME = 'General Options';

export type GeneralOptionsKey = typeof GENERAL_OPTIONS_KEY;
export type GeneralOptionsName = typeof GENERAL_OPTIONS_NAME;

export interface IGeneralOptions extends IBaseEconModel {
	assumptionKey: GeneralOptionsKey;
	assumptionName: GeneralOptionsName;
	econ_function: {
		main_options: IMainOptions;
		income_tax: IIncomeTax;
		discount_table: IDiscountTable;
		boe_conversion: IBoeConversion;
		reporting_units: IReportingUnits;
	};
}

export interface IMainOptions {
	aggregation_date: Date;
	currency: 'USD';
	reporting_period: string;
	fiscal: string;
	income_tax: string;
	project_type: string;
}

export interface IIncomeTax {
	carry_forward: string;
	fifteen_depletion: string;
	federal_income_tax: IRowField;
	state_income_tax: IRowField;
}

export interface IDiscountTable extends IRowField {
	discount_method: string;
	cash_accrual_time: string;
	first_discount: number;
	second_discount: number;
}

export interface IBoeConversion {
	oil: number;
	wet_gas: number;
	dry_gas: number;
	ngl: number;
	drip_condensate: number;
}

export interface IReportingUnits {
	oil: string;
	gas: string;
	ngl: string;
	drip_condensate: string;
	water: string;
	pressure: string;
	cash: string;
	water_cut: 'BBL/BOE';
	gor: string;
	condensate_gas_ratio: string;
	drip_condensate_yield: string;
	ngl_yield: string;
}

// Values For Enum Fields:

export const reportingPeriodValues = ['calendar', 'fiscal'];
export const fiscalValues = ['0-11', '1-0', '2-1', '3-2', '4-3', '5-4', '6-5', '7-6', '8-7', '9-8', '10-9', '11-10'];
export const projectTypeValues = [
	'primary_recovery',
	'secondary_recovery',
	'tertiary_recovery',
	'water_flood',
	'co2_flood',
	'surfactant_flood',
	'polymer_flood',
	'sagd',
	'thermal',
	'heavy_oil',
	'oil_sand',
	'deep_water',
];
export const discontTableValues = ['yearly', 'quarterly', 'monthly', 'daily'];
export const cashAccrualValues = ['mid_month', 'end_month'];
export const barrelUnits = ['BBL', 'MBBL', 'MMBBL'];
export const gasVolumeUnits = ['MCF', 'MMCF', 'BCF'];
export const gallonUnits = ['GAL', 'MGAL', 'MMGAL'];
export const pressureUnits = ['PSI', 'KPSI'];
export const cashUnits = ['$', 'M$', 'MM$'];
export const gorUnits = ['CF/BBL', 'MCF/BBL'];
export const barrelRatioUnits = ['BBL/MMCF', 'BBL/MCF'];
export const gallonRationUnits = ['GAL/MCF', 'GAL/MMCF'];
