import { set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { ICarbonExpensesEconFunction, IExpensesFields } from '@src/models/econ/expenses';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import {
	ApiExpensesFields,
	parseApiExpensesFieldsEconFunction,
	toApiExpensesFieldsEconFunction,
	toExpensesFieldsEconFunction,
} from './expenses-fields';

export type CarbonExpensesEconFunctionField<T> = IField<ICarbonExpensesEconFunction, T>;
export type ApiCarbonExpensesEconFunctionKey = keyof typeof API_CARBON_EXPENSES_ECON_FUNCTION;

type TypeOfField<FT> = FT extends CarbonExpensesEconFunctionField<infer T> ? T : never;

export type ApiCarbonExpensesEconFunction = {
	[key in ApiCarbonExpensesEconFunctionKey]?: TypeOfField<(typeof API_CARBON_EXPENSES_ECON_FUNCTION)[key]>;
};

const carbonExpensesEconFunctionReadWriteDbField = <
	K extends keyof ICarbonExpensesEconFunction,
	TParsed = ICarbonExpensesEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ICarbonExpensesEconFunction, K, TParsed>(key, definition, options);

const carbonExpenseReadWriteDbField = <K extends keyof ICarbonExpensesEconFunction>(
	key: K,
): CarbonExpensesEconFunctionField<ApiExpensesFields> => ({
	type: OpenApiDataType.object,
	read: (carbonExpense) => toApiExpensesFieldsEconFunction(carbonExpense[key] as IExpensesFields),
	parse: (value, location) => parseApiExpensesFieldsEconFunction(value, key, location),
	write: (carbonExpense, value) => set(carbonExpense, key, toExpensesFieldsEconFunction(value)),
});

export const API_CARBON_EXPENSES_ECON_FUNCTION = {
	category: carbonExpensesEconFunctionReadWriteDbField('category', STRING_FIELD),
	ch4: carbonExpenseReadWriteDbField('ch4'),
	co2: carbonExpenseReadWriteDbField('co2'),
	co2E: carbonExpenseReadWriteDbField('co2e'),
	n2O: carbonExpenseReadWriteDbField('n2o'),
};

export const getApiCarbonExpensesEconFunctionField = (
	field: string,
): (typeof API_CARBON_EXPENSES_ECON_FUNCTION)[ApiCarbonExpensesEconFunctionKey] | null =>
	getApiField(field, API_CARBON_EXPENSES_ECON_FUNCTION);

export const getRequiredFields: ApiCarbonExpensesEconFunctionKey[] = Object.entries(API_CARBON_EXPENSES_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiCarbonExpensesEconFunctionKey);

export const toCarbonExpensesEconFunction = (
	apiCarbonExpensesEconFunction: ApiCarbonExpensesEconFunction,
): ICarbonExpensesEconFunction | Record<string, unknown> => {
	const productionCarbonExpensesResult = {};

	if (isNil(apiCarbonExpensesEconFunction)) {
		return productionCarbonExpensesResult;
	}

	Object.entries(API_CARBON_EXPENSES_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (CarbonExpenses: ICarbonExpensesEconFunction, value: unknown) => void;
			coercedWrite(
				productionCarbonExpensesResult as ICarbonExpensesEconFunction,
				apiCarbonExpensesEconFunction[field as ApiCarbonExpensesEconFunctionKey],
			);
		}
	});
	return productionCarbonExpensesResult;
};

export const toApiCarbonExpensesEconFunction = (
	CarbonExpensesTaxEconFunction: ICarbonExpensesEconFunction,
): ApiCarbonExpensesEconFunction => {
	const apiCarbonExpensesEconFunction: Record<
		string,
		ApiCarbonExpensesEconFunction[ApiCarbonExpensesEconFunctionKey]
	> = {};
	Object.entries(API_CARBON_EXPENSES_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiCarbonExpensesEconFunction[field] = read(CarbonExpensesTaxEconFunction);
		}
	});
	return apiCarbonExpensesEconFunction;
};

export const parseApiCarbonExpensesEconFunction = (data: unknown, location?: string): ApiCarbonExpensesEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`carbonExpenses\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`carbonExpenses\` must be an object.`,
			location,
		);
	}

	const productionCarbonExpenses: Record<string, ApiCarbonExpensesEconFunction[ApiCarbonExpensesEconFunctionKey]> =
		{};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionCarbonExpensesField = getApiCarbonExpensesEconFunctionField(field);

				if (!productionCarbonExpensesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = productionCarbonExpensesField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiCarbonExpensesEconFunction[ApiCarbonExpensesEconFunctionKey]);

				if (write) {
					productionCarbonExpenses[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionCarbonExpenses;
};
