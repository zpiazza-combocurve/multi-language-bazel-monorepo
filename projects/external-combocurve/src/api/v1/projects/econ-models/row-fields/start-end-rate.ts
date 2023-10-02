import { get, isObject, set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { IEconFunctionRow } from './econ-function-row-fields';

export interface IStartEndRangeRowFields {
	oil_rate?: IStartEndRateField;
	gas_rate?: IStartEndRateField;
	water_rate?: IStartEndRateField;
}

export interface IStartEndRateField {
	start?: number;
	end?: number | string;
}
export type ApiStartEndRateField = {
	start?: number;
	end?: number | string;
};

const startEndRateReadWriteDbField = <K extends keyof IStartEndRateField, TParsed = IStartEndRateField[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IStartEndRateField, K, TParsed>(key, definition, options);

const API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD = {
	start: startEndRateReadWriteDbField('start', NUMBER_FIELD),
	end: startEndRateReadWriteDbField('end', NUMBER_FIELD),
};
type ApiStartEndRateKey = keyof typeof API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD;

const readStartEndRateRow = (key: string, econFunctionRow: IEconFunctionRow) => {
	if (!key) {
		return;
	}
	const econFunctionValue = get(econFunctionRow, key);

	if (!econFunctionValue) {
		return;
	}

	const apiRowStartEndDateRangeField: Record<string, ApiStartEndRateField[ApiStartEndRateKey]> = {};
	Object.entries(API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD).forEach(([field, { read }]) => {
		if (read && econFunctionValue) {
			apiRowStartEndDateRangeField[field] = read(econFunctionValue);
		}
	});

	const { start } = apiRowStartEndDateRangeField;
	return start;
};

const writeStartEndRateRow = (startEndDateRange: ApiStartEndRateField | undefined) => {
	if (!startEndDateRange) {
		return;
	}
	const apiStartEndRateField: Partial<Record<string, keyof IEconFunctionRow>> = {};
	Object.entries(API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD).forEach(([field, { write }]) => {
		if (write && startEndDateRange) {
			const coercedWrite = write as (dateField: ApiStartEndRateField, value: unknown) => void;

			coercedWrite(apiStartEndRateField, startEndDateRange[field as ApiStartEndRateKey]);
		}
	});
	return apiStartEndRateField;
};

export const rowStartEndDateRangeReadWriteDbField = <K extends keyof IEconFunctionRow>(
	key: K,
): IField<IEconFunctionRow, ApiStartEndRateField | number | undefined> => ({
	type: OpenApiDataType.object,
	parse: (data: unknown, location?: string) => parseApiRowStartEndDateRangeField(data, location),
	read: (x) => readStartEndRateRow(key, x as IEconFunctionRow) as ApiStartEndRateField | number | undefined,
	write: (s, r) => set(s, [key], writeStartEndRateRow(r as ApiStartEndRateField)),
});

const getApiRowStartEndDateRangeField = (
	field: string,
): (typeof API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD)[ApiStartEndRateKey] | null =>
	getApiField(field, API_ECON_FUNCTION_START_END_DATE_RATE_ROW_FIELD);

const parseApiRowStartEndDateRangeField = (data: unknown, location?: string): ApiStartEndRateField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid data structure`, location);
	}
	const errorAggregator = new ValidationErrorAggregator();
	const apiRowStartEndDateRange: Record<string, ApiStartEndRateField[ApiStartEndRateKey]> = {};
	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiRowStartEndDateRangeField = getApiRowStartEndDateRangeField(field);

				if (!apiRowStartEndDateRangeField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = apiRowStartEndDateRangeField;

				const parsedValue =
					parse && value !== 'inf'
						? parse(value, fieldPath)
						: (value as ApiStartEndRateField[ApiStartEndRateKey]);

				if (write) {
					apiRowStartEndDateRange[field] = parsedValue;
				}
				return apiRowStartEndDateRange;
			}),
		);

	errorAggregator.throwAll();

	return apiRowStartEndDateRange;
};
