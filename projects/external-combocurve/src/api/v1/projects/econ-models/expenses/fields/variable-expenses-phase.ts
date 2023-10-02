import { set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IVariableExpensesPhase, IVariableExpensesPhaseFields } from '@src/models/econ/expenses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import {
	API_VARIABLE_EXPENSES_PHASE_FIELDS,
	ApiVariableExpensesPhaseFields,
	parseApiVariableExpensesPhaseFieldsEconFunction,
	toApiVariableExpensesPhaseFieldsEconFunction,
	toVariableExpensesPhaseFieldsEconFunction,
} from './variable-expenses-phase-fields';

export type VariableExpensesField<T> = IField<IVariableExpensesPhase, T>;
export type ApiVariableExpensesPhaseKey = keyof typeof API_VARIABLE_EXPENSES_PHASES;

type TypeOfField<FT> = FT extends VariableExpensesField<infer T> ? T : never;

export type ApiVariableExpensesPhase = {
	[key in ApiVariableExpensesPhaseKey]?: TypeOfField<(typeof API_VARIABLE_EXPENSES_PHASES)[key]>;
};

const variableExpensesPhaseReadWriteDbField = <K extends keyof IVariableExpensesPhase>(
	key: K,
): VariableExpensesField<ApiVariableExpensesPhaseFields> => ({
	type: OpenApiDataType.object,
	properties: API_VARIABLE_EXPENSES_PHASE_FIELDS,
	read: (variableExpensePhase) =>
		toApiVariableExpensesPhaseFieldsEconFunction(variableExpensePhase[key] as IVariableExpensesPhaseFields),
	parse: (variableExpensePhase, location) =>
		parseApiVariableExpensesPhaseFieldsEconFunction(variableExpensePhase, key, location),
	write: (variableExpensePhase, value) =>
		set(variableExpensePhase, key, toVariableExpensesPhaseFieldsEconFunction(value)),
});

export const API_VARIABLE_EXPENSES_PHASES = {
	gathering: variableExpensesPhaseReadWriteDbField('gathering'),
	marketing: variableExpensesPhaseReadWriteDbField('marketing'),
	transportation: variableExpensesPhaseReadWriteDbField('transportation'),
	processing: variableExpensesPhaseReadWriteDbField('processing'),
	other: variableExpensesPhaseReadWriteDbField('other'),
};

export const getApiVariableExpensesPhaseField = (
	field: string,
): (typeof API_VARIABLE_EXPENSES_PHASES)[ApiVariableExpensesPhaseKey] | null =>
	getApiField(field, API_VARIABLE_EXPENSES_PHASES);

export const getRequiredFields: ApiVariableExpensesPhaseKey[] = Object.entries(API_VARIABLE_EXPENSES_PHASES)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiVariableExpensesPhaseKey);

export const toVariableExpensesPhase = (
	apiVariableExpensesPhase: ApiVariableExpensesPhase,
): IVariableExpensesPhase | Record<string, unknown> => {
	const productionVariableExpensesPhaseResult = {};

	if (isNil(apiVariableExpensesPhase)) {
		return productionVariableExpensesPhaseResult;
	}

	Object.entries(API_VARIABLE_EXPENSES_PHASES).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (VariableExpensesPhase: IVariableExpensesPhase, value: unknown) => void;
			coercedWrite(
				productionVariableExpensesPhaseResult as IVariableExpensesPhase,
				apiVariableExpensesPhase[field as ApiVariableExpensesPhaseKey],
			);
		}
	});
	return productionVariableExpensesPhaseResult;
};

export const toApiVariableExpensesPhase = (
	VariableExpensesPhaseTaxEconFunction: IVariableExpensesPhase,
): ApiVariableExpensesPhase => {
	const apiVariableExpensesPhase: Record<string, ApiVariableExpensesPhase[ApiVariableExpensesPhaseKey]> = {};
	Object.entries(API_VARIABLE_EXPENSES_PHASES).forEach(([field, { read }]) => {
		if (read) {
			apiVariableExpensesPhase[field] = read(VariableExpensesPhaseTaxEconFunction);
		}
	});
	return apiVariableExpensesPhase;
};

export const parseApiVariableExpensesPhase = (
	data: unknown,
	key: string,
	location?: string,
): ApiVariableExpensesPhase => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${key}\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`${key}\` must be an object.`,
			location,
		);
	}

	const productionVariableExpensesPhase: Record<string, ApiVariableExpensesPhase[ApiVariableExpensesPhaseKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionVariableExpensesPhaseField = getApiVariableExpensesPhaseField(field);

				if (!productionVariableExpensesPhaseField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = productionVariableExpensesPhaseField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiVariableExpensesPhase[ApiVariableExpensesPhaseKey]);

				if (write) {
					productionVariableExpensesPhase[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionVariableExpensesPhase;
};
