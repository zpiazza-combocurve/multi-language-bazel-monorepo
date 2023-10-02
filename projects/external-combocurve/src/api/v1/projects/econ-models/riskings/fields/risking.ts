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
import { IRisking, IRiskingEconFunction, RISKING_KEY, RISKING_NAME } from '@src/models/econ/riskings';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_FUNCTION_ROW_FIELD } from '../../row-fields/econ-function-row-field';
import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';
import { parseRiskingEconFunction } from '../validation';

import {
	API_RISKING_ECON_FUNCTION,
	ApiRiskingEconFunction,
	toApiRiskingEconFunction,
	toRiskingEconFunction,
} from './risking-econ-function';
import { ApiRiskingShutInRows, parseApiShutInRowField, readShutInRows, writeShutInRows } from './shut-in-rows';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IRiskingField<T> = IField<IRisking, T>;

const riskingField: IRiskingField<ApiRiskingEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_RISKING_ECON_FUNCTION,
	parse: (data: unknown, location?: string) => parseRiskingEconFunction(data, location),
	read: (risking) =>
		toApiRiskingEconFunction(get(risking, ['econ_function', 'risking_model']) as IRiskingEconFunction),
	write: (risking, value) => set(risking, ['econ_function', 'risking_model'], toRiskingEconFunction(value)),
};

const getShutInRowField = (): IRiskingField<ApiRiskingShutInRows | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: API_ECON_FUNCTION_ROW_FIELD,
		read: (risking) => readShutInRows(get(risking, ['econ_function', 'shutIn'])),
		parse: (data: unknown, location?: string) => parseApiShutInRowField(data, location),
		write: (risking, value) => {
			if (notNil(value)) {
				set(risking, ['econ_function', 'shutIn'], writeShutInRows(value));
			}
		},
		options: { isRequired: false },
	};
};

const API_RISKING_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	risking: riskingField,
	shutIn: getShutInRowField(),
};

export const toApiRisking = (risking: IRisking): ApiRisking => {
	const apiRisking: Record<string, ApiRisking[ApiRiskingKey]> = {};
	Object.entries(API_RISKING_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiRisking[field] = read(risking);
		}
	});
	return apiRisking;
};

export const toRisking = (apiRisking: ApiRisking, projectId: Types.ObjectId): IRisking => {
	const risking = {};
	Object.entries(API_RISKING_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (risking: Partial<IRisking>, value: unknown) => void;
			coercedWrite(risking, apiRisking[field as ApiRiskingKey]);
		}
	});
	return {
		...risking,
		assumptionKey: RISKING_KEY,
		assumptionName: RISKING_NAME,
		project: projectId,
	} as IRisking;
};

export type ApiRiskingKey = keyof typeof API_RISKING_FIELDS;

type TypeOfField<FT> = FT extends IRiskingField<infer T> ? T : never;

export type ApiRisking = {
	[key in ApiRiskingKey]?: TypeOfField<(typeof API_RISKING_FIELDS)[key]>;
};

const isApiRiskingField = (field: string): field is keyof typeof API_RISKING_FIELDS =>
	Object.keys(API_RISKING_FIELDS).includes(field);

export const getApiRiskingField = (field: string): (typeof API_RISKING_FIELDS)[ApiRiskingKey] | null => {
	if (!isApiRiskingField(field)) {
		return null;
	}
	return API_RISKING_FIELDS[field];
};

export const getRequiredFields = (risking: ApiRisking): ApiRiskingKey[] => {
	const baseRequired = Object.entries(API_RISKING_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiRiskingKey);
	if (risking.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_RISKING_FIELDS, {
		value: merge({ project: project._id, assumptionKey: RISKING_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_RISKING_FIELDS);

export const sortableFields = sortableDbFields(API_RISKING_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_RISKING_FIELDS, undefined, cursor);

export default API_RISKING_FIELDS;
