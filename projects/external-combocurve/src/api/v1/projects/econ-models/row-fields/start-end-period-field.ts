import { get, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { IEconFunctionRow } from './econ-function-row-fields';

export interface IRowOffsetAsOfField {
	start: number;
	end: number;
	period: number;
}
export type ApiRowOffsetAsOfField = {
	start?: number;
	end?: number;
	period?: number;
};

const monthPeriodReadWriteDbField = <K extends keyof IRowOffsetAsOfField, TParsed = IRowOffsetAsOfField[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IRowOffsetAsOfField, K, TParsed>(key, definition, options);

const API_ECON_FUNCTION_ROW_FIELD_AS_OF = {
	start: monthPeriodReadWriteDbField('start', NUMBER_FIELD),
	end: monthPeriodReadWriteDbField('end', NUMBER_FIELD),
	period: monthPeriodReadWriteDbField('period', NUMBER_FIELD),
};
type ApiRowOffsetAsOfFieldKey = keyof typeof API_ECON_FUNCTION_ROW_FIELD_AS_OF;

const readOffsetAsOfRow = (key: string, econFunctionRow: IEconFunctionRow) => {
	if (!key) {
		return;
	}
	const econFunctionValue = get(econFunctionRow, key);

	if (!econFunctionValue) {
		return;
	}

	const apiRowMonthPeriodField: Record<string, ApiRowOffsetAsOfField[ApiRowOffsetAsOfFieldKey]> = {};
	Object.entries(API_ECON_FUNCTION_ROW_FIELD_AS_OF).forEach(([field, { read }]) => {
		if (read && econFunctionValue) {
			apiRowMonthPeriodField[field] = read(econFunctionValue);
		}
	});
	const { period } = apiRowMonthPeriodField;
	return period;
};

const writeOffsetAsOfRow = (apiRowOffsetAsOfField: ApiRowOffsetAsOfField | undefined) => {
	if (!apiRowOffsetAsOfField) {
		return;
	}
	const apiRowMonthPeriodField: Partial<Record<string, keyof IEconFunctionRow>> = {};
	Object.entries(API_ECON_FUNCTION_ROW_FIELD_AS_OF).forEach(([field, { write }]) => {
		if (write && apiRowOffsetAsOfField) {
			const coercedWrite = write as (dateField: ApiRowOffsetAsOfField, value: unknown) => void;

			coercedWrite(apiRowMonthPeriodField, apiRowOffsetAsOfField[field as ApiRowOffsetAsOfFieldKey]);
		}
	});
	return apiRowMonthPeriodField;
};

export const rowOffsetReadWriteDbField = <K extends keyof IEconFunctionRow>(
	key: K,
): IField<IEconFunctionRow, ApiRowOffsetAsOfField | number | undefined> => ({
	type: OpenApiDataType.object,
	parse: (data: unknown, location?: string) => parseApiRowOffsetAsOfField(data, location),
	read: (x) => readOffsetAsOfRow(key, x),
	write: (s, r) => r && set(s, [key], writeOffsetAsOfRow(r as ApiRowOffsetAsOfField)),
});

const getApiRowOffsetAsOfField = (
	field: string,
): (typeof API_ECON_FUNCTION_ROW_FIELD_AS_OF)[ApiRowOffsetAsOfFieldKey] | null =>
	getApiField(field, API_ECON_FUNCTION_ROW_FIELD_AS_OF);

const parseApiRowOffsetAsOfField = (data: unknown, location?: string): ApiRowOffsetAsOfField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid data structure`, location);
	}
	const errorAggregator = new ValidationErrorAggregator();
	const apiRowOffsetAsOf: Record<string, ApiRowOffsetAsOfField[ApiRowOffsetAsOfFieldKey]> = {};
	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiRowMonthPeriodField = getApiRowOffsetAsOfField(field);

				if (!apiRowMonthPeriodField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = apiRowMonthPeriodField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiRowOffsetAsOfField[ApiRowOffsetAsOfFieldKey]);

				if (write) {
					apiRowOffsetAsOf[field] = parsedValue;
				}
				return apiRowOffsetAsOf;
			}),
		);

	errorAggregator.throwAll();

	return apiRowOffsetAsOf;
};
