import type { WritableDraft } from 'immer/dist/internal.js';

export interface CollapsedSectionState {
	general: boolean;
	model: boolean;
	filter: boolean;
	weightedData: boolean;
	matchEur: boolean;
	lowData: boolean;
}

export interface CollapsedState {
	shared: CollapsedSectionState;
	oil: CollapsedSectionState;
	gas: CollapsedSectionState;
	water: CollapsedSectionState;
}

export type Phase = 'oil' | 'gas' | 'water';
export type AxisCombo = 'rate' | 'ratio';
export type ForecastFormResolution = 'monthly_only' | 'daily_only' | 'monthly_preference' | 'daily_preference';
export type ForecastType = 'deterministic' | 'probabilistic';
export type FormPhase = Phase | 'shared';
export type TimeUnit = 'day' | 'month' | 'year';

export const formPhases: FormPhase[] = ['oil', 'gas', 'water', 'shared'];

export interface FormSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	shared: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	oil: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	gas: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	water: Record<string, any>;
	phases: {
		oil: boolean;
		gas: boolean;
		water: boolean;
	};
	applyAll: boolean;
}
export interface GeneralSettings {
	model_name: string;
	overwrite_manual: boolean;
	percentile: Array<number>;
	phases: Array<Phase>;
	prob_para: Array<string>;
	resolution: ForecastFormResolution;
}

export interface WellLifeDict {
	fixed_date?: Date;
	num?: number;
	unit?: TimeUnit;
	well_life_method?: string;
}

export interface TimePeriod {
	absolute_range?: [Date, Date];
	mode?: string;
	num_range?: [number, number];
	unit?: TimeUnit;
}

export interface WeightDict {
	absolute_range?: [Date, Date];
	mode?: string;
	num_range?: [number, number];
	unit?: TimeUnit;
	value?: number;
}

export type FormDraft = WritableDraft<FormSettings>;
