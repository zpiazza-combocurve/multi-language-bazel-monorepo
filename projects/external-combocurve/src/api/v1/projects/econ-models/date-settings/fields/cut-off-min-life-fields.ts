import { get, isNil, set } from 'lodash';

import { BOOLEAN_FIELD, IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { ICutOffMinLife } from '@src/models/econ/date-settings';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { CutOffEconFunctionField } from './cut-off';

export type CutOffMinLifeField<T> = IField<ICutOffMinLife, T>;

const emptyValueFieldWrapper = <K extends keyof ICutOffMinLife>(key: K) => {
	const baseFieldDefinition = cutOffMinLifeWriteDbField(key, BOOLEAN_FIELD);
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

const cutOffMinLifeWriteDbField = <K extends keyof ICutOffMinLife, TParsed = ICutOffMinLife[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ICutOffMinLife, K, TParsed>(key, definition, options);

export const API_CUT_OFF_MIN_FIELDS = {
	date: cutOffMinLifeWriteDbField('date', STRING_FIELD),
	asOf: cutOffMinLifeWriteDbField('as_of', NUMBER_FIELD),
	endHist: emptyValueFieldWrapper('end_hist'),
	none: emptyValueFieldWrapper('none'),
};

export type ApiCutOffMinLifeKey = keyof typeof API_CUT_OFF_MIN_FIELDS;

type TypeOfCutOffMinLifeFField<FT> = FT extends CutOffMinLifeField<infer T> ? T : never;

export type ApiCutOffMinLife = {
	[key in ApiCutOffMinLifeKey]?: TypeOfCutOffMinLifeFField<(typeof API_CUT_OFF_MIN_FIELDS)[key]>;
};

export const cutOffMinLifeFields = (): CutOffEconFunctionField<ApiCutOffMinLife | undefined> => ({
	type: OpenApiDataType.object,
	properties: API_CUT_OFF_MIN_FIELDS,
	read: (cutOffEconFunction) => toApiCutOffMinLife(get(cutOffEconFunction, ['min_cut_off'])),
	write: (cutOffEconFunction, value) => value && set(cutOffEconFunction, ['min_cut_off'], toCutOffMinLife(value)),
	parse: (data, location) => parseApiCutOffMinLife(data, location),
});

export const getApiCutOffMinLife = (field: string): (typeof API_CUT_OFF_MIN_FIELDS)[ApiCutOffMinLifeKey] | null =>
	getApiField(field, API_CUT_OFF_MIN_FIELDS);

export const getRequiredCutOffMinLifeF: ApiCutOffMinLifeKey[] = Object.entries(API_CUT_OFF_MIN_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiCutOffMinLifeKey);

export const toCutOffMinLife = (apiCutOffMinLifeField: ApiCutOffMinLife): ICutOffMinLife | Record<string, unknown> => {
	const cutOffMinLifeFFieldResult = {};

	if (isNil(apiCutOffMinLifeField)) {
		return cutOffMinLifeFFieldResult;
	}

	Object.entries(API_CUT_OFF_MIN_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (CutOffMinLifeFField: ICutOffMinLife, value: unknown) => void;
			coercedWrite(
				cutOffMinLifeFFieldResult as ICutOffMinLife,
				apiCutOffMinLifeField[field as ApiCutOffMinLifeKey],
			);
		}
	});
	return cutOffMinLifeFFieldResult as ICutOffMinLife;
};

export const parseApiCutOffMinLife = (data: unknown, location?: string): ApiCutOffMinLife => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const cutOffMinLife: Record<string, ApiCutOffMinLife[ApiCutOffMinLifeKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const cutOffMinLifeEconFunctionField = getApiCutOffMinLife(field);

				if (!cutOffMinLifeEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = cutOffMinLifeEconFunctionField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiCutOffMinLife[ApiCutOffMinLifeKey]);

				if (write) {
					cutOffMinLife[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return cutOffMinLife;
};

export const toApiCutOffMinLife = (cutOffMinLifeField: ICutOffMinLife): ApiCutOffMinLife | undefined => {
	if (!cutOffMinLifeField) {
		return;
	}
	const apiCutOffMinLifeField: Record<string, ApiCutOffMinLife[ApiCutOffMinLifeKey]> = {};
	Object.entries(API_CUT_OFF_MIN_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiCutOffMinLifeField[field] = read(cutOffMinLifeField);
		}
	});
	return apiCutOffMinLifeField;
};
