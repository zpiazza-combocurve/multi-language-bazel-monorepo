import { isNil, set } from 'lodash';

import { getApiField, IField } from '@src/api/v1/fields';
import { IDifferentialsEconFunction } from '@src/models/econ/differentials';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { parsePhaseGroup } from '../validation';

import { ApiPhaseGroup, PHASE_GROUP_FIELDS, toApiPhaseGroup, toPhaseGroup } from './phase-group-fields';

export type DifferentialsEconFunctionField<T> = IField<IDifferentialsEconFunction, T>;

const getDifferentialsEconFunctionTypeFields = <K extends keyof IDifferentialsEconFunction>(
	key: K,
): DifferentialsEconFunctionField<ApiPhaseGroup> => ({
	type: OpenApiDataType.object,
	properties: PHASE_GROUP_FIELDS,
	parse: (value: unknown, location?: string) => parsePhaseGroup(value, location),
	read: (differentialsEconFunction) => toApiPhaseGroup(differentialsEconFunction[key]),
	write: (differentialsEconFunction, value) => set(differentialsEconFunction, key, toPhaseGroup(value)),
});

export const API_DIFFERENTIALS_ECON_FUNCTION = {
	firstDifferential: getDifferentialsEconFunctionTypeFields('differentials_1'),
	secondDifferential: getDifferentialsEconFunctionTypeFields('differentials_2'),
	thirdDifferential: getDifferentialsEconFunctionTypeFields('differentials_3'),
};

export type ApiDifferentialsEconFunctionKey = keyof typeof API_DIFFERENTIALS_ECON_FUNCTION;

type TypeOfField<FT> = FT extends DifferentialsEconFunctionField<infer T> ? T : never;

export type ApiDifferentialsEconFunction = {
	[key in ApiDifferentialsEconFunctionKey]?: TypeOfField<(typeof API_DIFFERENTIALS_ECON_FUNCTION)[key]>;
};

export const getApiDifferentialsEconFunctionField = (
	field: string,
): (typeof API_DIFFERENTIALS_ECON_FUNCTION)[ApiDifferentialsEconFunctionKey] | null =>
	getApiField(field, API_DIFFERENTIALS_ECON_FUNCTION);

export const getRequiredFields: ApiDifferentialsEconFunctionKey[] = Object.entries(API_DIFFERENTIALS_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDifferentialsEconFunctionKey);

export const toDifferentialsEconFunction = (
	apiDifferentialsEconFunction: ApiDifferentialsEconFunction,
): IDifferentialsEconFunction | Record<string, unknown> => {
	const differentialsEconFunctionResult = {};

	if (isNil(apiDifferentialsEconFunction)) {
		return differentialsEconFunctionResult;
	}

	Object.entries(API_DIFFERENTIALS_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				differentialsEconFunction: IDifferentialsEconFunction,
				value: unknown,
			) => void;
			coercedWrite(
				differentialsEconFunctionResult as IDifferentialsEconFunction,
				apiDifferentialsEconFunction[field as ApiDifferentialsEconFunctionKey],
			);
		}
	});
	return differentialsEconFunctionResult as IDifferentialsEconFunction;
};

export const toApiDifferentialsEconFunction = (
	differentialsEconFunction: IDifferentialsEconFunction,
): ApiDifferentialsEconFunction => {
	const apiDifferentialsEconFunction: Record<string, ApiDifferentialsEconFunction[ApiDifferentialsEconFunctionKey]> =
		{};
	Object.entries(API_DIFFERENTIALS_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiDifferentialsEconFunction[field] = read(differentialsEconFunction);
		}
	});
	return apiDifferentialsEconFunction;
};
