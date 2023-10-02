import { camelCase, isNil, set } from 'lodash';

import { getApiField, IField } from '@src/api/v1/fields';
import { isObject, RequestStructureError } from '@src/helpers/validation';
import { FluidModelComposition } from '@src/models/econ/fluid-model';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	API_FLUID_MODEL_COMPONENT,
	ApiFluidModelComponent,
	parseApiFluidModelComponent,
	toApiFluidModelComponent,
	toFluidModelComponent,
} from './fluid-model-component';

export type IFluidModelCompositionField<T> = IField<FluidModelComposition, T>;

const apiFluidModelComponentReadWriteField = <K extends keyof FluidModelComposition>(
	key: K,
): IFluidModelCompositionField<ApiFluidModelComponent> => ({
	type: OpenApiDataType.object,
	properties: API_FLUID_MODEL_COMPONENT,
	read: (fluidModelComposition) => toApiFluidModelComponent(fluidModelComposition[key]),
	parse: (value, location) => parseApiFluidModelComponent(value, key, location),
	write: (fluidModelComposition, value) => set(fluidModelComposition, key, toFluidModelComponent(value)),
});

export const API_FLUID_MODEL_COMPOSITION = {
	N2: apiFluidModelComponentReadWriteField('N2'),
	CO2: apiFluidModelComponentReadWriteField('CO2'),
	C1: apiFluidModelComponentReadWriteField('C1'),
	C2: apiFluidModelComponentReadWriteField('C2'),
	C3: apiFluidModelComponentReadWriteField('C3'),
	iC4: apiFluidModelComponentReadWriteField('iC4'),
	nC4: apiFluidModelComponentReadWriteField('nC4'),
	iC5: apiFluidModelComponentReadWriteField('iC5'),
	nC5: apiFluidModelComponentReadWriteField('nC5'),
	iC6: apiFluidModelComponentReadWriteField('iC6'),
	nC6: apiFluidModelComponentReadWriteField('nC6'),
	C7: apiFluidModelComponentReadWriteField('C7'),
	C8: apiFluidModelComponentReadWriteField('C8'),
	C9: apiFluidModelComponentReadWriteField('C9'),
	C10Plus: apiFluidModelComponentReadWriteField('C10+'),
	H2S: apiFluidModelComponentReadWriteField('H2S'),
	H2: apiFluidModelComponentReadWriteField('H2'),
	H2O: apiFluidModelComponentReadWriteField('H2O'),
	He: apiFluidModelComponentReadWriteField('He'),
	O2: apiFluidModelComponentReadWriteField('O2'),
};

export type ApiFluidModelCompositionKey = keyof typeof API_FLUID_MODEL_COMPOSITION;

type TypeOfField<FT> = FT extends IFluidModelCompositionField<infer T> ? T : never;

export type ApiFluidModelComposition = {
	[key in ApiFluidModelCompositionKey]?: TypeOfField<(typeof API_FLUID_MODEL_COMPOSITION)[key]>;
};

export const getApiFluidModelCompositionField = (
	field: string,
): (typeof API_FLUID_MODEL_COMPOSITION)[ApiFluidModelCompositionKey] | null =>
	getApiField(field, API_FLUID_MODEL_COMPOSITION);

export const toFluidModelComposition = (apiFluidModelComposition: ApiFluidModelComposition): FluidModelComposition => {
	const fluidModelCompositionResult = {};

	if (isNil(apiFluidModelComposition)) {
		return fluidModelCompositionResult;
	}

	Object.entries(API_FLUID_MODEL_COMPOSITION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (fluidModelComposition: FluidModelComposition, value: unknown) => void;
			coercedWrite(fluidModelCompositionResult, apiFluidModelComposition[field as ApiFluidModelCompositionKey]);
		}
	});

	return fluidModelCompositionResult;
};

export const toApiFluidModelComposition = (fluidModelComposition: FluidModelComposition): ApiFluidModelComposition => {
	const apiFluidModelEconFunction: Record<string, ApiFluidModelComposition[ApiFluidModelCompositionKey]> = {};
	Object.entries(API_FLUID_MODEL_COMPOSITION).forEach(([field, { read }]) => {
		if (read) {
			apiFluidModelEconFunction[field] = read(fluidModelComposition);
		}
	});
	return apiFluidModelEconFunction;
};

export const parseApiFluidModelComposition = (
	data: unknown,
	key: string,
	location?: string,
): ApiFluidModelComposition => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const productionFixedExpensesFields: Record<string, ApiFluidModelComposition[ApiFluidModelCompositionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionFixedExpensesFieldsField = getApiFluidModelCompositionField(field);

				if (!productionFixedExpensesFieldsField) {
					return;
				}

				const { write, parse } = productionFixedExpensesFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFluidModelComposition[ApiFluidModelCompositionKey]);

				if (write) {
					productionFixedExpensesFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionFixedExpensesFields;
};
