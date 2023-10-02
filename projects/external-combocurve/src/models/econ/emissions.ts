import { IBaseEconModel } from './econ-models';

export const EMISSIONS_KEY = 'emission';
export const EMISSIONS_NAME = 'Emission';

export const EMISSION_CATEGORY = [
	'associated_gas',
	'acid_gas_removal_units',
	'centrifugal_compressor',
	'eor_hydrocarbon_liquids',
	'eor_injection_pumps',
	'liquids_unloading',
	'pneumatic_device',
	'dehydrators',
	'equipment_leaks',
	'atmospheric_tank',
	'reciprocating_compressor',
	'completions_with_fracturing',
	'completions_without_fracturing',
	'drilling',
	'completion',
	'combustion',
	'pneumatic_pump',
	'well_testing',
	'blowdown_vent_stacks',
	'flare',
	'scope2',
	'scope3',
] as const;

export const EMISSION_UNIT = [
	'mt_per_mbbl',
	'mt_per_mmcf',
	'mt_per_mboe',
	'mt_per_well_per_year',
	'mt_per_new_well',
] as const;

export type EmissionCategory = (typeof EMISSION_CATEGORY)[number];
export type EmissionUnit = (typeof EMISSION_UNIT)[number];

export type EmissionKey = typeof EMISSIONS_KEY;
type EmissionName = typeof EMISSIONS_NAME;

export interface IEmission extends IBaseEconModel {
	assumptionKey: EmissionKey;
	assumptionName: EmissionName;
	econ_function: IEmissionEconFunction;
}

export interface IEmissionEconFunction extends Record<string, Array<IEmissionRow>> {
	table: Array<IEmissionRow>;
}

export interface IEmissionRow {
	selected: boolean;
	category: EmissionCategory;
	co2e: number;
	co2: number;
	ch4: number;
	n2o: number;
	unit: EmissionUnit;
	escalation_model: 'none' | string;
}
