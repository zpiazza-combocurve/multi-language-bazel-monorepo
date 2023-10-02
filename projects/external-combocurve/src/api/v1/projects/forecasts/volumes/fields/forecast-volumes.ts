import { merge } from 'lodash';
import { Types } from 'mongoose';

import { ApiQueryFilters, OpenApiDataType } from '@src/helpers/fields/field-definition';
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
import { FORECAST_RESOLUTION, IForecastVolumes } from '@src/models/forecast-volume';
import { getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD } from '@src/helpers/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';

import { BaseForecastResolved } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	API_FORECAST_PHASE_VOLUMES_FIELDS,
	ApiForecastPhaseVolumes,
	toApiForecastPhaseVolumes,
} from './forecast-phase-volumes';

export const READ_RECORD_LIMIT = 200;

type IForecastVolumesField<T> = IField<IForecastVolumes, T>;

const readForecastVolumesField = <K extends keyof IForecastVolumes, TParsed = IForecastVolumes[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecastVolumes, K, TParsed>(key, definition, options);

const getForecastPhaseVolumes: IForecastVolumesField<Array<ApiForecastPhaseVolumes>> = {
	type: OpenApiDataType.array,
	items: {
		type: OpenApiDataType.object,
		properties: API_FORECAST_PHASE_VOLUMES_FIELDS,
	},
	read: (forecastVolumesData) => {
		return toApiForecastPhaseVolumes(forecastVolumesData.phases);
	},
};

const API_FORECAST_VOLUMES_FIELDS = {
	project: readForecastVolumesField('project', OBJECT_ID_FIELD, {}),
	forecast: readForecastVolumesField('forecast', OBJECT_ID_FIELD, {}),
	resolution: readForecastVolumesField('resolution', getStringEnumField(FORECAST_RESOLUTION), {}),
	well: readForecastVolumesField('well', OBJECT_ID_FIELD, {
		sortable: true,
		allowCursor: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	phases: getForecastPhaseVolumes,
};

export default API_FORECAST_VOLUMES_FIELDS;

export type ApiForecastVolumesKey = keyof typeof API_FORECAST_VOLUMES_FIELDS;

type TypeOfField<FT> = FT extends IForecastVolumesField<infer T> ? T : never;

export type ApiForecastVolumes = {
	[key in ApiForecastVolumesKey]?: TypeOfField<(typeof API_FORECAST_VOLUMES_FIELDS)[key]>;
};

export const toApiForecastDailyVolumes = (forecastDailyVolumes: IForecastVolumes): ApiForecastVolumes => {
	const apiForecast: Record<string, ApiForecastVolumes[ApiForecastVolumesKey]> = {};
	Object.entries(API_FORECAST_VOLUMES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecast[field] = read(forecastDailyVolumes);
		}
	});
	return apiForecast;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_FORECAST_VOLUMES_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_FORECAST_VOLUMES_FIELDS);

export const getFilters = (
	filters: ApiQueryFilters,
	project: BaseProjectResolved,
	forecast: BaseForecastResolved,
	cursor?: IFilter,
): IFilter =>
	getApiReadDbFilters(filters, API_FORECAST_VOLUMES_FIELDS, {
		value: merge({ project: project._id }, { forecast: Types.ObjectId(forecast.id) }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_FORECAST_VOLUMES_FIELDS);
