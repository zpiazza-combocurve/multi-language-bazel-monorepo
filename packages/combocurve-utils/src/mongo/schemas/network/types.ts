import mongoose from 'mongoose';

export enum EmissionType {
	vented = 'vented',
	combustion = 'combustion',
	flare = 'flare',
	capture = 'capture',
	electricity = 'electricity',
}

export const EMISSION_TYPES = Object.values(EmissionType);

export enum NodeType {
	'well_group' = 'well_group',
	'flare' = 'flare',
	'oil_tank' = 'oil_tank',
	'liquids_unloading' = 'liquids_unloading',
	'associated_gas' = 'associated_gas',
	'econ_output' = 'econ_output',
	'atmosphere' = 'atmosphere',
	'facility' = 'facility',
	'combustion' = 'combustion',
	'pneumatic_device' = 'pneumatic_device',
	'pneumatic_pump' = 'pneumatic_pump',
	'centrifugal_compressor' = 'centrifugal_compressor',
	'reciprocating_compressor' = 'reciprocating_compressor',
	'drilling' = 'drilling',
	'completion' = 'completion',
	'flowback' = 'flowback',
	'custom_calculation' = 'custom_calculation',
	'capture' = 'capture',
}

export enum NetworkNodeType {
	'well_group' = 'well_group',
	'flare' = 'flare',
	'oil_tank' = 'oil_tank',
	'liquids_unloading' = 'liquids_unloading',
	'associated_gas' = 'associated_gas',
	'econ_output' = 'econ_output',
	'atmosphere' = 'atmosphere',
	'facility' = 'facility',
	'drilling' = 'drilling',
	'completion' = 'completion',
	'flowback' = 'flowback',
	'custom_calculation' = 'custom_calculation',
	'capture' = 'capture',
}

export enum FacilityNodeType {
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
	'custom_calculation' = 'custom_calculation',
}

export enum EdgeType {
	'oil' = 'oil',
	'gas' = 'gas',
	'water' = 'water',
	'link' = 'link',
	'development' = 'development',
}

enum TimeSeriesInputCommonCriteriaOptions {
	Flat = 'entire_well_life',
	Dates = 'dates',
}

export const TimeSeriesCriterias = Object.values(TimeSeriesInputCommonCriteriaOptions);

enum FuelType {
	anthracite = 'anthracite',
	bituminous = 'bituminous',
	subbituminous = 'subbituminous',
	lignite = 'lignite',
	coal_coke = 'coal_coke',
	mixed_commercial_sector = 'mixed_commercial_sector',
	mixed_industrial_coking = 'mixed_industrial_coking',
	mixed_industrial_sector = 'mixed_industrial_sector',
	mixed_electric_power_sector = 'mixed_electric_power_sector',
	natural_gas = 'natural_gas',
	distillate_fuel_oil_number_1 = 'distillate_fuel_oil_number_1',
	distillate_fuel_oil_number_2 = 'distillate_fuel_oil_number_2',
	distillate_fuel_oil_number_4 = 'distillate_fuel_oil_number_4',
	residual_fuel_oil_number_5 = 'residual_fuel_oil_number_5',
	residual_fuel_oil_number_6 = 'residual_fuel_oil_number_6',
	used_oil = 'used_oil',
	kerosene = 'kerosene',
	liquefied_petroleum_gases_lpg = 'liquefied_petroleum_gases_lpg',
	propane = 'propane',
	propylene = 'propylene',
	ethane = 'ethane',
	ethanol = 'ethanol',
	ethylene = 'ethylene',
	isobutane = 'isobutane',
	isobutylene = 'isobutylene',
	butane = 'butane',
	butylene = 'butylene',
	naphtha = 'naphtha',
	natural_gasoline = 'natural_gasoline',
	other_oil = 'other_oil',
	pentanes_plus = 'pentanes_plus',
	petrochemical_feedstocks = 'petrochemical_feedstocks',
	special_naphtha = 'special_naphtha',
	unfinished_oils = 'unfinished_oils',
	heavy_gas_oils = 'heavy_gas_oils',
	lubricants = 'lubricants',
	motor_gasoline = 'motor_gasoline',
	aviation_gasoline = 'aviation_gasoline',
	kerosene_type_jet_fuel = 'kerosene_type_jet_fuel',
	asphalt_and_road_oil = 'asphalt_and_road_oil',
	crude_oil = 'crude_oil',
	petroleum_coke = 'petroleum_coke',
	propane_gas = 'propane_gas',
	municipal_solid_waste = 'municipal_solid_waste',
	tires = 'tires',
	plastics = 'plastics',
	blast_furnace_gas = 'blast_furnace_gas',
	coke_oven_gas = 'coke_oven_gas',
	fuel_gas = 'fuel_gas',
	wood_and_wood_residuals = 'wood_and_wood_residuals',
	agricultural_byproducts = 'agricultural_byproducts',
	peat = 'peat',
	solid_byproducts = 'solid_byproducts',
	landfill_gas = 'landfill_gas',
	other_biomass_gases = 'other_biomass_gases',
	biodiesel = 'biodiesel',
	rendered_animal_fat = 'rendered_animal_fat',
	vegetable_oil = 'vegetable_oil',
	electricity_us_average = 'electricity_us_average',
	electricity_ercot = 'electricity_ercot',
}

