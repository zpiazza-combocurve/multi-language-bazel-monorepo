import { IBaseEconModel } from './econ-models';

export const FLUID_MODEL_KEY = 'fluid_model';
export const FLUID_MODEL_NAME = 'Fluid Model';

const PHASES = ['gas', 'oil', 'water', 'ngl', 'drip_condensate'] as const;

export const FLUID_MODEL_COMPONENTS = [
	'N2',
	'CO2',
	'C1',
	'C2',
	'C3',
	'iC4',
	'nC4',
	'iC5',
	'nC5',
	'iC6',
	'nC6',
	'C7',
	'C8',
	'C9',
	'C10+',
	'H2S',
	'H2',
	'H2O',
	'He',
	'O2',
];

export type FluidModelComponents = (typeof FLUID_MODEL_COMPONENTS)[number];
export type Phases = (typeof PHASES)[number];

export type FluidModelKey = typeof FLUID_MODEL_KEY;
type FluidModelName = typeof FLUID_MODEL_NAME;

export type FluidModelComposition = Record<FluidModelComponents, IFluidModelComponent>;
export type FluidModelEconFunction = Record<Phases, IFluidModelPhase>;

export interface IFluidModel extends IBaseEconModel {
	assumptionKey: FluidModelKey;
	assumptionName: FluidModelName;
	econ_function: FluidModelEconFunction;
}

export interface IFluidModelPhase {
	composition: FluidModelComposition;
	criteria: string;
}

export interface IFluidModelComponent {
	percentage: number;
	price: number;
}
