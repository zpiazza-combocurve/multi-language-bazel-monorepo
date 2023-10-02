import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import {
	ACTUAL_FORECAST_KEY,
	ACTUAL_FORECAST_NAME,
	IActualOrForecast,
	IActualOrForecastEconFunction,
} from '@src/models/econ/actual-forecast';
import { ApiQueryFilters, OpenApiDataType } from '@src/helpers/fields/field-definition';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	ACTUAL_OR_FORECAST_FIELDS,
	ActualForecastTypeKey,
	ApiActualForecastType,
} from './actual-forecast-econ-function';

export type ActualForecastKey = keyof typeof ACTUAL_FORECAST_FIELDS;
export type ActualForecastField<T> = IField<IActualOrForecast, T>;
export type TypeActualForecastField<FT> = FT extends ActualForecastField<infer T> ? T : never;

export type ApiActualForecast = {
	[key in ActualForecastKey]?: TypeActualForecastField<(typeof ACTUAL_FORECAST_FIELDS)[key]>;
};

const actualOrForecastField: ActualForecastField<ApiActualForecastType> = {
	type: OpenApiDataType.object,
	properties: ACTUAL_OR_FORECAST_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiActualForecastType, ActualForecastTypeKey>(
			'Actual Or Forecast',
			ACTUAL_OR_FORECAST_FIELDS,
			data,
			location,
		),
	read: (escalation) =>
		readRequestFromDocument<IActualOrForecastEconFunction, ApiActualForecastType, ActualForecastTypeKey>(
			get(escalation, ['econ_function', 'production_vs_fit_model']) as IActualOrForecastEconFunction,
			ACTUAL_OR_FORECAST_FIELDS,
		),
	write: (escalation, value) =>
		set(
			escalation,
			['econ_function', 'production_vs_fit_model'],
			writeDocumentWithRequest<IActualOrForecastEconFunction, ApiActualForecastType, ActualForecastTypeKey>(
				value,
				ACTUAL_OR_FORECAST_FIELDS,
			),
		),
};

export function parseRequestFromPayload<ApiRequest, ApiKey extends keyof ApiRequest>(
	name: string,
	fields: Record<string, unknown>,
	data: unknown,
	location?: string,
): ApiRequest {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ${name} data structure`, location);
	}

	const request: Record<string, ApiRequest[ApiKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();
	if (data.ignoreHistoryProd === true) {
		data.replaceActualWithForecast = {
			oil: {
				never: true,
			},
			gas: {
				never: true,
			},
			water: {
				never: true,
			},
		};
	}
	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;

				if (field in fields) {
					const apiField = fields[field] as Record<string, unknown>;

					let parsedValue = value as ApiRequest[ApiKey];
					if ('parse' in apiField && typeof apiField.parse === 'function') {
						parsedValue = apiField.parse(value, fieldPath);
					}

					if ('write' in apiField) {
						request[field] = parsedValue;
					}
				} else {
					throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
				}
			}),
		);

	errorAggregator.throwAll();

	return request as unknown as ApiRequest;
}

const ACTUAL_FORECAST_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	actualOrForecast: actualOrForecastField,
};

export const filterableFields = filterableReadDbFields(ACTUAL_FORECAST_FIELDS);
export const sortableFields = sortableDbFields(ACTUAL_FORECAST_FIELDS);

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, ACTUAL_FORECAST_FIELDS, {
		value: merge({ project: project._id, assumptionKey: ACTUAL_FORECAST_KEY }, cursor || {}),
	});

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, ACTUAL_FORECAST_FIELDS, undefined, cursor);

const isActualForecast = (field: string): field is keyof typeof ACTUAL_FORECAST_FIELDS =>
	Object.keys(ACTUAL_FORECAST_FIELDS).includes(field);

export const getActualForecastField = (field: string): (typeof ACTUAL_FORECAST_FIELDS)[ActualForecastKey] | null => {
	if (!isActualForecast(field)) {
		return null;
	}
	return ACTUAL_FORECAST_FIELDS[field];
};

export const getRequestFromDocument = (mongoModel: IActualOrForecast): ApiActualForecast => {
	return readRequestFromDocument<IActualOrForecast, ApiActualForecast, ActualForecastKey>(
		mongoModel,
		ACTUAL_FORECAST_FIELDS,
	);
};

export const getDocumentFromRequest = (
	apiEscalation: ApiActualForecast,
	projectId: Types.ObjectId,
): IActualOrForecast => {
	const mongoModel = writeDocumentWithRequest<IActualOrForecast, ApiActualForecast, ActualForecastKey>(
		apiEscalation,
		ACTUAL_FORECAST_FIELDS,
	);

	return {
		...mongoModel,
		assumptionKey: ACTUAL_FORECAST_KEY,
		assumptionName: ACTUAL_FORECAST_NAME,
		project: projectId,
	} as IActualOrForecast;
};

export default ACTUAL_FORECAST_FIELDS;
