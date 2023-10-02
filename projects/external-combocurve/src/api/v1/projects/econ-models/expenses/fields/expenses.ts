import { cloneDeep, get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { Expenses_KEY, Expenses_NAME, IExpenses } from '@src/models/econ/expenses';
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
	API_BASE_EXPENSES_FIELDS,
	ApiExpensesFields,
	parseApiExpensesFieldsEconFunction,
	toApiExpensesFieldsEconFunction,
	toExpensesFieldsEconFunction,
} from './expenses-fields';
import {
	API_CARBON_EXPENSES_ECON_FUNCTION,
	ApiCarbonExpensesEconFunction,
	parseApiCarbonExpensesEconFunction,
	toApiCarbonExpensesEconFunction,
	toCarbonExpensesEconFunction,
} from './carbon-expenses-econ-function';
import {
	API_FIXED_EXPENSES_ECON_FUNCTION,
	ApiFixedExpensesEconFunction,
	parseApiFixedExpensesEconFunction,
	toApiFixedExpensesEconFunction,
	toFixedExpensesEconFunction,
} from './fixed-expenses-econ-function';
import {
	API_VARIABLE_EXPENSES_ECON_FUNCTION,
	ApiVariableExpensesEconFunction,
	parseApiVariableExpensesEconFunction,
	toApiVariableExpensesEconFunction,
	toVariableExpensesEconFunction,
} from './variable-expenses-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IExpensesField<T> = IField<IExpenses, T>;

const variableExpensesField: IExpensesField<ApiVariableExpensesEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_VARIABLE_EXPENSES_ECON_FUNCTION,
	parse: (data: unknown, location?: string) => parseApiVariableExpensesEconFunction(data, location),
	read: (expenses) => toApiVariableExpensesEconFunction(get(expenses, ['econ_function', 'variable_expenses'])),
	write: (expenses, value) =>
		set(expenses, ['econ_function', 'variable_expenses'], toVariableExpensesEconFunction(value)),
};

const fixedExpensesField: IExpensesField<ApiFixedExpensesEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_FIXED_EXPENSES_ECON_FUNCTION,
	parse: (data: unknown, location?: string) => parseApiFixedExpensesEconFunction(data, location),
	read: (expenses) => toApiFixedExpensesEconFunction(get(expenses, ['econ_function', 'fixed_expenses'])),
	write: (expenses, value) => set(expenses, ['econ_function', 'fixed_expenses'], toFixedExpensesEconFunction(value)),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { description, ...restBaseExpensesFields } = cloneDeep(API_BASE_EXPENSES_FIELDS);
const WATER_DISPOSAL_FIELDS = { ...restBaseExpensesFields };

const waterDisposalField: IExpensesField<ApiExpensesFields> = {
	type: OpenApiDataType.object,
	properties: WATER_DISPOSAL_FIELDS,
	parse: (data: unknown, location?: string) => parseApiExpensesFieldsEconFunction(data, 'water_disposal', location),
	read: (expenses) => toApiExpensesFieldsEconFunction(get(expenses, ['econ_function', 'water_disposal'])),
	write: (expenses, value) => set(expenses, ['econ_function', 'water_disposal'], toExpensesFieldsEconFunction(value)),
};

const carbonExpensesField: IExpensesField<ApiCarbonExpensesEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_CARBON_EXPENSES_ECON_FUNCTION,
	parse: (data: unknown, location?: string) => parseApiCarbonExpensesEconFunction(data, location),
	read: (expenses) => toApiCarbonExpensesEconFunction(get(expenses, ['econ_function', 'carbon_expenses'])),
	write: (expenses, value) =>
		set(expenses, ['econ_function', 'carbon_expenses'], toCarbonExpensesEconFunction(value)),
};

const API_EXPENSES_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	variableExpenses: variableExpensesField,
	fixedExpenses: fixedExpensesField,
	waterDisposal: waterDisposalField,
	carbonExpenses: carbonExpensesField,
};

export const toApiExpenses = (expenses: IExpenses): ApiExpenses => {
	const apiExpenses: Record<string, ApiExpenses[ApiExpensesKey]> = {};
	Object.entries(API_EXPENSES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiExpenses[field] = read(expenses);
		}
	});
	return apiExpenses;
};

export const toExpenses = (apiExpenses: ApiExpenses, projectId: Types.ObjectId): IExpenses => {
	const expenses = {};
	Object.entries(API_EXPENSES_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (expenses: Partial<IExpenses>, value: unknown) => void;
			coercedWrite(expenses, apiExpenses[field as ApiExpensesKey]);
		}
	});
	return {
		...expenses,
		assumptionKey: Expenses_KEY,
		assumptionName: Expenses_NAME,
		project: projectId,
	} as IExpenses;
};

export type ApiExpensesKey = keyof typeof API_EXPENSES_FIELDS;

type TypeOfField<FT> = FT extends IExpensesField<infer T> ? T : never;

export type ApiExpenses = {
	[key in ApiExpensesKey]?: TypeOfField<(typeof API_EXPENSES_FIELDS)[key]>;
};

const isApiExpensesField = (field: string): field is keyof typeof API_EXPENSES_FIELDS =>
	Object.keys(API_EXPENSES_FIELDS).includes(field);

export const getApiExpensesField = (field: string): (typeof API_EXPENSES_FIELDS)[ApiExpensesKey] | null => {
	if (!isApiExpensesField(field)) {
		return null;
	}
	return API_EXPENSES_FIELDS[field];
};

export const getRequiredFields = (expenses: ApiExpenses): ApiExpensesKey[] => {
	const baseRequired = Object.entries(API_EXPENSES_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiExpensesKey);
	if (expenses.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_EXPENSES_FIELDS, {
		value: merge({ project: project._id, assumptionKey: Expenses_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_EXPENSES_FIELDS);

export const sortableFields = sortableDbFields(API_EXPENSES_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_EXPENSES_FIELDS, undefined, cursor);

export default API_EXPENSES_FIELDS;
