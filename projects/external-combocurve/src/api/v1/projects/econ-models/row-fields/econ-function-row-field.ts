import { isNil, isObject } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiEconFunctionRow, IRowField, rowsReadWriteDbField } from './econ-function-row-fields';

export type IEconFunctionRowField<T> = IField<IRowField, T>;

export const API_ECON_FUNCTION_ROW_FIELD = {
	rows: rowsReadWriteDbField(),
};

export type ApiEconFunctionRowFieldKey = keyof typeof API_ECON_FUNCTION_ROW_FIELD;

type TypeOfField<FT> = FT extends IEconFunctionRowField<infer T> ? T : never;

export type ApiEconFunctionRowField = {
	[key in ApiEconFunctionRowFieldKey]?: TypeOfField<(typeof API_ECON_FUNCTION_ROW_FIELD)[key]>;
};

export const getApiEconFunctionRowField = (
	field: string,
): (typeof API_ECON_FUNCTION_ROW_FIELD)[ApiEconFunctionRowFieldKey] | null =>
	getApiField(field, API_ECON_FUNCTION_ROW_FIELD);

export const getRequiredFields: ApiEconFunctionRowFieldKey[] = Object.entries(API_ECON_FUNCTION_ROW_FIELD)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiEconFunctionRowFieldKey);

export const toEconFunctionRowField = (
	apiEconFunctionRowField: ApiEconFunctionRowField,
): IRowField | Record<string, unknown> => {
	const result = {};

	if (isNil(apiEconFunctionRowField)) {
		return {};
	}

	Object.entries(API_ECON_FUNCTION_ROW_FIELD).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (rowField: IRowField, value: unknown) => void;
			coercedWrite(result as IRowField, apiEconFunctionRowField[field as ApiEconFunctionRowFieldKey]);
		}
	});

	return result;
};

export const toApiEconFunctionRowField = (rowField: IRowField): ApiEconFunctionRowField => {
	const apiEconFunctionRowField: Record<
		string,
		ApiEconFunctionRowField[ApiEconFunctionRowFieldKey] | ApiEconFunctionRow[]
	> = {};
	Object.entries(API_ECON_FUNCTION_ROW_FIELD).forEach(([field, { read }]) => {
		if (read) {
			apiEconFunctionRowField[field] = read(rowField);
		}
	});

	return apiEconFunctionRowField;
};

export const parseEconFunctionRowField = (data: unknown, location?: string): ApiEconFunctionRowField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid risking model rows data structure`, location);
	}

	const riskingEconFunction: Record<string, ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const riskingEconFunctionField = getApiEconFunctionRowField(field);

				if (!riskingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = riskingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]);

				if (write) {
					riskingEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return riskingEconFunction;
};
