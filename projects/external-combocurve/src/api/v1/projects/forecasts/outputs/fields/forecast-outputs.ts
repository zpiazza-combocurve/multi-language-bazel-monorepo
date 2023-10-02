import { cloneDeep, isEmpty, merge } from 'lodash';
import { model, Types } from 'mongoose';

import {
	API_FORECAST_SEGMENT_FIELDS,
	ApiPDictValue,
	ApiRatioPDictValue,
	toApiForecastSegment,
} from '@src/helpers/segments';
import {
	BASE_PHASES,
	FORECAST_DATA_STATUS,
	IDeterministicForecastData,
	IForecastData,
	IProbabilisticForecastData,
	PSeries,
} from '@src/models/forecast-data';
import {
	BOOLEAN_FIELD,
	DATE_FIELD,
	getStringEnumField,
	IFieldDefinition,
	NUMBER_FIELD,
	OBJECT_ID_FIELD,
	STRING_FIELD,
} from '@src/helpers/fields';
import { DeterministicForecastDataSchema, ForecastDataSchema } from '@src/schemas';
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
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseForecastResolved } from '@src/api/v1/projects/forecasts/fields';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { ForecastType } from '@src/models/forecasts';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS,
	ApiForecastTypeCurveApplySetting,
	toApiForecastTypeCurveApplySetting,
} from './typecurve-apply-settings';
import { API_FORECAST_TYPE_CURVE_DATA, ApiForecastTypeCurveData, toApiForecastTypeCurveData } from './typecurve-data';

export const READ_RECORD_LIMIT = 1000;

const defaultForecastData = new (model<IProbabilisticForecastData>('defaultForecastData', ForecastDataSchema))({});
const defaultDeterministicForecastData = new (model<IDeterministicForecastData>(
	'defaultDeterministicForecastData',
	DeterministicForecastDataSchema,
))({});

type IForecastDataField<T> = IField<IForecastData, T>;

const getPDict = (type: PSeries): IForecastDataField<ApiPDictValue | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: {
			segments: {
				type: OpenApiDataType.array,
				items: { type: OpenApiDataType.object, properties: API_FORECAST_SEGMENT_FIELDS },
			},
			eur: NUMBER_FIELD,
		},
		read: (forecastData) => {
			const typeInformation = forecastData?.P_dict && (<IProbabilisticForecastData>forecastData).P_dict?.[type];
			const segments = typeInformation?.segments;
			const forecastType = forecastData.$locals['forecastType'] as ForecastType;
			if (
				!segments?.length ||
				segments.length === 0 ||
				(forecastType === 'deterministic' && (<IDeterministicForecastData>forecastData).forecastType !== 'rate')
			) {
				return undefined;
			}
			return {
				segments: segments.map(toApiForecastSegment),
				eur: typeInformation?.eur,
			};
		},
	};
};

const typeCurveApplySetting: IForecastDataField<ApiForecastTypeCurveApplySetting | undefined> = {
	type: OpenApiDataType.object,
	properties: API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS,
	read: (forecastData) => {
		const typeCurveApplySetting = forecastData?.typeCurveApplySetting;
		if (!typeCurveApplySetting || isEmpty(typeCurveApplySetting)) {
			return undefined;
		}
		return toApiForecastTypeCurveApplySetting(typeCurveApplySetting);
	},
};

const typeCurveData: IForecastDataField<ApiForecastTypeCurveData | undefined> = {
	type: OpenApiDataType.object,
	properties: API_FORECAST_TYPE_CURVE_DATA,
	read: (forecastData) => {
		const typeCurveData = forecastData?.typeCurveData;
		if (!typeCurveData || isEmpty(typeCurveData)) {
			return undefined;
		}
		return toApiForecastTypeCurveData(typeCurveData);
	},
};

