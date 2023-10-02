import { cloneDeep, merge } from 'lodash';
import { LeanDocument, Types } from 'mongoose';

import {
	BOOLEAN_FIELD,
	DATE_FIELD,
	getStringEnumField,
	IFieldDefinition,
	INTEGER_FIELD,
	OBJECT_ID_FIELD,
	STRING_FIELD,
} from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IFilterOption,
	IFilterOptionRecord,
	readDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { P_SERIES, PSeries } from '@src/models/forecast-data';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IWell } from '@src/models/wells';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

export const READ_RECORD_LIMIT = 1000;

export interface IAriesForecastColumns {
	PROPNUM: string;
	'WELL NAME': string;
	'WELL NUMBER': string;
	'INPT ID': string;
	API10: string;
	API12: string;
	API14: string;
	'CHOSEN ID': string;
	'ARIES ID': string;
	'PHDWIN ID': string;
	SECTION: number;
	SEQUENCE: number;
	QUALIFIER: string;
	KEYWORD: string;
	EXPRESSION: string;
}

export const SELECTED_ID_KEY = [
	'inptID',
	'api10',
	'api12',
	'api14',
	'chosenID',
	'aries_id',
	'phdwin_id',
	'well_name',
	'well_name_well_number',
] as const;
export type SelectedIdKey = (typeof SELECTED_ID_KEY)[number];

const ENDING_CONDITION = ['years', 'months', 'absolute_date', 'ending_rate'] as const;
type EndingCondition = (typeof ENDING_CONDITION)[number];

const FORECAST_UNIT = ['per_day', 'per_month'] as const;
type ForecastUnit = (typeof FORECAST_UNIT)[number];

const TO_LIFE = ['yes', 'no'] as const;
type ToLife = (typeof TO_LIFE)[number];

const DATA_RESOLUTION = ['same_as_forecast', 'daily', 'monthly'] as const;
type DataResolution = (typeof DATA_RESOLUTION)[number];

export interface IAriesForecastSettings {
	pSeries: PSeries;
	startDate: Date | null;
	selectedIdKey: SelectedIdKey;
	endingCondition: EndingCondition;
	forecastUnit: ForecastUnit;
	toLife: ToLife;
	dataResolution: DataResolution;
	includeZeroForecast: boolean;
	forecastStartToLatestProd: boolean;
	forecastHistoryMatch: boolean;
}

export const defaultSettings: IAriesForecastSettings = {
	pSeries: 'best',
	startDate: null,
	selectedIdKey: 'chosenID',
	endingCondition: 'years',
	forecastUnit: 'per_day',
	toLife: 'no',
	dataResolution: 'same_as_forecast',
	includeZeroForecast: false,
	forecastStartToLatestProd: false,
	forecastHistoryMatch: false,
};
export interface IAriesForecastData {
	well: Types.ObjectId;
	forecast: IAriesForecastColumns[];
	settings: IAriesForecastSettings;
}

type IAriesForecastDataField<T> = IField<IAriesForecastData, T>;

export type ApiAriesForecastColumnsKey = keyof typeof API_ARIES_FORECAST_COLUMNS_FIELDS;

export type IAriesForecastColumnsField<T extends IAriesForecastColumns, TField> = IField<T, TField>;

type TypeOfColumnsField<FT> = FT extends IAriesForecastColumnsField<IAriesForecastColumns, infer T> ? T : never;

export type ApiAriesForecastColumns = {
	[key in ApiAriesForecastColumnsKey]?: TypeOfColumnsField<(typeof API_ARIES_FORECAST_COLUMNS_FIELDS)[key]>;
};

const readAriesFieldColumn = <K extends keyof IAriesForecastColumns>(
	key: K,
	definition: IFieldDefinition<IAriesForecastColumns[K]>,
): IAriesForecastColumnsField<IAriesForecastColumns, IAriesForecastColumns[K]> => {
	return {
		...definition,
		read: (ariesColumn) => ariesColumn[key],
	};
};

