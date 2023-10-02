import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { CAPEX_KEY, CAPEX_NAME, ICapex } from '@src/models/econ/capex';
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
	API_COMPLETION_COST_ECON_FUNCTION,
	ApiCompletionCostEconFunction,
	parseCompletionCostEconFunction,
	toApiCompletionCostEconFunction,
	toCompletionCostEconFunction,
} from './completion-cost';
import {
	API_DRILLING_COST_ECON_FUNCTION,
	ApiDrillingCostEconFunction,
	parseDrillingCostEconFunction,
	toApiDrillingCostEconFunction,
	toDrillingCostEconFunction,
} from './drilling-cost';
import {
	API_OTHER_CAPEX_ECON_FUNCTION,
	ApiOtherCapexEconFunction,
	parseOtherCapexEconFunction,
	toApiOtherCapexEconFunction,
	toOtherCapexEconFunction,
} from './other-capex';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type CapexField<T> = IField<ICapex, T>;

const otherCapexField: CapexField<ApiOtherCapexEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_OTHER_CAPEX_ECON_FUNCTION,
	parse: parseOtherCapexEconFunction,
	read: (otherCapex) => toApiOtherCapexEconFunction(get(otherCapex, ['econ_function', 'other_capex'])),
	write: (otherCapex, value) => set(otherCapex, ['econ_function', 'other_capex'], toOtherCapexEconFunction(value)),
};

const drillingCostField: CapexField<ApiDrillingCostEconFunction | undefined> = {
	type: OpenApiDataType.object,
	properties: API_DRILLING_COST_ECON_FUNCTION,
	parse: parseDrillingCostEconFunction,
	read: (drillingCost) => toApiDrillingCostEconFunction(get(drillingCost, ['econ_function', 'drilling_cost'])),
	write: (drillingCost, value) =>
		value && set(drillingCost, ['econ_function', 'drilling_cost'], toDrillingCostEconFunction(value)),
};

const completionCostField: CapexField<ApiCompletionCostEconFunction | undefined> = {
	type: OpenApiDataType.object,
	properties: API_COMPLETION_COST_ECON_FUNCTION,
	parse: parseCompletionCostEconFunction,
	read: (completionCost) =>
		toApiCompletionCostEconFunction(get(completionCost, ['econ_function', 'completion_cost'])),
	write: (completionCost, value) =>
		value && set(completionCost, ['econ_function', 'completion_cost'], toCompletionCostEconFunction(value)),
};

const recompletionWorkoverField: CapexField<Record<string, unknown> | undefined> = {
	type: OpenApiDataType.object,
	write: (recompletionWorkover) => set(recompletionWorkover, ['econ_function', 'recompletion_workover'], () => ({})),
};

const API_CAPEX_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	otherCapex: otherCapexField,
	drillingCost: drillingCostField,
	completionCost: completionCostField,
	recompletionWorkover: recompletionWorkoverField,
};

export const toApiCapex = (Capex: ICapex): ApiCapex => {
	const apiCapex: Record<string, ApiCapex[ApiCapexKey]> = {};
	Object.entries(API_CAPEX_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiCapex[field] = read(Capex);
		}
	});
	return apiCapex;
};

export const toCapex = (apiCapex: ApiCapex, projectId: Types.ObjectId): ICapex => {
	const capex = {};
	Object.entries(API_CAPEX_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (capex: Partial<ICapex>, value: unknown) => void;
			coercedWrite(capex, apiCapex[field as ApiCapexKey]);
		}
	});
	return {
		...capex,
		assumptionKey: CAPEX_KEY,
		assumptionName: CAPEX_NAME,
		project: projectId,
	} as ICapex;
};

export type ApiCapexKey = keyof typeof API_CAPEX_FIELDS;

type TypeOfField<FT> = FT extends CapexField<infer T> ? T : never;

export type ApiCapex = {
	[key in ApiCapexKey]?: TypeOfField<(typeof API_CAPEX_FIELDS)[key]>;
};

const isApiCapexField = (field: string): field is keyof typeof API_CAPEX_FIELDS =>
	Object.keys(API_CAPEX_FIELDS).includes(field);

export const getApiCapexField = (field: string): (typeof API_CAPEX_FIELDS)[ApiCapexKey] | null => {
	if (!isApiCapexField(field)) {
		return null;
	}
	return API_CAPEX_FIELDS[field];
};

export const getRequiredFields = (capex: ApiCapex): ApiCapexKey[] => {
	const baseRequired = Object.entries(API_CAPEX_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiCapexKey);
	if (capex.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_CAPEX_FIELDS, {
		value: merge({ project: project._id, assumptionKey: CAPEX_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_CAPEX_FIELDS);

export const sortableFields = sortableDbFields(API_CAPEX_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_CAPEX_FIELDS, undefined, cursor);

export default API_CAPEX_FIELDS;
