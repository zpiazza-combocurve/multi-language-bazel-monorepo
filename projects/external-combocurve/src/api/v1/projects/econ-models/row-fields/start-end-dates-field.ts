import { set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { IEconFunctionRow } from './econ-function-row-fields';

export interface IRowDateField {
	start_date: string;
	end_date: string;
}
export type ApiRowDateField = {
	startDate?: string;
	endDate?: string;
};

const dateReadWriteDbField = <K extends keyof IRowDateField, TParsed = IRowDateField[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IRowDateField, K, TParsed>(key, definition, options);

const API_ECON_FUNCTION_DATE_ROW_FIELD = {
	startDate: dateReadWriteDbField('start_date', STRING_FIELD),
	endDate: dateReadWriteDbField('end_date', STRING_FIELD),
};
type ApiRowDateFieldKey = keyof typeof API_ECON_FUNCTION_DATE_ROW_FIELD;

const readDatesRow = ({ dates }: IEconFunctionRow) => {
	if (!dates) {
		return;
	}
	const apiRowDateField: Record<string, ApiRowDateField[ApiRowDateFieldKey]> = {};
	Object.entries(API_ECON_FUNCTION_DATE_ROW_FIELD).forEach(([field, { read }]) => {
		if (read && dates) {
			apiRowDateField[field] = read(dates);
		}
	});
	const { startDate } = apiRowDateField;
	return startDate;
};

const writeDatesRow = (dates: ApiRowDateField | undefined) => {
	if (!dates) {
		return;
	}
	const apiRowDateField: Partial<Record<string, keyof IEconFunctionRow>> = {};
	Object.entries(API_ECON_FUNCTION_DATE_ROW_FIELD).forEach(([field, { write }]) => {
		if (write && dates) {
			const coercedWrite = write as (dateField: ApiRowDateField, value: unknown) => void;

			coercedWrite(apiRowDateField, dates[field as ApiRowDateFieldKey]);
		}
	});
	return apiRowDateField;
};

const getApiRowOffsetAsOfField = (
	field: string,
): (typeof API_ECON_FUNCTION_DATE_ROW_FIELD)[ApiRowDateFieldKey] | null =>
	getApiField(field, API_ECON_FUNCTION_DATE_ROW_FIELD);

const parseApiRowDateField = (data: unknown, location?: string): ApiRowDateField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid dates data structure`, location);
	}
	const errorAggregator = new ValidationErrorAggregator();
	const apiDatesRow: Record<string, ApiRowDateField[ApiRowDateFieldKey]> = {};
	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiRowOffsetAsOfField = getApiRowOffsetAsOfField(field);

				if (!apiRowOffsetAsOfField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = apiRowOffsetAsOfField;

				const parsedValue =
					parse && value !== 'Econ Limit'
						? parse(value, fieldPath)
						: (value as ApiRowDateField[ApiRowDateFieldKey]);

				if (write) {
					apiDatesRow[field] = parsedValue as ApiRowDateField[ApiRowDateFieldKey];
				}
				return apiDatesRow;
			}),
		);

	errorAggregator.throwAll();

	return apiDatesRow;
};

export const rowDateReadWriteDbField = (): IField<IEconFunctionRow, ApiRowDateField | string | undefined> => ({
	type: OpenApiDataType.object,
	parse: (data, location?: string) => parseApiRowDateField(data, location),
	read: readDatesRow,
	write: (s, r) => r && set(s, ['dates'], writeDatesRow(r as ApiRowDateField)),
});