const API_ARIES_FORECAST_COLUMNS_FIELDS = {
	PROPNUM: readAriesFieldColumn('PROPNUM', STRING_FIELD),
	'WELL NAME': readAriesFieldColumn('WELL NAME', STRING_FIELD),
	'WELL NUMBER': readAriesFieldColumn('WELL NUMBER', STRING_FIELD),
	'INPT ID': readAriesFieldColumn('INPT ID', STRING_FIELD),
	API10: readAriesFieldColumn('API10', STRING_FIELD),
	API12: readAriesFieldColumn('API12', STRING_FIELD),
	API14: readAriesFieldColumn('API14', STRING_FIELD),
	'CHOSEN ID': readAriesFieldColumn('CHOSEN ID', STRING_FIELD),
	'ARIES ID': readAriesFieldColumn('ARIES ID', STRING_FIELD),
	'PHDWIN ID': readAriesFieldColumn('PHDWIN ID', STRING_FIELD),
	SECTION: readAriesFieldColumn('SECTION', INTEGER_FIELD),
	SEQUENCE: readAriesFieldColumn('SEQUENCE', INTEGER_FIELD),
	QUALIFIER: readAriesFieldColumn('QUALIFIER', STRING_FIELD),
	KEYWORD: readAriesFieldColumn('KEYWORD', STRING_FIELD),
	EXPRESSION: readAriesFieldColumn('EXPRESSION', STRING_FIELD),
};

export const toApiForecastColumns = (ariesColumns: IAriesForecastColumns): ApiAriesForecastColumns => {
	const apiAriesForecastColumns: Record<string, ApiAriesForecastColumns[ApiAriesForecastColumnsKey]> = {};
	Object.entries(API_ARIES_FORECAST_COLUMNS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiAriesForecastColumns[field] = read(ariesColumns);
		}
	});
	return apiAriesForecastColumns;
};

export type ApiAriesForecastSettingsKey = keyof typeof API_ARIES_FORECASTS_SETTINGS_FIELDS;

export type IAriesForecastSettingsField<T extends IAriesForecastSettings, TField> = IField<T, TField>;

type TypeOfSettingsField<FT> = FT extends IAriesForecastSettingsField<IAriesForecastSettings, infer T> ? T : never;

export type ApiAriesForecastSettings = {
	[key in ApiAriesForecastSettingsKey]?: TypeOfSettingsField<(typeof API_ARIES_FORECASTS_SETTINGS_FIELDS)[key]>;
};

const settingsField = <K extends keyof IAriesForecastSettings>(
	key: K,
	definition: IFieldDefinition<IAriesForecastSettings[K]>,
) => ({
	...readDbField<IAriesForecastSettings, K>(key, definition, { filterOption: { read: { filterValues: 1 } } }),
	getApiFilter: (filter: ApiQueryFilters) => {
		const parsedValue = definition.parseQuery?.(Object.values(filter)[0]);
		if (!parsedValue) {
			return { [key]: Object.values(filter)[0][0] };
		}
		return {
			[key]: parsedValue[0].value,
		};
	},
});

const API_ARIES_FORECASTS_SETTINGS_FIELDS = {
	pSeries: settingsField('pSeries', getStringEnumField(P_SERIES)),
	startDate: settingsField('startDate', DATE_FIELD),
	selectedIdKey: settingsField('selectedIdKey', getStringEnumField(SELECTED_ID_KEY)),
	endingCondition: settingsField('endingCondition', getStringEnumField(ENDING_CONDITION)),
	forecastUnit: settingsField('forecastUnit', getStringEnumField(FORECAST_UNIT)),
	toLife: settingsField('toLife', getStringEnumField(TO_LIFE)),
	dataResolution: settingsField('dataResolution', getStringEnumField(DATA_RESOLUTION)),
	includeZeroForecast: settingsField('includeZeroForecast', BOOLEAN_FIELD),
	forecastStartToLatestProd: settingsField('forecastStartToLatestProd', BOOLEAN_FIELD),
	forecastHistoryMatch: settingsField('forecastHistoryMatch', BOOLEAN_FIELD),
};

const getColumns = (field: 'forecast'): IAriesForecastDataField<ApiAriesForecastColumns[]> => {
	return {
		type: OpenApiDataType.array,
		items: { type: OpenApiDataType.object, properties: API_ARIES_FORECAST_COLUMNS_FIELDS },
		read: (ariesForecastData) => ariesForecastData[field].map(toApiForecastColumns),
	};
};

const wellField = <K extends keyof IAriesForecastData>(
	key: K,
	definition: IFieldDefinition<IAriesForecastData[K]>,
): IAriesForecastDataField<IAriesForecastData[K]> => {
	const readWellId = readDbField<IWell, '_id', IAriesForecastData[K]>('_id', definition, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
		allowCursor: true,
	});

	return {
		...definition,
		read: (t) => t[key],
		getDbSort: readWellId.getDbSort,
		getDbReadFilter: readWellId.getDbReadFilter,
		getDbDeleteFilter: readWellId.getDbDeleteFilter,
		options: readWellId.options,
	};
};

