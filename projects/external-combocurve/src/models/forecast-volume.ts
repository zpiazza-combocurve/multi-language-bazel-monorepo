import { Types } from 'mongoose';

import { BasePhases, PSeries } from './forecast-data';
export { DailyProductionSchema } from '../schemas';

export const FORECAST_RESOLUTION = ['daily', 'monthly'] as const;

export type ForecastResolutions = (typeof FORECAST_RESOLUTION)[number];

export interface IForecastVolumes {
	project: Types.ObjectId;
	forecast: Types.ObjectId;
	resolution: ForecastResolutions;
	well: Types.ObjectId;
	phases: Array<IForecastPhaseVolumes>;
}

export interface IForecastPhaseVolumes {
	phase: BasePhases;
	series: Array<IForecastSeriesVolumes>;
	ratio?: IForecastRatioVolumes;
	forecastOutputId: Types.ObjectId;
}

export interface IForecastSeriesVolumes {
	eur?: number;
	series: PSeries;
	startDate: Date;
	endDate: Date;
	volumes: Array<number>;
}

export interface IForecastRatioVolumes {
	eur?: number;
	basePhase?: BasePhases | null;
	startDate: Date;
	endDate: Date;
	volumes: Array<number>;
}
