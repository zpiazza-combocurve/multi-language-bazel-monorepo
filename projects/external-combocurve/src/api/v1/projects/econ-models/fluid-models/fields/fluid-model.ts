import { merge, set } from 'lodash';
import { Types } from 'mongoose';

import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { FLUID_MODEL_KEY, FLUID_MODEL_NAME, IFluidModel } from '@src/models/econ/fluid-model';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	API_FLUID_MODEL_ECON_FUNCTION,
	ApiFluidModelEconFunction,
	parseApiFluidModelEconFunction,
	toApiFluidModelEconFunction,
	toFluidModelEconFunction,
} from './fluid-model-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IFluidModelField<T> = IField<IFluidModel, T>;

const fluidModelField: IFluidModelField<ApiFluidModelEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_FLUID_MODEL_ECON_FUNCTION,
	parse: (value, location) => parseApiFluidModelEconFunction(value, 'econ_function', location),
	read: (fluidModel) => toApiFluidModelEconFunction(fluidModel.econ_function),
	write: (fluidModel, value) => set(fluidModel, 'econ_function', toFluidModelEconFunction(value)),
};

const API_FLUID_MODEL_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	fluidModel: fluidModelField,
};

export const toApiFluidModel = (fluidModel: IFluidModel): ApiFluidModel => {
	const apiFluidModel: Record<string, ApiFluidModel[ApiFluidModelKey]> = {};
	Object.entries(API_FLUID_MODEL_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiFluidModel[field] = read(fluidModel);
		}
	});
	return apiFluidModel;
};

export const toFluidModel = (apiFluidModel: ApiFluidModel, projectId: Types.ObjectId): IFluidModel => {
	const fluidModel = {};
	Object.entries(API_FLUID_MODEL_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (fluidModel: Partial<IFluidModel>, value: unknown) => void;
			coercedWrite(fluidModel, apiFluidModel[field as ApiFluidModelKey]);
		}
	});
	return {
		...fluidModel,
		assumptionKey: FLUID_MODEL_KEY,
		assumptionName: FLUID_MODEL_NAME,
		project: projectId,
	} as IFluidModel;
};

export type ApiFluidModelKey = keyof typeof API_FLUID_MODEL_FIELDS;

type TypeOfField<FT> = FT extends IFluidModelField<infer T> ? T : never;

export type ApiFluidModel = {
	[key in ApiFluidModelKey]?: TypeOfField<(typeof API_FLUID_MODEL_FIELDS)[key]>;
};

const isApiFluidModelField = (field: string): field is keyof typeof API_FLUID_MODEL_FIELDS =>
	Object.keys(API_FLUID_MODEL_FIELDS).includes(field);

export const getApiFluidModelField = (field: string): (typeof API_FLUID_MODEL_FIELDS)[ApiFluidModelKey] | null => {
	if (!isApiFluidModelField(field)) {
		return null;
	}
	return API_FLUID_MODEL_FIELDS[field];
};

export const getRequiredFields = (fluidModel: ApiFluidModel): ApiFluidModelKey[] => {
	const baseRequired = Object.entries(API_FLUID_MODEL_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiFluidModelKey);
	if (fluidModel.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_FLUID_MODEL_FIELDS, {
		value: merge({ project: project._id, assumptionKey: FLUID_MODEL_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_FLUID_MODEL_FIELDS);

export const sortableFields = sortableDbFields(API_FLUID_MODEL_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_FLUID_MODEL_FIELDS, undefined, cursor);

export default API_FLUID_MODEL_FIELDS;
