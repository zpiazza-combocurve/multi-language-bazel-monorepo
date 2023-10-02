import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { Depreciation_KEY, Depreciation_NAME, IDepreciation } from '@src/models/econ/depreciation';
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
	API_Depreciation__ECON_FUNCTION,
	ApiDepreciationEconFunction,
	parseDepreciationEconFunction,
	toApiDepreciationEconFunction,
	toDepreciationEconFunction,
} from './depreciation';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IDepreciationField<T> = IField<IDepreciation, T>;

const depreciationField: IDepreciationField<ApiDepreciationEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_Depreciation__ECON_FUNCTION,
	parse: (data, location) => parseDepreciationEconFunction(data, location),
	read: (depreciation) => toApiDepreciationEconFunction(get(depreciation, ['econ_function', 'depreciation_model'])),
	write: (depreciation, value) =>
		set(depreciation, ['econ_function', 'depreciation_model'], toDepreciationEconFunction(value)),
};

const API_Depreciation__FIELDS = {
	...API_ECON_MODEL_FIELDS,
	depreciation: depreciationField,
};

export const toApiDepreciation = (depreciation: IDepreciation): ApiDepreciation => {
	const apiDepreciation: Record<string, ApiDepreciation[ApiDepreciationKey]> = {};
	Object.entries(API_Depreciation__FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiDepreciation[field] = read(depreciation);
		}
	});
	return apiDepreciation;
};

export const toDepreciation = (apiDepreciation: ApiDepreciation, projectId: Types.ObjectId): IDepreciation => {
	const depreciation = {};
	Object.entries(API_Depreciation__FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (depreciation: Partial<IDepreciation>, value: unknown) => void;
			coercedWrite(depreciation, apiDepreciation[field as ApiDepreciationKey]);
		}
	});
	return {
		...depreciation,
		assumptionKey: Depreciation_KEY,
		assumptionName: Depreciation_NAME,
		project: projectId,
	} as IDepreciation;
};

export type ApiDepreciationKey = keyof typeof API_Depreciation__FIELDS;

type TypeOfField<FT> = FT extends IDepreciationField<infer T> ? T : never;

export type ApiDepreciation = {
	[key in ApiDepreciationKey]?: TypeOfField<(typeof API_Depreciation__FIELDS)[key]>;
};

const isApiDepreciationField = (field: string): field is keyof typeof API_Depreciation__FIELDS =>
	Object.keys(API_Depreciation__FIELDS).includes(field);

export const getApiDepreciationField = (
	field: string,
): (typeof API_Depreciation__FIELDS)[ApiDepreciationKey] | null => {
	if (!isApiDepreciationField(field)) {
		return null;
	}
	return API_Depreciation__FIELDS[field];
};

export const getRequiredFields = (depreciation: ApiDepreciation): ApiDepreciationKey[] => {
	const baseRequired = Object.entries(API_Depreciation__FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiDepreciationKey);
	if (depreciation.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_Depreciation__FIELDS, {
		value: merge({ project: project._id, assumptionKey: Depreciation_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_Depreciation__FIELDS);

export const sortableFields = sortableDbFields(API_Depreciation__FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_Depreciation__FIELDS, undefined, cursor);

export default API_Depreciation__FIELDS;