export const FuelTypes = Object.values(FuelType);

enum PneumaticDeviceType {
	highBleed = 'high-bleed',
	intermittent = 'intermittent',
	lowBleed = 'low-bleed',
}

export const PneumaticDeviceTypes = Object.values(PneumaticDeviceType);

export enum Criteria {
	FPD = 'FPD',
	schedule = 'schedule',
	headers = 'headers',
	duration = 'duration',
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

enum EmissionCategory {
	associated_gas = 'associated_gas',
	acid_gas_removal_units = 'acid_gas_removal_units',
	centrifugal_compressor = 'centrifugal_compressor',
	eor_hydrocarbon_liquids = 'eor_hydrocarbon_liquids',
	eor_injection_pumps = 'eor_injection_pumps',
	liquids_unloading = 'liquids_unloading',
	pneumatic_device = 'pneumatic_device',
	dehydrators = 'dehydrators',
	equipment_leaks = 'equipment_leaks',
	atmospheric_tank = 'atmospheric_tank',
	reciprocating_compressor = 'reciprocating_compressor',
	completions_with_fracturing = 'completions_with_fracturing',
	completions_without_fracturing = 'completions_without_fracturing',
	drilling = 'drilling',
	completion = 'completion',
	combustion = 'combustion',
	pneumatic_pump = 'pneumatic_pump',
	well_testing = 'well_testing',
	blowdown_vent_stacks = 'blowdown_vent_stacks',
	flare = 'flare',
	scope2 = 'scope2',
	scope3 = 'scope3',
	custom_calculation = 'custom_calculation',
}

export const EMISSION_CATEGORYS = Object.values(EmissionCategory);

export interface Network {
	createdBy: mongoose.Types.ObjectId;
	name: string;
	project: mongoose.Types.ObjectId;
	// // tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }], // TODO tags
	nodes: NetworkNode[];
	edges: NetworkEdge[];
	// // they will be updated when click save networks
	fluidModels: mongoose.Types.ObjectId[];
	wells: mongoose.Types.ObjectId[];
	facilities: mongoose.Types.ObjectId[];
	copiedFrom?: mongoose.Types.ObjectId;
	updateAt: Date;
	createAt: Date;
}

export interface Facility {
	createdBy: mongoose.Types.ObjectId;
	name: string;
	project: mongoose.Types.ObjectId;
	copiedFrom?: mongoose.Types.ObjectId;
	// tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }], // TODO tags
	nodes: FacilityNode[];
	edges: FacilityEdge[];
	inputs: InputEdge[]; // without the from property
	outputs: OutputEdge[]; // without the to property
	fluidModels: mongoose.Types.ObjectId[]; // update this when save facility
	updateAt: Date;
	createAt: Date;
}

interface BaseNode {
	id: string;
	// type: NodeType;
	params: object;
	name: string;
	description: string;
	shape: {
		position: { x: number; y: number };
	};
}

export interface NetworkNode extends BaseNode {
	type: NetworkNodeType;
}

export interface FacilityNode extends BaseNode {
	type: FacilityNodeType;
}

interface BaseEdge {
	id: string;
	by: EdgeType;
	name?: string;
	description?: string;
	shape?: {
		vertices?: [];
	};
}

export interface InputEdge extends BaseEdge {
	to: string;
	toHandle?: string;
}

export interface OutputEdge extends BaseEdge {
	from: string;
	fromHandle?: string;
}

export interface NetworkEdge extends BaseEdge {
	from: string;
	fromHandle?: string;
	fromFacilityObjectId?: string;
	to: string;
	toHandle?: string;
	toFacilityObjectId?: string;
	params?: object;
}

export interface FacilityEdge extends BaseEdge {
	from: string;
	fromHandle?: string;
	to?: string;
	toHandle?: string;
	params?: object;
}
