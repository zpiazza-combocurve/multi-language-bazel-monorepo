import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IVariableExpensesPhaseFields } from '@src/models/econ/expenses';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { API_BASE_EXPENSES_FIELDS } from './expenses-fields';

export type VariableExpensesPhaseFieldsField<T> = IField<IVariableExpensesPhaseFields, T>;
export type ApiVariableExpensesPhaseFieldsKey = keyof typeof API_VARIABLE_EXPENSES_PHASE_FIELDS;

type TypeOfField<FT> = FT extends VariableExpensesPhaseFieldsField<infer T> ? T : never;

export type ApiVariableExpensesPhaseFields = {
	[key in ApiVariableExpensesPhaseFieldsKey]?: TypeOfField<(typeof API_VARIABLE_EXPENSES_PHASE_FIELDS)[key]>;
};

const variableExpensesPhaseFieldsReadWriteDbField = <
	K extends keyof IVariableExpensesPhaseFields,
	TParsed = IVariableExpensesPhaseFields[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IVariableExpensesPhaseFields, K, TParsed>(key, definition, options);

export const API_VARIABLE_EXPENSES_PHASE_FIELDS = {
	shrinkageCondition: variableExpensesPhaseFieldsReadWriteDbField('shrinkage_condition', STRING_FIELD),
	...API_BASE_EXPENSES_FIELDS,
};

export const getApiVariableExpensesPhaseFieldsField = (
	field: string,
): (typeof API_VARIABLE_EXPENSES_PHASE_FIELDS)[ApiVariableExpensesPhaseFieldsKey] | null =>
	getApiField(field, API_VARIABLE_EXPENSES_PHASE_FIELDS);

export const getRequiredFields: ApiVariableExpensesPhaseFieldsKey[] = Object.entries(API_VARIABLE_EXPENSES_PHASE_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiVariableExpensesPhaseFieldsKey);

export const toVariableExpensesPhaseFieldsEconFunction = (
	apiVariableExpensesPhaseFields: ApiVariableExpensesPhaseFields,
): IVariableExpensesPhaseFields | Record<string, unknown> => {
	const productionVariableExpensesPhaseFieldsResult = {};

	if (isNil(apiVariableExpensesPhaseFields)) {
		return productionVariableExpensesPhaseFieldsResult;
	}

	Object.entries(API_VARIABLE_EXPENSES_PHASE_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				VariableExpensesPhaseFields: IVariableExpensesPhaseFields,
				value: unknown,
			) => void;
			coercedWrite(
				productionVariableExpensesPhaseFieldsResult as IVariableExpensesPhaseFields,
				apiVariableExpensesPhaseFields[field as ApiVariableExpensesPhaseFieldsKey],
			);
		}
	});
	return productionVariableExpensesPhaseFieldsResult;
};

export const toApiVariableExpensesPhaseFieldsEconFunction = (
	VariableExpensesPhaseFieldsTaxEconFunction: IVariableExpensesPhaseFields,
): ApiVariableExpensesPhaseFields => {
	const apiVariableExpensesPhaseFieldsEconFunction: Record<
		string,
		ApiVariableExpensesPhaseFields[ApiVariableExpensesPhaseFieldsKey]
	> = {};
	Object.entries(API_VARIABLE_EXPENSES_PHASE_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiVariableExpensesPhaseFieldsEconFunction[field] = read(VariableExpensesPhaseFieldsTaxEconFunction);
		}
	});
	return apiVariableExpensesPhaseFieldsEconFunction;
};

export const parseApiVariableExpensesPhaseFieldsEconFunction = (
	data: unknown,
	key: string,
	location?: string,
): ApiVariableExpensesPhaseFields => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${key}\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`${key}\` must be an object.`,
			location,
		);
	}

	const productionVariableExpensesPhaseFields: Record<
		string,
		ApiVariableExpensesPhaseFields[ApiVariableExpensesPhaseFieldsKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	// setting these property default value bc is needed in flex_cc
	if (data.description === undefined) {
		data.description = '';
	}

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionVariableExpensesPhaseFieldsField = getApiVariableExpensesPhaseFieldsField(field);

				if (!productionVariableExpensesPhaseFieldsField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateBaseExpensesFieldsRows(value, fieldPath);
				}

				const { write, parse } = productionVariableExpensesPhaseFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiVariableExpensesPhaseFields[ApiVariableExpensesPhaseFieldsKey]);

				if (write) {
					productionVariableExpensesPhaseFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionVariableExpensesPhaseFields;
};

export const getEconFunctionsRowTypesGenerators = (): [
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndRateCriteria,
	typeof GenerateStartEndDatesCriteria,
	typeof GenerateFlatRowCriteria,
] => {
	return [
		GenerateStartEndPeriodCriteria,
		GenerateStartEndRateCriteria,
		GenerateStartEndDatesCriteria,
		GenerateFlatRowCriteria,
	];
};

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];
	return getMatchingValidationFunction(firstRow, getEconFunctionsRowTypesGenerators);
};

export const validateBaseExpensesFieldsRows = (rows: unknown, location: string): void => {
	const errorAggregator = new ValidationErrorAggregator();

	errorAggregator.catch(() => {
		if (!Array.isArray(rows)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		const areRowsObject = rows.map(isObject);
		if (areRowsObject.some((isObject) => !isObject)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		const validateRowsFunction = getRowsValidation(rows);

		for (const rowProperty of validateRowsFunction) {
			errorAggregator.catch(() => {
				rowProperty.validateRows({
					rows,
					location,
				});
			});
		}
	});

	errorAggregator.throwAll();
};
