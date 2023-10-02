import { get, set } from 'lodash';

import {
	cashAccrualValues,
	discontTableValues,
	GENERAL_OPTIONS_NAME,
	IDiscountTable,
} from '@src/models/econ/general-options';
import { getRangeField, getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { IField, readWriteDbField } from '@src/api/v1/fields';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

import { IGeneralOptionsField } from './econ-function';

const createRWDBField = <K extends keyof IDiscountTable, TParsed = IDiscountTable[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
) => readWriteDbField<IDiscountTable, K, TParsed>(key, definition, { hasDefault: true });

export const DISCONT_TABLE_FIELDS = {
	discountMethod: createRWDBField('discount_method', getStringEnumField(discontTableValues, 'yearly')),
	cashAccrualTime: createRWDBField('cash_accrual_time', getStringEnumField(cashAccrualValues, 'mid_month')),
	firstDiscount: createRWDBField('first_discount', getRangeField(0, 100, 10)),
	secondDiscount: createRWDBField('second_discount', getRangeField(0, 100, 15)),
	discounts: rowsReadWriteDbField(),
};

// DB Mapping
export type IDiscountTableField<T> = IField<IDiscountTable, T>;
type TypeOfDiscountTableField<FT> = FT extends IDiscountTableField<infer T> ? T : never;

// Api Mapping
export type ApiDiscountTableFieldsKeys = keyof typeof DISCONT_TABLE_FIELDS;
export type ApiDiscountTableType = {
	[key in ApiDiscountTableFieldsKeys]?: TypeOfDiscountTableField<(typeof DISCONT_TABLE_FIELDS)[key]>;
};

// Field
export const discontTableField: IGeneralOptionsField<ApiDiscountTableType> = {
	type: OpenApiDataType.object,
	properties: DISCONT_TABLE_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiDiscountTableType, ApiDiscountTableFieldsKeys>(
			GENERAL_OPTIONS_NAME,
			DISCONT_TABLE_FIELDS,
			data,
			location,
		),
	read: (expenses) =>
		readRequestFromDocument<IDiscountTable, ApiDiscountTableType, ApiDiscountTableFieldsKeys>(
			get(expenses, ['econ_function', 'discount_table']),
			DISCONT_TABLE_FIELDS,
		),
	write: (expenses, value) =>
		set(
			expenses,
			['econ_function', 'discount_table'],
			writeDocumentWithRequest<IDiscountTable, ApiDiscountTableType, ApiDiscountTableFieldsKeys>(
				value,
				DISCONT_TABLE_FIELDS,
			),
		),
};
