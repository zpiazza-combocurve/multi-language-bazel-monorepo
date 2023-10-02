import { get, set } from 'lodash';

import { GENERAL_OPTIONS_NAME, IBoeConversion } from '@src/models/econ/general-options';
import { getRangeField, IFieldDefinition } from '@src/helpers/fields';
import { IField, readWriteDbField } from '@src/api/v1/fields';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { IGeneralOptionsField } from './econ-function';

const createRWDBField = <K extends keyof IBoeConversion, TParsed = IBoeConversion[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
) => readWriteDbField<IBoeConversion, K, TParsed>(key, definition, { hasDefault: true });

export const BOE_CONVERSION_FIELDS = {
	oil: createRWDBField('oil', getRangeField(1, 2, 1)),
	wetGas: createRWDBField('wet_gas', getRangeField(4, 50, 6)),
	dryGas: createRWDBField('dry_gas', getRangeField(4, 50, 6)),
	ngl: createRWDBField('ngl', getRangeField(1, 2, 1)),
	dripCondensate: createRWDBField('drip_condensate', getRangeField(1, 2, 1)),
};

// DB Mapping
export type IBoeConversionField<T> = IField<IBoeConversion, T>;
type TypeOfBoeConversionField<FT> = FT extends IBoeConversionField<infer T> ? T : never;

// Api Mapping
export type ApiBoeConversionFieldsKeys = keyof typeof BOE_CONVERSION_FIELDS;
export type ApiBoeConversionType = {
	[key in ApiBoeConversionFieldsKeys]?: TypeOfBoeConversionField<(typeof BOE_CONVERSION_FIELDS)[key]>;
};

// Field
export const boeConversionField: IGeneralOptionsField<ApiBoeConversionType> = {
	type: OpenApiDataType.object,
	properties: BOE_CONVERSION_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiBoeConversionType, ApiBoeConversionFieldsKeys>(
			GENERAL_OPTIONS_NAME,
			BOE_CONVERSION_FIELDS,
			data,
			location,
		),
	read: (expenses) =>
		readRequestFromDocument<IBoeConversion, ApiBoeConversionType, ApiBoeConversionFieldsKeys>(
			get(expenses, ['econ_function', 'boe_conversion']),
			BOE_CONVERSION_FIELDS,
		),
	write: (expenses, value) =>
		set(
			expenses,
			['econ_function', 'boe_conversion'],
			writeDocumentWithRequest<IBoeConversion, ApiBoeConversionType, ApiBoeConversionFieldsKeys>(
				value,
				BOE_CONVERSION_FIELDS,
			),
		),
};
