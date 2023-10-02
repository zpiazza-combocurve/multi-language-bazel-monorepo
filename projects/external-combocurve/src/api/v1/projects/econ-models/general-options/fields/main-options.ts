import { get, set } from 'lodash';

import {
	fiscalValues,
	GENERAL_OPTIONS_NAME,
	IMainOptions,
	projectTypeValues,
	reportingPeriodValues,
} from '@src/models/econ/general-options';
import { getStringEnumField, IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { readWriteYesNoDbField } from '../../fields';

import { IGeneralOptionsField } from './econ-function';

const hasDefault: IReadWriteFieldOptions = { hasDefault: true };
const createRWDBField = <K extends keyof IMainOptions, TParsed = IMainOptions[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IMainOptions, K, TParsed>(key, definition, options);

export const MAIN_OPTIONS_FIELDS = {
	aggregationDate: createRWDBField('aggregation_date', STRING_FIELD),
	currency: createRWDBField('currency', getStringEnumField(['USD'], 'USD'), { hasDefault: true }),
	reportingPeriod: createRWDBField(
		'reporting_period',
		getStringEnumField(reportingPeriodValues, 'calendar'),
		hasDefault,
	),
	fiscal: createRWDBField('fiscal', getStringEnumField(fiscalValues, '5-4'), hasDefault),
	incomeTax: readWriteYesNoDbField('income_tax'),
	projectType: createRWDBField('project_type', getStringEnumField(projectTypeValues, 'primary_recovery'), hasDefault),
};

// DB Mapping
export type IMainOptionsField<T> = IField<IMainOptions, T>;
type TypeOfMainOptionsField<FT> = FT extends IMainOptionsField<infer T> ? T : never;

// Api Mapping
export type ApiMainOptionsFieldsKeys = keyof typeof MAIN_OPTIONS_FIELDS;
export type ApiMainOptionsType = {
	[key in ApiMainOptionsFieldsKeys]?: TypeOfMainOptionsField<(typeof MAIN_OPTIONS_FIELDS)[key]>;
};

// Field
export const mainOptionsField: IGeneralOptionsField<ApiMainOptionsType> = {
	type: OpenApiDataType.object,
	properties: MAIN_OPTIONS_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiMainOptionsType, ApiMainOptionsFieldsKeys>(
			GENERAL_OPTIONS_NAME,
			MAIN_OPTIONS_FIELDS,
			data,
			location,
		),
	read: (expenses) =>
		readRequestFromDocument<IMainOptions, ApiMainOptionsType, ApiMainOptionsFieldsKeys>(
			get(expenses, ['econ_function', 'main_options']),
			MAIN_OPTIONS_FIELDS,
		),
	write: (expenses, value) =>
		set(
			expenses,
			['econ_function', 'main_options'],
			writeDocumentWithRequest<IMainOptions, ApiMainOptionsType, ApiMainOptionsFieldsKeys>(
				value,
				MAIN_OPTIONS_FIELDS,
			),
		),
};
