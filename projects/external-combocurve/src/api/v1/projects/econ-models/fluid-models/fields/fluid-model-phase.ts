import { camelCase, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { isObject, RequestStructureError } from '@src/helpers/validation';
import { IFluidModelPhase } from '@src/models/econ/fluid-model';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	API_FLUID_MODEL_COMPOSITION,
	ApiFluidModelComposition,
	parseApiFluidModelComposition,
	toApiFluidModelComposition,
	toFluidModelComposition,
} from '../../fluid-models/fields/fluid-model-composition';

export type FluidModelPhaseField<T> = IField<IFluidModelPhase, T>;
export type ApiFluidModelPhaseFieldsKey = keyof typeof API_FLUID_MODEL_PHASE_FIELDS;

type TypeOfField<FT> = FT extends FluidModelPhaseField<infer T> ? T : never;

export type ApiFluidModelPhase = {
	[key in ApiFluidModelPhaseFieldsKey]?: TypeOfField<(typeof API_FLUID_MODEL_PHASE_FIELDS)[key]>;
};

const apiFluidModelPhaseCompositionReadWriteField = (): FluidModelPhaseField<ApiFluidModelComposition> => ({
	type: OpenApiDataType.object,
	properties: API_FLUID_MODEL_COMPOSITION,
	read: (fluidModelComposition) => toApiFluidModelComposition(fluidModelComposition.composition),
	parse: (value, location) => parseApiFluidModelComposition(value, 'composition', location),
	write: (fluidModelComposition, value) => set(fluidModelComposition, 'composition', toFluidModelComposition(value)),
});

const apiFluidModelPhaseReadWriteField = <K extends keyof IFluidModelPhase, TParsed = IFluidModelPhase[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IFluidModelPhase, K, TParsed>(key, definition, options);

export const API_FLUID_MODEL_PHASE_FIELDS = {
	composition: apiFluidModelPhaseCompositionReadWriteField(),
	criteria: apiFluidModelPhaseReadWriteField('criteria', getStringEnumField(['flat'])),
};

export const getApiFluidModelPhaseField = (
	field: string,
): (typeof API_FLUID_MODEL_PHASE_FIELDS)[ApiFluidModelPhaseFieldsKey] | null =>
	getApiField(field, API_FLUID_MODEL_PHASE_FIELDS);

//TODO: refactor to use shared logic for parsing and conversions after it is merged
export const toFluidModelPhase = (
	apiFluidModelPhaseFields: ApiFluidModelPhase,
): IFluidModelPhase | Record<string, unknown> => {
	const fluidModelPhaseResult = {};

	if (isNil(apiFluidModelPhaseFields)) {
		return fluidModelPhaseResult;
	}

	Object.entries(API_FLUID_MODEL_PHASE_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (FixedExpensesFields: IFluidModelPhase, value: unknown) => void;
			coercedWrite(
				fluidModelPhaseResult as IFluidModelPhase,
				apiFluidModelPhaseFields[field as ApiFluidModelPhaseFieldsKey],
			);
		}
	});

	return fluidModelPhaseResult;
};

export const toApiFluidModelPhase = (fluidModelPhase: IFluidModelPhase): ApiFluidModelPhase => {
	const apiFluidModelPhase: Record<string, ApiFluidModelPhase[ApiFluidModelPhaseFieldsKey]> = {};
	Object.entries(API_FLUID_MODEL_PHASE_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiFluidModelPhase[field] = read(fluidModelPhase);
		}
	});
	return apiFluidModelPhase;
};

export const parseApiFluidModelPhase = (data: unknown, key: string, location?: string): ApiFluidModelPhase => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const fluidModelPhaseFields: Record<string, ApiFluidModelPhase[ApiFluidModelPhaseFieldsKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	if (data.criteria === undefined) {
		data.criteria = 'flat';
	}

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionFixedExpensesFieldsField = getApiFluidModelPhaseField(field);

				if (!productionFixedExpensesFieldsField) {
					return;
				}
				const { write, parse } = productionFixedExpensesFieldsField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiFluidModelPhase[ApiFluidModelPhaseFieldsKey]);

				if (write) {
					fluidModelPhaseFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return fluidModelPhaseFields;
};
