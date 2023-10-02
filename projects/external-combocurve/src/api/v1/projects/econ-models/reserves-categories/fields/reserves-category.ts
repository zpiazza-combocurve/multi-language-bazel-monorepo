import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { IReservesCategory, RESERVES_CATEGORY_KEY, RESERVES_CATEGORY_NAME } from '@src/models/econ/reserves-categories';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';
import { parseReservesCategoryEconFunction } from '../validation';

import {
	API_RESERVES_CATEGORY_ECON_FUNCTION,
	ApiReservesCategoryEconFunction,
	toApiReservesCategoryEconFunction,
	toReservesCategoryEconFunction,
} from './reserves-category-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IReservesCategoryField<T> = IField<IReservesCategory, T>;

const reservesCategoryField: IReservesCategoryField<ApiReservesCategoryEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_RESERVES_CATEGORY_ECON_FUNCTION,
	parse: parseReservesCategoryEconFunction,
	read: (reservesCategory) =>
		toApiReservesCategoryEconFunction(get(reservesCategory, ['econ_function', 'reserves_category'])),
	write: (reservesCategory, value) =>
		set(reservesCategory, ['econ_function', 'reserves_category'], toReservesCategoryEconFunction(value)),
};

const API_RESERVES_CATEGORY_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	reservesCategory: reservesCategoryField,
};

export const toApiReservesCategory = (reservesCategory: IReservesCategory): ApiReservesCategory => {
	const apiReservesCategory: Record<string, ApiReservesCategory[ApiReservesCategoryKey]> = {};
	Object.entries(API_RESERVES_CATEGORY_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiReservesCategory[field] = read(reservesCategory);
		}
	});
	return apiReservesCategory;
};

export const toReservesCategory = (
	apiReservesCategory: ApiReservesCategory,
	projectId: Types.ObjectId,
): IReservesCategory => {
	const reservesCategory = {};
	Object.entries(API_RESERVES_CATEGORY_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (reservesCategory: Partial<IReservesCategory>, value: unknown) => void;
			coercedWrite(reservesCategory, apiReservesCategory[field as ApiReservesCategoryKey]);
		}
	});
	return {
		...reservesCategory,
		assumptionKey: RESERVES_CATEGORY_KEY,
		assumptionName: RESERVES_CATEGORY_NAME,
		project: projectId,
	} as IReservesCategory;
};

export type ApiReservesCategoryKey = keyof typeof API_RESERVES_CATEGORY_FIELDS;

type TypeOfField<FT> = FT extends IReservesCategoryField<infer T> ? T : never;

export type ApiReservesCategory = {
	[key in ApiReservesCategoryKey]?: TypeOfField<(typeof API_RESERVES_CATEGORY_FIELDS)[key]>;
};

const isApiReservesCategoryField = (field: string): field is keyof typeof API_RESERVES_CATEGORY_FIELDS =>
	Object.keys(API_RESERVES_CATEGORY_FIELDS).includes(field);

export const getApiReservesCategoryField = (
	field: string,
): (typeof API_RESERVES_CATEGORY_FIELDS)[ApiReservesCategoryKey] | null => {
	if (!isApiReservesCategoryField(field)) {
		return null;
	}
	return API_RESERVES_CATEGORY_FIELDS[field];
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_RESERVES_CATEGORY_FIELDS, {
		value: merge({ project: project._id, assumptionKey: RESERVES_CATEGORY_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_RESERVES_CATEGORY_FIELDS);

export const sortableFields = sortableDbFields(API_RESERVES_CATEGORY_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_RESERVES_CATEGORY_FIELDS, undefined, cursor);

export default API_RESERVES_CATEGORY_FIELDS;
