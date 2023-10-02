import { set } from 'lodash';

import { getApiField, IField } from '@src/api/v1/fields';
import { IEmissionEconFunction, IEmissionRow } from '@src/models/econ/emissions';
import { isNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/field-definition';

import { ApiEmissionRow, EMISSION_ROW_FIELDS, toApiEmissionRow, toEmissionRow } from './emission-row';

export type IEmissionEconFunctionField<T> = IField<IEmissionEconFunction, T>;

export type ApiEmissionEconFunctionKey = keyof typeof EMISSION_ECON_FUNCTION_FIELDS;
type TypeOfEmissionEconFunctionField<FT> = FT extends IEmissionEconFunctionField<infer T> ? T : never;

export type ApiEmissionEconFunction = {
	[key in ApiEmissionEconFunctionKey]?: TypeOfEmissionEconFunctionField<(typeof EMISSION_ECON_FUNCTION_FIELDS)[key]>;
};

export const rowsReadWriteDbField: IEmissionEconFunctionField<ApiEmissionRow[]> = {
	type: OpenApiDataType.array,
	items: { type: OpenApiDataType.object, properties: EMISSION_ROW_FIELDS },
	write: (econFunction, apiRows) => set(econFunction, ['table'], toEmissionRows(apiRows)),
	read: (econFunction) => toApiEmissionRows(econFunction),
};

export const EMISSION_ECON_FUNCTION_FIELDS = {
	rows: rowsReadWriteDbField,
};

export const toEmissionRows = (apiEmissionRows: ApiEmissionRow[]): Array<IEmissionRow | Record<string, unknown>> => {
	const emissionRowsResult: Array<IEmissionRow | Record<string, unknown>> = [];

	if (isNil(apiEmissionRows)) {
		return emissionRowsResult;
	}

	for (const apiEmissionRow of apiEmissionRows) {
		emissionRowsResult.push(toEmissionRow(apiEmissionRow));
	}

	return emissionRowsResult;
};

export const toApiEmissionRows = (emissionType: IEmissionEconFunction): Array<ApiEmissionRow> => {
	const apiEmissionRowsResult: Array<ApiEmissionRow> = [];

	if (isNil(emissionType?.table)) {
		return apiEmissionRowsResult;
	}

	for (const emissionRow of emissionType.table) {
		apiEmissionRowsResult.push(toApiEmissionRow(emissionRow));
	}

	return apiEmissionRowsResult;
};

export const getApiEmissionEconFunctionField = (
	field: string,
): (typeof EMISSION_ECON_FUNCTION_FIELDS)[ApiEmissionEconFunctionKey] | null =>
	getApiField(field, EMISSION_ECON_FUNCTION_FIELDS);

export const toEmissionEconFunction = (
	apiEmissionRow: ApiEmissionEconFunction,
): IEmissionEconFunction | Record<string, unknown> => {
	const emissionRowResult = {};

	if (isNil(apiEmissionRow)) {
		return emissionRowResult;
	}

	Object.entries(EMISSION_ECON_FUNCTION_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (emission: IEmissionEconFunction, value: unknown) => void;
			coercedWrite(
				emissionRowResult as IEmissionEconFunction,
				apiEmissionRow[field as ApiEmissionEconFunctionKey],
			);
		}
	});
	return emissionRowResult;
};

export const toApiEmissionEconFunction = (emissionType: IEmissionEconFunction): ApiEmissionEconFunction => {
	const apiEmissionType: Record<string, ApiEmissionEconFunction[ApiEmissionEconFunctionKey]> = {};
	Object.entries(EMISSION_ECON_FUNCTION_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEmissionType[field] = read(emissionType) as ApiEmissionEconFunction[ApiEmissionEconFunctionKey];
		}
	});
	return apiEmissionType;
};
