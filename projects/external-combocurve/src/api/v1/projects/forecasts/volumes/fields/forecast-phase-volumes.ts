import { getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD } from '@src/helpers/fields';
import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { BASE_PHASES } from '@src/models/forecast-data';
import { IForecastPhaseVolumes } from '@src/models/forecast-volume';
import { OpenApiDataType } from '@src/helpers/fields/field-definition';

import {
	API_FORECAST_RATIO_VOLUMES_FIELDS,
	ApiForecastRatioVolumes,
	toApiForecastRatioVolumes,
} from './forecast-ratio-volumes';
import {
	API_FORECAST_SERIES_VOLUMES_FIELDS,
	ApiForecastSeriesVolumes,
	toApiForecastSeriesVolumes,
} from './forecast-series-volumes';

type IForecastPhaseVolumesField<T> = IField<IForecastPhaseVolumes, T>;

const readForecastPhaseVolumesField = <K extends keyof IForecastPhaseVolumes, TParsed = IForecastPhaseVolumes[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecastPhaseVolumes, K, TParsed>(key, definition, options);

const seriesField: IForecastPhaseVolumesField<Array<ApiForecastSeriesVolumes>> = {
	type: OpenApiDataType.array,
	items: {
		type: OpenApiDataType.object,
		properties: API_FORECAST_SERIES_VOLUMES_FIELDS,
	},
	read: (forecastPhaseVolumes) => {
		return toApiForecastSeriesVolumes(forecastPhaseVolumes.series);
	},
};

const ratioField: IForecastPhaseVolumesField<ApiForecastRatioVolumes | undefined> = {
	type: OpenApiDataType.object,
	properties: API_FORECAST_RATIO_VOLUMES_FIELDS,
	read: (forecastPhaseVolumes) => {
		return forecastPhaseVolumes.ratio ? toApiForecastRatioVolumes(forecastPhaseVolumes.ratio) : undefined;
	},
};

export const API_FORECAST_PHASE_VOLUMES_FIELDS = {
	forecastOutputId: readForecastPhaseVolumesField('forecastOutputId', OBJECT_ID_FIELD, {}),
	phase: readForecastPhaseVolumesField('phase', getStringEnumField(BASE_PHASES), {}),
	series: seriesField,
	ratio: ratioField,
};

export type ApiForecastPhaseVolumesKey = keyof typeof API_FORECAST_PHASE_VOLUMES_FIELDS;

type TypeOfField<FT> = FT extends IForecastPhaseVolumesField<infer T> ? T : never;

export type ApiForecastPhaseVolumes = {
	[key in ApiForecastPhaseVolumesKey]?: TypeOfField<(typeof API_FORECAST_PHASE_VOLUMES_FIELDS)[key]>;
};

export const toApiForecastPhaseVolumes = (
	forecastPhaseVolumes: Array<IForecastPhaseVolumes>,
): Array<ApiForecastPhaseVolumes> => {
	return forecastPhaseVolumes.map((forecastPhaseVolume) => {
		const apiForecastSegment: Record<string, ApiForecastPhaseVolumes[ApiForecastPhaseVolumesKey]> = {};
		Object.entries(API_FORECAST_PHASE_VOLUMES_FIELDS).forEach(([field, { read }]) => {
			if (read) {
				apiForecastSegment[field] = read(forecastPhaseVolume);
			}
		});

		return apiForecastSegment;
	});
};
