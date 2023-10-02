import { camelCase, isNil } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { isObject, RequestStructureError } from '@src/helpers/validation';
import { IFluidModelComponent } from '@src/models/econ/fluid-model';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

export type IFluidModelComponentField<T> = IField<IFluidModelComponent, T>;

const fluidModelComponentReadWriteField = <K extends keyof IFluidModelComponent, TParsed = IFluidModelComponent[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IFluidModelComponent, K, TParsed>(key, definition, options);

export const API_FLUID_MODEL_COMPONENT = {
	percentage: fluidModelComponentReadWriteField('percentage', NUMBER_FIELD),
	// The price field is included in the mongo records but is not used in the UI
	//price: fluidModelComponentReadWriteDbField('price', NUMBER_FIELD),
};

export type ApiFluidModelComponentKey = keyof typeof API_FLUID_MODEL_COMPONENT;

type TypeOfField<FT> = FT extends IFluidModelComponentField<infer T> ? T : never;

export type ApiFluidModelComponent = {
	[key in ApiFluidModelComponentKey]?: TypeOfField<(typeof API_FLUID_MODEL_COMPONENT)[key]>;
};

export const getApiFluidModelComponentField = (
	field: string,
): (typeof API_FLUID_MODEL_COMPONENT)[ApiFluidModelComponentKey] | null =>
	getApiField(field, API_FLUID_MODEL_COMPONENT);

export const toFluidModelComponent = (apiFluidModelEconFunction: ApiFluidModelComponent): IFluidModelComponent => {
	const fluidModelEconFunctionResult = { percentage: 0, price: 0 };

	if (isNil(apiFluidModelEconFunction)) {
		return fluidModelEconFunctionResult;
	}

	Object.entries(API_FLUID_MODEL_COMPONENT).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (fluidModel: ApiFluidModelComponent, value: unknown) => void;
			coercedWrite(fluidModelEconFunctionResult, apiFluidModelEconFunction[field as ApiFluidModelComponentKey]);
		}
	});

	return fluidModelEconFunctionResult;
};

export const toApiFluidModelComponent = (fluidModel: IFluidModelComponent): ApiFluidModelComponent => {
	const apiFluidModelEconFunction: Record<string, ApiFluidModelComponent[ApiFluidModelComponentKey]> = {};
	Object.entries(API_FLUID_MODEL_COMPONENT).forEach(([field, { read }]) => {
		if (read) {
			apiFluidModelEconFunction[field] = read(fluidModel);
		}
	});
	return apiFluidModelEconFunction;
};

export const parseApiFluidModelComponent = (data: unknown, key: string, location?: string): ApiFluidModelComponent => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const productionFixedExpensesFields: Record<string, ApiFluidModelComponent[ApiFluidModelComponentKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionFixedExpensesFieldsField = getApiFluidModelComponentField(field);

				if (!productionFixedExpensesFieldsField) {
					return;
				}

				const { write, parse } = productionFixedExpensesFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFluidModelComponent[ApiFluidModelComponentKey]);

				if (write) {
					productionFixedExpensesFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionFixedExpensesFields;
};
