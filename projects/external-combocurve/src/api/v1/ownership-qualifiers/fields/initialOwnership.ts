import { get, round, set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { InitialOwnership, NPI_TYPE, NpiType } from '@src/models/econ/ownership-qualifiers';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { parseApiInitialOwnership } from '../validations/initialOwnership';

import { OwnershipField } from './ownership';

export type ApiInitialOwnershipkey = keyof typeof API_INITIAL_OWNERSHIP_FIELDS;

type InitialOwnershipField<T> = IField<InitialOwnership, T>;

export type ApiInitialOwnership = {
	workingInterest?: number;
	netProfitInterestType?: NpiType;
	netProfitInterest?: number;
	netRevenueInterest?: number;
	leaseNetRevenueInterest?: number | null;
	oilNetRevenueInterest?: number;
	gasNetRevenueInterest?: number;
	nglNetRevenueInterest?: number;
	dripCondensateNetRevenueInterest?: number;
};

export const getInitialOwnership = (path: string[]): OwnershipField<ApiInitialOwnership> => ({
	type: OpenApiDataType.object,
	properties: API_INITIAL_OWNERSHIP_FIELDS,
	parse: parseApiInitialOwnership,
	read: (ownership) => toApiInitialOwnership(get(ownership, path)),
	write: (ownership, value) => {
		let initialOwnership = get(ownership, path) as InitialOwnership;
		initialOwnership = toInitialOwnership(initialOwnership, value);
		set(ownership, path, initialOwnership);
	},
	options: { isRequired: true },
});

const initialOwnershipReadWriteDbField = <K extends keyof InitialOwnership, TParsed = InitialOwnership[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<InitialOwnership, K, TParsed>(key, definition, options);

const initialOwnershipReadWriteFieldWithDefault = <K extends keyof InitialOwnership, TParsed = InitialOwnership[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => ({
	...readWriteDbField<InitialOwnership, K, TParsed>(key, definition, options),
	write: (initialOwnership: Partial<InitialOwnership>, value: InitialOwnership[K]) => {
		if (notNil(value)) {
			initialOwnership[key] = value;
		}
	},
});

const initialOwnershipFieldWithPath = (path: string[], isRequired: boolean): InitialOwnershipField<number | null> => ({
	...NUMBER_FIELD,
	read: (initialOwnership) => {
		const value = get(initialOwnership, path);
		return value !== '' ? value : null;
	},
	write: (initialOwnership, value) => {
		if (notNil(value)) {
			set(initialOwnership, path, value);
		}
	},
	options: { isRequired },
});

const leaseNetRevenueInterestField: InitialOwnershipField<number | null> = {
	...initialOwnershipFieldWithPath(['original_ownership', 'lease_net_revenue_interest'], false),
	//	leaseNetRevenueInterest is calculated in case there is not value for it coming from request
	// (calculated field) leaseNetRevenueInterest = netRevenueInterest * 100 / workingInterest. Result is rounded to 8 digits
	// - if calculation is greater than 100 or workingInterest is 0 then leaseNetRevenueInterest = 100
	write: (initialOwnership, value) => {
		const { working_interest: workingInterest = 0, original_ownership } = initialOwnership;
		const netRevenueInterest = original_ownership?.net_revenue_interest ?? 0;
		const roundDigit = 8;
		const leaseNRICalc = round((netRevenueInterest * 100) / workingInterest, roundDigit);
		const setDefaultValue = workingInterest === 0 || leaseNRICalc > 100;

		const leaseNRIValue = notNil(value) ? value : setDefaultValue ? 100 : leaseNRICalc;
		set(initialOwnership, ['original_ownership', 'lease_net_revenue_interest'], leaseNRIValue);
	},
};

const API_INITIAL_OWNERSHIP_FIELDS = {
	workingInterest: initialOwnershipReadWriteDbField('working_interest', NUMBER_FIELD, { isRequired: true }),
	netProfitInterestType: initialOwnershipReadWriteFieldWithDefault(
		'net_profit_interest_type',
		getStringEnumField(NPI_TYPE),
	),
	netProfitInterest: initialOwnershipReadWriteFieldWithDefault('net_profit_interest', NUMBER_FIELD),
	netRevenueInterest: initialOwnershipFieldWithPath(['original_ownership', 'net_revenue_interest'], true),
	leaseNetRevenueInterest: leaseNetRevenueInterestField,
	oilNetRevenueInterest: initialOwnershipFieldWithPath(['oil_ownership', 'net_revenue_interest'], false),
	gasNetRevenueInterest: initialOwnershipFieldWithPath(['gas_ownership', 'net_revenue_interest'], false),
	nglNetRevenueInterest: initialOwnershipFieldWithPath(['ngl_ownership', 'net_revenue_interest'], false),
	dripCondensateNetRevenueInterest: initialOwnershipFieldWithPath(
		['drip_condensate_ownership', 'net_revenue_interest'],
		false,
	),
};

export const toApiInitialOwnership = (initialOwnership: InitialOwnership): ApiInitialOwnership => {
	const apiInitialOwnership: Record<string, ApiInitialOwnership[ApiInitialOwnershipkey]> = {};
	Object.entries(API_INITIAL_OWNERSHIP_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiInitialOwnership[field] = read(initialOwnership);
		}
	});
	return apiInitialOwnership;
};

export const toInitialOwnership = (
	initialOwnership: InitialOwnership,
	apiInitialOwnership: ApiInitialOwnership,
): InitialOwnership => {
	const initialOwnershipResult = { ...initialOwnership };
	Object.entries(API_INITIAL_OWNERSHIP_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (production: InitialOwnership, value: unknown) => void;
			coercedWrite(initialOwnershipResult, apiInitialOwnership[field as ApiInitialOwnershipkey]);
		}
	});
	return initialOwnershipResult;
};

export const getApiInitialOwnershipField = (
	field: string,
): (typeof API_INITIAL_OWNERSHIP_FIELDS)[ApiInitialOwnershipkey] | null =>
	getApiField(field, API_INITIAL_OWNERSHIP_FIELDS);

export const requiredFields: ApiInitialOwnershipkey[] = Object.entries(API_INITIAL_OWNERSHIP_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiInitialOwnershipkey);
