import { get, isNil, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { IDateSettingsSourceHierarchyUseForecast } from '@src/models/econ/date-settings';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { DateSettingEconFunctionField } from './date-settings-econ-function';
import { fpdSourceHierarchyFields } from './fpd-source-hierarchy-fields';

export type FPDSourceHierarchiesField<T> = IField<IDateSettingsSourceHierarchyUseForecast, T>;

export const API_FPD_HIERARCHY_OBJECT_FIELDS = {
	firstFpdSource: fpdSourceHierarchyFields('first_fpd_source'),
	secondFpdSource: fpdSourceHierarchyFields('second_fpd_source'),
	thirdFpdSource: fpdSourceHierarchyFields('third_fpd_source'),
	fourthFpdSource: fpdSourceHierarchyFields('fourth_fpd_source'),
	useForecastSchedule: readWriteYesNoDbField<IDateSettingsSourceHierarchyUseForecast>(
		'use_forecast_schedule_when_no_prod',
	),
};

export type ApiFPDSourceHierarchiesKey = keyof typeof API_FPD_HIERARCHY_OBJECT_FIELDS;

type TypeOfFPDSourceHierarchiesField<FT> = FT extends FPDSourceHierarchiesField<infer T> ? T : never;

export type ApiFPDSourceHierarchies = {
	[key in ApiFPDSourceHierarchiesKey]?: TypeOfFPDSourceHierarchiesField<
		(typeof API_FPD_HIERARCHY_OBJECT_FIELDS)[key]
	>;
};

export const fpdSourceHierarchyObjectFields = (): DateSettingEconFunctionField<ApiFPDSourceHierarchies> => ({
	type: OpenApiDataType.object,
	properties: API_FPD_HIERARCHY_OBJECT_FIELDS,
	read: (dateSettingEconFunction) =>
		toApiFPDSourceHierarchies(get(dateSettingEconFunction, ['fpd_source_hierarchy'])),
	write: (dateSettingEconFunction, value) =>
		set(dateSettingEconFunction, ['fpd_source_hierarchy'], toFPDSourceHierarchies(value)),
	parse: (data, location) => parseApiFPDSourceHierarchies(data, location),
});

export const getApiFPDSourceHierarchies = (
	field: string,
): (typeof API_FPD_HIERARCHY_OBJECT_FIELDS)[ApiFPDSourceHierarchiesKey] | null =>
	getApiField(field, API_FPD_HIERARCHY_OBJECT_FIELDS);

export const getRequiredFPDSourceHierarchies: ApiFPDSourceHierarchiesKey[] = Object.entries(
	API_FPD_HIERARCHY_OBJECT_FIELDS,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiFPDSourceHierarchiesKey);

export const toFPDSourceHierarchies = (
	apiFPDSourceHierarchiesField: ApiFPDSourceHierarchies,
): IDateSettingsSourceHierarchyUseForecast | Record<string, unknown> => {
	const FPDSourceHierarchiesFieldResult = {};

	if (isNil(apiFPDSourceHierarchiesField)) {
		return FPDSourceHierarchiesFieldResult;
	}

	Object.entries(API_FPD_HIERARCHY_OBJECT_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				FPDSourceHierarchiesField: IDateSettingsSourceHierarchyUseForecast,
				value: unknown,
			) => void;
			coercedWrite(
				FPDSourceHierarchiesFieldResult as IDateSettingsSourceHierarchyUseForecast,
				apiFPDSourceHierarchiesField[field as ApiFPDSourceHierarchiesKey],
			);
		}
	});
	return FPDSourceHierarchiesFieldResult as IDateSettingsSourceHierarchyUseForecast;
};

export const parseApiFPDSourceHierarchies = (data: unknown, location?: string): ApiFPDSourceHierarchies => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const otherCapexEconFunction: Record<string, ApiFPDSourceHierarchies[ApiFPDSourceHierarchiesKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const otherCapexEconFunctionField = getApiFPDSourceHierarchies(field);

				if (!otherCapexEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = otherCapexEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFPDSourceHierarchies[ApiFPDSourceHierarchiesKey]);

				if (write) {
					otherCapexEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return otherCapexEconFunction;
};

export const toApiFPDSourceHierarchies = (
	FPDSourceHierarchiesField: IDateSettingsSourceHierarchyUseForecast,
): ApiFPDSourceHierarchies => {
	const apiFPDSourceHierarchiesField: Record<string, ApiFPDSourceHierarchies[ApiFPDSourceHierarchiesKey]> = {};
	Object.entries(API_FPD_HIERARCHY_OBJECT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiFPDSourceHierarchiesField[field] = read(FPDSourceHierarchiesField);
		}
	});
	return apiFPDSourceHierarchiesField;
};