// Let it here in case we need to expose settings
// const settingField: IAriesForecastDataField<ApiAriesForecastSettings> = {
// 	type: OpenApiDataType.object,
// 	properties: API_ARIES_FORECASTS_SETTINGS_FIELDS,
// 	read: (ariesForecastData) => toApiAriesForecastSettings(ariesForecastData.settings),
// };

const API_ARIES_FORECAST_DATA_FIELDS = {
	well: wellField('well', OBJECT_ID_FIELD),
	forecast: getColumns('forecast'),
};

export default API_ARIES_FORECAST_DATA_FIELDS;

export type ApiAriesForecastDataKey = keyof typeof API_ARIES_FORECAST_DATA_FIELDS;

type TypeOfField<FT> = FT extends IAriesForecastDataField<infer T> ? T : never;

export type ApiAriesForecastData = {
	[key in ApiAriesForecastDataKey]?: TypeOfField<(typeof API_ARIES_FORECAST_DATA_FIELDS)[key]>;
};

export const toApiAriesForecastData = (ariesForecastData: IAriesForecastData): ApiAriesForecastData => {
	const apiAriesForecastData: Record<string, ApiAriesForecastData[ApiAriesForecastDataKey]> = {};
	Object.entries(API_ARIES_FORECAST_DATA_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiAriesForecastData[field] = read(ariesForecastData);
		}
	});
	return apiAriesForecastData;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_ARIES_FORECAST_DATA_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_ARIES_FORECAST_DATA_FIELDS);

export const getFilters = (filters: ApiQueryFilters, wellIds: Types.ObjectId[] | [], cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_ARIES_FORECAST_DATA_FIELDS, {
		value: merge({ _id: { $in: wellIds } }, cursor || {}),
		override: false,
	});

export const filterableFields = filterableReadDbFields(API_ARIES_FORECAST_DATA_FIELDS);

export const ariesForecastSettings = Object.entries(API_ARIES_FORECASTS_SETTINGS_FIELDS)
	.filter(([, field]) => !!field.getDbReadFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.['read'] as IFilterOption;
		return acc;
	}, {});

const isApiAriesForecastSettingsField = (field: string): field is ApiAriesForecastSettingsKey =>
	Object.keys(API_ARIES_FORECASTS_SETTINGS_FIELDS).includes(field);

export const getAriesForecastSettingsField = (
	fieldName: string,
): (typeof API_ARIES_FORECASTS_SETTINGS_FIELDS)[ApiAriesForecastSettingsKey] | null => {
	if (!isApiAriesForecastSettingsField(fieldName)) {
		return null;
	}
	const field = API_ARIES_FORECASTS_SETTINGS_FIELDS[fieldName];

	return field;
};

export const getSettingsFromFilters = (filters: ApiQueryFilters): IAriesForecastSettings => {
	const res = Object.entries(filters).reduce<IAriesForecastSettings>((cumFilters, [field, filter]) => {
		const getFilter = getAriesForecastSettingsField(field)?.getApiFilter;
		if (!getFilter) {
			return cumFilters;
		}
		return { ...cumFilters, ...getFilter({ [field]: filter }) };
	}, cloneDeep(defaultSettings));
	return res;
};

export const toApiAriesForecastSettings = (ariesForecastSettings: IAriesForecastSettings): ApiAriesForecastSettings => {
	const apiAriesForecastSettings: Record<string, ApiAriesForecastSettings[ApiAriesForecastSettingsKey]> = {};
	Object.entries(API_ARIES_FORECASTS_SETTINGS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiAriesForecastSettings[field] = read(ariesForecastSettings);
		}
	});
	return apiAriesForecastSettings;
};

export const getSelectedIdProjection = (selectedIdKey: SelectedIdKey): string => {
	return '_id ' + (selectedIdKey == 'well_name_well_number' ? 'well_name well_number' : selectedIdKey);
};

export const getWellSelectedIdValue = (well: LeanDocument<IWell>, selectedIdKey: SelectedIdKey): string | undefined => {
	if (selectedIdKey == 'well_name_well_number') {
		return !well['well_name'] && !well['well_number']
			? undefined
			: well['well_name'] ?? '' + well['well_number'] ?? '';
	}

	return well[selectedIdKey];
};
