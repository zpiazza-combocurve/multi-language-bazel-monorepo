import { isNil } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, readWriteDbField } from '@src/api/v1/fields';
import { BOOLEAN_FIELD } from '@src/helpers/fields';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '@src/api/v1/wells/validation';
import { IOtherCapexEconFunction } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { otherCapexRowField } from './other-capex-row-fields';

export type OtherCapexEconFunctionField<T> = IField<IOtherCapexEconFunction, T>;

const probCapexField = readWriteDbField<IOtherCapexEconFunction, 'probCapex'>('probCapex', BOOLEAN_FIELD);

probCapexField.read = () => undefined;

export const API_OTHER_CAPEX_ECON_FUNCTION = {
	rows: otherCapexRowField(),
	probCapex: probCapexField,
};

export type ApiOtherCapexEconFunctionKey = keyof typeof API_OTHER_CAPEX_ECON_FUNCTION;

type TypeOfOtherCapexField<FT> = FT extends OtherCapexEconFunctionField<infer T> ? T : never;

export type ApiOtherCapexEconFunction = {
	[key in ApiOtherCapexEconFunctionKey]?: TypeOfOtherCapexField<(typeof API_OTHER_CAPEX_ECON_FUNCTION)[key]>;
};

export const getApiOtherCapexEconFunctionField = (
	field: string,
): (typeof API_OTHER_CAPEX_ECON_FUNCTION)[ApiOtherCapexEconFunctionKey] | null =>
	getApiField(field, API_OTHER_CAPEX_ECON_FUNCTION);

export const getRequiredOtherCapexFields: ApiOtherCapexEconFunctionKey[] = Object.entries(API_OTHER_CAPEX_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiOtherCapexEconFunctionKey);

export const toOtherCapexEconFunction = (
	apiOtherCapexEconFunction: ApiOtherCapexEconFunction,
): IOtherCapexEconFunction | Record<string, unknown> => {
	const otherCapexEconFunctionResult = {};

	if (isNil(apiOtherCapexEconFunction)) {
		return otherCapexEconFunctionResult;
	}

	Object.entries(API_OTHER_CAPEX_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (otherCapexEconFunction: IOtherCapexEconFunction, value: unknown) => void;
			coercedWrite(
				otherCapexEconFunctionResult as IOtherCapexEconFunction,
				apiOtherCapexEconFunction[field as ApiOtherCapexEconFunctionKey],
			);
		}
	});
	return otherCapexEconFunctionResult as IOtherCapexEconFunction;
};

export const toApiOtherCapexEconFunction = (
	otherCapexEconFunction: IOtherCapexEconFunction,
): ApiOtherCapexEconFunction => {
	const apiOtherCapexEconFunction: Record<string, ApiOtherCapexEconFunction[ApiOtherCapexEconFunctionKey]> = {};
	Object.entries(API_OTHER_CAPEX_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiOtherCapexEconFunction[field] = read(otherCapexEconFunction);
		}
	});
	return apiOtherCapexEconFunction;
};

export const parseOtherCapexEconFunction = (data: unknown, location?: string): ApiOtherCapexEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid otherCapex data structure`, location);
	}
	const apiOtherCapexEconFunction: Record<string, ApiOtherCapexEconFunction[ApiOtherCapexEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();
	if (data.probCapex === undefined) {
		data.probCapex = false;
	}
	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiOtherCapexEconFunctionField = getApiOtherCapexEconFunctionField(field);

				if (!apiOtherCapexEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiOtherCapexEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiOtherCapexEconFunction[ApiOtherCapexEconFunctionKey]);

				if (write) {
					apiOtherCapexEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiOtherCapexEconFunction;
};
