import { set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IVariableExpensesEconFunction, IVariableExpensesPhase } from '@src/models/econ/expenses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import {
	API_VARIABLE_EXPENSES_PHASES,
	ApiVariableExpensesPhase,
	parseApiVariableExpensesPhase,
	toApiVariableExpensesPhase,
	toVariableExpensesPhase,
} from './variable-expenses-phase';
import {
	API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE,
	ApiVariableExpensesNotShrinkagePhase,
	parseApiVariableExpensesNotShrinkagePhase,
	toApiVariableExpensesNotShrinkageNotShrinkagePhase,
	toVariableExpensesNotShrinkagePhase,
} from './variable-expenses-phase-not-shrunk';
export type VariableExpensesEconFunctionField<T> = IField<IVariableExpensesEconFunction, T>;
export type ApiVariableExpensesEconFunctionKey = keyof typeof API_VARIABLE_EXPENSES_ECON_FUNCTION;

type TypeOfField<FT> = FT extends VariableExpensesEconFunctionField<infer T> ? T : never;

export type ApiVariableExpensesEconFunction = {
	[key in ApiVariableExpensesEconFunctionKey]?: TypeOfField<(typeof API_VARIABLE_EXPENSES_ECON_FUNCTION)[key]>;
};

const variableExpensesEconFunctionReadWriteDbField = <K extends keyof IVariableExpensesEconFunction>(
	key: K,
): VariableExpensesEconFunctionField<ApiVariableExpensesPhase> => ({
	type: OpenApiDataType.object,
	properties: API_VARIABLE_EXPENSES_PHASES,
	read: (variableExpensePhase) => toApiVariableExpensesPhase(variableExpensePhase[key] as IVariableExpensesPhase),
	parse: (variableExpensePhase, location) => parseApiVariableExpensesPhase(variableExpensePhase, key, location),
	write: (variableExpensePhase, value) => set(variableExpensePhase, key, toVariableExpensesPhase(value)),
});

const variableExpensesEconFunctionNotShrinkageReadWriteDbField = <K extends keyof IVariableExpensesEconFunction>(
	key: K,
): VariableExpensesEconFunctionField<ApiVariableExpensesNotShrinkagePhase> => ({
	type: OpenApiDataType.object,
	properties: API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE,
	read: (variableExpensePhase) => toApiVariableExpensesNotShrinkageNotShrinkagePhase(variableExpensePhase[key]),
	parse: (value, location) => parseApiVariableExpensesNotShrinkagePhase(value, key, location),
	write: (carbonExpense, value) => set(carbonExpense, key, toVariableExpensesNotShrinkagePhase(value)),
});

export const API_VARIABLE_EXPENSES_ECON_FUNCTION = {
	oil: variableExpensesEconFunctionReadWriteDbField('oil'),
	gas: variableExpensesEconFunctionReadWriteDbField('gas'),
	ngl: variableExpensesEconFunctionNotShrinkageReadWriteDbField('ngl'),
	dripCondensate: variableExpensesEconFunctionNotShrinkageReadWriteDbField('drip_condensate'),
};

export const getApiVariableExpensesEconFunctionField = (
	field: string,
): (typeof API_VARIABLE_EXPENSES_ECON_FUNCTION)[ApiVariableExpensesEconFunctionKey] | null =>
	getApiField(field, API_VARIABLE_EXPENSES_ECON_FUNCTION);

export const getRequiredFields: ApiVariableExpensesEconFunctionKey[] = Object.entries(
	API_VARIABLE_EXPENSES_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiVariableExpensesEconFunctionKey);

export const toVariableExpensesEconFunction = (
	apiVariableExpensesEconFunction: ApiVariableExpensesEconFunction,
): IVariableExpensesEconFunction | Record<string, unknown> => {
	const productionVariableExpensesResult = {};

	if (isNil(apiVariableExpensesEconFunction)) {
		return productionVariableExpensesResult;
	}

	Object.entries(API_VARIABLE_EXPENSES_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (VariableExpenses: IVariableExpensesEconFunction, value: unknown) => void;
			coercedWrite(
				productionVariableExpensesResult as IVariableExpensesEconFunction,
				apiVariableExpensesEconFunction[field as ApiVariableExpensesEconFunctionKey],
			);
		}
	});
	return productionVariableExpensesResult;
};

export const toApiVariableExpensesEconFunction = (
	VariableExpensesTaxEconFunction: IVariableExpensesEconFunction,
): ApiVariableExpensesEconFunction => {
	const apiVariableExpensesEconFunction: Record<
		string,
		ApiVariableExpensesEconFunction[ApiVariableExpensesEconFunctionKey]
	> = {};
	Object.entries(API_VARIABLE_EXPENSES_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiVariableExpensesEconFunction[field] = read(VariableExpensesTaxEconFunction);
		}
	});
	return apiVariableExpensesEconFunction;
};

export const parseApiVariableExpensesEconFunction = (
	data: unknown,
	location?: string,
): ApiVariableExpensesEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`variableExpenses\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`variableExpenses\` must be an object.`,
			location,
		);
	}

	const productionVariableExpenses: Record<
		string,
		ApiVariableExpensesEconFunction[ApiVariableExpensesEconFunctionKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionVariableExpensesField = getApiVariableExpensesEconFunctionField(field);

				if (!productionVariableExpensesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = productionVariableExpensesField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiVariableExpensesEconFunction[ApiVariableExpensesEconFunctionKey]);

				if (write) {
					productionVariableExpenses[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionVariableExpenses;
};
