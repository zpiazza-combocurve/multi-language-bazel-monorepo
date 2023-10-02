import { get, isNil, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { ILossFlareEconFunction, ROWS_CALCULATION_METHOD } from '@src/models/econ/stream-properties';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_ECON_FUNCTION_ROW_FIELD,
	ApiEconFunctionRowField,
	toApiEconFunctionRowField,
	toEconFunctionRowField,
} from '../../row-fields/econ-function-row-field';
import { parseEconFunctionRowField } from '../validation';

export type LossFlareEconFunctionField<T> = IField<ILossFlareEconFunction, T>;

const lossFlareEconFunctionReadWriteDbField = <
	K extends keyof ILossFlareEconFunction,
	TParsed = ILossFlareEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ILossFlareEconFunction, K, TParsed>(key, definition, options);

const getEconFunctionRowField = (path: string): LossFlareEconFunctionField<ApiEconFunctionRowField | null> => {
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
const rateType: IField<ILossFlareEconFunction, string> = {
	type: OpenApiDataType.string,
	read: (rate_type) => get(rate_type, ['rate_type']),
	write: (rateType) => set(rateType, ['rate_type'], 'gross_well_head'),
};

export const API_LOSS_FLARE_ECON_FUNCTION = {
	rateType: rateType,
	rowsCalculationMethod: lossFlareEconFunctionReadWriteDbField(
		'rows_calculation_method',
		getStringEnumField(ROWS_CALCULATION_METHOD),
	),
	oilLoss: getEconFunctionRowField('oil_loss'),
	gasLoss: getEconFunctionRowField('gas_loss'),
	gasFlare: getEconFunctionRowField('gas_flare'),
};

export type ApiLossFlareEconFunctionKey = keyof typeof API_LOSS_FLARE_ECON_FUNCTION;

type TypeOfField<FT> = FT extends LossFlareEconFunctionField<infer T> ? T : never;

export type ApiLossFlareEconFunction = {
	[key in ApiLossFlareEconFunctionKey]?: TypeOfField<(typeof API_LOSS_FLARE_ECON_FUNCTION)[key]>;
};

export const getApiLossFlareEconFunctionField = (
	field: string,
): (typeof API_LOSS_FLARE_ECON_FUNCTION)[ApiLossFlareEconFunctionKey] | null =>
	getApiField(field, API_LOSS_FLARE_ECON_FUNCTION);

export const getRequiredLossFlareFields: ApiLossFlareEconFunctionKey[] = Object.entries(API_LOSS_FLARE_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiLossFlareEconFunctionKey);

export const toLossFlareEconFunction = (
	apiLossFlareEconFunction: ApiLossFlareEconFunction,
): ILossFlareEconFunction | Record<string, unknown> => {
	const lossFlareEconFunctionResult = {};

	if (isNil(apiLossFlareEconFunction)) {
		return lossFlareEconFunctionResult;
	}

	Object.entries(API_LOSS_FLARE_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (lossFlareEconFunction: ILossFlareEconFunction, value: unknown) => void;
			coercedWrite(
				lossFlareEconFunctionResult as ILossFlareEconFunction,
				apiLossFlareEconFunction[field as ApiLossFlareEconFunctionKey],
			);
		}
	});
	return lossFlareEconFunctionResult as ILossFlareEconFunction;
};

export const toApiLossFlareEconFunction = (lossFlareEconFunction: ILossFlareEconFunction): ApiLossFlareEconFunction => {
	const apiLossFlareEconFunction: Record<string, ApiLossFlareEconFunction[ApiLossFlareEconFunctionKey]> = {};
	Object.entries(API_LOSS_FLARE_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiLossFlareEconFunction[field] = read(lossFlareEconFunction);
		}
	});
	return apiLossFlareEconFunction;
};
