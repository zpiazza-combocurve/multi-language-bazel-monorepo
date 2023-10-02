import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IBreakeven, IPricing, Pricing_KEY, Pricing_NAME } from '@src/models/econ/pricing';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';
import { parsePricingEconFunction } from '../validation';

import {
	API_PRICING_ECON_FUNCTION,
	ApiPricingEconFunction,
	toApiPricingEconFunction,
	toPricingEconFunction,
} from './pricing-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IPricingField<T> = IField<IPricing, T>;

const pricingField: IPricingField<ApiPricingEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_PRICING_ECON_FUNCTION,
	parse: parsePricingEconFunction,
	read: (pricing) => toApiPricingEconFunction(get(pricing, ['econ_function', 'price_model'])),
	write: (pricing, value) => set(pricing, ['econ_function', 'price_model'], toPricingEconFunction(value)),
};

//TODO: this breakeven field is going to be deprecated
//but we still need to send it to flex_cc. For now, sending the values as default.
const breakevenField: IField<IPricing, IBreakeven> = {
	type: OpenApiDataType.object,
	write: (pricing) =>
		set(pricing, ['econ_function', 'breakeven'], {
			npv_discount: 0,
			based_on_price_ratio: 'no',
			price_ratio: '',
		}),
};

const API_PRICING_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	priceModel: pricingField,
	breakeven: breakevenField,
};

export const toApiPricing = (pricing: IPricing): ApiPricing => {
	const apiPricing: Record<string, ApiPricing[ApiPricingKey]> = {};
	Object.entries(API_PRICING_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiPricing[field] = read(pricing);
		}
	});
	return apiPricing;
};

export const toPricing = (apiPricing: ApiPricing, projectId: Types.ObjectId): IPricing => {
	const pricing = {};
	Object.entries(API_PRICING_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (pricing: Partial<IPricing>, value: unknown) => void;
			coercedWrite(pricing, apiPricing[field as ApiPricingKey]);
		}
	});
	return {
		...pricing,
		assumptionKey: Pricing_KEY,
		assumptionName: Pricing_NAME,
		project: projectId,
	} as IPricing;
};

export type ApiPricingKey = keyof typeof API_PRICING_FIELDS;

type TypeOfField<FT> = FT extends IPricingField<infer T> ? T : never;

export type ApiPricing = {
	[key in ApiPricingKey]?: TypeOfField<(typeof API_PRICING_FIELDS)[key]>;
};

const isApiPricingField = (field: string): field is keyof typeof API_PRICING_FIELDS =>
	Object.keys(API_PRICING_FIELDS).includes(field);

export const getApiPricingField = (field: string): (typeof API_PRICING_FIELDS)[ApiPricingKey] | null => {
	if (!isApiPricingField(field)) {
		return null;
	}
	return API_PRICING_FIELDS[field];
};

export const getRequiredFields = (pricing: ApiPricing): ApiPricingKey[] => {
	const baseRequired = Object.entries(API_PRICING_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiPricingKey);
	if (pricing.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_PRICING_FIELDS, {
		value: merge({ project: project._id, assumptionKey: Pricing_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_PRICING_FIELDS);

export const sortableFields = sortableDbFields(API_PRICING_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_PRICING_FIELDS, undefined, cursor);

export default API_PRICING_FIELDS;
