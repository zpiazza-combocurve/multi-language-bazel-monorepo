import { get, isNil, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IOtherCapexEscalationStart } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { OtherCapeRowField } from './other-capex-row-fields';

export type EscalationStartField<T> = IField<IOtherCapexEscalationStart, T>;

const escalationStartReadWriteDbField = <
	K extends keyof IOtherCapexEscalationStart,
	TParsed = IOtherCapexEscalationStart[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IOtherCapexEscalationStart, K, TParsed>(key, definition, options);

export const API_ESCALATION_START_FIELDS = {
	date: escalationStartReadWriteDbField('date', STRING_FIELD),
	applyToCriteria: escalationStartReadWriteDbField('apply_to_criteria', NUMBER_FIELD),
	fpd: escalationStartReadWriteDbField('fpd', NUMBER_FIELD),
	asOfDate: escalationStartReadWriteDbField('as_of_date', NUMBER_FIELD),
	econLimit: escalationStartReadWriteDbField('econ_limit', NUMBER_FIELD),
};

export type ApiEscalationStartKey = keyof typeof API_ESCALATION_START_FIELDS;

type TypeOfEscalationStartField<FT> = FT extends EscalationStartField<infer T> ? T : never;

export type ApiEscalationStart = {
	[key in ApiEscalationStartKey]?: TypeOfEscalationStartField<(typeof API_ESCALATION_START_FIELDS)[key]>;
};

export const otherCapexEscalationStartReadWriteDbField = (): OtherCapeRowField<ApiEscalationStart> => ({
	type: OpenApiDataType.object,
	properties: API_ESCALATION_START_FIELDS,
	read: (otherCapex) => toApiEscalationStart(get(otherCapex, ['escalation_start'])),
	write: (otherCapex, value) => set(otherCapex, ['escalation_start'], toEscalationStart(value)),
	parse: (data, location) => parseApiEscalationStart(data, location),
});

export const getApiEscalationStart = (
	field: string,
): (typeof API_ESCALATION_START_FIELDS)[ApiEscalationStartKey] | null =>
	getApiField(field, API_ESCALATION_START_FIELDS);

export const getRequiredEscalationStart: ApiEscalationStartKey[] = Object.entries(API_ESCALATION_START_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiEscalationStartKey);

export const toEscalationStart = (
	apiEscalationStartField: ApiEscalationStart,
): IOtherCapexEscalationStart | Record<string, unknown> => {
	const EscalationStartFieldResult = {};

	if (isNil(apiEscalationStartField)) {
		return EscalationStartFieldResult;
	}

	Object.entries(API_ESCALATION_START_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (EscalationStartField: IOtherCapexEscalationStart, value: unknown) => void;
			coercedWrite(
				EscalationStartFieldResult as IOtherCapexEscalationStart,
				apiEscalationStartField[field as ApiEscalationStartKey],
			);
		}
	});
	return EscalationStartFieldResult as IOtherCapexEscalationStart;
};

export const parseApiEscalationStart = (data: unknown, location?: string): ApiEscalationStart => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Capex model rows data structure`, location);
	}

	const otherCapexEconFunction: Record<string, ApiEscalationStart[ApiEscalationStartKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const otherCapexEconFunctionField = getApiEscalationStart(field);

				if (!otherCapexEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = otherCapexEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEscalationStart[ApiEscalationStartKey]);

				if (write) {
					otherCapexEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return otherCapexEconFunction;
};

export const toApiEscalationStart = (EscalationStartField: IOtherCapexEscalationStart): ApiEscalationStart => {
	const apiEscalationStartField: Record<string, ApiEscalationStart[ApiEscalationStartKey]> = {};
	Object.entries(API_ESCALATION_START_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEscalationStartField[field] = read(EscalationStartField);
		}
	});
	return apiEscalationStartField;
};
