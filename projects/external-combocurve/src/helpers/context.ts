import { Model } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { ForecastType } from '@src/models/forecasts';
import { IForecastData } from '@src/models/forecast-data';

export const getForecastDataModel = (context: ApiContextV1, forecastType: ForecastType): Model<IForecastData> => {
	switch (forecastType) {
		case 'deterministic':
			return context.models.DeterministicForecastDataModel;
		case 'probabilistic':
			return context.models.ProbabilisticForecastDataModel;
	}
};
