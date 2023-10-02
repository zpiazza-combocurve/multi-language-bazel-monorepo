import { camelCase, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IVariableExpensesPhase } from '@src/models/econ/expenses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import {
	API_BASE_EXPENSES_FIELDS,
	ApiExpensesFields,
	parseApiExpensesFieldsEconFunction,
	toApiExpensesFieldsEconFunction,
	toExpensesFieldsEconFunction,
} from './expenses-fields';

export type VariableExpensesNotShrinkageField<T> = IField<IVariableExpensesPhase, T>;
export type ApiVariableExpensesNotShrinkagePhaseKey = keyof typeof API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE;

type TypeOfField<FT> = FT extends VariableExpensesNotShrinkageField<infer T> ? T : never;

export type ApiVariableExpensesNotShrinkagePhase = {
	[key in ApiVariableExpensesNotShrinkagePhaseKey]?: TypeOfField<
		(typeof API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE)[key]
	>;
};

const variableExpensesNotShrinkagePhaseReadWriteDbField = <K extends keyof IVariableExpensesPhase>(
	key: K,
): VariableExpensesNotShrinkageField<ApiExpensesFields> => ({
	type: OpenApiDataType.object,
	properties: API_BASE_EXPENSES_FIELDS,
	read: (variableExpensePhase) => toApiExpensesFieldsEconFunction(variableExpensePhase[key]),
	parse: (value, location) => parseApiExpensesFieldsEconFunction(value, key, location),
	write: (carbonExpense, value) => set(carbonExpense, key, toExpensesFieldsEconFunction(value)),
});

export const API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE = {
	gathering: variableExpensesNotShrinkagePhaseReadWriteDbField('gathering'),
	marketing: variableExpensesNotShrinkagePhaseReadWriteDbField('marketing'),
	transportation: variableExpensesNotShrinkagePhaseReadWriteDbField('transportation'),
	processing: variableExpensesNotShrinkagePhaseReadWriteDbField('processing'),
	other: variableExpensesNotShrinkagePhaseReadWriteDbField('other'),
};

export const getApiVariableExpensesNotShrinkagePhaseField = (
	field: string,
): (typeof API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE)[ApiVariableExpensesNotShrinkagePhaseKey] | null =>
	getApiField(field, API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE);

export const getRequiredFields: ApiVariableExpensesNotShrinkagePhaseKey[] = Object.entries(
	API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiVariableExpensesNotShrinkagePhaseKey);

export const toVariableExpensesNotShrinkagePhase = (
	apiVariableExpensesNotShrinkagePhase: ApiVariableExpensesNotShrinkagePhase,
): IVariableExpensesPhase | Record<string, unknown> => {
	const productionVariableExpensesNotShrinkagePhaseResult = {};

	if (isNil(apiVariableExpensesNotShrinkagePhase)) {
		return productionVariableExpensesNotShrinkagePhaseResult;
	}

	Object.entries(API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				VariableExpensesNotShrinkagePhase: IVariableExpensesPhase,
				value: unknown,
			) => void;
			coercedWrite(
				productionVariableExpensesNotShrinkagePhaseResult as IVariableExpensesPhase,
				apiVariableExpensesNotShrinkagePhase[field as ApiVariableExpensesNotShrinkagePhaseKey],
			);
		}
	});
	return productionVariableExpensesNotShrinkagePhaseResult;
};

export const toApiVariableExpensesNotShrinkageNotShrinkagePhase = (
	VariableExpensesNotShrinkagePhaseTaxEconFunction: IVariableExpensesPhase,
): ApiVariableExpensesNotShrinkagePhase => {
	const apiVariableExpensesNotShrinkagePhase: Record<
		string,
		ApiVariableExpensesNotShrinkagePhase[ApiVariableExpensesNotShrinkagePhaseKey]
	> = {};
	Object.entries(API_VARIABLE_EXPENSES_PHASES_NOT_SHRINKAGE).forEach(([field, { read }]) => {
		if (read) {
			apiVariableExpensesNotShrinkagePhase[field] = read(VariableExpensesNotShrinkagePhaseTaxEconFunction);
		}
	});
	return apiVariableExpensesNotShrinkagePhase;
};

export const parseApiVariableExpensesNotShrinkagePhase = (
	data: unknown,
	key: string,
	location?: string,
): ApiVariableExpensesNotShrinkagePhase => {
	if (!isObject(data)) {
		key = camelCase(key);
		throw new RequestStructureError(
			`Invalid value for \`${key}\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`${key}\` must be an object.`,
			location,
		);
	}

	const productionVariableExpensesNotShrinkagePhase: Record<
		string,
		ApiVariableExpensesNotShrinkagePhase[ApiVariableExpensesNotShrinkagePhaseKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionVariableExpensesNotShrinkagePhaseField =
					getApiVariableExpensesNotShrinkagePhaseField(field);

				if (!productionVariableExpensesNotShrinkagePhaseField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = productionVariableExpensesNotShrinkagePhaseField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiVariableExpensesNotShrinkagePhase[ApiVariableExpensesNotShrinkagePhaseKey]);

				if (write) {
					productionVariableExpensesNotShrinkagePhase[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionVariableExpensesNotShrinkagePhase;
};
