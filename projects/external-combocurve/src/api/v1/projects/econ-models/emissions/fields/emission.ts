import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { EMISSIONS_KEY, EMISSIONS_NAME, IEmission } from '@src/models/econ/emissions';
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
import { parseEmissionEconFunction } from '../validation';

import {
	ApiEmissionEconFunction,
	EMISSION_ECON_FUNCTION_FIELDS,
	toApiEmissionEconFunction,
	toEmissionEconFunction,
} from './emission-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IEmissionField<T> = IField<IEmission, T>;

const emissionField: IEmissionField<ApiEmissionEconFunction> = {
	type: OpenApiDataType.object,
	properties: EMISSION_ECON_FUNCTION_FIELDS,
	parse: parseEmissionEconFunction,
	read: (emission) => toApiEmissionEconFunction(get(emission, ['econ_function'])),
	write: (emission, value) => set(emission, ['econ_function'], toEmissionEconFunction(value)),
};

const API_EMISSIONS_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	emissions: emissionField,
};

export const toApiEmission = (emission: IEmission): ApiEmission => {
	const apiEmission: Record<string, ApiEmission[ApiEmissionKey]> = {};
	Object.entries(API_EMISSIONS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEmission[field] = read(emission);
		}
	});
	return apiEmission;
};

export const toEmission = (apiEmission: ApiEmission, projectId: Types.ObjectId): IEmission => {
	const emission = {};
	Object.entries(API_EMISSIONS_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (emission: Partial<IEmission>, value: unknown) => void;
			coercedWrite(emission, apiEmission[field as ApiEmissionKey]);
		}
	});
	return {
		...emission,
		assumptionKey: EMISSIONS_KEY,
		assumptionName: EMISSIONS_NAME,
		project: projectId,
	} as IEmission;
};

export type ApiEmissionKey = keyof typeof API_EMISSIONS_FIELDS;

type TypeOfField<FT> = FT extends IEmissionField<infer T> ? T : never;

export type ApiEmission = {
	[key in ApiEmissionKey]?: TypeOfField<(typeof API_EMISSIONS_FIELDS)[key]>;
};

const isApiEmissionField = (field: string): field is keyof typeof API_EMISSIONS_FIELDS =>
	Object.keys(API_EMISSIONS_FIELDS).includes(field);

export const getApiEmissionField = (field: string): (typeof API_EMISSIONS_FIELDS)[ApiEmissionKey] | null => {
	if (!isApiEmissionField(field)) {
		return null;
	}
	return API_EMISSIONS_FIELDS[field];
};

export const getRequiredFields = (emission: ApiEmission): ApiEmissionKey[] => {
	const baseRequired = Object.entries(API_EMISSIONS_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiEmissionKey);
	if (emission.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_EMISSIONS_FIELDS, {
		value: merge({ project: project._id, assumptionKey: EMISSIONS_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_EMISSIONS_FIELDS);

export const sortableFields = sortableDbFields(API_EMISSIONS_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_EMISSIONS_FIELDS, undefined, cursor);

export default API_EMISSIONS_FIELDS;
