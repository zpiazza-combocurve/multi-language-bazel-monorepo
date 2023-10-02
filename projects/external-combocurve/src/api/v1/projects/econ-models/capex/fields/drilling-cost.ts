import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IDrillingCostEconFunction } from '@src/models/econ/capex';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { drillingCostRowField } from './drilling-cost-rows';

export type DrillingCostEconFunctionField<T> = IField<IDrillingCostEconFunction, T>;

const drillingCostEconFunctionReadWriteDbField = <
	K extends keyof IDrillingCostEconFunction,
	TParsed = IDrillingCostEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDrillingCostEconFunction, K, TParsed>(key, definition, options);

export const API_DRILLING_COST_ECON_FUNCTION = {
	dollarPerFtOfVertical: drillingCostEconFunctionReadWriteDbField('dollar_per_ft_of_vertical', NUMBER_FIELD),
	dollarPerFtOfHorizontal: drillingCostEconFunctionReadWriteDbField('dollar_per_ft_of_horizontal', NUMBER_FIELD),
	fixedCost: drillingCostEconFunctionReadWriteDbField('fixed_cost', NUMBER_FIELD),
	tangiblePct: drillingCostEconFunctionReadWriteDbField('tangible_pct', NUMBER_FIELD),
	calculation: drillingCostEconFunctionReadWriteDbField('calculation', STRING_FIELD),
	escalationModel: drillingCostEconFunctionReadWriteDbField('escalation_model', STRING_FIELD),
	depreciationModel: drillingCostEconFunctionReadWriteDbField('depreciation_model', STRING_FIELD),
	dealTerms: drillingCostEconFunctionReadWriteDbField('deal_terms', NUMBER_FIELD),
	rows: drillingCostRowField(),
};

export type ApiDrillingCostEconFunctionKey = keyof typeof API_DRILLING_COST_ECON_FUNCTION;

type TypeOfField<FT> = FT extends DrillingCostEconFunctionField<infer T> ? T : never;

export type ApiDrillingCostEconFunction = {
	[key in ApiDrillingCostEconFunctionKey]?: TypeOfField<(typeof API_DRILLING_COST_ECON_FUNCTION)[key]>;
};

export const getApiDrillingCostEconFunctionField = (
	field: string,
): (typeof API_DRILLING_COST_ECON_FUNCTION)[ApiDrillingCostEconFunctionKey] | null =>
	getApiField(field, API_DRILLING_COST_ECON_FUNCTION);

export const getRequiredDrillingCostFields: ApiDrillingCostEconFunctionKey[] = Object.entries(
	API_DRILLING_COST_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDrillingCostEconFunctionKey);

export const toDrillingCostEconFunction = (
	apiDrillingCostEconFunction?: ApiDrillingCostEconFunction,
): IDrillingCostEconFunction | Record<string, unknown> => {
	const drillingCostEconFunctionResult = {};

	if (isNil(apiDrillingCostEconFunction)) {
		return drillingCostEconFunctionResult;
	}

	Object.entries(API_DRILLING_COST_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (drillingCostEconFunction: IDrillingCostEconFunction, value: unknown) => void;
			coercedWrite(
				drillingCostEconFunctionResult as IDrillingCostEconFunction,
				apiDrillingCostEconFunction[field as ApiDrillingCostEconFunctionKey],
			);
		}
	});

	return drillingCostEconFunctionResult as IDrillingCostEconFunction;
};

export const toApiDrillingCostEconFunction = (
	drillingCostEconFunction?: IDrillingCostEconFunction,
): ApiDrillingCostEconFunction | undefined => {
	if (drillingCostEconFunction === undefined) {
		return;
	}
	const apiDrillingCostEconFunction: Record<string, ApiDrillingCostEconFunction[ApiDrillingCostEconFunctionKey]> = {};
	Object.entries(API_DRILLING_COST_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiDrillingCostEconFunction[field] = read(drillingCostEconFunction);
		}
	});
	return apiDrillingCostEconFunction;
};

export const parseDrillingCostEconFunction = (data: unknown, location?: string): ApiDrillingCostEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Drilling Cost data structure`, location);
	}
	const apiDrillingCostEconFunction: Record<string, ApiDrillingCostEconFunction[ApiDrillingCostEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiDrillingCostEconFunctionField = getApiDrillingCostEconFunctionField(field);

				if (!apiDrillingCostEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiDrillingCostEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiDrillingCostEconFunction[ApiDrillingCostEconFunctionKey]);

				if (write) {
					apiDrillingCostEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiDrillingCostEconFunction;
};
