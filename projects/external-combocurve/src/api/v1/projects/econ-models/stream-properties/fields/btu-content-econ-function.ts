import { isNil } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { IBtuContentEconFunction } from '@src/models/econ/stream-properties';

export type BtuContentEconFunctionField<T> = IField<IBtuContentEconFunction, T>;

const btuContentEconFunctionReadWriteDbField = <
	K extends keyof IBtuContentEconFunction,
	TParsed = IBtuContentEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IBtuContentEconFunction, K, TParsed>(key, definition, options);

export const API_BTU_CONTENT_ECON_FUNCTION = {
	unshrunkGas: btuContentEconFunctionReadWriteDbField('unshrunk_gas', NUMBER_FIELD),
	shrunkGas: btuContentEconFunctionReadWriteDbField('shrunk_gas', NUMBER_FIELD),
};

export type ApiBtuContentEconFunctionKey = keyof typeof API_BTU_CONTENT_ECON_FUNCTION;

type TypeOfBtuContentField<FT> = FT extends BtuContentEconFunctionField<infer T> ? T : never;

export type ApiBtuContentEconFunction = {
	[key in ApiBtuContentEconFunctionKey]?: TypeOfBtuContentField<(typeof API_BTU_CONTENT_ECON_FUNCTION)[key]>;
};

export const getApiBtuContentEconFunctionField = (
	field: string,
): (typeof API_BTU_CONTENT_ECON_FUNCTION)[ApiBtuContentEconFunctionKey] | null =>
	getApiField(field, API_BTU_CONTENT_ECON_FUNCTION);

export const getRequiredBtuContentFields: ApiBtuContentEconFunctionKey[] = Object.entries(API_BTU_CONTENT_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiBtuContentEconFunctionKey);

export const toBtuContentEconFunction = (
	apiBtuContentEconFunction: ApiBtuContentEconFunction,
): IBtuContentEconFunction | Record<string, unknown> => {
	const btuContentEconFunctionResult = {};

	if (isNil(apiBtuContentEconFunction)) {
		return btuContentEconFunctionResult;
	}

	Object.entries(API_BTU_CONTENT_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (btuContentEconFunction: IBtuContentEconFunction, value: unknown) => void;
			coercedWrite(
				btuContentEconFunctionResult as IBtuContentEconFunction,
				apiBtuContentEconFunction[field as ApiBtuContentEconFunctionKey],
			);
		}
	});
	return btuContentEconFunctionResult as IBtuContentEconFunction;
};

export const toApiBtuContentEconFunction = (
	btuContentEconFunction: IBtuContentEconFunction,
): ApiBtuContentEconFunction => {
	const apiBtuContentEconFunction: Record<string, ApiBtuContentEconFunction[ApiBtuContentEconFunctionKey]> = {};
	Object.entries(API_BTU_CONTENT_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiBtuContentEconFunction[field] = read(btuContentEconFunction);
		}
	});
	return apiBtuContentEconFunction;
};
