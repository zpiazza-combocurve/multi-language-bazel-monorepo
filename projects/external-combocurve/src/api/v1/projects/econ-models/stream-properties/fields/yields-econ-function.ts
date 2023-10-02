import { get, isNil, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { IYieldsEconFunction, ROWS_CALCULATION_METHOD } from '@src/models/econ/stream-properties';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_ECON_FUNCTION_ROW_FIELD,
	ApiEconFunctionRowField,
	toApiEconFunctionRowField,
	toEconFunctionRowField,
} from '../../row-fields/econ-function-row-field';
import { parseEconFunctionRowField } from '../validation';

export type YieldsEconFunctionField<T> = IField<IYieldsEconFunction, T>;

const yieldsEconFunctionReadWriteDbField = <K extends keyof IYieldsEconFunction, TParsed = IYieldsEconFunction[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IYieldsEconFunction, K, TParsed>(key, definition, options);

const getEconFunctionRowField = (path: string): YieldsEconFunctionField<ApiEconFunctionRowField | null> => {
	return {
		type: OpenApiDataType.object,
		properties: API_ECON_FUNCTION_ROW_FIELD,
		parse: (data: unknown, location?: string) => parseEconFunctionRowField(data, location),
		read: (yields) => toApiEconFunctionRowField(get(yields, path)),
		write: (yields, value) => {
			if (notNil(value)) {
				set(yields, path, toEconFunctionRowField(value));
			}
		},
		options: { isRequired: false },
	};
};

//This field is always set to gross_well_head so we only write to it. There is no need to read from it.
const rateType: IField<IYieldsEconFunction, string> = {
	type: OpenApiDataType.string,
	read: (rate_type) => get(rate_type, ['rate_type']),
	write: (rateType) => set(rateType, ['rate_type'], 'gross_well_head'),
};

export const API_YIELDS_ECON_FUNCTION = {
	rateType: rateType,
	rowsCalculationMethod: yieldsEconFunctionReadWriteDbField(
		'rows_calculation_method',
		getStringEnumField(ROWS_CALCULATION_METHOD),
	),
	ngl: getEconFunctionRowField('ngl'),
	dripCondensate: getEconFunctionRowField('drip_condensate'),
};

export type ApiYieldsEconFunctionKey = keyof typeof API_YIELDS_ECON_FUNCTION;

type TypeOfField<FT> = FT extends YieldsEconFunctionField<infer T> ? T : never;

export type ApiYieldsEconFunction = {
	[key in ApiYieldsEconFunctionKey]?: TypeOfField<(typeof API_YIELDS_ECON_FUNCTION)[key]>;
};

export const getApiYieldsEconFunctionField = (
	field: string,
): (typeof API_YIELDS_ECON_FUNCTION)[ApiYieldsEconFunctionKey] | null => getApiField(field, API_YIELDS_ECON_FUNCTION);

export const getRequiredYieldsFields: ApiYieldsEconFunctionKey[] = Object.entries(API_YIELDS_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiYieldsEconFunctionKey);

export const toYieldsEconFunction = (
	apiYieldsEconFunction: ApiYieldsEconFunction,
): IYieldsEconFunction | Record<string, unknown> => {
	const yieldsEconFunctionResult = {};

	if (isNil(apiYieldsEconFunction)) {
		return yieldsEconFunctionResult;
	}

	Object.entries(API_YIELDS_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (yieldsEconFunction: IYieldsEconFunction, value: unknown) => void;
			coercedWrite(
				yieldsEconFunctionResult as IYieldsEconFunction,
				apiYieldsEconFunction[field as ApiYieldsEconFunctionKey],
			);
		}
	});
	return yieldsEconFunctionResult as IYieldsEconFunction;
};

export const toApiYieldsEconFunction = (yieldsEconFunction: IYieldsEconFunction): ApiYieldsEconFunction => {
	const apiYieldsEconFunction: Record<string, ApiYieldsEconFunction[ApiYieldsEconFunctionKey]> = {};
	Object.entries(API_YIELDS_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiYieldsEconFunction[field] = read(yieldsEconFunction);
		}
	});
	return apiYieldsEconFunction;
};
