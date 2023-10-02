import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { ISeveranceTaxEconFunction } from '@src/models/econ/production-taxes';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { taxPhaseReadWriteDbField } from './severance-tax-phases-fields';

export type SeveranceTaxEconFunctionField<T> = IField<ISeveranceTaxEconFunction, T>;
export type ApiSeveranceTaxEconFunctionKey = keyof typeof API_SEVERANCE_TAX;

type TypeOfField<FT> = FT extends SeveranceTaxEconFunctionField<infer T> ? T : never;

export type ApiSeveranceTaxEconFunction = {
	[key in ApiSeveranceTaxEconFunctionKey]?: TypeOfField<(typeof API_SEVERANCE_TAX)[key]>;
};

const severanceTaxEconFunctionReadWriteDbField = <
	K extends keyof ISeveranceTaxEconFunction,
	TParsed = ISeveranceTaxEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ISeveranceTaxEconFunction, K, TParsed>(key, definition, options);

export const API_SEVERANCE_TAX = {
	state: severanceTaxEconFunctionReadWriteDbField('state', STRING_FIELD),
	shrinkageCondition: severanceTaxEconFunctionReadWriteDbField('shrinkage_condition', STRING_FIELD),
	calculation: severanceTaxEconFunctionReadWriteDbField('calculation', STRING_FIELD),
	rateType: severanceTaxEconFunctionReadWriteDbField('rate_type', STRING_FIELD),
	rowsCalculationMethod: severanceTaxEconFunctionReadWriteDbField('rows_calculation_method', STRING_FIELD),
	oil: taxPhaseReadWriteDbField('oil'),
	gas: taxPhaseReadWriteDbField('gas'),
	ngl: taxPhaseReadWriteDbField('ngl'),
	dripCondensate: taxPhaseReadWriteDbField('drip_condensate'),
};

export const getApiSeveranceTaxEconFunctionField = (
	field: string,
): (typeof API_SEVERANCE_TAX)[ApiSeveranceTaxEconFunctionKey] | null => getApiField(field, API_SEVERANCE_TAX);

export const getRequiredFields: ApiSeveranceTaxEconFunctionKey[] = Object.entries(API_SEVERANCE_TAX)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiSeveranceTaxEconFunctionKey);

export const toSeveranceTaxEconFunction = (
	ApiSeveranceTaxEconFunction: ApiSeveranceTaxEconFunction,
): ISeveranceTaxEconFunction | Record<string, unknown> => {
	const productionTaxesEconFunctionResult = {};

	if (isNil(ApiSeveranceTaxEconFunction)) {
		return productionTaxesEconFunctionResult;
	}

	Object.entries(API_SEVERANCE_TAX).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (AdValorem: ISeveranceTaxEconFunction, value: unknown) => void;
			coercedWrite(
				productionTaxesEconFunctionResult as ISeveranceTaxEconFunction,
				ApiSeveranceTaxEconFunction[field as ApiSeveranceTaxEconFunctionKey],
			);
		}
	});
	return productionTaxesEconFunctionResult;
};

export const toApiSeveranceTaxEconFunction = (
	adValoremTaxEconFunction: ISeveranceTaxEconFunction,
): ApiSeveranceTaxEconFunction => {
	const ApiSeveranceTaxEconFunction: Record<string, ApiSeveranceTaxEconFunction[ApiSeveranceTaxEconFunctionKey]> = {};
	Object.entries(API_SEVERANCE_TAX).forEach(([field, { read }]) => {
		if (read) {
			ApiSeveranceTaxEconFunction[field] = read(adValoremTaxEconFunction);
		}
	});
	return ApiSeveranceTaxEconFunction;
};

export const parseApiSeveranceTaxEconFunction = (data: unknown, location?: string): ApiSeveranceTaxEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ProductionTaxes data structure`, location);
	}

	const productionTaxesEconFunction: Record<string, ApiSeveranceTaxEconFunction[ApiSeveranceTaxEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionTaxesEconFunctionField = getApiSeveranceTaxEconFunctionField(field);

				if (!productionTaxesEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = productionTaxesEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiSeveranceTaxEconFunction[ApiSeveranceTaxEconFunctionKey]);

				if (write) {
					productionTaxesEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionTaxesEconFunction;
};
