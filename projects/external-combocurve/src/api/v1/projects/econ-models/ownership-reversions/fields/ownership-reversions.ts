import { merge } from 'lodash';
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
import {
	IOwnershipReversions,
	OWNERSHIP_REVERSION_KEY,
	OWNERSHIP_REVERSION_NAME,
} from '@src/models/econ/ownership-reversions';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';
import { parseOwnershipReversionEconFunction } from '../validation';

import {
	API_OWNERSHIP_REVERSION_ECON_FUNCTION,
	ApiOwnershipReversionEconFunction,
	toApiOwnershipReversionEconFunction,
	toOwnershipReversionEconFunction,
} from './ownership-reversions-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IOwnershipReversionsField<T> = IField<IOwnershipReversions, T>;

const ownershipReversionField: IOwnershipReversionsField<ApiOwnershipReversionEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_OWNERSHIP_REVERSION_ECON_FUNCTION,
	parse: parseOwnershipReversionEconFunction,
	read: (ownershipReversion) => toApiOwnershipReversionEconFunction(ownershipReversion),
	write: (ownershipReversion, value) => {
		const { econ_function } = toOwnershipReversionEconFunction(value);
		ownershipReversion['econ_function'] = econ_function;
	},
};

const API_OWNERSHIP_REVERSIONS_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	ownership: ownershipReversionField,
};

export const toApiOwnershipReversion = (ownershipReversion: IOwnershipReversions): ApiOwnershipReversion => {
	const apiOwnershipReversion: Record<string, ApiOwnershipReversion[ApiOwnershipReversionKey]> = {};
	Object.entries(API_OWNERSHIP_REVERSIONS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiOwnershipReversion[field] = read(ownershipReversion);
		}
	});
	return apiOwnershipReversion;
};

export const toOwnershipReversion = (
	apiOwnershipReversion: ApiOwnershipReversion,
	projectId: Types.ObjectId,
): IOwnershipReversions => {
	const ownershipReversion = {};
	Object.entries(API_OWNERSHIP_REVERSIONS_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (reservesCategory: Partial<IOwnershipReversions>, value: unknown) => void;
			coercedWrite(ownershipReversion, apiOwnershipReversion[field as ApiOwnershipReversionKey]);
		}
	});
	return {
		...ownershipReversion,
		assumptionKey: OWNERSHIP_REVERSION_KEY,
		assumptionName: OWNERSHIP_REVERSION_NAME,
		project: projectId,
	} as IOwnershipReversions;
};

export type ApiOwnershipReversionKey = keyof typeof API_OWNERSHIP_REVERSIONS_FIELDS;

type TypeOfField<FT> = FT extends IOwnershipReversionsField<infer T> ? T : never;

export type ApiOwnershipReversion = {
	[key in ApiOwnershipReversionKey]?: TypeOfField<(typeof API_OWNERSHIP_REVERSIONS_FIELDS)[key]>;
};

const isApiOwnershipReversionField = (field: string): field is keyof typeof API_OWNERSHIP_REVERSIONS_FIELDS =>
	Object.keys(API_OWNERSHIP_REVERSIONS_FIELDS).includes(field);

export const getApiOwnershipReversionField = (
	field: string,
): (typeof API_OWNERSHIP_REVERSIONS_FIELDS)[ApiOwnershipReversionKey] | null => {
	if (!isApiOwnershipReversionField(field)) {
		return null;
	}
	return API_OWNERSHIP_REVERSIONS_FIELDS[field];
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_OWNERSHIP_REVERSIONS_FIELDS, {
		value: merge({ project: project._id, assumptionKey: OWNERSHIP_REVERSION_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_OWNERSHIP_REVERSIONS_FIELDS);

export const sortableFields = sortableDbFields(API_OWNERSHIP_REVERSIONS_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_OWNERSHIP_REVERSIONS_FIELDS, undefined, cursor);

export default API_OWNERSHIP_REVERSIONS_FIELDS;
