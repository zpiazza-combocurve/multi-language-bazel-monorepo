import { DATE_FIELD, getStringEnumField, IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { BASE_PHASES } from '@src/models/forecast-data';
import { IForecastRatioVolumes } from '@src/models/forecast-volume';
import { OpenApiDataType } from '@src/helpers/fields/field-definition';

type IForecastRatioVolumesField<T> = IField<IForecastRatioVolumes, T>;

const readForecastRatioVolumesField = <K extends keyof IForecastRatioVolumes, TParsed = IForecastRatioVolumes[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecastRatioVolumes, K, TParsed>(key, definition, options);

const volumesField: IForecastRatioVolumesField<Array<number | null>> = {
	type: OpenApiDataType.array,
	items: {
		type: OpenApiDataType.number,
	},
	read: (forecastPhaseDailyVolumes) => {
		return forecastPhaseDailyVolumes.volumes;
	},
};

export const API_FORECAST_RATIO_VOLUMES_FIELDS = {
	eur: readForecastRatioVolumesField('eur', NUMBER_FIELD, {}),
	basePhase: readForecastRatioVolumesField('basePhase', getStringEnumField(BASE_PHASES), {}),
	startDate: readForecastRatioVolumesField('startDate', DATE_FIELD, {}),
	endDate: readForecastRatioVolumesField('endDate', DATE_FIELD, {}),
	volumes: volumesField,
};

export type ApiForecastRatioVolumesKey = keyof typeof API_FORECAST_RATIO_VOLUMES_FIELDS;

type TypeOfField<FT> = FT extends IForecastRatioVolumesField<infer T> ? T : never;

export type ApiForecastRatioVolumes = {
	[key in ApiForecastRatioVolumesKey]?: TypeOfField<(typeof API_FORECAST_RATIO_VOLUMES_FIELDS)[key]>;
};

export const toApiForecastRatioVolumes = (forecastRatioVolume: IForecastRatioVolumes): ApiForecastRatioVolumes => {
	const apiForecastRatio: Record<string, ApiForecastRatioVolumes[ApiForecastRatioVolumesKey]> = {};
	Object.entries(API_FORECAST_RATIO_VOLUMES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecastRatio[field] = read(forecastRatioVolume);
		}
	});

	return apiForecastRatio;
};
