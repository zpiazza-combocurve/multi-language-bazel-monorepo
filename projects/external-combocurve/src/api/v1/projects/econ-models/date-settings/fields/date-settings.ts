import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { DateSettings_KEY, DateSettings_Name, IDateSettings } from '@src/models/econ/date-settings';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	API_CUT_OFF_ECON_FUNCTION,
	ApiCutOffEconFunction,
	parseApiCutOffEconFunction,
	toApiCutOffEconFunction,
	toCutOffEconFunction,
} from './cut-off';
import {
	API_DATE_SETTING_ECON_FUNCTION,
	ApiDateSettingEconFunction,
	parseApiDateSettingEconFunction,
	toApiDateSettingEconFunction,
	toDateSettingEconFunction,
} from './date-settings-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type DateSettingsField<T> = IField<IDateSettings, T>;

const cutOffField: DateSettingsField<ApiCutOffEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_CUT_OFF_ECON_FUNCTION,
	parse: (data, location) => parseApiCutOffEconFunction(data, location),
	read: (cutOff) => toApiCutOffEconFunction(get(cutOff, ['econ_function', 'cut_off'])),
	write: (cutOff, value) => set(cutOff, ['econ_function', 'cut_off'], toCutOffEconFunction(value)),
};

const dateSettingsField: DateSettingsField<ApiDateSettingEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_DATE_SETTING_ECON_FUNCTION,
	parse: (data, location) => parseApiDateSettingEconFunction(data, location),
	read: (DateSettings) => toApiDateSettingEconFunction(get(DateSettings, ['econ_function', 'dates_setting'])),
	write: (DateSettings, value) =>
		value && set(DateSettings, ['econ_function', 'dates_setting'], toDateSettingEconFunction(value)),
};

const API_DATE_SETTINGS_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	dateSetting: dateSettingsField,
	cutOff: cutOffField,
};

export const toApiDateSettings = (DateSettings: IDateSettings): ApiDateSettings => {
	const apiDateSettings: Record<string, ApiDateSettings[ApiDateSettingsKey]> = {};
	Object.entries(API_DATE_SETTINGS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiDateSettings[field] = read(DateSettings);
		}
	});
	return apiDateSettings;
};

export const toDateSettings = (apiDateSettings: ApiDateSettings, projectId: Types.ObjectId): IDateSettings => {
	const dateSettings = {};
	Object.entries(API_DATE_SETTINGS_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (DateSettings: Partial<IDateSettings>, value: unknown) => void;
			coercedWrite(dateSettings, apiDateSettings[field as ApiDateSettingsKey]);
		}
	});
	return {
		...dateSettings,
		assumptionKey: DateSettings_KEY,
		assumptionName: DateSettings_Name,
		project: projectId,
	} as IDateSettings;
};

export type ApiDateSettingsKey = keyof typeof API_DATE_SETTINGS_FIELDS;

type TypeOfField<FT> = FT extends DateSettingsField<infer T> ? T : never;

export type ApiDateSettings = {
	[key in ApiDateSettingsKey]?: TypeOfField<(typeof API_DATE_SETTINGS_FIELDS)[key]>;
};

const isApiDateSettingsField = (field: string): field is keyof typeof API_DATE_SETTINGS_FIELDS =>
	Object.keys(API_DATE_SETTINGS_FIELDS).includes(field);

export const getApiDateSettingsField = (
	field: string,
): (typeof API_DATE_SETTINGS_FIELDS)[ApiDateSettingsKey] | null => {
	if (!isApiDateSettingsField(field)) {
		return null;
	}
	return API_DATE_SETTINGS_FIELDS[field];
};

export const getRequiredFields = (DateSettings: ApiDateSettings): ApiDateSettingsKey[] => {
	const baseRequired = Object.entries(API_DATE_SETTINGS_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiDateSettingsKey);
	if (DateSettings.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_DATE_SETTINGS_FIELDS, {
		value: merge({ project: project._id, assumptionKey: DateSettings_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_DATE_SETTINGS_FIELDS);

export const sortableFields = sortableDbFields(API_DATE_SETTINGS_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_DATE_SETTINGS_FIELDS, undefined, cursor);

export default API_DATE_SETTINGS_FIELDS;
