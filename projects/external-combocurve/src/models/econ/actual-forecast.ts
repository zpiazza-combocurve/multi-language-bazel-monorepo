import { IBaseEconModel } from './econ-models';

export const ACTUAL_FORECAST_KEY = 'production_vs_fit';
export const ACTUAL_FORECAST_NAME = 'Actual or Forecast';

export type ActualForecastKey = typeof ACTUAL_FORECAST_KEY;
export type ActualForecastName = typeof ACTUAL_FORECAST_NAME;

export interface IActualOrForecast extends IBaseEconModel {
	assumptionKey: ActualForecastKey;
	assumptionName: ActualForecastName;
	econ_function: {
		production_vs_fit_model: IActualOrForecastEconFunction;
	};
}

export interface IActualOrForecastEconFunction {
	ignore_hist_prod?: string;
	replace_actual?: IActualForecastReplaceActual;
}

export interface IActualForecastReplaceActual {
	oil?: IActualOrForecastPhase;
	gas?: IActualOrForecastPhase;
	water?: IActualOrForecastPhase;
}

export type IActualOrForecastPhase = Record<keyof IActualOrForecastOption, string | boolean | undefined>;

export interface IActualOrForecastOption {
	never?: string | boolean;
	as_of_date?: string | boolean;
	date?: string;
}
