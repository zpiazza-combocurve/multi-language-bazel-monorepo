import { set } from 'lodash';

import { IActualForecastReplaceActual, IActualOrForecastEconFunction } from '@src/models/econ/actual-forecast';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { IField } from '@src/api/v1/fields';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { readWriteYesNoDbField } from '../../fields';

import {
	AF_REPLACE_CRITERIA_FIELDS,
	ApiAFReplaceActualType,
	ApiAFReplaceActualTypeKey,
} from './actual-forecast-criteria';

type ActualForecastField<T> = IField<IActualOrForecastEconFunction, T>;
export type ActualForecastTypeKey = keyof typeof ACTUAL_OR_FORECAST_FIELDS;

export type ApiActualForecastType = {
	[key in ActualForecastTypeKey]?: ActualForecastField<(typeof ACTUAL_OR_FORECAST_FIELDS)[key]>;
};

export const ACTUAL_OR_FORECAST_FIELDS = {
	ignoreHistoryProd: readWriteYesNoDbField('ignore_hist_prod'),
	replaceActualWithForecast: getAFReplaceActualTypeField('replace_actual'),
};

function getAFReplaceActualTypeField<K extends keyof IActualOrForecastEconFunction>(
	key: K,
): ActualForecastField<ApiAFReplaceActualType | undefined> {
	return {
		type: OpenApiDataType.object,
		properties: AF_REPLACE_CRITERIA_FIELDS,
		parse: (data: unknown, location?: string) =>
			parseRequestFromPayload<ApiAFReplaceActualType, ApiAFReplaceActualTypeKey>(
				'Actual Or Foreacst',
				AF_REPLACE_CRITERIA_FIELDS,
				data,
				location,
			),
		read: (pricing) => {
			const value = pricing[key];
			if (typeof value !== 'string' && pricing.ignore_hist_prod === 'no') {
				return readRequestFromDocument<
					IActualForecastReplaceActual,
					ApiAFReplaceActualType,
					ApiAFReplaceActualTypeKey
				>(value, AF_REPLACE_CRITERIA_FIELDS);
			}

			return undefined;
		},
		write: (pricing, value) =>
			set(
				pricing,
				[key],
				writeDocumentWithRequest<
					IActualForecastReplaceActual,
					ApiAFReplaceActualType,
					ApiAFReplaceActualTypeKey
				>(value, AF_REPLACE_CRITERIA_FIELDS),
			),
	};
}
