// enums
export enum NodeType {
	'well_group' = 'well_group',
	'flare' = 'flare',
	'oil_tank' = 'oil_tank',
	'liquids_unloading' = 'liquids_unloading',
	'associated_gas' = 'associated_gas',
	'econ_output' = 'econ_output',
	'atmosphere' = 'atmosphere',
	'combustion' = 'combustion',
	'pneumatic_device' = 'pneumatic_device',
	'pneumatic_pump' = 'pneumatic_pump',
	'centrifugal_compressor' = 'centrifugal_compressor',
	'reciprocating_compressor' = 'reciprocating_compressor',
	'facility' = 'facility',
	'drilling' = 'drilling',
	'completion' = 'completion',
	'capture' = 'capture',
	'flowback' = 'flowback',
	'custom_calculation' = 'custom_calculation',
}

export enum Stream {
	oil = 'oil',
	gas = 'gas',
	water = 'water',
	link = 'link',
	development = 'development',
}

export enum NonDisplayedStream {
	CO2e = 'CO2e',
	CO2 = 'CO2',
	CH4 = 'CH4',
	N2O = 'N2O',
}

export enum SelectedFormula {
	simple = 'simple',
	advanced = 'advanced',
}

export enum EmissionType {
	vented = 'vented',
	combustion = 'combustion',
	flare = 'flare',
	capture = 'capture',
	electricity = 'electricity',
}

export enum PneumaticDeviceType {
	highBleed = 'high-bleed',
	intermittent = 'intermittent',
	lowBleed = 'low-bleed',
}

export enum TimeSeriesCriteria {
	Flat = 'entire_well_life',
	FPD = 'offset_to_fpd',
	Dates = 'dates',
}

// other helper types
export interface CustomCalculationInput {
	name: string;
	assign: boolean;
	by: Stream;
}

export interface CustomCalculationOutput {
	name: string;
	assign: boolean;
	by: Stream | NonDisplayedStream;
	emission_type: EmissionType | 'N/A';
	category: string | null;
}

export interface CustomCalculationFormula {
	simple: {
		output: string;
		formula: string;
	}[];
	advanced?: string;
}

export type { RowDataByNodeTypeMap } from './network-shared-row-data';

// nodes
export type { Node, NodeByTypeMap } from './network-shared-nodes';

// edges
export type { Edge, EdgeByStreamMap, InputEdge, OutputEdge } from './network-shared-edges';
