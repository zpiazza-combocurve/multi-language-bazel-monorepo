import { isNil } from 'lodash';

import { getApiField, IField } from '@src/api/v1/fields';
import { IPricingEconFunction } from '@src/models/econ/pricing';

import { getPricingEconFunctionTypeFields } from './pricing-type';

export const API_PRICING_ECON_FUNCTION = {
	oil: getPricingEconFunctionTypeFields('oil'),
	gas: getPricingEconFunctionTypeFields('gas'),
	ngl: getPricingEconFunctionTypeFields('ngl'),
	dripCondensate: getPricingEconFunctionTypeFields('drip_condensate'),
};

export type IPricingEconFunctionField<T> = IField<IPricingEconFunction, T>;
export type ApiPricingEconFunctionKey = keyof typeof API_PRICING_ECON_FUNCTION;

type TypeOfField<FT> = FT extends IPricingEconFunctionField<infer T> ? T : never;

export type ApiPricingEconFunction = {
	[key in ApiPricingEconFunctionKey]?: TypeOfField<(typeof API_PRICING_ECON_FUNCTION)[key]>;
};

export const getApiPricingEconFunctionField = (
	field: string,
): (typeof API_PRICING_ECON_FUNCTION)[ApiPricingEconFunctionKey] | null =>
	getApiField(field, API_PRICING_ECON_FUNCTION);

export const getRequiredFields: ApiPricingEconFunctionKey[] = Object.entries(API_PRICING_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiPricingEconFunctionKey);

export const toPricingEconFunction = (
	apiPricingEconFunction: ApiPricingEconFunction,
): IPricingEconFunction | Record<string, unknown> => {
	const pricingEconFunctionResult = {};

	if (isNil(apiPricingEconFunction)) {
		return pricingEconFunctionResult;
	}

	Object.entries(API_PRICING_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (Pricing: IPricingEconFunction, value: unknown) => void;
			coercedWrite(
				pricingEconFunctionResult as IPricingEconFunction,
				apiPricingEconFunction[field as ApiPricingEconFunctionKey],
			);
		}
	});
	return pricingEconFunctionResult;
};

export const toApiPricingEconFunction = (pricing: IPricingEconFunction): ApiPricingEconFunction => {
	const apiPricingEconFunction: Record<string, ApiPricingEconFunction[ApiPricingEconFunctionKey]> = {};
	Object.entries(API_PRICING_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiPricingEconFunction[field] = read(pricing);
		}
	});
	return apiPricingEconFunction;
};
