import { set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { IFixedExpensesEconFunction, IFixedExpensesFields } from '@src/models/econ/expenses';
import { isNil, notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import {
	API_FIXED_EXPENSES_FIELDS,
	ApiFixedExpensesFields,
	parseApiFixedExpensesFieldsEconFunction,
	toApiFixedExpensesFieldsEconFunction,
	toFixedExpensesFieldsEconFunction,
} from './fixed-expenses-fields';

export type FixedExpensesEconFunctionField<T> = IField<IFixedExpensesEconFunction, T>;
export type ApiFixedExpensesEconFunctionKey = keyof typeof API_FIXED_EXPENSES_ECON_FUNCTION;

type TypeOfField<FT> = FT extends FixedExpensesEconFunctionField<infer T> ? T : never;

export type ApiFixedExpensesEconFunction = {
	[key in ApiFixedExpensesEconFunctionKey]?: TypeOfField<(typeof API_FIXED_EXPENSES_ECON_FUNCTION)[key]>;
};

const fixedExpensesEconFunctionReadWriteDbField = <K extends keyof IFixedExpensesEconFunction>(
	key: K,
): FixedExpensesEconFunctionField<ApiFixedExpensesFields> => ({
	type: OpenApiDataType.object,
	properties: API_FIXED_EXPENSES_FIELDS,
	read: (fixedExpenseEconFunction) =>
		toApiFixedExpensesFieldsEconFunction(fixedExpenseEconFunction[key] as IFixedExpensesFields),
	parse: (value, location) => parseApiFixedExpensesFieldsEconFunction(value, key, location),
	write: (fixedExpenseEconFunction, value) =>
		set(fixedExpenseEconFunction, key, toFixedExpensesFieldsEconFunction(value)),
});

export const API_FIXED_EXPENSES_ECON_FUNCTION = {
	monthlyWellCost: fixedExpensesEconFunctionReadWriteDbField('monthly_well_cost'),
	otherMonthlyCost1: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_1'),
	otherMonthlyCost2: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_2'),
	otherMonthlyCost3: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_3'),
	otherMonthlyCost4: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_4'),
	otherMonthlyCost5: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_5'),
	otherMonthlyCost6: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_6'),
	otherMonthlyCost7: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_7'),
	otherMonthlyCost8: fixedExpensesEconFunctionReadWriteDbField('other_monthly_cost_8'),
};

export const getApiFixedExpensesEconFunctionField = (
	field: string,
): (typeof API_FIXED_EXPENSES_ECON_FUNCTION)[ApiFixedExpensesEconFunctionKey] | null =>
	getApiField(field, API_FIXED_EXPENSES_ECON_FUNCTION);

export const getRequiredFields: ApiFixedExpensesEconFunctionKey[] = Object.entries(API_FIXED_EXPENSES_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiFixedExpensesEconFunctionKey);

export const toFixedExpensesEconFunction = (
	apiFixedExpensesEconFunction: ApiFixedExpensesEconFunction,
): IFixedExpensesEconFunction | Record<string, unknown> => {
	const productionFixedExpensesResult = {};

	if (isNil(apiFixedExpensesEconFunction)) {
		return productionFixedExpensesResult;
	}

	Object.entries(API_FIXED_EXPENSES_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (FixedExpenses: IFixedExpensesEconFunction, value: unknown) => void;
			coercedWrite(
				productionFixedExpensesResult as IFixedExpensesEconFunction,
				apiFixedExpensesEconFunction[field as ApiFixedExpensesEconFunctionKey],
			);
		}
	});
	return productionFixedExpensesResult;
};

export const toApiFixedExpensesEconFunction = (
	FixedExpensesTaxEconFunction: IFixedExpensesEconFunction,
): ApiFixedExpensesEconFunction => {
	const apiFixedExpensesEconFunction: Record<string, ApiFixedExpensesEconFunction[ApiFixedExpensesEconFunctionKey]> =
		{};
	Object.entries(API_FIXED_EXPENSES_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiFixedExpensesEconFunction[field] = read(FixedExpensesTaxEconFunction);
		}
	});
	return apiFixedExpensesEconFunction;
};

export const parseApiFixedExpensesEconFunction = (data: unknown, location?: string): ApiFixedExpensesEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`fixedExpenses\`: \`${(
				data as string | undefined
			)?.toString()}\`. \`fixedExpenses\` must be an object.`,
			location,
		);
	}

	const productionFixedExpenses: Record<string, ApiFixedExpensesEconFunction[ApiFixedExpensesEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionFixedExpensesField = getApiFixedExpensesEconFunctionField(field);

				if (!productionFixedExpensesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = productionFixedExpensesField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFixedExpensesEconFunction[ApiFixedExpensesEconFunctionKey]);

				if (write) {
					productionFixedExpenses[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionFixedExpenses;
};
