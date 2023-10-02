/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, isNil, set } from 'lodash';

import { BOOLEAN_FIELD, IFieldDefinition } from '@src/helpers/fields';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IRiskingEconFunction } from '@src/models/econ/riskings';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_ECON_FUNCTION_ROW_FIELD,
	ApiEconFunctionRowField,
	toApiEconFunctionRowField,
	toEconFunctionRowField,
} from '../../row-fields/econ-function-row-field';
import { ApiEconFunctionRow, IApiRowField } from '../../row-fields/econ-function-row-fields';
import { parseRiskingEconFunctionRowField } from '../validation';

export type IRiskingEconFunctionField<T> = IField<IRiskingEconFunction, T>;

const riskingEconFunctionReadWriteYesNoDbField = <
	K extends keyof IRiskingEconFunction,
	TParsed = IRiskingEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => ({
	...readWriteDbField<IRiskingEconFunction, K, TParsed>(key, definition, options),
	read: (value: any) => {
		const databaseValue = get(value, key) as string;

		if (!databaseValue) {
			return undefined;
		}

		return databaseValue && databaseValue.toLowerCase() == 'yes';
	},
	write: (risking: any, value: any) => {
		if (notNil(value)) {
			set(risking, key, value ? 'yes' : 'no');
		}
	},
});

const getEconFunctionRowField = (path: string): IRiskingEconFunctionField<ApiEconFunctionRowField | null> => {
	return {
		type: OpenApiDataType.object,
		properties: API_ECON_FUNCTION_ROW_FIELD,
		parse: (data: unknown, location?: string) => parseRiskingEconFunctionRowField(data, location),
		read: (ownership) => toApiEconFunctionRowField(get(ownership, path)),
		write: (ownership, value) => {
			if (notNil(value)) {
				set(ownership, path, toEconFunctionRowField(value));
			}
		},
		options: { isRequired: false },
	};
};

export const API_RISKING_ECON_FUNCTION_ROW_FIELDS = {
	oil: getEconFunctionRowField('oil'),
	gas: getEconFunctionRowField('gas'),
	ngl: getEconFunctionRowField('ngl'),
	dripCondensate: getEconFunctionRowField('drip_condensate'),
	water: getEconFunctionRowField('water'),
};

export const API_RISKING_ECON_FUNCTION = {
	riskProd: riskingEconFunctionReadWriteYesNoDbField('risk_prod', BOOLEAN_FIELD),
	riskNglDripCondViaGasRisk: riskingEconFunctionReadWriteYesNoDbField(
		'risk_ngl_drip_cond_via_gas_risk',
		BOOLEAN_FIELD,
	),
	...API_RISKING_ECON_FUNCTION_ROW_FIELDS,
};

export type ApiRiskingEconFunctionKey = keyof typeof API_RISKING_ECON_FUNCTION;

type TypeOfField<FT> = FT extends IRiskingEconFunctionField<infer T> ? T : never;

export type ApiRiskingEconFunction = {
	[key in ApiRiskingEconFunctionKey]?: TypeOfField<(typeof API_RISKING_ECON_FUNCTION)[key]>;
};

export const getApiRiskingEconFunctionField = (
	field: string,
): (typeof API_RISKING_ECON_FUNCTION)[ApiRiskingEconFunctionKey] | null =>
	getApiField(field, API_RISKING_ECON_FUNCTION);

export const getRequiredFields: ApiRiskingEconFunctionKey[] = Object.entries(API_RISKING_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiRiskingEconFunctionKey);

export const toRiskingEconFunction = (
	apiRiskingEconFunction: ApiRiskingEconFunction,
): IRiskingEconFunction | Record<string, unknown> => {
	const riskingEconFunctionResult = {};

	if (isNil(apiRiskingEconFunction)) {
		return {};
	}

	Object.entries(API_RISKING_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (risking: IRiskingEconFunction, value: unknown) => void;
			coercedWrite(
				riskingEconFunctionResult as IRiskingEconFunction,
				apiRiskingEconFunction[field as ApiRiskingEconFunctionKey],
			);
		}
	});
	return riskingEconFunctionResult;
};

export const toApiRiskingEconFunction = (
	risking: IRiskingEconFunction & Partial<IApiRowField>,
): ApiRiskingEconFunction => {
	const apiRiskingEconFunction: Record<
		string,
		ApiRiskingEconFunction[ApiRiskingEconFunctionKey] | ApiEconFunctionRow[]
	> = {};
	Object.entries(API_RISKING_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiRiskingEconFunction[field] = read(risking);
		}
	});
	return apiRiskingEconFunction;
};
