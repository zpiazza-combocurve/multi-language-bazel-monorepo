import { camelCase } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IFixedExpensesFields } from '@src/models/econ/expenses';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { API_BASE_EXPENSES_FIELDS } from './expenses-fields';

export type FixedExpensesFieldsField<T> = IField<IFixedExpensesFields, T>;
export type ApiFixedExpensesFieldsKey = keyof typeof API_FIXED_EXPENSES_FIELDS;

type TypeOfField<FT> = FT extends FixedExpensesFieldsField<infer T> ? T : never;

export type ApiFixedExpensesFields = {
	[key in ApiFixedExpensesFieldsKey]?: TypeOfField<(typeof API_FIXED_EXPENSES_FIELDS)[key]>;
};

export const API_FIXED_EXPENSES_FIELDS = {
	stopAtEconLimit: readWriteYesNoDbField<IFixedExpensesFields>('stop_at_econ_limit'),
	expenseBeforeFpd: readWriteYesNoDbField<IFixedExpensesFields>('expense_before_fpd'),
	...API_BASE_EXPENSES_FIELDS,
};

export const getApiFixedExpensesFieldsField = (
	field: string,
): (typeof API_FIXED_EXPENSES_FIELDS)[ApiFixedExpensesFieldsKey] | null =>
	getApiField(field, API_FIXED_EXPENSES_FIELDS);

export const getRequiredFields: ApiFixedExpensesFieldsKey[] = Object.entries(API_FIXED_EXPENSES_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiFixedExpensesFieldsKey);

export const toFixedExpensesFieldsEconFunction = (
	apiFixedExpensesFields: ApiFixedExpensesFields,
): IFixedExpensesFields | Record<string, unknown> => {
	const productionFixedExpensesFieldsResult = {};

	if (isNil(apiFixedExpensesFields)) {
		return productionFixedExpensesFieldsResult;
	}

	Object.entries(API_FIXED_EXPENSES_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (FixedExpensesFields: IFixedExpensesFields, value: unknown) => void;
			coercedWrite(
				productionFixedExpensesFieldsResult as IFixedExpensesFields,
				apiFixedExpensesFields[field as ApiFixedExpensesFieldsKey],
			);
		}
	});
	return productionFixedExpensesFieldsResult;
};

export const toApiFixedExpensesFieldsEconFunction = (
	FixedExpensesFieldsTaxEconFunction: IFixedExpensesFields,
): ApiFixedExpensesFields => {
	const apiFixedExpensesFieldsEconFunction: Record<string, ApiFixedExpensesFields[ApiFixedExpensesFieldsKey]> = {};
	Object.entries(API_FIXED_EXPENSES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiFixedExpensesFieldsEconFunction[field] = read(FixedExpensesFieldsTaxEconFunction);
		}
	});
	return apiFixedExpensesFieldsEconFunction;
};

export const parseApiFixedExpensesFieldsEconFunction = (
	data: unknown,
	key: string,
	location?: string,
): ApiFixedExpensesFields => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const productionFixedExpensesFields: Record<string, ApiFixedExpensesFields[ApiFixedExpensesFieldsKey]> = {};

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
				const productionFixedExpensesFieldsField = getApiFixedExpensesFieldsField(field);

				if (!productionFixedExpensesFieldsField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				if (field === 'rows') {
					validateBaseExpensesFieldsRows(value, fieldPath);
				}

				const { write, parse } = productionFixedExpensesFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFixedExpensesFields[ApiFixedExpensesFieldsKey]);

				if (write) {
					productionFixedExpensesFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionFixedExpensesFields;
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
