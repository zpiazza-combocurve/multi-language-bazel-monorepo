import { get } from 'lodash';

import { IField } from '@src/api/v1/fields';
import { ISingleProductionCustomColumn } from '@src/models/custom-columns';
import { STRING_FIELD } from '@src/helpers/fields';

export type SingleProductionCustomColumnField<T> = IField<ISingleProductionCustomColumn, T>;

const singleProductionCustomColumnWriteDbField = <K extends keyof ISingleProductionCustomColumn>(
	key: K,
): IField<ISingleProductionCustomColumn, string> => ({
	...STRING_FIELD,
	read: (singleProductionCustomColumn) =>
		get(singleProductionCustomColumn, [key, 'label'], getDefaultValue(key)) as string,
});

export const API_SINGLE_PRODUCTION_CUSTOM_COLUMNS = {
	customNumber0: singleProductionCustomColumnWriteDbField('customNumber0'),
	customNumber1: singleProductionCustomColumnWriteDbField('customNumber1'),
	customNumber2: singleProductionCustomColumnWriteDbField('customNumber2'),
	customNumber3: singleProductionCustomColumnWriteDbField('customNumber3'),
	customNumber4: singleProductionCustomColumnWriteDbField('customNumber4'),
};

const getDefaultValue = (fieldName: string) => {
	return `Custom Number ${fieldName.length - 1}`;
};

export type ApiSingleProductionCustomColumnKey = keyof typeof API_SINGLE_PRODUCTION_CUSTOM_COLUMNS;

type TypeOfSingleProductionCustomColumnField<FT> = FT extends SingleProductionCustomColumnField<infer T> ? T : never;

export type ApiSingleProductionCustomColumn = {
	[key in ApiSingleProductionCustomColumnKey]?: TypeOfSingleProductionCustomColumnField<
		(typeof API_SINGLE_PRODUCTION_CUSTOM_COLUMNS)[key]
	>;
};

export const toApiSingleProductionCustomColumn = (
	singleProductionCustomColumnField: ISingleProductionCustomColumn,
): ApiSingleProductionCustomColumn => {
	const apiSingleProductionCustomColumnField: Record<
		string,
		ApiSingleProductionCustomColumn[ApiSingleProductionCustomColumnKey]
	> = {};
	Object.entries(API_SINGLE_PRODUCTION_CUSTOM_COLUMNS).forEach(([field, { read }]) => {
		if (read) {
			apiSingleProductionCustomColumnField[field] = read(singleProductionCustomColumnField);
		}
	});
	return apiSingleProductionCustomColumnField;
};
