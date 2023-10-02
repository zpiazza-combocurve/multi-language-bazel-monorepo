import { set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IPricingEconFunction, PricingType } from '@src/models/econ/pricing';
import { IFieldDefinition } from '@src/helpers/fields/field-definition';
import { isNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { STRING_FIELD } from '@src/helpers/fields';

import { parsePricingType } from '../validation';
import { readWriteNullableNumberDbField } from '../../fields';
import { rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

import { IPricingEconFunctionField } from './pricing-econ-function';

export type IPricingTypeField<T> = IField<PricingType, T>;

export type ApiPricingTypeKey = keyof typeof PRICING_TYPE;
type TypeOfPricingField<FT> = FT extends IPricingTypeField<infer T> ? T : never;

export type ApiPricingType = {
	[key in ApiPricingTypeKey]?: TypeOfPricingField<(typeof PRICING_TYPE)[key]>;
};

const pricingModeTypeReadWriteDbField = <K extends keyof PricingType, TParsed = PricingType[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<PricingType, K, TParsed>(key, definition, options);

const PRICING_TYPE = {
	cap: readWriteNullableNumberDbField('cap'),
	escalationModel: pricingModeTypeReadWriteDbField('escalation_model', STRING_FIELD),
	rows: rowsReadWriteDbField(),
};
export const getPricingEconFunctionTypeFields = <K extends keyof IPricingEconFunction>(
	key: K,
): IPricingEconFunctionField<ApiPricingType> => ({
	type: OpenApiDataType.object,
	properties: PRICING_TYPE,
	parse: (data: unknown, location?: string) => parsePricingType(data, location),
	read: (pricing) => toApiPricingType(pricing[key]),
	write: (pricing, value) => set(pricing, [key], toPricingType(value)),
});

const toPricingType = (apiPricingType: ApiPricingType): PricingType | Record<string, unknown> => {
	const pricingTypeResult = {};

	if (isNil(apiPricingType)) {
		return pricingTypeResult;
	}

	Object.entries(PRICING_TYPE).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (pricing: PricingType, value: unknown) => void;
			coercedWrite(pricingTypeResult as PricingType, apiPricingType[field as ApiPricingTypeKey]);
		}
	});
	return pricingTypeResult;
};

const toApiPricingType = (pricingType: PricingType): ApiPricingType => {
	const apiPricingType: Record<string, ApiPricingType[ApiPricingTypeKey]> = {};
	Object.entries(PRICING_TYPE).forEach(([field, { read }]) => {
		if (read) {
			apiPricingType[field] = read(pricingType) as ApiPricingType[ApiPricingTypeKey];
		}
	});
	return apiPricingType;
};

export const getApiPricingTypeField = (field: string): (typeof PRICING_TYPE)[ApiPricingTypeKey] | null =>
	getApiField(field, PRICING_TYPE);
