import { camelCase } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IExpensesFields } from '@src/models/econ/expenses';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../../validation';
import { readWriteNullableNumberDbField, readWriteYesNoDbField } from '../../fields';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

export type VariableExpensesField<T> = IField<IExpensesFields, T>;
export type ApiExpensesFieldsKey = keyof typeof API_BASE_EXPENSES_FIELDS;

type TypeOfField<FT> = FT extends VariableExpensesField<infer T> ? T : never;

export type ApiExpensesFields = {
	[key in ApiExpensesFieldsKey]?: TypeOfField<(typeof API_BASE_EXPENSES_FIELDS)[key]>;
};

const expensesFieldsReadWriteDbField = <K extends keyof IExpensesFields, TParsed = IExpensesFields[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IExpensesFields, K, TParsed>(key, definition, options);

export const API_BASE_EXPENSES_FIELDS = {
	description: expensesFieldsReadWriteDbField('description', STRING_FIELD),
	escalationModel: expensesFieldsReadWriteDbField('escalation_model', STRING_FIELD),
	calculation: expensesFieldsReadWriteDbField('calculation', STRING_FIELD),
	affectEconLimit: readWriteYesNoDbField<IExpensesFields>('affect_econ_limit'),
	deductBeforeSeveranceTax: readWriteYesNoDbField<IExpensesFields>('deduct_before_severance_tax'),
	deductBeforeAdValTax: readWriteYesNoDbField<IExpensesFields>('deduct_before_ad_val_tax'),
	cap: readWriteNullableNumberDbField('cap'),
	dealTerms: expensesFieldsReadWriteDbField('deal_terms', NUMBER_FIELD),
	rateType: expensesFieldsReadWriteDbField('rate_type', STRING_FIELD),
	rowsCalculationMethod: expensesFieldsReadWriteDbField('rows_calculation_method', STRING_FIELD),
	rows: rowsReadWriteDbField(),
};

export const getApiExpensesFieldsField = (
	field: string,
): (typeof API_BASE_EXPENSES_FIELDS)[ApiExpensesFieldsKey] | null => getApiField(field, API_BASE_EXPENSES_FIELDS);

export const getRequiredFields: ApiExpensesFieldsKey[] = Object.entries(API_BASE_EXPENSES_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiExpensesFieldsKey);

export const toExpensesFieldsEconFunction = (
	apiExpensesFields: ApiExpensesFields,
): IExpensesFields | Record<string, unknown> => {
	const productionExpensesFieldsResult = {};

	if (isNil(apiExpensesFields)) {
		return productionExpensesFieldsResult;
	}

	Object.entries(API_BASE_EXPENSES_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (ExpensesFields: IExpensesFields, value: unknown) => void;
			coercedWrite(
				productionExpensesFieldsResult as IExpensesFields,
				apiExpensesFields[field as ApiExpensesFieldsKey],
			);
		}
	});
	return productionExpensesFieldsResult;
};

export const toApiExpensesFieldsEconFunction = (ExpensesFieldsTaxEconFunction: IExpensesFields): ApiExpensesFields => {
	const apiExpensesFieldsEconFunction: Record<string, ApiExpensesFields[ApiExpensesFieldsKey]> = {};
	Object.entries(API_BASE_EXPENSES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiExpensesFieldsEconFunction[field] = read(ExpensesFieldsTaxEconFunction);
		}
	});
	return apiExpensesFieldsEconFunction;
};

export const parseApiExpensesFieldsEconFunction = (
	data: unknown,
	key: string,
	location?: string,
): ApiExpensesFields => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}
	// setting these property default value bc is needed in flex_cc
	if (data.description === undefined) {
		data.description = '';
	}
	const productionExpensesFields: Record<string, ApiExpensesFields[ApiExpensesFieldsKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionExpensesFieldsField = getApiExpensesFieldsField(field);

				if (!productionExpensesFieldsField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				if (field === 'rows') {
					validateBaseExpensesFieldsRows(value, fieldPath);
				}
				const { write, parse } = productionExpensesFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiExpensesFields[ApiExpensesFieldsKey]);

				if (write) {
					productionExpensesFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionExpensesFields;
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
