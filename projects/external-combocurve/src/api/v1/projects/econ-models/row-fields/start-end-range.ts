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
	oil_rate?: IStartEndRangeField;
	gas_rate?: IStartEndRangeField;
	water_rate?: IStartEndRangeField;
	total_fluid_rate?: IStartEndRangeField;
}

export interface IStartEndRangeField {
	start?: number;
	end?: number;
}
export type ApiStartEndRangeField = {
	start?: number;
	end?: number | string;
};

const startEndDateRangeReadWriteDbField = <K extends keyof IStartEndRangeField, TParsed = IStartEndRangeField[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IStartEndRangeField, K, TParsed>(key, definition, options);

const API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE = {
	start: startEndDateRangeReadWriteDbField('start', NUMBER_FIELD),
	end: startEndDateRangeReadWriteDbField('end', NUMBER_FIELD),
};
type ApiStartEndRangeKey = keyof typeof API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE;

const readStartEndRateRow = (key: string, econFunctionRow: IEconFunctionRow) => {
	if (!key) {
		return;
	}
	const econFunctionValue = get(econFunctionRow, key);

	if (!econFunctionValue) {
		return;
	}

	const apiRowStartEndDateRangeField: Record<string, ApiStartEndRangeField[ApiStartEndRangeKey]> = {};
	Object.entries(API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE).forEach(([field, { read }]) => {
		if (read && econFunctionValue) {
			apiRowStartEndDateRangeField[field] = read(econFunctionValue);
		}
	});

	const { start } = apiRowStartEndDateRangeField;
	return start;
};

const writeStartEndRateRow = (startEndDateRange: ApiStartEndRangeField | undefined) => {
	if (!startEndDateRange) {
		return;
	}
	const apiStartEndRateField: Partial<Record<string, keyof IEconFunctionRow>> = {};
	Object.entries(API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE).forEach(([field, { write }]) => {
		if (write && startEndDateRange) {
			const coercedWrite = write as (dateField: ApiStartEndRangeField, value: unknown) => void;

			coercedWrite(apiStartEndRateField, startEndDateRange[field as ApiStartEndRangeKey]);
		}
	});
	return apiStartEndRateField;
};

export const rowStartEndDateRangeReadWriteDbField = <K extends keyof IStartEndRangeRowFields>(
	key: K,
): IField<IEconFunctionRow, ApiStartEndRangeField | number | undefined> => ({
	type: OpenApiDataType.object,
	parse: (data: unknown, location?: string) => parseApiRowStartEndDateRangeField(data, location),
	read: (x) => readStartEndRateRow(key, x as IEconFunctionRow) as ApiStartEndRangeField | number | undefined,
	write: (s, r) => set(s, [key], writeStartEndRateRow(r as ApiStartEndRangeField)),
});

const getApiRowStartEndDateRangeField = (
	field: string,
): (typeof API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE)[ApiStartEndRangeKey] | null =>
	getApiField(field, API_ECON_FUNCTION_ROW_FIELD_START_END_DATE_RANGE);

const parseApiRowStartEndDateRangeField = (data: unknown, location?: string): ApiStartEndRangeField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid data structure`, location);
	}
	const errorAggregator = new ValidationErrorAggregator();
	const apiRowStartEndDateRange: Record<string, ApiStartEndRangeField[ApiStartEndRangeKey]> = {};
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
						: (value as ApiStartEndRangeField[ApiStartEndRangeKey]);

				if (write) {
					apiRowStartEndDateRange[field] = parsedValue;
				}
				return apiRowStartEndDateRange;
			}),
		);

	errorAggregator.throwAll();

	return apiRowStartEndDateRange;
};
