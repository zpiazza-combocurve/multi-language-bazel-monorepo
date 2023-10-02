import { isNil } from 'lodash';

import {
	defaultReservesCategoryEconFunction,
	IReservesCategoryEconFunction,
	PRMS_RESERVES_CATEGORY,
	PRMS_RESERVES_SUB_CATEGORY,
	PRMS_RESOURCES_CLASS,
} from '@src/models/econ/reserves-categories';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';

export type IReservesCategoryEconFunctionField<T> = IField<IReservesCategoryEconFunction, T>;

const reservesCategoryEconFunctionReadWriteDbField = <
	K extends keyof IReservesCategoryEconFunction,
	TParsed = IReservesCategoryEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IReservesCategoryEconFunction, K, TParsed>(key, definition, options);

export const API_RESERVES_CATEGORY_ECON_FUNCTION = {
	prmsClass: reservesCategoryEconFunctionReadWriteDbField(
		'prms_resources_class',
		getStringEnumField(PRMS_RESOURCES_CLASS),
	),
	prmsCategory: reservesCategoryEconFunctionReadWriteDbField(
		'prms_reserves_category',
		getStringEnumField(PRMS_RESERVES_CATEGORY),
	),
	prmsSubCategory: reservesCategoryEconFunctionReadWriteDbField(
		'prms_reserves_sub_category',
		getStringEnumField(PRMS_RESERVES_SUB_CATEGORY),
	),
};

export type ApiReservesCategoryEconFunctionKey = keyof typeof API_RESERVES_CATEGORY_ECON_FUNCTION;

type TypeOfField<FT> = FT extends IReservesCategoryEconFunctionField<infer T> ? T : never;

export type ApiReservesCategoryEconFunction = {
	[key in ApiReservesCategoryEconFunctionKey]?: TypeOfField<(typeof API_RESERVES_CATEGORY_ECON_FUNCTION)[key]>;
};

export const getApiReservesCategoryEconFunctionField = (
	field: string,
): (typeof API_RESERVES_CATEGORY_ECON_FUNCTION)[ApiReservesCategoryEconFunctionKey] | null =>
	getApiField(field, API_RESERVES_CATEGORY_ECON_FUNCTION);

export const getRequiredFields: ApiReservesCategoryEconFunctionKey[] = Object.entries(
	API_RESERVES_CATEGORY_ECON_FUNCTION,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiReservesCategoryEconFunctionKey);

export const toReservesCategoryEconFunction = (
	apiReservesCategoryEconFunction: ApiReservesCategoryEconFunction,
): IReservesCategoryEconFunction => {
	const reservesCategoryEconFunctionResult = { ...defaultReservesCategoryEconFunction };

	if (isNil(apiReservesCategoryEconFunction)) {
		return reservesCategoryEconFunctionResult;
	}

	Object.entries(API_RESERVES_CATEGORY_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (reservesCategory: IReservesCategoryEconFunction, value: unknown) => void;
			coercedWrite(
				reservesCategoryEconFunctionResult,
				apiReservesCategoryEconFunction[field as ApiReservesCategoryEconFunctionKey],
			);
		}
	});
	return reservesCategoryEconFunctionResult;
};

export const toApiReservesCategoryEconFunction = (
	reservesCategory: IReservesCategoryEconFunction,
): ApiReservesCategoryEconFunction => {
	const apiReservesCategoryEconFunction: Record<
		string,
		ApiReservesCategoryEconFunction[ApiReservesCategoryEconFunctionKey]
	> = {};
	Object.entries(API_RESERVES_CATEGORY_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiReservesCategoryEconFunction[field] = read(reservesCategory);
		}
	});
	return apiReservesCategoryEconFunction;
};