const ratioForecast: IForecastDataField<ApiRatioPDictValue | undefined> = {
	type: OpenApiDataType.object,
	properties: {
		segments: {
			type: OpenApiDataType.array,
			items: { type: OpenApiDataType.object, properties: API_FORECAST_SEGMENT_FIELDS },
		},
		basePhase: {
			type: OpenApiDataType.string,
		},
		eur: NUMBER_FIELD,
	},
	read: (forecastData) => {
		const deterministicForecastData = forecastData as IDeterministicForecastData;
		const segments = deterministicForecastData?.ratio?.segments;
		const basePhase = deterministicForecastData?.ratio?.basePhase;
		const eur = deterministicForecastData?.ratio?.eur;
		const forecastType = forecastData.$locals['forecastType'] as ForecastType;
		if (
			forecastType != 'deterministic' ||
			!segments?.length ||
			segments.length === 0 ||
			deterministicForecastData.forecastType !== 'ratio'
		) {
			return undefined;
		}
		return {
			segments: segments.map(toApiForecastSegment),
			basePhase: basePhase,
			eur: eur,
		};
	},
};

const readForecastDataField = <K extends keyof IForecastData, TParsed = IForecastData[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IForecastData, K, TParsed>(key, definition, options);

const API_FORECAST_DATA_FIELDS = {
	best: getPDict('best'),
	createdAt: readForecastDataField('createdAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
	}),
	forecasted: readForecastDataField('forecasted', BOOLEAN_FIELD),
	forecastedAt: readForecastDataField('forecastedAt', DATE_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	forecastedBy: readForecastDataField('forecastedBy', OBJECT_ID_FIELD),
	id: readForecastDataField('_id', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
		allowCursor: true,
	}),
	forecast: readForecastDataField('forecast', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
		allowCursor: true,
	}),
	p10: getPDict('P10'),
	p50: getPDict('P50'),
	p90: getPDict('P90'),
	phase: readForecastDataField('phase', getStringEnumField(BASE_PHASES), {
		filterOption: { read: { filterValues: 1 } },
	}),
	ratio: ratioForecast,
	reviewedAt: readForecastDataField('reviewedAt', DATE_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	reviewedBy: readForecastDataField('reviewedBy', OBJECT_ID_FIELD),
	runDate: readForecastDataField('runDate', DATE_FIELD, { sortable: true }),
	status: readForecastDataField('status', getStringEnumField(FORECAST_DATA_STATUS)),
	typeCurve: readForecastDataField('typeCurve', OBJECT_ID_FIELD),
	typeCurveApplySettings: typeCurveApplySetting,
	typeCurveData: typeCurveData,
	updatedAt: readForecastDataField('updatedAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
	}),
	well: readForecastDataField('well', OBJECT_ID_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	data_freq: readForecastDataField('data_freq', STRING_FIELD),
};

export default API_FORECAST_DATA_FIELDS;

export type ApiForecastDataKey = keyof typeof API_FORECAST_DATA_FIELDS;

type TypeOfField<FT> = FT extends IForecastDataField<infer T> ? T : never;

export type ApiForecastData = { [key in ApiForecastDataKey]?: TypeOfField<(typeof API_FORECAST_DATA_FIELDS)[key]> };

export const toApiForecastData = (forecastData: IForecastData, forecast: BaseForecastResolved): ApiForecastData => {
	forecastData.$locals = { forecastType: forecast.type, ...forecastData.$locals };
	const defaultData = forecast.type == 'deterministic' ? defaultDeterministicForecastData : defaultForecastData;
	const forecastDataWithDefault = merge(cloneDeep(defaultData), forecastData) as IForecastData;

	const apiForecastData: Record<string, ApiForecastData[ApiForecastDataKey]> = {};
	Object.entries(API_FORECAST_DATA_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecastData[field] = read(forecastDataWithDefault);
		}
	});
	return apiForecastData;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_FORECAST_DATA_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_FORECAST_DATA_FIELDS);

export const getFilters = (
	filters: ApiQueryFilters,
	project: BaseProjectResolved,
	forecastId: Types.ObjectId,
	cursor?: IFilter,
): IFilter =>
	getApiReadDbFilters(filters, API_FORECAST_DATA_FIELDS, {
		value: merge({ project: project._id, forecast: forecastId }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_FORECAST_DATA_FIELDS);
