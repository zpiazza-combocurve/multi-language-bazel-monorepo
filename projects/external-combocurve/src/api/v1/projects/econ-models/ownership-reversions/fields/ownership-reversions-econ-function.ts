import { cloneDeep, isNil } from 'lodash';

import {
	defaultOwnershipReversionEconFunction,
	IOwnershipReversionEconFunction,
	IOwnershipReversions,
} from '@src/models/econ/ownership-reversions';
import { getApiField, IField } from '@src/api/v1/fields';
import { API_OWNERSHIP_REVERSIONS } from '@src/api/v1/ownership-qualifiers/fields/ownership';
import { ApiInitialOwnership } from '@src/api/v1/ownership-qualifiers/fields/initialOwnership';
import { ApiReversion } from '@src/api/v1/ownership-qualifiers/fields/reversion';

export type IOwnershipReversionEconFunctionField<T> = IField<IOwnershipReversionEconFunction, T>;

export const API_OWNERSHIP_REVERSION_ECON_FUNCTION = API_OWNERSHIP_REVERSIONS;

export type ApiOwnershipReversionEconFunctionKey = keyof typeof API_OWNERSHIP_REVERSION_ECON_FUNCTION;

export interface ApiOwnershipReversionEconFunction {
	initialOwnership?: ApiInitialOwnership;
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

interface OwnershipReversionEconFunctionValue {
	econ_function: { ownership: IOwnershipReversionEconFunction };
}

export const getApiOwnershipReversionEconFunctionField = (
	field: string,
): (typeof API_OWNERSHIP_REVERSION_ECON_FUNCTION)[ApiOwnershipReversionEconFunctionKey] | null =>
	getApiField(field, API_OWNERSHIP_REVERSION_ECON_FUNCTION);

export const getRequiredFields: ApiOwnershipReversionEconFunctionKey[] = Object.entries(
	API_OWNERSHIP_REVERSION_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiOwnershipReversionEconFunctionKey);

export const toOwnershipReversionEconFunction = (
	apiOwnershipReversionEconFunction: ApiOwnershipReversionEconFunction,
): OwnershipReversionEconFunctionValue => {
	const ownershipReversionEconFunctionResult = {
		econ_function: { ownership: cloneDeep(defaultOwnershipReversionEconFunction) },
	} as OwnershipReversionEconFunctionValue;

	if (isNil(apiOwnershipReversionEconFunction)) {
		return ownershipReversionEconFunctionResult;
	}

	Object.entries(API_OWNERSHIP_REVERSION_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (
				ownershipReversion: OwnershipReversionEconFunctionValue,
				value: unknown,
			) => void;
			coercedWrite(
				ownershipReversionEconFunctionResult,
				apiOwnershipReversionEconFunction[field as ApiOwnershipReversionEconFunctionKey],
			);
		}
	});
	return ownershipReversionEconFunctionResult;
};

export const toApiOwnershipReversionEconFunction = (
	ownershipReversion: IOwnershipReversions,
): ApiOwnershipReversionEconFunction => {
	const apiOwnershipReversionEconFunction: Record<
		string,
		ApiOwnershipReversionEconFunction[ApiOwnershipReversionEconFunctionKey] | null
	> = {};
	Object.entries(API_OWNERSHIP_REVERSION_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiOwnershipReversionEconFunction[field] = read(ownershipReversion);
		}
	});
	return apiOwnershipReversionEconFunction;
};
