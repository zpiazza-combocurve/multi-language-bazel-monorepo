import { get } from 'lodash';

import { IField } from '@src/api/v1/fields';
import { IWellCustomColumn } from '@src/models/custom-columns';
import { STRING_FIELD } from '@src/helpers/fields';

export type WellCustomColumnField<T> = IField<IWellCustomColumn, T>;
export const READ_RECORD_LIMIT = 200;

const wellCustomColumnWriteDbField = <K extends keyof IWellCustomColumn>(
	key: K,
): IField<IWellCustomColumn, string> => ({
	...STRING_FIELD,
	read: (wellCustomColumn) => get(wellCustomColumn, [key, 'label'], getDefaultValue(key)) as string,
});

export const API_WELL_CUSTOM_COLUMNS = {
	customString0: wellCustomColumnWriteDbField('custom_string_0'),
	customString1: wellCustomColumnWriteDbField('custom_string_1'),
	customString2: wellCustomColumnWriteDbField('custom_string_2'),
	customString3: wellCustomColumnWriteDbField('custom_string_3'),
	customString4: wellCustomColumnWriteDbField('custom_string_4'),
	customString5: wellCustomColumnWriteDbField('custom_string_5'),
	customString6: wellCustomColumnWriteDbField('custom_string_6'),
	customString7: wellCustomColumnWriteDbField('custom_string_7'),
	customString8: wellCustomColumnWriteDbField('custom_string_8'),
	customString9: wellCustomColumnWriteDbField('custom_string_9'),
	customString10: wellCustomColumnWriteDbField('custom_string_10'),
	customString11: wellCustomColumnWriteDbField('custom_string_11'),
	customString12: wellCustomColumnWriteDbField('custom_string_12'),
	customString13: wellCustomColumnWriteDbField('custom_string_13'),
	customString14: wellCustomColumnWriteDbField('custom_string_14'),
	customString15: wellCustomColumnWriteDbField('custom_string_15'),
	customString16: wellCustomColumnWriteDbField('custom_string_16'),
	customString17: wellCustomColumnWriteDbField('custom_string_17'),
	customString18: wellCustomColumnWriteDbField('custom_string_18'),
	customString19: wellCustomColumnWriteDbField('custom_string_19'),
	//numbers
	customNumber0: wellCustomColumnWriteDbField('custom_number_0'),
	customNumber1: wellCustomColumnWriteDbField('custom_number_1'),
	customNumber2: wellCustomColumnWriteDbField('custom_number_2'),
	customNumber3: wellCustomColumnWriteDbField('custom_number_3'),
	customNumber4: wellCustomColumnWriteDbField('custom_number_4'),
	customNumber5: wellCustomColumnWriteDbField('custom_number_5'),
	customNumber6: wellCustomColumnWriteDbField('custom_number_6'),
	customNumber7: wellCustomColumnWriteDbField('custom_number_7'),
	customNumber8: wellCustomColumnWriteDbField('custom_number_8'),
	customNumber9: wellCustomColumnWriteDbField('custom_number_9'),
	customNumber10: wellCustomColumnWriteDbField('custom_number_10'),
	customNumber11: wellCustomColumnWriteDbField('custom_number_11'),
	customNumber12: wellCustomColumnWriteDbField('custom_number_12'),
	customNumber13: wellCustomColumnWriteDbField('custom_number_13'),
	customNumber14: wellCustomColumnWriteDbField('custom_number_14'),
	customNumber15: wellCustomColumnWriteDbField('custom_number_15'),
	customNumber16: wellCustomColumnWriteDbField('custom_number_16'),
	customNumber17: wellCustomColumnWriteDbField('custom_number_17'),
	customNumber18: wellCustomColumnWriteDbField('custom_number_18'),
	customNumber19: wellCustomColumnWriteDbField('custom_number_19'),
	//dates
	customDate0: wellCustomColumnWriteDbField('custom_date_0'),
	customDate1: wellCustomColumnWriteDbField('custom_date_1'),
	customDate2: wellCustomColumnWriteDbField('custom_date_2'),
	customDate3: wellCustomColumnWriteDbField('custom_date_3'),
	customDate4: wellCustomColumnWriteDbField('custom_date_4'),
	customDate5: wellCustomColumnWriteDbField('custom_date_5'),
	customDate6: wellCustomColumnWriteDbField('custom_date_6'),
	customDate7: wellCustomColumnWriteDbField('custom_date_7'),
	customDate8: wellCustomColumnWriteDbField('custom_date_8'),
	customDate9: wellCustomColumnWriteDbField('custom_date_9'),
	//booleans
	customBool0: wellCustomColumnWriteDbField('custom_bool_0'),
	customBool1: wellCustomColumnWriteDbField('custom_bool_1'),
	customBool2: wellCustomColumnWriteDbField('custom_bool_2'),
	customBool3: wellCustomColumnWriteDbField('custom_bool_3'),
	customBool4: wellCustomColumnWriteDbField('custom_bool_4'),
};

export type ApiWellCustomColumnKey = keyof typeof API_WELL_CUSTOM_COLUMNS;

type TypeOfWellCustomColumnField<FT> = FT extends WellCustomColumnField<infer T> ? T : never;

export type ApiWellCustomColumn = {
	[key in ApiWellCustomColumnKey]?: TypeOfWellCustomColumnField<(typeof API_WELL_CUSTOM_COLUMNS)[key]>;
};

export default API_WELL_CUSTOM_COLUMNS;

const getDefaultValue = (fieldName: string) => {
	const [, fieldType, fieldNumber] = fieldName.split('_');
	if (fieldType === 'bool') {
		return `Custom Boolean Header ${fieldNumber}`;
	}
	if (fieldType === 'date') {
		return `Custom Date Header ${fieldNumber}`;
	}
	if (fieldType === 'number') {
		return `Custom Number Header ${fieldNumber}`;
	}
	if (fieldType === 'string') {
		return `Custom Text Header ${fieldNumber}`;
	}
	return null;
};

export const toApiWellCustomColumn = (wellCustomColumnField: IWellCustomColumn): ApiWellCustomColumn => {
	const apiWellCustomColumnField: Record<string, ApiWellCustomColumn[ApiWellCustomColumnKey]> = {};
	Object.entries(API_WELL_CUSTOM_COLUMNS).forEach(([field, { read }]) => {
		if (read) {
			apiWellCustomColumnField[field] = read(wellCustomColumnField);
		}
	});
	return apiWellCustomColumnField;
};
