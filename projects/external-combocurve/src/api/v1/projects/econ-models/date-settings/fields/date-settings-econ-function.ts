import { isNil } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IDateSettingEconFunction } from '@src/models/econ/date-settings';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { asOfOrDiscountField } from './as-of-discount-fields';
import { fpdSourceHierarchyObjectFields } from './fpd-source-hierarchy-object-fields';

export type DateSettingEconFunctionField<T> = IField<IDateSettingEconFunction, T>;

const dateSettingEconFunctionReadWriteDbField = <
	K extends keyof IDateSettingEconFunction,
	TParsed = IDateSettingEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDateSettingEconFunction, K, TParsed>(key, definition, options);

export const API_DATE_SETTING_ECON_FUNCTION = {
	maxWellLife: dateSettingEconFunctionReadWriteDbField('max_well_life', NUMBER_FIELD),
	asOfDate: asOfOrDiscountField('as_of_date'),
	discountDate: asOfOrDiscountField('discount_date'),
	cashFlowPriorAsOfDate: readWriteYesNoDbField<IDateSettingEconFunction>('cash_flow_prior_to_as_of_date'),
	productionDataResolution: dateSettingEconFunctionReadWriteDbField('production_data_resolution', STRING_FIELD),
	fpdSourceHierarchy: fpdSourceHierarchyObjectFields(),
};

export type ApiDateSettingEconFunctionKey = keyof typeof API_DATE_SETTING_ECON_FUNCTION;

type TypeOfDateSettingEconFunctionField<FT> = FT extends DateSettingEconFunctionField<infer T> ? T : never;

export type ApiDateSettingEconFunction = {
	[key in ApiDateSettingEconFunctionKey]?: TypeOfDateSettingEconFunctionField<
		(typeof API_DATE_SETTING_ECON_FUNCTION)[key]
	>;
};

export const getApiDateSettingEconFunction = (
	field: string,
): (typeof API_DATE_SETTING_ECON_FUNCTION)[ApiDateSettingEconFunctionKey] | null =>
	getApiField(field, API_DATE_SETTING_ECON_FUNCTION);

export const getRequiredDateSettingEconFunction: ApiDateSettingEconFunctionKey[] = Object.entries(
	API_DATE_SETTING_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDateSettingEconFunctionKey);

export const toDateSettingEconFunction = (
	apiDateSettingEconFunctionField: ApiDateSettingEconFunction,
): IDateSettingEconFunction | Record<string, unknown> => {
	const DateSettingEconFunctionFieldResult = {};

	if (isNil(apiDateSettingEconFunctionField)) {
		return DateSettingEconFunctionFieldResult;
	}

	Object.entries(API_DATE_SETTING_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				DateSettingEconFunctionField: IDateSettingEconFunction,
				value: unknown,
			) => void;
			coercedWrite(
				DateSettingEconFunctionFieldResult as IDateSettingEconFunction,
				apiDateSettingEconFunctionField[field as ApiDateSettingEconFunctionKey],
			);
		}
	});
	return DateSettingEconFunctionFieldResult as IDateSettingEconFunction;
};

export const parseApiDateSettingEconFunction = (data: unknown, location?: string): ApiDateSettingEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const dateSettingEconFunction: Record<string, ApiDateSettingEconFunction[ApiDateSettingEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const dateSettingEconFunctionField = getApiDateSettingEconFunction(field);

				if (!dateSettingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = dateSettingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiDateSettingEconFunction[ApiDateSettingEconFunctionKey]);

				if (write) {
					dateSettingEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return dateSettingEconFunction;
};

export const toApiDateSettingEconFunction = (
	DateSettingEconFunctionField: IDateSettingEconFunction,
): ApiDateSettingEconFunction => {
	const apiDateSettingEconFunctionField: Record<string, ApiDateSettingEconFunction[ApiDateSettingEconFunctionKey]> =
		{};
	Object.entries(API_DATE_SETTING_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiDateSettingEconFunctionField[field] = read(DateSettingEconFunctionField);
		}
	});
	return apiDateSettingEconFunctionField;
};
