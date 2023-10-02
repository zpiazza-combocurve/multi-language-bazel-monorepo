import { get, set } from 'lodash';

import { GENERAL_OPTIONS_NAME, IIncomeTax } from '@src/models/econ/general-options';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { IField } from '@src/api/v1/fields';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	API_ECON_FUNCTION_ROW_FIELDS,
	ApiEconFunctionRow,
	parseApiEconFunctionRow,
	toApiEconFunctionRow,
	toEconFunctionRow,
} from '../../row-fields/econ-function-row-fields';
import { completeIncomeTaxRows } from '../validation';
import { IEconFunctionRowField } from '../../row-fields/econ-function-row-field';
import { readWriteYesNoDbField } from '../../fields';

import { IGeneralOptionsField } from './econ-function';

const incomeTaxRows = (mongoField: string): IEconFunctionRowField<ApiEconFunctionRow[]> => ({
	type: OpenApiDataType.array,
	parse: (rows: unknown, location?: string) => {
		completeIncomeTaxRows(rows, location);
		return parseApiEconFunctionRow(rows, location);
	},
	items: { type: OpenApiDataType.object, properties: API_ECON_FUNCTION_ROW_FIELDS },
	write: (rowField, value) => set(rowField, [mongoField, 'rows'], toEconFunctionRow(value)),
	read: (rowField) => toApiEconFunctionRow(get(rowField, [mongoField])),
});

export const INCOME_TAX_FIELDS = {
	carryForward: readWriteYesNoDbField('carry_forward'),
	fifteenDepletion: readWriteYesNoDbField('fifteen_depletion'),
	federalIncomeTax: incomeTaxRows('federal_income_tax'),
	stateIncomeTax: incomeTaxRows('state_income_tax'),
};

// DB Mapping
export type IIncomeTaxField<T> = IField<IIncomeTax, T>;
type TypeOfIncomeTaxField<FT> = FT extends IIncomeTaxField<infer T> ? T : never;

// API Mapping
export type ApiIncomeTaxFieldsKeys = keyof typeof INCOME_TAX_FIELDS;
export type ApiIncomeTaxTypeField = {
	[key in ApiIncomeTaxFieldsKeys]?: TypeOfIncomeTaxField<(typeof INCOME_TAX_FIELDS)[key]>;
};

// Field
export const incomeTaxField: IGeneralOptionsField<ApiIncomeTaxTypeField> = {
	type: OpenApiDataType.object,
	properties: INCOME_TAX_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiIncomeTaxTypeField, ApiIncomeTaxFieldsKeys>(
			GENERAL_OPTIONS_NAME,
			INCOME_TAX_FIELDS,
			data,
			location,
		),
	read: (model): ApiIncomeTaxTypeField => {
		const api = readRequestFromDocument<IIncomeTax, ApiIncomeTaxTypeField, ApiIncomeTaxFieldsKeys>(
			get(model, ['econ_function', 'income_tax']),
			INCOME_TAX_FIELDS,
		);

		return api;
	},
	write: (model, value) =>
		set(
			model,
			['econ_function', 'income_tax'],
			writeDocumentWithRequest<IIncomeTax, ApiIncomeTaxTypeField, ApiIncomeTaxFieldsKeys>(
				value,
				INCOME_TAX_FIELDS,
			),
		),
};
