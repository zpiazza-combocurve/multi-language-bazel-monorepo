import { merge } from 'lodash';

import { ApiQueryFilters, OpenApiDataType } from '@src/helpers/fields/field-definition';
import {
	BOOLEAN_FIELD,
	DATE_FIELD,
	getStringEnumField,
	IFieldDefinition,
	OBJECT_ID_FIELD,
	STRING_FIELD,
} from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IReadFieldOptions,
	readDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { FORECAST_TYPE, IForecast } from '@src/models/forecasts';
import { IFilter, ISort } from '@src/helpers/mongo-queries';

import { IApiTag, tagsFieldDefinition, toApiTag } from '../../tags/fields/tags';
import { BaseProjectResolved } from '../fields';

export type BaseForecastResolved = Pick<IForecast, 'id' | 'type' | 'name'>;

export const READ_RECORD_LIMIT = 200;

type IForecastField<T> = IField<IForecast, T>;

const readForecastField = <K extends keyof IForecast, TParsed = IForecast[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecast, K, TParsed>(key, definition, options);

const readForecatsTagsField = () => ({
	key: 'tags',
	...readDbField<IForecast, 'tags', Array<IApiTag> | undefined>('tags', tagsFieldDefinition(), {
		filterOption: { read: { filterValues: 100 } },
	}),
	read: (forecast: IForecast) => forecast['tags']?.map(toApiTag) ?? [],
	write: undefined,
});

const API_FORECAST_FIELDS = {
	createdAt: readForecastField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	id: readForecastField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	name: readForecastField('name', STRING_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),
	runDate: readForecastField('runDate', DATE_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),
	running: readForecastField('running', BOOLEAN_FIELD, {}),
	tags: readForecatsTagsField(),
	type: readForecastField('type', getStringEnumField(FORECAST_TYPE), {
		filterOption: { read: { filterValues: 1 } },
	}),

	updatedAt: readForecastField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

export const API_ADD_WELL_FORECAST_FIELDS = {
	id: readForecastField(
		'wells',
		{ type: OpenApiDataType.array, items: OBJECT_ID_FIELD },
		{
			allowCursor: true,
			sortable: true,
			filterOption: { read: { filterValues: 100 } },
		},
	),
};

export default API_FORECAST_FIELDS;

export type ApiForecastKey = keyof typeof API_FORECAST_FIELDS;

type TypeOfField<FT> = FT extends IForecastField<infer T> ? T : never;

export type ApiForecast = { [key in ApiForecastKey]?: TypeOfField<(typeof API_FORECAST_FIELDS)[key]> };

export const toApiForecast = (forecast: IForecast): ApiForecast => {
	const apiForecast: Record<string, ApiForecast[ApiForecastKey]> = {};
	Object.entries(API_FORECAST_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecast[field] = read(forecast);
		}
	});
	return apiForecast;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_FORECAST_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_FORECAST_FIELDS);

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_FORECAST_FIELDS, { value: merge({ project: project._id }, cursor || {}) });

export const filterableFields = filterableReadDbFields(API_FORECAST_FIELDS);
