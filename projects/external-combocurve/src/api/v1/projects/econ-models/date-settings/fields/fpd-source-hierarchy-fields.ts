import { get, isNil, set } from 'lodash';

import { BOOLEAN_FIELD, IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IDateSettingFPDSourceHierarchy, IFPDSourceHierarchies } from '@src/models/econ/date-settings';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { FPDSourceHierarchiesField } from './fpd-source-hierarchy-object-fields';

export type FPDSourceHierarchyField<T> = IField<IDateSettingFPDSourceHierarchy, T>;

const fPdSourceHierarchyWriteDbField = <
	K extends keyof IDateSettingFPDSourceHierarchy,
	TParsed = IDateSettingFPDSourceHierarchy[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDateSettingFPDSourceHierarchy, K, TParsed>(key, definition, options);
const emptySourceFieldWrapper = <K extends keyof IDateSettingFPDSourceHierarchy>(key: K) => {
	const baseFieldDefinition = fPdSourceHierarchyWriteDbField(key, BOOLEAN_FIELD);
	baseFieldDefinition.read = (value) => {
		if (value[key] !== undefined) {
			return true;
		}
		return;
	};

	baseFieldDefinition.write = (object, value) => {
		if (value !== undefined) {
			object[key] = true;
		}
	};
	return baseFieldDefinition;
};
export const API_FPD_HIERARCHY_OBJECT_FIELDS = {
	date: fPdSourceHierarchyWriteDbField('date', STRING_FIELD),
	wellHeader: emptySourceFieldWrapper('well_header'),
	forecast: emptySourceFieldWrapper('forecast'),
	linkToWells: fPdSourceHierarchyWriteDbField('link_to_wells_ecl', STRING_FIELD),
	notUsed: emptySourceFieldWrapper('not_used'),
	productionData: emptySourceFieldWrapper('production_data'),
};

export type ApiDateSettingFPDSourceHierarchyKey = keyof typeof API_FPD_HIERARCHY_OBJECT_FIELDS;

type TypeOfFPDSourceHierarchyField<FT> = FT extends FPDSourceHierarchyField<infer T> ? T : never;

export type ApiDateSettingFPDSourceHierarchy = {
	[key in ApiDateSettingFPDSourceHierarchyKey]?: TypeOfFPDSourceHierarchyField<
		(typeof API_FPD_HIERARCHY_OBJECT_FIELDS)[key]
	>;
};

export const fpdSourceHierarchyFields = <K extends keyof IFPDSourceHierarchies>(
	key: K,
): FPDSourceHierarchiesField<ApiDateSettingFPDSourceHierarchy> => ({
	type: OpenApiDataType.object,
	properties: API_FPD_HIERARCHY_OBJECT_FIELDS,
	read: (fpdSourceHierarchies) => toApiDateSettingFPDSourceHierarchy(get(fpdSourceHierarchies, [key])),
	write: (fpdSourceHierarchies, value) => set(fpdSourceHierarchies, [key], toFPDSourceHierarchy(value)),
	parse: (data, location) => parseApiDateSettingFPDSourceHierarchy(data, location),
});

export const getApiDateSettingFPDSourceHierarchy = (
	field: string,
): (typeof API_FPD_HIERARCHY_OBJECT_FIELDS)[ApiDateSettingFPDSourceHierarchyKey] | null =>
	getApiField(field, API_FPD_HIERARCHY_OBJECT_FIELDS);

export const getRequiredFPDSourceHierarchy: ApiDateSettingFPDSourceHierarchyKey[] = Object.entries(
	API_FPD_HIERARCHY_OBJECT_FIELDS,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDateSettingFPDSourceHierarchyKey);

export const toFPDSourceHierarchy = (
	ApiDateSettingFPDSourceHierarchyField: ApiDateSettingFPDSourceHierarchy,
): IDateSettingFPDSourceHierarchy | Record<string, unknown> => {
	const fPDSourceHierarchyFieldResult = {};

	if (isNil(ApiDateSettingFPDSourceHierarchyField)) {
		return fPDSourceHierarchyFieldResult;
	}

	Object.entries(API_FPD_HIERARCHY_OBJECT_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				FPDSourceHierarchyField: IDateSettingFPDSourceHierarchy,
				value: unknown,
			) => void;
			coercedWrite(
				fPDSourceHierarchyFieldResult as IDateSettingFPDSourceHierarchy,
				ApiDateSettingFPDSourceHierarchyField[field as ApiDateSettingFPDSourceHierarchyKey],
			);
		}
	});
	return fPDSourceHierarchyFieldResult as IDateSettingFPDSourceHierarchy;
};

export const parseApiDateSettingFPDSourceHierarchy = (
	data: unknown,
	location?: string,
): ApiDateSettingFPDSourceHierarchy => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const fPDSourceHierarchyFieldResult: Record<
		string,
		ApiDateSettingFPDSourceHierarchy[ApiDateSettingFPDSourceHierarchyKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const fPDSourceHierarchyFieldResultField = getApiDateSettingFPDSourceHierarchy(field);

				if (!fPDSourceHierarchyFieldResultField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = fPDSourceHierarchyFieldResultField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiDateSettingFPDSourceHierarchy[ApiDateSettingFPDSourceHierarchyKey]);

				if (write) {
					fPDSourceHierarchyFieldResult[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return fPDSourceHierarchyFieldResult;
};

export const toApiDateSettingFPDSourceHierarchy = (
	fPDSourceHierarchyField: IDateSettingFPDSourceHierarchy,
): ApiDateSettingFPDSourceHierarchy => {
	const ApiDateSettingFPDSourceHierarchyField: Record<
		string,
		ApiDateSettingFPDSourceHierarchy[ApiDateSettingFPDSourceHierarchyKey]
	> = {};
	Object.entries(API_FPD_HIERARCHY_OBJECT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			ApiDateSettingFPDSourceHierarchyField[field] = read(fPDSourceHierarchyField);
		}
	});
	return ApiDateSettingFPDSourceHierarchyField;
};
