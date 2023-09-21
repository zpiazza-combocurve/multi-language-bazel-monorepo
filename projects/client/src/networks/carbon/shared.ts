import * as joint from '@clientio/rappid';
import { NodeType } from '@combocurve/types/client/network-shared';
import { useEffect, useRef } from 'react';
import { useMatch } from 'react-router-dom';

import { EmissionCategory } from '@/inpt-shared/econ-models/emissions';
import { projectRoutes } from '@/projects/routes';

import { getNewStandardEdgeRow } from './Diagram/forms/StandardEdgeForm';
import { TimeSeriesInputCommonCriteriaOptions } from './Diagram/types';
import {
	EdgeType,
	EdgeTypeEdgeMap,
	EmissionType,
	FuelType,
	NodeTypeNodeMap,
	NonDisplayedStream,
	PneumaticDeviceType,
	SelectedFormula,
	Stream,
} from './types';

export const START_VALUE = 'Start';

export function useNetworkModelId() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRoutes.project(':projectId').networkModel(':id').root}/*`);
	const nwId = match?.params?.id;
	return nwId;
}

export function useNetworkModelFacilityId() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRoutes.project(':projectId').facility(':id').root}/*`);
	const nwId = match?.params?.id;
	return nwId;
}

export function checkLinkValidity(link: joint.dia.Link) {
	const sourceElement = link.getSourceElement();
	const targetElement = link.getTargetElement();
	if (!sourceElement || !targetElement) {
		link.remove();
	}
	const sourcePorts = sourceElement?.getPorts();
	const targetPorts = targetElement?.getPorts();
	const linkSourceData = link.get('source');
	const linkTargetData = link.get('target');
	if (!sourcePorts?.some((port) => port.id === linkSourceData.port)) {
		link.remove();
	}
	if (!targetPorts?.some((port) => port.id === linkTargetData.port)) {
		link.remove();
	}
}

export enum PortsGroup {
	in = 'in',
	out = 'out',
	linkIn = 'linkIn',
	linkOut = 'linkOut',
	developmentIn = 'developmentIn',
	developmentOut = 'developmentOut',
}

export type DetailedPort = {
	stream: Stream;
	portsGroup: PortsGroup;
};

export interface NodePresetData {
	name: string;
	ports: DetailedPort[];
}

export const DEFAULT_PORT_NAMES: Record<Stream, string> = {
	[Stream.oil]: 'Oil',
	[Stream.gas]: 'Gas',
	[Stream.water]: 'Water',
	[Stream.link]: 'Link',
	[Stream.development]: 'Dev',
};

export const STREAM_DISPLAY_UNITS: Record<
	Exclude<Stream, Stream.link | Stream.development> | NonDisplayedStream,
	string
> = {
	[Stream.oil]: 'BBL',
	[Stream.gas]: 'MCF',
	[Stream.water]: 'BBL',
	[NonDisplayedStream.CO2e]: 'MT',
	[NonDisplayedStream.CO2]: 'MT',
	[NonDisplayedStream.CH4]: 'MT',
	[NonDisplayedStream.N2O]: 'MT',
};

const OIL_GAS_AND_WATER_STREAMS = [Stream.oil, Stream.gas, Stream.water];
export const INPUT_PORT_GROUPS = [PortsGroup.in, PortsGroup.linkIn, PortsGroup.developmentIn];
export const OUTPUT_PORT_GROUPS = [PortsGroup.out, PortsGroup.linkOut, PortsGroup.developmentOut];

export const NODES_PRESETS: Record<Exclude<NodeType, 'facility'>, NodePresetData> = {
	[NodeType.well_group]: {
		name: 'Well Group',
		ports: [
			...OIL_GAS_AND_WATER_STREAMS.map((stream) => ({
				stream,
				portsGroup: PortsGroup.out,
			})),
			{
				stream: Stream.link,
				portsGroup: PortsGroup.linkOut,
			},
			{
				stream: Stream.development,
				portsGroup: PortsGroup.developmentIn,
			},
		],
	},
	[NodeType.atmosphere]: {
		name: 'Atmosphere',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
		],
	},
	[NodeType.capture]: {
		name: 'Capture',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
		],
	},
	[NodeType.econ_output]: {
		name: 'Econ Output',
		ports: [
			...OIL_GAS_AND_WATER_STREAMS.map((stream) => ({
				stream,
				portsGroup: PortsGroup.in,
			})),
		],
	},
	[NodeType.liquids_unloading]: {
		name: 'Liquids Unloading',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.out,
			},
		],
	},
	[NodeType.flare]: {
		name: 'Flare',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
		],
	},
	[NodeType.oil_tank]: {
		name: 'Oil Tank',
		ports: [
			{
				stream: Stream.oil,
				portsGroup: PortsGroup.in,
			},
			{
				stream: Stream.oil,
				portsGroup: PortsGroup.out,
			},
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.out,
			},
		],
	},
	[NodeType.associated_gas]: {
		name: 'Associated Gas',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.out,
			},
		],
	},
	[NodeType.combustion]: {
		name: 'Combustion',
		ports: [],
	},
	[NodeType.pneumatic_device]: {
		name: 'Pneumatic Device',
		ports: [],
	},
	[NodeType.pneumatic_pump]: {
		name: 'Pneumatic Pump',
		ports: [],
	},
	[NodeType.centrifugal_compressor]: {
		name: 'Centrifugal Compressor',
		ports: [],
	},
	[NodeType.reciprocating_compressor]: {
		name: 'Reciprocating Compressor',
		ports: [],
	},
	[NodeType.drilling]: {
		name: 'Drilling',
		ports: [
			{
				stream: Stream.development,
				portsGroup: PortsGroup.developmentOut,
			},
		],
	},
	[NodeType.completion]: {
		name: 'Completion',
		ports: [
			{
				stream: Stream.development,
				portsGroup: PortsGroup.developmentOut,
			},
		],
	},
	[NodeType.flowback]: {
		name: 'Flowback',
		ports: [
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.in,
			},
			{
				stream: Stream.gas,
				portsGroup: PortsGroup.out,
			},
		],
	},
	[NodeType.custom_calculation]: {
		name: 'Custom Calculation',
		ports: [],
	},
};

export const EMISSION_TYPE_LABELS: Record<EmissionType, string> = {
	[EmissionType.vented]: 'Vented',
	[EmissionType.capture]: 'Capture',
	[EmissionType.flare]: 'Flare',
	[EmissionType.combustion]: 'Combustion',
	[EmissionType.electricity]: 'Electricity',
};

export const ATMOSPHERE_EMISSION_OPTIONS = [
	{
		value: EmissionType.vented,
		label: 'Vented',
	},
];

export const CAPTURE_EMISSION_OPTIONS = [
	{
		value: EmissionType.capture,
		label: 'Capture',
	},
];

export const DEVICE_TYPE_LIST = [
	PneumaticDeviceType.highBleed,
	PneumaticDeviceType.intermittent,
	PneumaticDeviceType.lowBleed,
];
export const DEVICE_TYPE_LABELS = {
	[PneumaticDeviceType.highBleed]: 'High Bleed',
	[PneumaticDeviceType.intermittent]: 'Intermittent',
	[PneumaticDeviceType.lowBleed]: 'Low Bleed',
};

export const DEFAULT_NODE_DATA: {
	[nodeType in keyof Omit<NodeTypeNodeMap, 'facility'>]: NodeTypeNodeMap[nodeType]['params'];
} = {
	associated_gas: null,
	atmosphere: { emission_type: EmissionType.vented },
	capture: { emission_type: EmissionType.capture },
	econ_output: null,
	flare: { fuel_hhv: { value: 0.001235, unit: 'MMBtu/scf' }, pct_flare_efficiency: 98, pct_flare_unlit: 0 },
	liquids_unloading: null,
	oil_tank: { oil_to_gas_ratio: 1, output_gas_fluid_model: null },
	well_group: {
		wells: [],
		fluid_model: null,
	},
	combustion: {
		time_series: {
			fuel_type: 'distillate_fuel_oil_number_2',
			assigning_mode: 'facility',
			criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
			rows: [
				{
					period: 'Flat',
					consumption_rate: 0,
				},
			],
		},
	},
	pneumatic_device: {
		time_series: {
			criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
			rows: [
				{
					count: 0,
					runtime: 8760,
					device_type: PneumaticDeviceType.highBleed,
					period: 'Flat',
				},
			],
		},
		fluid_model: null,
	},
	pneumatic_pump: {
		time_series: {
			assigning_mode: 'facility',
			criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
			rows: [
				{
					count: 0,
					runtime: 8760,
					period: 'Flat',
				},
			],
		},
		fluid_model: null,
	},
	centrifugal_compressor: {
		time_series: {
			assigning_mode: 'facility',
			criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
			rows: [
				{
					count: 0,
					runtime: 8760,
					period: 'Flat',
				},
			],
		},
		fluid_model: null,
	},
	reciprocating_compressor: {
		time_series: {
			assigning_mode: 'facility',
			criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
			rows: [
				{
					count: 0,
					runtime: 8760,
					period: 'Flat',
				},
			],
		},
		fluid_model: null,
	},
	drilling: {
		time_series: {
			fuel_type: 'distillate_fuel_oil_number_2',
			rows: [
				{
					start_date_window: START_VALUE,
					consumption_rate: 0,
					start_criteria: 'FPD',
					start_criteria_option: null,
					start_value: 0,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 0,
				},
			],
		},
	},
	completion: {
		time_series: {
			fuel_type: 'distillate_fuel_oil_number_2',
			rows: [
				{
					start_date_window: START_VALUE,
					consumption_rate: 0,
					start_criteria: 'FPD',
					start_criteria_option: null,
					start_value: 0,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 0,
				},
			],
		},
	},
	flowback: {
		time_series: {
			rows: [
				{
					start_date_window: START_VALUE,
					flowback_rate: 0,
					start_criteria: 'FPD',
					start_criteria_option: null,
					start_value: 0,
					end_criteria: 'duration',
					end_criteria_option: null,
					end_value: 0,
				},
			],
		},
	},
	custom_calculation: {
		inputs: [
			{
				name: 'Oil',
				assign: false,
				by: Stream.oil,
			},
			{
				name: 'Gas',
				assign: false,
				by: Stream.gas,
			},
			{
				name: 'Water',
				assign: false,
				by: Stream.water,
			},
		],
		outputs: [
			{
				name: 'Gas',
				assign: false,
				by: Stream.gas,
				category: EmissionCategory.custom_calculation,
				emission_type: 'N/A',
			},
			{
				name: 'CO2e',
				assign: false,
				by: NonDisplayedStream.CO2e,
				category: EmissionCategory.custom_calculation,
				emission_type: EmissionType.vented,
			},
			{
				name: 'CO2',
				assign: false,
				by: NonDisplayedStream.CO2,
				category: EmissionCategory.custom_calculation,
				emission_type: EmissionType.vented,
			},
			{
				name: 'CH4',
				assign: false,
				by: NonDisplayedStream.CH4,
				category: EmissionCategory.custom_calculation,
				emission_type: EmissionType.vented,
			},
			{
				name: 'N2O',
				assign: false,
				by: NonDisplayedStream.N2O,
				category: EmissionCategory.custom_calculation,
				emission_type: EmissionType.vented,
			},
		],
		formula: {
			simple: [],
			advanced: '',
		},
		fluid_model: null,
		active_formula: SelectedFormula.simple,
	},
};

export const DND_NETWORK_MODEL_TYPE = 'DND_NETWORK_MODEL_TYPE';

/** If the callback returns true, then it won't be called again */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useOnce(cb: () => boolean, deps: any[]) {
	const doneRef = useRef(false);
	return useEffect(() => {
		if (doneRef.current) return;
		const done = cb();
		if (done) doneRef.current = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}

export const DETAILED_FUEL_TYPES: {
	[k: string]: FuelType;
} = {
	anthracite: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: anthracite',
	},
	bituminous: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: bituminous',
	},
	subbituminous: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: subbituminous',
	},
	lignite: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: lignite',
	},
	coal_coke: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: coal coke',
	},
	mixed_commercial_sector: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: mixed (commercial sector)',
	},
	mixed_industrial_coking: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: mixed (industrial coking)',
	},
	mixed_industrial_sector: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: mixed (industrial sector)',
	},
	mixed_electric_power_sector: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Coal and coke: mixed (electric power sector)',
	},
	natural_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Natural gas (pipeline quality)',
	},
	distillate_fuel_oil_number_1: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: distillate fuel oil No. 1',
	},
	distillate_fuel_oil_number_2: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: distillate fuel oil No. 2',
	},
	distillate_fuel_oil_number_4: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: distillate fuel oil No. 4',
	},
	residual_fuel_oil_number_5: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: residual fuel oil No. 5',
	},
	residual_fuel_oil_number_6: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: residual fuel oil No. 6',
	},
	used_oil: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: used oil',
	},
	kerosene: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: kerosene',
	},
	liquefied_petroleum_gases_lpg: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: liquefied petroleum gases (LPG)',
	},
	propane: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: propane',
	},
	propylene: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: propylene',
	},
	ethane: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: ethane',
	},
	ethanol: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Biomass fuels - liquid: ethanol',
	},
	ethylene: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: ethylene',
	},
	isobutane: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: isobutane',
	},
	isobutylene: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: isobutylene',
	},
	butane: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: butane',
	},
	butylene: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: butylene',
	},
	naphtha: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: naphtha (<401 deg f)',
	},
	natural_gasoline: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: natural gasoline',
	},
	other_oil: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: other oil (>401 deg f)',
	},
	pentanes_plus: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: pentanes plus',
	},
	petrochemical_feedstocks: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: petrochemical feedstocks',
	},
	special_naphtha: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: special naphtha',
	},
	unfinished_oils: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: unfinished oils',
	},
	heavy_gas_oils: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: heavy gas oils',
	},
	lubricants: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: lubricants',
	},
	motor_gasoline: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: motor gasoline',
	},
	aviation_gasoline: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: aviation gasoline',
	},
	kerosene_type_jet_fuel: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: kerosene-type jet fuel',
	},
	asphalt_and_road_oil: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: asphalt and road oil',
	},
	crude_oil: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Petroleum products: crude oil',
	},
	petroleum_coke: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Petroleum products - solid: petroleum coke',
	},
	propane_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Petroleum products - gaseous: propane gas',
	},
	municipal_solid_waste: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Other fuels - solid: municipal solid waste',
	},
	tires: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Other fuels - solid: tires',
	},
	plastics: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Other fuels - solid: plastics',
	},
	blast_furnace_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Other fuels - gaseous: blast furnace gas',
	},
	coke_oven_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Other fuels - gaseous: coke oven gas',
	},
	fuel_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Other fuels - gaseous: fuel gas',
	},
	wood_and_wood_residuals: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Biomass fuels - solid: wood and wood residuals',
	},
	agricultural_byproducts: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Biomass fuels - solid: agricultural byproducts',
	},
	peat: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Biomass fuels - solid: peat',
	},
	solid_byproducts: {
		fuel_phase: 'solid',
		fuel_unit: 'short_ton',
		display_unit: 'TN',
		label: 'Biomass fuels - solid: solid byproducts',
	},
	landfill_gas: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Biomass fuels - gaseous: landfill gas',
	},
	other_biomass_gases: {
		fuel_phase: 'gas',
		fuel_unit: 'scf',
		display_unit: 'SCF',
		label: 'Biomass fuels - gaseous: other biomass gases',
	},
	biodiesel: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Biomass fuels - liquid: biodiesel (100%)',
	},
	rendered_animal_fat: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Biomass fuels - liquid: rendered animal fat',
	},
	vegetable_oil: {
		fuel_phase: 'liquid',
		fuel_unit: 'gallon',
		display_unit: 'GAL',
		label: 'Biomass fuels - liquid: vegetable oil',
	},
	electricity_us_average: {
		fuel_phase: 'electricity',
		fuel_unit: 'megawatt-hours',
		display_unit: 'MWH',
		label: 'Electricity: U.S. Average',
	},
	electricity_ercot: {
		fuel_phase: 'electricity',
		fuel_unit: 'megawatt-hours',
		display_unit: 'MWH',
		label: 'Electricity: ERCOT',
	},
};

export const DEFAULT_EDGE_DATA: {
	[edgeType in keyof EdgeTypeEdgeMap]: Partial<EdgeTypeEdgeMap[edgeType]>;
} = {
	[EdgeType.base]: {
		name: '',
		description: '',
	},
	[EdgeType.standard]: {
		params: {
			time_series: {
				criteria: TimeSeriesInputCommonCriteriaOptions.Flat,
				rows: [getNewStandardEdgeRow(TimeSeriesInputCommonCriteriaOptions.Flat, [])],
			},
		},
	},
	[EdgeType.input]: {},
	[EdgeType.output]: {},
	[EdgeType.link]: {},
	[EdgeType.development]: {},
};
