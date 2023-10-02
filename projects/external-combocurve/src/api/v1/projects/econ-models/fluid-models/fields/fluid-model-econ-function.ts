import { camelCase, isNil, set } from 'lodash';

import { getApiField, IField } from '@src/api/v1/fields';
import { isObject, RequestStructureError } from '@src/helpers/validation';
import { FluidModelEconFunction } from '@src/models/econ/fluid-model';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	API_FLUID_MODEL_PHASE_FIELDS,
	ApiFluidModelPhase,
	parseApiFluidModelPhase,
	toApiFluidModelPhase,
	toFluidModelPhase,
} from './fluid-model-phase';

export type IFluidModelEconFunctionField<T> = IField<FluidModelEconFunction, T>;

const apiFluidModelEconFunctionReadWriteField = <K extends keyof FluidModelEconFunction>(
	key: K,
): IFluidModelEconFunctionField<ApiFluidModelPhase> => ({
	type: OpenApiDataType.object,
	properties: API_FLUID_MODEL_PHASE_FIELDS,
	read: (fluidModelComposition) => toApiFluidModelPhase(fluidModelComposition[key]),
	parse: (value, location) => parseApiFluidModelPhase(value, key, location),
	write: (fluidModelComposition, value) => set(fluidModelComposition, key, toFluidModelPhase(value)),
});

export const API_FLUID_MODEL_ECON_FUNCTION = {
	oil: apiFluidModelEconFunctionReadWriteField('oil'),
	gas: apiFluidModelEconFunctionReadWriteField('gas'),
	water: apiFluidModelEconFunctionReadWriteField('water'),
	ngl: apiFluidModelEconFunctionReadWriteField('ngl'),
	dripCondensate: apiFluidModelEconFunctionReadWriteField('drip_condensate'),
};

export type ApiFluidModelEconFunctionKey = keyof typeof API_FLUID_MODEL_ECON_FUNCTION;

type TypeOfField<FT> = FT extends IFluidModelEconFunctionField<infer T> ? T : never;

export type ApiFluidModelEconFunction = {
	[key in ApiFluidModelEconFunctionKey]?: TypeOfField<(typeof API_FLUID_MODEL_ECON_FUNCTION)[key]>;
};

export const getApiFluidModelEconFunctionField = (
	field: string,
): (typeof API_FLUID_MODEL_ECON_FUNCTION)[ApiFluidModelEconFunctionKey] | null =>
	getApiField(field, API_FLUID_MODEL_ECON_FUNCTION);

export const toFluidModelEconFunction = (
	apiFluidModelEconFunction: ApiFluidModelEconFunction,
): FluidModelEconFunction | Record<string, unknown> => {
	const fluidModelEconFunctionResult = {};

	if (isNil(apiFluidModelEconFunction)) {
		return fluidModelEconFunctionResult;
	}

	Object.entries(API_FLUID_MODEL_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (fluidModelEconFunction: FluidModelEconFunction, value: unknown) => void;
			coercedWrite(
				fluidModelEconFunctionResult as FluidModelEconFunction,
				apiFluidModelEconFunction[field as ApiFluidModelEconFunctionKey],
			);
		}
	});
	return fluidModelEconFunctionResult;
};

export const toApiFluidModelEconFunction = (fluidModel: FluidModelEconFunction): ApiFluidModelEconFunction => {
	const apiFluidModelEconFunction: Record<string, ApiFluidModelEconFunction[ApiFluidModelEconFunctionKey]> = {};
	Object.entries(API_FLUID_MODEL_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiFluidModelEconFunction[field] = read(fluidModel);
		}
	});
	return apiFluidModelEconFunction;
};

export const parseApiFluidModelEconFunction = (
	data: unknown,
	key: string,
	location?: string,
): ApiFluidModelEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const apiFluidModelEconFunction: Record<string, ApiFluidModelEconFunction[ApiFluidModelEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiFluidModelEconFunctionField = getApiFluidModelEconFunctionField(field);

				if (!apiFluidModelEconFunctionField) {
					return;
				}
				const { write, parse } = apiFluidModelEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFluidModelEconFunction[ApiFluidModelEconFunctionKey]);

				if (write) {
					apiFluidModelEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiFluidModelEconFunction;
};
