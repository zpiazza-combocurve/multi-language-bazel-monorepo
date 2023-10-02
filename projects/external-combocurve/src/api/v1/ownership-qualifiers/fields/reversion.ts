import { get, invert, set } from 'lodash';

import { BalanceType, IncludeNetProfitInterestType, Reversion } from '@src/models/econ/ownership-qualifiers';
import { DATE_FIELD, getStringEnumField, IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { IField, IReadWriteFieldOptions, isApiDataField, readWriteDbField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

const DB_TO_API_REVERSION_TYPE = {
	irr: 'Irr',
	payout_with_investment: 'PayoutWithInvestment',
	payout_without_investment: 'PayoutWithoutInvestment',
	roi_undisc: 'UndiscRoi',
	offset_to_as_of_date: 'AsOf',
	date: 'Date',
	well_head_oil_cum: 'WhCumOil',
	well_head_gas_cum: 'WhCumGas',
	well_head_boe_cum: 'WhCumBoe',
} as const;

export const API_REVERSION_TYPE_TO_DB = invert(DB_TO_API_REVERSION_TYPE);

const DATE_REVERSION = ['date'];

const DB_REVERSION_TYPES = Object.keys(DB_TO_API_REVERSION_TYPE);
const API_REVERSION_TYPES = Object.values(DB_TO_API_REVERSION_TYPE);

const isReversionNumber = (value: string): value is DbNumberReversionType =>
	DB_REVERSION_TYPES.includes(value) && !DATE_REVERSION.includes(value);
const isReversionDate = (value: string): value is DbDateReversionType => DATE_REVERSION.includes(value);

type DbReversionType = keyof typeof DB_TO_API_REVERSION_TYPE;
type DbNumberReversionType =
	| 'irr'
	| 'payout_with_investment'
	| 'payout_without_investment'
	| 'roi_undisc'
	| 'well_head_oil_cum'
	| 'well_head_gas_cum'
	| 'well_head_boe_cum';
type DbDateReversionType = 'offset_to_as_of_date' | 'date';
type ApiReversionType = (typeof API_REVERSION_TYPES)[number];

export type ApiReversionkey = keyof typeof API_REVERSION_FIELDS;

type ReversionField<T> = IField<Reversion, T>;

export type ApiReversion = {
	reversionValue?: number | Date;
	reversionType?: ApiReversionType;
	balance?: BalanceType | '';
	includeNetProfitInterest?: IncludeNetProfitInterestType | '';
	workingInterest?: number;
	netRevenueInterest?: number;
	leaseNetRevenueInterest?: number;
	netProfitInterest?: number;
	oilNetRevenueInterest?: number;
	gasNetRevenueInterest?: number;
	nglNetRevenueInterest?: number;
	dripCondensateNetRevenueInterest?: number;
};

const reversionReadWriteDbField = <K extends keyof Reversion, TParsed = Reversion[K] | null>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
): IField<Reversion, Reversion[K] | null, TParsed> => ({
	...readWriteDbField<Reversion, K, TParsed>(key, definition, options),
	read: (reversion) => (reversion[key] !== '' ? reversion[key] : null),
	write: (reversion, value) => {
		if (notNil(value)) {
			reversion[key] = value;
		}
	},
});

const reversionFieldWithPath = (path: string[], isRequired: boolean): ReversionField<number | null> => ({
	...NUMBER_FIELD,
	read: (reversion) => {
		const value = get(reversion, path);
		return value !== '' ? value : null;
	},
	write: (reversion, value) => {
		if (notNil(value)) {
			set(reversion, path, value);
		}
	},
	options: { isRequired },
});

const getReversionType = (reversion: Reversion): DbReversionType | null => {
	const reversionFields = reversion == undefined ? [] : Object.keys(reversion);
	let reversionType = null;

	DB_REVERSION_TYPES.forEach((r) => {
		const coercedValue = r as DbReversionType;
		if (reversionFields.includes(coercedValue)) {
			reversionType = coercedValue;
			return;
		}
	});
	return reversionType;
};

const reversionTypeField: ReversionField<ApiReversionType | null> = {
	...getStringEnumField(API_REVERSION_TYPES),
	read: (reversion) => {
		const reversionType = getReversionType(reversion);
		return reversionType && DB_TO_API_REVERSION_TYPE[reversionType];
	},
	write: () => ({}),
	options: { isRequired: true },
};

const noReversionField: ReversionField<'' | null> = {
	type: OpenApiDataType.string,
	read: () => null,
	options: { isRequired: true },
};

const reversionNumberField = (key: DbNumberReversionType): ReversionField<number | undefined> => ({
	...NUMBER_FIELD,
	read: (reversion) => reversion[key],
	write: (reversion, value) => (reversion[key] = value),
	options: { isRequired: true },
});

const reversionDateField = (key: DbDateReversionType): ReversionField<Date | undefined> => ({
	...DATE_FIELD,
	write: (reversion, value) => (reversion[key] = value),
	options: { isRequired: true },
});

const balanceField: ReversionField<BalanceType | ''> = {
	...getStringEnumField(['net', 'gross']),
	read: (reversion) => {
		const reversionType = getReversionType(reversion);
		return notNil(reversionType) && !DATE_REVERSION.includes(reversionType) ? reversion['balance'] : '';
	},
	write: (reversion, value) => {
		reversion['balance'] = value as BalanceType;
	},
};

const includeNetProfitInterestField: ReversionField<IncludeNetProfitInterestType | ''> = {
	...getStringEnumField(['yes', 'no']),
	read: (reversion) => {
		const reversionType = getReversionType(reversion);
		return notNil(reversionType) && !DATE_REVERSION.includes(reversionType)
			? reversion['include_net_profit_interest']
			: '';
	},
	write: (reversion, value) => {
		reversion['include_net_profit_interest'] = value as IncludeNetProfitInterestType;
	},
};

export const API_REVERSION_FIELDS = {
	reversionType: reversionTypeField,
	reversionValue: noReversionField, // Default field definition. Definition obtained dynamically
	balance: balanceField,
	includeNetProfitInterest: includeNetProfitInterestField,
	workingInterest: reversionReadWriteDbField('working_interest', NUMBER_FIELD, { isRequired: true }),
	netRevenueInterest: reversionFieldWithPath(['original_ownership', 'net_revenue_interest'], true),
	leaseNetRevenueInterest: reversionFieldWithPath(['original_ownership', 'lease_net_revenue_interest'], true),
	netProfitInterest: reversionReadWriteDbField('net_profit_interest', NUMBER_FIELD, { isRequired: true }),
	oilNetRevenueInterest: reversionFieldWithPath(['oil_ownership', 'net_revenue_interest'], false),
	gasNetRevenueInterest: reversionFieldWithPath(['gas_ownership', 'net_revenue_interest'], false),
	nglNetRevenueInterest: reversionFieldWithPath(['ngl_ownership', 'net_revenue_interest'], false),
	dripCondensateNetRevenueInterest: reversionFieldWithPath(
		['drip_condensate_ownership', 'net_revenue_interest'],
		false,
	),
};

const isApiInitialOwnershipField = (field: string): field is keyof typeof API_REVERSION_FIELDS =>
	isApiDataField(field, API_REVERSION_FIELDS);

export const getReversionField = (
	field: string,
	reversionType?: string | undefined,
):
	| (typeof API_REVERSION_FIELDS)[ApiReversionkey]
	| ReturnType<typeof reversionDateField>
	| ReturnType<typeof reversionNumberField>
	| null => {
	if (!isApiInitialOwnershipField(field)) {
		return null;
	}

	if (reversionType && field === 'reversionValue' && isReversionDate(reversionType)) {
		return reversionDateField(reversionType);
	}
	if (reversionType && field === 'reversionValue' && isReversionNumber(reversionType)) {
		return reversionNumberField(reversionType);
	}

	return API_REVERSION_FIELDS[field];
};

export const toApiReversion = (reversion: Reversion): ApiReversion | null => {
	const apiReversion: Record<string, ApiReversion[ApiReversionkey] | null> = {};

	const reversionType = getReversionType(reversion);

	if (isNil(reversionType)) {
		return null;
	}
	Object.entries(API_REVERSION_FIELDS).forEach(([f]) => {
		const { read } = getReversionField(f, reversionType) || {};
		if (read) {
			apiReversion[f] = read(reversion);
		}
	});

	return apiReversion;
};

const hasNoReversion = (reversion: Reversion) => Object.keys(reversion).includes('no_reversion');

export const toReversion = (reversion: Reversion, apiReversion: ApiReversion): Reversion => {
	const reversionResult = { ...reversion };

	const reversionType = apiReversion.reversionType && API_REVERSION_TYPE_TO_DB[apiReversion.reversionType];
	Object.entries(API_REVERSION_FIELDS).forEach(([field]) => {
		const apiReversionField = getReversionField(field, reversionType);
		const { write } = apiReversionField || {};
		if (write) {
			const coercedWrite = write as (reversion: Reversion, value: unknown) => void;
			coercedWrite(reversionResult, apiReversion[field as ApiReversionkey]);
		}
	});

	if (hasNoReversion(reversionResult)) {
		delete reversionResult.no_reversion;
	}

	return reversionResult;
};

export const requiredFields: ApiReversionkey[] = Object.entries(API_REVERSION_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiReversionkey);
