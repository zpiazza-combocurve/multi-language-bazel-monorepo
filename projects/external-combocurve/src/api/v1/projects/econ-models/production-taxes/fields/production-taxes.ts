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
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { IProductionTaxes, ProductionTaxes_KEY, ProductionTaxes_NAME } from '@src/models/econ/production-taxes';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	API_AD_VALOREM_ECON_FUNCTION,
	ApiAdValoremEconFunction,
	parseApiAdValoremTaxEconFunction,
	toAdValoremTaxEconFunction,
	toApiAdValoremTaxEconFunction,
} from './production-taxes-advalorem-econ-function';
import {
	API_SEVERANCE_TAX,
	ApiSeveranceTaxEconFunction,
	parseApiSeveranceTaxEconFunction,
	toApiSeveranceTaxEconFunction,
	toSeveranceTaxEconFunction,
} from './production-taxes-severance-tax-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IProductionTaxesField<T> = IField<IProductionTaxes, T>;

const adValoremTaxField: IProductionTaxesField<ApiAdValoremEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_AD_VALOREM_ECON_FUNCTION,
	parse: (data: unknown, location?: string) => parseApiAdValoremTaxEconFunction(data, location),
	read: (productionTaxes) => toApiAdValoremTaxEconFunction(get(productionTaxes, ['econ_function', 'ad_valorem_tax'])),
	write: (productionTaxes, value) =>
		set(productionTaxes, ['econ_function', 'ad_valorem_tax'], toAdValoremTaxEconFunction(value)),
};

const severanceTaxField: IProductionTaxesField<ApiSeveranceTaxEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_SEVERANCE_TAX,
	parse: (data: unknown, location?: string) => parseApiSeveranceTaxEconFunction(data, location),
	read: (productionTaxes) => toApiSeveranceTaxEconFunction(get(productionTaxes, ['econ_function', 'severance_tax'])),
	write: (productionTaxes, value) =>
		set(productionTaxes, ['econ_function', 'severance_tax'], toSeveranceTaxEconFunction(value)),
};

const API_PRODUCTION_TAXES_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	adValoremTax: adValoremTaxField,
	severanceTax: severanceTaxField,
};

export const toApiProductionTaxes = (productionTaxes: IProductionTaxes): ApiProductionTaxes => {
	const apiProductionTaxes: Record<string, ApiProductionTaxes[ApiProductionTaxesKey]> = {};
	Object.entries(API_PRODUCTION_TAXES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiProductionTaxes[field] = read(productionTaxes);
		}
	});
	return apiProductionTaxes;
};

export const toProductionTaxes = (
	apiProductionTaxes: ApiProductionTaxes,
	projectId: Types.ObjectId,
): IProductionTaxes => {
	const productionTaxes = {};
	Object.entries(API_PRODUCTION_TAXES_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (productionTaxes: Partial<IProductionTaxes>, value: unknown) => void;
			coercedWrite(productionTaxes, apiProductionTaxes[field as ApiProductionTaxesKey]);
		}
	});
	return {
		...productionTaxes,
		assumptionKey: ProductionTaxes_KEY,
		assumptionName: ProductionTaxes_NAME,
		project: projectId,
	} as IProductionTaxes;
};

export type ApiProductionTaxesKey = keyof typeof API_PRODUCTION_TAXES_FIELDS;

type TypeOfField<FT> = FT extends IProductionTaxesField<infer T> ? T : never;

export type ApiProductionTaxes = {
	[key in ApiProductionTaxesKey]?: TypeOfField<(typeof API_PRODUCTION_TAXES_FIELDS)[key]>;
};

const isApiProductionTaxesField = (field: string): field is keyof typeof API_PRODUCTION_TAXES_FIELDS =>
	Object.keys(API_PRODUCTION_TAXES_FIELDS).includes(field);

export const getApiProductionTaxesField = (
	field: string,
): (typeof API_PRODUCTION_TAXES_FIELDS)[ApiProductionTaxesKey] | null => {
	if (!isApiProductionTaxesField(field)) {
		return null;
	}
	return API_PRODUCTION_TAXES_FIELDS[field];
};

export const getRequiredFields = (productionTaxes: ApiProductionTaxes): ApiProductionTaxesKey[] => {
	const baseRequired = Object.entries(API_PRODUCTION_TAXES_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiProductionTaxesKey);
	if (productionTaxes.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_PRODUCTION_TAXES_FIELDS, {
		value: merge({ project: project._id, assumptionKey: ProductionTaxes_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_PRODUCTION_TAXES_FIELDS);

export const sortableFields = sortableDbFields(API_PRODUCTION_TAXES_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_PRODUCTION_TAXES_FIELDS, undefined, cursor);

export default API_PRODUCTION_TAXES_FIELDS;
