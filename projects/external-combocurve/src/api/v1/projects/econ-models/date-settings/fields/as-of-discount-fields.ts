import { get, isNil, set } from 'lodash';

import { BOOLEAN_FIELD, IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IDateSettingDiscountOrAsOf, IDynamicDiscountDate } from '@src/models/econ/date-settings';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { DateSettingEconFunctionField } from './date-settings-econ-function';

export type AsOfDateOrDiscountDateField<T> = IField<IDateSettingDiscountOrAsOf, T>;

const dynamicFieldUIValues: Record<string, IDynamicDiscountDate> = {
	first_of_next_month: {
		label: 'First of Next Month',
		value: 'first_of_next_month',
	},
	first_of_next_year: {
		label: 'First of Next Year',
		value: 'first_of_next_year',
	},
};

const asOfDiscountWriteDbField = <K extends keyof IDateSettingDiscountOrAsOf, TParsed = IDateSettingDiscountOrAsOf[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDateSettingDiscountOrAsOf, K, TParsed>(key, definition, options);

const dynamicField = asOfDiscountWriteDbField('dynamic', STRING_FIELD);
dynamicField.read = (dat) => {
	if (!dat.dynamic) {
		return;
	} else if (typeof dat.dynamic === 'string') {
		return dat.dynamic;
	} else if (typeof dat.dynamic === 'object') {
		return dat.dynamic.value;
	}
};

dynamicField.write = (t, value) => {
	if (typeof value === 'string') {
		t.dynamic = dynamicFieldUIValues[value];
	}
};

const emptyValueFieldWrapper = <K extends keyof IDateSettingDiscountOrAsOf>(key: K) => {
	const baseFieldDefinition = asOfDiscountWriteDbField(key, BOOLEAN_FIELD);
	baseFieldDefinition.read = (value) => {
		if (value[key] !== undefined) {
			return true;
		}
		return;
	};

	baseFieldDefinition.write = (object, value) => {
		if (value !== undefined) {
			object[key] = '';
		}
	};
	return baseFieldDefinition;
};

export const API_AS_OF_DISCOUNT_FIELDS = {
	date: asOfDiscountWriteDbField('date', STRING_FIELD),
	dynamic: dynamicField,
	fpd: emptyValueFieldWrapper('fpd'),
	majorSegment: emptyValueFieldWrapper('maj_seg'),
};

export type ApiAsOfDateOrDiscountDateKey = keyof typeof API_AS_OF_DISCOUNT_FIELDS;

type TypeOfAsOfDateOrDiscountDateField<FT> = FT extends AsOfDateOrDiscountDateField<infer T> ? T : never;

export type ApiAsOfDateOrDiscountDate = {
	[key in ApiAsOfDateOrDiscountDateKey]?: TypeOfAsOfDateOrDiscountDateField<(typeof API_AS_OF_DISCOUNT_FIELDS)[key]>;
};

export const asOfOrDiscountField = (key: string): DateSettingEconFunctionField<ApiAsOfDateOrDiscountDate> => ({
	type: OpenApiDataType.object,
	properties: API_AS_OF_DISCOUNT_FIELDS,
	read: (dateSettingEconFunction) => toApiAsOfDateOrDiscountDate(get(dateSettingEconFunction, [key])),
	write: (dateSettingEconFunction, value) => set(dateSettingEconFunction, [key], toAsOfDateOrDiscountDate(value)),
	parse: (data, location) => parseApiAsOfDateOrDiscountDate(data, location),
});

export const getApiAsOfDateOrDiscountDate = (
	field: string,
): (typeof API_AS_OF_DISCOUNT_FIELDS)[ApiAsOfDateOrDiscountDateKey] | null =>
	getApiField(field, API_AS_OF_DISCOUNT_FIELDS);

export const getRequiredAsOfDateOrDiscountDate: ApiAsOfDateOrDiscountDateKey[] = Object.entries(
	API_AS_OF_DISCOUNT_FIELDS,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiAsOfDateOrDiscountDateKey);

export const toAsOfDateOrDiscountDate = (
	apiAsOfDateOrDiscountDateField: ApiAsOfDateOrDiscountDate,
): IDateSettingDiscountOrAsOf | Record<string, unknown> => {
	const AsOfDateOrDiscountDateFieldResult = {};

	if (isNil(apiAsOfDateOrDiscountDateField)) {
		return AsOfDateOrDiscountDateFieldResult;
	}

	Object.entries(API_AS_OF_DISCOUNT_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				AsOfDateOrDiscountDateField: IDateSettingDiscountOrAsOf,
				value: unknown,
			) => void;
			coercedWrite(
				AsOfDateOrDiscountDateFieldResult as IDateSettingDiscountOrAsOf,
				apiAsOfDateOrDiscountDateField[field as ApiAsOfDateOrDiscountDateKey],
			);
		}
	});
	return AsOfDateOrDiscountDateFieldResult as IDateSettingDiscountOrAsOf;
};

export const parseApiAsOfDateOrDiscountDate = (data: unknown, location?: string): ApiAsOfDateOrDiscountDate => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const asOfDiscount: Record<string, ApiAsOfDateOrDiscountDate[ApiAsOfDateOrDiscountDateKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const asOfDiscountField = getApiAsOfDateOrDiscountDate(field);

				if (!asOfDiscountField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = asOfDiscountField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiAsOfDateOrDiscountDate[ApiAsOfDateOrDiscountDateKey]);

				if (write) {
					asOfDiscount[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return asOfDiscount;
};

export const toApiAsOfDateOrDiscountDate = (
	AsOfDateOrDiscountDateField: IDateSettingDiscountOrAsOf,
): ApiAsOfDateOrDiscountDate => {
	const apiAsOfDateOrDiscountDateField: Record<string, ApiAsOfDateOrDiscountDate[ApiAsOfDateOrDiscountDateKey]> = {};
	Object.entries(API_AS_OF_DISCOUNT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiAsOfDateOrDiscountDateField[field] = read(AsOfDateOrDiscountDateField);
		}
	});
	return apiAsOfDateOrDiscountDateField;
};
