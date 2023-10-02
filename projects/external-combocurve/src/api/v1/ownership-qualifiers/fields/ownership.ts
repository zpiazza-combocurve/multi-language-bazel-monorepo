import { get, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { Ownership, Reversion } from '@src/models/econ/ownership-qualifiers';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { parseReversion } from '../validations/reversion';

import { API_REVERSION_FIELDS, ApiReversion, toApiReversion, toReversion } from './reversion';
import { ApiInitialOwnership, getInitialOwnership } from './initialOwnership';

export type ApiOwnershipKey = keyof typeof API_OWNERSHIP_FIELDS;

export type OwnershipField<T> = IField<Ownership, T>;

export const OWNERSHIP_DB_PATH = ['econ_function', 'ownership'];

const ownershipReadWriteDbFieldWithDefault = <K extends keyof Ownership, TParsed = Ownership[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => ({
	...readWriteDbField<Ownership, K, TParsed>(key, definition, options),
	write: (initialOwnership: Partial<Ownership>, value: Ownership[K]) => {
		if (notNil(value)) {
			initialOwnership[key] = value;
		}
	},
});

interface ReversionFields {
	firstReversion?: ApiReversion;
	secondReversion?: ApiReversion;
	thirdReversion?: ApiReversion;
	fourthReversion?: ApiReversion;
	fifthReversion?: ApiReversion;
	sixthReversion?: ApiReversion;
	seventhReversion?: ApiReversion;
	eighthReversion?: ApiReversion;
	ninthReversion?: ApiReversion;
	tenthReversion?: ApiReversion;
}
export interface ApiOwnership extends ReversionFields {
	name?: string;
	initialOwnership?: ApiInitialOwnership;
}

const getReversion = (path: string[]): OwnershipField<ApiReversion | null> => {
	return {
		type: OpenApiDataType.object,
		properties: API_REVERSION_FIELDS,
		parse: parseReversion,
		read: (ownership) => toApiReversion(get(ownership, path)),
		write: (ownership, value) => {
			if (notNil(value)) {
				let reversion = get(ownership, path) as Reversion;
				reversion = toReversion(reversion, value);
				set(ownership, path, reversion);
			}
		},
		options: { isRequired: false },
	};
};

export const REVERSION_FIELDS = {
	firstReversion: getReversion([...OWNERSHIP_DB_PATH, 'first_reversion']),
	secondReversion: getReversion([...OWNERSHIP_DB_PATH, 'second_reversion']),
	thirdReversion: getReversion([...OWNERSHIP_DB_PATH, 'third_reversion']),
	fourthReversion: getReversion([...OWNERSHIP_DB_PATH, 'fourth_reversion']),
	fifthReversion: getReversion([...OWNERSHIP_DB_PATH, 'fifth_reversion']),
	sixthReversion: getReversion([...OWNERSHIP_DB_PATH, 'sixth_reversion']),
	seventhReversion: getReversion([...OWNERSHIP_DB_PATH, 'seventh_reversion']),
	eighthReversion: getReversion([...OWNERSHIP_DB_PATH, 'eighth_reversion']),
	ninthReversion: getReversion([...OWNERSHIP_DB_PATH, 'ninth_reversion']),
	tenthReversion: getReversion([...OWNERSHIP_DB_PATH, 'tenth_reversion']),
};

export const API_OWNERSHIP_REVERSIONS = {
	initialOwnership: getInitialOwnership([...OWNERSHIP_DB_PATH, 'initial_ownership']),
	...REVERSION_FIELDS,
};

export const API_OWNERSHIP_FIELDS = {
	name: ownershipReadWriteDbFieldWithDefault('name', STRING_FIELD),
	...API_OWNERSHIP_REVERSIONS,
};

export const toApiOwnership = (ownership: Ownership): ApiOwnership => {
	const apiOwnership: Record<string, ApiOwnership[ApiOwnershipKey] | null> = {};
	Object.entries(API_OWNERSHIP_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiOwnership[field] = read(ownership);
		}
	});
	return apiOwnership;
};

export const toOwnership = (ownership: Ownership, apiOwnership: ApiOwnership): Ownership => {
	const ownershipResult = { ...ownership };
	Object.entries(API_OWNERSHIP_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (production: Ownership, value: unknown) => void;
			coercedWrite(ownershipResult, apiOwnership[field as ApiOwnershipKey]);
		}
	});
	return ownershipResult;
};

export const getApiOwnershipField = (field: string): (typeof API_OWNERSHIP_FIELDS)[ApiOwnershipKey] | null =>
	getApiField(field, API_OWNERSHIP_FIELDS);

const getRequiredReversions = (ownership: ApiOwnership): (keyof ReversionFields)[] => {
	const reversionFieldkeys = Object.keys(REVERSION_FIELDS).map((e) => e as keyof ReversionFields);

	for (let index = reversionFieldkeys.length - 1; index >= 0; index--) {
		if (ownership[reversionFieldkeys[index]]) {
			return reversionFieldkeys.splice(0, index + 1);
		}
	}

	return [];
};

export const getRequiredFields = (ownership: ApiOwnership): ApiOwnershipKey[] => {
	const baseRequired = Object.entries(API_OWNERSHIP_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiOwnershipKey);
	return [...baseRequired, ...getRequiredReversions(ownership)];
};
