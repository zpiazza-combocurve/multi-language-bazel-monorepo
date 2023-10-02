import { get, isNil, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { IShrinkageEconFunction, ROWS_CALCULATION_METHOD } from '@src/models/econ/stream-properties';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_ECON_FUNCTION_ROW_FIELD,
	ApiEconFunctionRowField,
	toApiEconFunctionRowField,
	toEconFunctionRowField,
} from '../../row-fields/econ-function-row-field';
import { parseEconFunctionRowField } from '../validation';

export type ShrinkageEconFunctionField<T> = IField<IShrinkageEconFunction, T>;

const shrinkageEconFunctionReadWriteDbField = <
	K extends keyof IShrinkageEconFunction,
	TParsed = IShrinkageEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IShrinkageEconFunction, K, TParsed>(key, definition, options);

const getEconFunctionRowField = (path: string): ShrinkageEconFunctionField<ApiEconFunctionRowField | null> => {
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
const rateType: IField<IShrinkageEconFunction, string> = {
	type: OpenApiDataType.string,
	read: (rate_type) => get(rate_type, ['rate_type']),
	write: (rateType) => set(rateType, ['rate_type'], 'gross_well_head'),
};

export const API_SHRINKAGE_ECON_FUNCTION = {
	rateType: rateType,
	rowsCalculationMethod: shrinkageEconFunctionReadWriteDbField(
		'rows_calculation_method',
		getStringEnumField(ROWS_CALCULATION_METHOD),
	),
	oil: getEconFunctionRowField('oil'),
	gas: getEconFunctionRowField('gas'),
};

export type ApiShrinkageEconFunctionKey = keyof typeof API_SHRINKAGE_ECON_FUNCTION;

type TypeOfField<FT> = FT extends ShrinkageEconFunctionField<infer T> ? T : never;

export type ApiShrinkageEconFunction = {
	[key in ApiShrinkageEconFunctionKey]?: TypeOfField<(typeof API_SHRINKAGE_ECON_FUNCTION)[key]>;
};

export const getApiShrinkageEconFunctionField = (
	field: string,
): (typeof API_SHRINKAGE_ECON_FUNCTION)[ApiShrinkageEconFunctionKey] | null =>
	getApiField(field, API_SHRINKAGE_ECON_FUNCTION);

export const getRequiredShrinkageFields: ApiShrinkageEconFunctionKey[] = Object.entries(API_SHRINKAGE_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiShrinkageEconFunctionKey);

export const toShrinkageEconFunction = (
	apiShrinkageEconFunction: ApiShrinkageEconFunction,
): IShrinkageEconFunction | Record<string, unknown> => {
	const shrinkageEconFunctionResult = {};

	if (isNil(apiShrinkageEconFunction)) {
		return shrinkageEconFunctionResult;
	}

	Object.entries(API_SHRINKAGE_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (shrinkageEconFunction: IShrinkageEconFunction, value: unknown) => void;
			coercedWrite(
				shrinkageEconFunctionResult as IShrinkageEconFunction,
				apiShrinkageEconFunction[field as ApiShrinkageEconFunctionKey],
			);
		}
	});
	return shrinkageEconFunctionResult as IShrinkageEconFunction;
};

export const toApiShrinkageEconFunction = (shrinkageEconFunction: IShrinkageEconFunction): ApiShrinkageEconFunction => {
	const apiShrinkageEconFunction: Record<string, ApiShrinkageEconFunction[ApiShrinkageEconFunctionKey]> = {};
	Object.entries(API_SHRINKAGE_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiShrinkageEconFunction[field] = read(shrinkageEconFunction);
		}
	});
	return apiShrinkageEconFunction;
};
