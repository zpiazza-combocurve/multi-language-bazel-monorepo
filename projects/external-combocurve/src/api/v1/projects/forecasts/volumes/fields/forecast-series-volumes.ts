import { DATE_FIELD, getStringEnumField, IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { IForecastSeriesVolumes } from '@src/models/forecast-volume';
import { OpenApiDataType } from '@src/helpers/fields/field-definition';
import { P_SERIES } from '@src/models/forecast-data';

type IForecastSeriesVolumesField<T> = IField<IForecastSeriesVolumes, T>;

const readForecastSeriesVolumesField = <K extends keyof IForecastSeriesVolumes, TParsed = IForecastSeriesVolumes[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecastSeriesVolumes, K, TParsed>(key, definition, options);

const volumesField: IForecastSeriesVolumesField<Array<number | null>> = {
	type: OpenApiDataType.array,
	items: {
		type: OpenApiDataType.number,
	},
	read: (forecastPhaseDailyVolumes) => {
		return forecastPhaseDailyVolumes.volumes;
	},
};

export const API_FORECAST_SERIES_VOLUMES_FIELDS = {
	eur: readForecastSeriesVolumesField('eur', NUMBER_FIELD, {}),
	series: readForecastSeriesVolumesField('series', getStringEnumField(P_SERIES), {}),
	startDate: readForecastSeriesVolumesField('startDate', DATE_FIELD, {}),
	endDate: readForecastSeriesVolumesField('endDate', DATE_FIELD, {}),
	volumes: volumesField,
};

export type ApiForecastSeriesVolumesKey = keyof typeof API_FORECAST_SERIES_VOLUMES_FIELDS;

type TypeOfField<FT> = FT extends IForecastSeriesVolumesField<infer T> ? T : never;

export type ApiForecastSeriesVolumes = {
	[key in ApiForecastSeriesVolumesKey]?: TypeOfField<(typeof API_FORECAST_SERIES_VOLUMES_FIELDS)[key]>;
};

export const toApiForecastSeriesVolumes = (
	forecastSeriesVolumes: Array<IForecastSeriesVolumes>,
): Array<ApiForecastSeriesVolumes> => {
	return forecastSeriesVolumes.map((forecastSeriesVolume) => {
		const apiForecastSeries: Record<string, ApiForecastSeriesVolumes[ApiForecastSeriesVolumesKey]> = {};
		Object.entries(API_FORECAST_SERIES_VOLUMES_FIELDS).forEach(([field, { read }]) => {
			if (read) {
				apiForecastSeries[field] = read(forecastSeriesVolume);
			}
		});

		return apiForecastSeries;
	});
};
