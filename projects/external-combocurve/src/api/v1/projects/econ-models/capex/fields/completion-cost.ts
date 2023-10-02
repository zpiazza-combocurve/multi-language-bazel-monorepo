import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '@src/api/v1/wells/validation';
import { ICompletionCostEconFunction } from '@src/models/econ/capex';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { completionCostRowsField } from './completion-cost-rows';
import { dollarPerFtHorizontalRowsField } from './completion-cost-dollar-per-horizontal-rows';

export type CompletionCostEconFunctionField<T> = IField<ICompletionCostEconFunction, T>;

const completionCostEconFunctionReadWriteDbField = <
	K extends keyof ICompletionCostEconFunction,
	TParsed = ICompletionCostEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ICompletionCostEconFunction, K, TParsed>(key, definition, options);

export const API_COMPLETION_COST_ECON_FUNCTION = {
	dollarPerFtOfVertical: completionCostEconFunctionReadWriteDbField('dollar_per_ft_of_vertical', NUMBER_FIELD),
	dollarPerFtOfHorizontal: dollarPerFtHorizontalRowsField(),
	fixedCost: completionCostEconFunctionReadWriteDbField('fixed_cost', NUMBER_FIELD),
	tangiblePct: completionCostEconFunctionReadWriteDbField('tangible_pct', NUMBER_FIELD),
	calculation: completionCostEconFunctionReadWriteDbField('calculation', STRING_FIELD),
	escalationModel: completionCostEconFunctionReadWriteDbField('escalation_model', STRING_FIELD),
	depreciationModel: completionCostEconFunctionReadWriteDbField('depreciation_model', STRING_FIELD),
	dealTerms: completionCostEconFunctionReadWriteDbField('deal_terms', NUMBER_FIELD),
	rows: completionCostRowsField(),
};

export type ApiCompletionCostEconFunctionKey = keyof typeof API_COMPLETION_COST_ECON_FUNCTION;

type TypeOfField<FT> = FT extends CompletionCostEconFunctionField<infer T> ? T : never;

export type ApiCompletionCostEconFunction = {
	[key in ApiCompletionCostEconFunctionKey]?: TypeOfField<(typeof API_COMPLETION_COST_ECON_FUNCTION)[key]>;
};

export const getApiCompletionCostEconFunctionField = (
	field: string,
): (typeof API_COMPLETION_COST_ECON_FUNCTION)[ApiCompletionCostEconFunctionKey] | null =>
	getApiField(field, API_COMPLETION_COST_ECON_FUNCTION);

export const getRequiredCompletionCostFields: ApiCompletionCostEconFunctionKey[] = Object.entries(
	API_COMPLETION_COST_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiCompletionCostEconFunctionKey);

export const toCompletionCostEconFunction = (
	apiCompletionCostEconFunction?: ApiCompletionCostEconFunction,
): ICompletionCostEconFunction | Record<string, unknown> => {
	const completionCostEconFunctionResult = {};

	if (isNil(apiCompletionCostEconFunction)) {
		return completionCostEconFunctionResult;
	}

	Object.entries(API_COMPLETION_COST_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				completionCostEconFunction: ICompletionCostEconFunction,
				value: unknown,
			) => void;
			coercedWrite(
				completionCostEconFunctionResult as ICompletionCostEconFunction,
				apiCompletionCostEconFunction[field as ApiCompletionCostEconFunctionKey],
			);
		}
	});

	return completionCostEconFunctionResult as ICompletionCostEconFunction;
};

export const toApiCompletionCostEconFunction = (
	completionCostEconFunction: ICompletionCostEconFunction | undefined,
): ApiCompletionCostEconFunction | undefined => {
	if (completionCostEconFunction === undefined) {
		return;
	}
	const apiCompletionCostEconFunction: Record<
		string,
		ApiCompletionCostEconFunction[ApiCompletionCostEconFunctionKey]
	> = {};
	Object.entries(API_COMPLETION_COST_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiCompletionCostEconFunction[field] = read(completionCostEconFunction);
		}
	});
	return apiCompletionCostEconFunction;
};

export const parseCompletionCostEconFunction = (data: unknown, location?: string): ApiCompletionCostEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Completion Cost data structure`, location);
	}
	const apiCompletionCostEconFunction: Record<
		string,
		ApiCompletionCostEconFunction[ApiCompletionCostEconFunctionKey]
	> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiCompletionCostEconFunctionField = getApiCompletionCostEconFunctionField(field);

				if (!apiCompletionCostEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiCompletionCostEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiCompletionCostEconFunction[ApiCompletionCostEconFunctionKey]);

				if (write) {
					apiCompletionCostEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiCompletionCostEconFunction;
};
