import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { DIFFERENTIALS_KEY, DIFFERENTIALS_NAME, IDifferentials } from '@src/models/econ/differentials';
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
import { parseDifferentialsEconFunction } from '../validation';

import {
	API_DIFFERENTIALS_ECON_FUNCTION,
	ApiDifferentialsEconFunction,
	toApiDifferentialsEconFunction,
	toDifferentialsEconFunction,
} from './differentials-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type DifferentialsField<T> = IField<IDifferentials, T>;

const differentialsField: DifferentialsField<ApiDifferentialsEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_DIFFERENTIALS_ECON_FUNCTION,
	parse: parseDifferentialsEconFunction,
	read: (differentials) => toApiDifferentialsEconFunction(get(differentials, ['econ_function', 'differentials'])),
	write: (differentials, value) =>
		set(differentials, ['econ_function', 'differentials'], toDifferentialsEconFunction(value)),
};

const API_DIFFERENTIALS_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	differentials: differentialsField,
};

export const toApiDifferentials = (differentials: IDifferentials): ApiDifferentials => {
	const apiDifferentials: Record<string, ApiDifferentials[ApiDifferentialsKey]> = {};
	Object.entries(API_DIFFERENTIALS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiDifferentials[field] = read(differentials);
		}
	});
	return apiDifferentials;
};

export const toDifferentials = (apiDifferentials: ApiDifferentials, projectId: Types.ObjectId): IDifferentials => {
	const differentials = {};
	Object.entries(API_DIFFERENTIALS_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (differentials: Partial<IDifferentials>, value: unknown) => void;
			coercedWrite(differentials, apiDifferentials[field as ApiDifferentialsKey]);
		}
	});
	return {
		...differentials,
		assumptionKey: DIFFERENTIALS_KEY,
		assumptionName: DIFFERENTIALS_NAME,
		project: projectId,
	} as IDifferentials;
};

export type ApiDifferentialsKey = keyof typeof API_DIFFERENTIALS_FIELDS;

type TypeOfField<FT> = FT extends DifferentialsField<infer T> ? T : never;

export type ApiDifferentials = {
	[key in ApiDifferentialsKey]?: TypeOfField<(typeof API_DIFFERENTIALS_FIELDS)[key]>;
};

const isApiDifferentialsField = (field: string): field is keyof typeof API_DIFFERENTIALS_FIELDS =>
	Object.keys(API_DIFFERENTIALS_FIELDS).includes(field);

export const getApiDifferentialsField = (
	field: string,
): (typeof API_DIFFERENTIALS_FIELDS)[ApiDifferentialsKey] | null => {
	if (!isApiDifferentialsField(field)) {
		return null;
	}
	return API_DIFFERENTIALS_FIELDS[field];
};

export const getRequiredFields = (differentials: ApiDifferentials): ApiDifferentialsKey[] => {
	const baseRequired = Object.entries(API_DIFFERENTIALS_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiDifferentialsKey);
	if (differentials.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_DIFFERENTIALS_FIELDS, {
		value: merge({ project: project._id, assumptionKey: DIFFERENTIALS_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_DIFFERENTIALS_FIELDS);

export const sortableFields = sortableDbFields(API_DIFFERENTIALS_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_DIFFERENTIALS_FIELDS, undefined, cursor);

export default API_DIFFERENTIALS_FIELDS;
