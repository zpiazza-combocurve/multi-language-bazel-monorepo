import { set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getRangeField, IFieldDefinition, INTEGER_FIELD, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/field-definition';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { readWriteYesNoDbField, readWriteYesNoOrNumberDbField } from '../fields';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { IRowDateField, rowDateReadWriteDbField } from './start-end-dates-field';
import { IRowOffsetAsOfField, rowOffsetReadWriteDbField } from './start-end-period-field';
import { IStartEndRateField, rowStartEndDateRangeReadWriteDbField } from './start-end-rate';
import { IStartEndRangeField } from './start-end-range';

export const PHASE = ['all', 'oil', 'gas', 'water'] as const;
export const POST_SHUT_IN_END_CRITERIA = ['dates', 'offset_to_as_of_date', 'econ_limit'] as const;
export const REPEAT_RANGE_OF_DATES = ['no_repeat', 'monthly', 'yearly'] as const;
export const SEASONAL_VALUES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
] as const;
export const UNIT = ['day', 'month'] as const;

export type Phase = (typeof PHASE)[number];
export type PostShutInEndCriteria = (typeof POST_SHUT_IN_END_CRITERIA)[number];
export type RepeatRangeOfDates = (typeof REPEAT_RANGE_OF_DATES)[number];
export type SeasonalValue = (typeof SEASONAL_VALUES)[number];
export type Unit = (typeof UNIT)[number];

type TypeOfEconFunctionRowField<FT> = FT extends EconFunctionRowField<IEconFunctionRow, infer T> ? T : never;

type ApiEconFunctionRowKey = keyof typeof API_ECON_FUNCTION_ROW_FIELDS;

export interface IRowField {
	rows: IEconFunctionRow[];
}

export interface IApiRowField {
	rows: ApiEconFunctionRow[];
}

export type ApiEconFunctionRow = {
	[key in ApiEconFunctionRowKey]?: TypeOfEconFunctionRowField<(typeof API_ECON_FUNCTION_ROW_FIELDS)[key]>;
};

type EconFunctionRowField<T extends IEconFunctionRow, TField> = IField<T, TField>;

type IEconFunctionRowField<T> = IField<IRowField, T>;

export const rowsReadWriteDbField = (): IEconFunctionRowField<ApiEconFunctionRow[]> => ({
	type: OpenApiDataType.array,
	parse: parseApiEconFunctionRow,
	items: { type: OpenApiDataType.object, properties: API_ECON_FUNCTION_ROW_FIELDS },
	write: (rowField, value) => set(rowField, ['rows'], toEconFunctionRow(value)),
	read: (rowField) => toApiEconFunctionRow(rowField),
});

const econFunctionRowReadWriteDbField = <K extends keyof IEconFunctionRow, TParsed = IEconFunctionRow[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => ({
	...readWriteDbField<IEconFunctionRow, K, TParsed>(key, definition, options),
	write: (econFunctionRow: Partial<IEconFunctionRow>, value: IEconFunctionRow[K]) => {
		if (notNil(value)) {
			econFunctionRow[key] = value;
		}
	},
});

// Econ Function Row Fields (alphabetical order)
export const API_ECON_FUNCTION_ROW_FIELDS = {
	capex: readWriteYesNoDbField<IEconFunctionRow>('capex'),
	carbonExpense: econFunctionRowReadWriteDbField('carbon_expense', NUMBER_FIELD),
	count: econFunctionRowReadWriteDbField('count', INTEGER_FIELD),
	dates: rowDateReadWriteDbField(),
	dollarPerBbl: econFunctionRowReadWriteDbField('dollar_per_bbl', NUMBER_FIELD),
	dollarPerBoe: econFunctionRowReadWriteDbField('dollar_per_boe', NUMBER_FIELD),
	dollarPerGal: econFunctionRowReadWriteDbField('dollar_per_gal', NUMBER_FIELD),
	dollarPerMcf: econFunctionRowReadWriteDbField('dollar_per_mcf', NUMBER_FIELD),
	dollarPerMmbtu: econFunctionRowReadWriteDbField('dollar_per_mmbtu', NUMBER_FIELD),
	dollarPerMonth: econFunctionRowReadWriteDbField('dollar_per_month', NUMBER_FIELD),
	dollarPerYear: econFunctionRowReadWriteDbField('dollar_per_year', NUMBER_FIELD),
	entireWellLife: econFunctionRowReadWriteDbField('entire_well_life', STRING_FIELD),
	fixedExpense: readWriteYesNoOrNumberDbField<IEconFunctionRow>('fixed_expense'),
	fixedExpensePerWell: econFunctionRowReadWriteDbField('fixed_expense_per_well', NUMBER_FIELD),
	gasRate: rowStartEndDateRangeReadWriteDbField('gas_rate'),
	monthPeriod: rowOffsetReadWriteDbField('month_period'),
	multiplier: econFunctionRowReadWriteDbField('multiplier', NUMBER_FIELD),
	offsetToAsOf: rowOffsetReadWriteDbField('offset_to_as_of_date'),
	offsetToDiscountDate: rowOffsetReadWriteDbField('offset_to_discount_date'),
	offsetToEndHistory: rowOffsetReadWriteDbField('offset_to_end_history'),
	offsetToFirstSegment: rowOffsetReadWriteDbField('offset_to_first_segment'),
	offsetToFpd: rowOffsetReadWriteDbField('offset_to_fpd'),
	oilRate: rowStartEndDateRangeReadWriteDbField('oil_rate'),
	pctOfBasePrice: econFunctionRowReadWriteDbField('pct_of_base_price', NUMBER_FIELD),
	pctOfDripCondensateRev: econFunctionRowReadWriteDbField('pct_of_drip_condensate_rev', NUMBER_FIELD),
	pctOfGasRev: econFunctionRowReadWriteDbField('pct_of_gas_rev', NUMBER_FIELD),
	pctOfNglRev: econFunctionRowReadWriteDbField('pct_of_ngl_rev', NUMBER_FIELD),
	pctOfOilPrice: econFunctionRowReadWriteDbField('pct_of_oil_price', NUMBER_FIELD),
	year: econFunctionRowReadWriteDbField('year', NUMBER_FIELD),
	tanFactor: econFunctionRowReadWriteDbField('tan_factor', NUMBER_FIELD),
	tanCumulative: econFunctionRowReadWriteDbField('tan_cumulative', NUMBER_FIELD),
	intanFactor: econFunctionRowReadWriteDbField('intan_factor', NUMBER_FIELD),
	intanCumulative: econFunctionRowReadWriteDbField('intan_cumulative', NUMBER_FIELD),
	tangibleBonusDepreciation: econFunctionRowReadWriteDbField('tangible_bonus_depreciation', NUMBER_FIELD),
	intangibleBonusDepreciation: econFunctionRowReadWriteDbField('intangible_bonus_depreciation', NUMBER_FIELD),
	pctOfOilRev: econFunctionRowReadWriteDbField('pct_of_oil_rev', NUMBER_FIELD),
	pctOfRevenue: econFunctionRowReadWriteDbField('pct_of_revenue', NUMBER_FIELD),
	pctOfTotalRev: econFunctionRowReadWriteDbField('pct_of_total_rev', NUMBER_FIELD),
	pctPerYear: econFunctionRowReadWriteDbField('pct_per_year', NUMBER_FIELD),
	pctRemaining: econFunctionRowReadWriteDbField('pct_remaining', NUMBER_FIELD),
	percentage: econFunctionRowReadWriteDbField('percentage', NUMBER_FIELD),
	phase: econFunctionRowReadWriteDbField('phase', STRING_FIELD),
	price: econFunctionRowReadWriteDbField('price', NUMBER_FIELD),
	repeatRangeOfDates: econFunctionRowReadWriteDbField('repeat_range_of_dates', STRING_FIELD),
	scalePostShutInEnd: econFunctionRowReadWriteDbField('scale_post_shut_in_end', STRING_FIELD),
	scalePostShutInEndCriteria: econFunctionRowReadWriteDbField('scale_post_shut_in_end_criteria', STRING_FIELD),
	seasonal: econFunctionRowReadWriteDbField('seasonal', STRING_FIELD),
	shrunkGas: econFunctionRowReadWriteDbField('shrunk_gas', STRING_FIELD),
	totalFluidRate: rowStartEndDateRangeReadWriteDbField('total_fluid_rate'),
	totalOccurrences: econFunctionRowReadWriteDbField('total_occurrences', INTEGER_FIELD),
	unit: econFunctionRowReadWriteDbField('unit', STRING_FIELD),
	unshrunkGas: econFunctionRowReadWriteDbField('unshrunk_gas', STRING_FIELD),
	waterRate: rowStartEndDateRangeReadWriteDbField('water_rate'),
	yield: econFunctionRowReadWriteDbField('yield', NUMBER_FIELD),
	discountTable: econFunctionRowReadWriteDbField('discount_table', getRangeField(0, 1000, 0)),
};

// IEconFunctionRow (alphabetical order)
export interface IEconFunctionRow {
	capex?: string;
	count?: number;
	dates?: IRowDateField;
	dollar_per_bbl?: number;
	dollar_per_boe?: number;
	dollar_per_gal?: number;
	dollar_per_mcf?: number;
	dollar_per_mmbtu?: number;
	dollar_per_month?: number;
	dollar_per_year?: number;
	entire_well_life?: string;
	fixed_expense?: string;
	gas_rate?: IStartEndRangeField;
	month_period?: IRowOffsetAsOfField;
	multiplier?: number;
	offset_to_as_of_date?: IRowOffsetAsOfField;
	offset_to_discount_date?: IRowOffsetAsOfField;
	offset_to_end_history?: IRowOffsetAsOfField;
	offset_to_first_segment?: IRowOffsetAsOfField;
	offset_to_fpd?: IRowOffsetAsOfField;
	oil_rate?: IStartEndRateField;
	pct_of_base_price?: number;
	pct_of_oil_price?: number;
	year?: number;
	tan_factor?: number;
	tan_cumulative?: number;
	intan_factor?: number;
	intan_cumulative?: number;
	tangible_bonus_depreciation?: number;
	intangible_bonus_depreciation?: number;
	pct_of_revenue?: number;
	pct_per_year?: number;
	pct_remaining?: number;
	percentage?: number;
	phase?: string;
	price?: number;
	repeat_range_of_dates?: string;
	scale_post_shut_in_end_criteria?: string;
	scale_post_shut_in_end?: string;
	seasonal?: string;
	shrunk_gas?: string;
	total_occurrences?: number;
	unit?: string;
	unshrunk_gas?: string;
	water_rate?: IStartEndRateField;
	yield?: number;
	pct_of_oil_rev?: number;
	pct_of_gas_rev?: number;
	pct_of_ngl_rev?: number;
	pct_of_drip_condensate_rev?: number;
	pct_of_total_rev?: number;
	total_fluid_rate?: IStartEndRateField;
	fixed_expense_per_well?: number;
	carbon_expense?: number;
	discount_table?: number;
}

export const toEconFunctionRow = (apiEconFunctionRows: ApiEconFunctionRow[]): IEconFunctionRow[] => {
	const econFunctionRowResults: IEconFunctionRow[] = [];

	if (isNil(apiEconFunctionRows)) {
		return econFunctionRowResults;
	}

	for (const apiEconFunctionRow of apiEconFunctionRows) {
		const econFunctionRowResult: IEconFunctionRow = {};

		Object.entries(API_ECON_FUNCTION_ROW_FIELDS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (escalation: IEconFunctionRow, value: unknown) => void;
				coercedWrite(econFunctionRowResult, apiEconFunctionRow[field as ApiEconFunctionRowKey]);
			}
		});
		econFunctionRowResults.push(econFunctionRowResult);
	}

	return econFunctionRowResults;
};

export const toApiEconFunctionRow = (rowField: IRowField): ApiEconFunctionRow[] => {
	const apiRows: ApiEconFunctionRow[] = [];

	if (!rowField?.rows?.length) {
		return apiRows;
	}

	const { rows } = rowField;

	for (const row of rows) {
		const apiEconFunctionRow: Record<string, ApiEconFunctionRow[ApiEconFunctionRowKey]> = {};

		Object.entries(API_ECON_FUNCTION_ROW_FIELDS).forEach(([field, { read }]) => {
			if (read) {
				apiEconFunctionRow[field] = read(row as IEconFunctionRow);
			}
		});
		apiRows.push(apiEconFunctionRow);
	}

	return apiRows;
};

const getApiRowField = (field: string): (typeof API_ECON_FUNCTION_ROW_FIELDS)[ApiEconFunctionRowKey] | null =>
	getApiField(field, API_ECON_FUNCTION_ROW_FIELDS);

export const parseApiEconFunctionRow = (rows: unknown, location?: string): ApiEconFunctionRow[] => {
	if (!Array.isArray(rows)) {
		throw new RequestStructureError(`Invalid Rows data structure`, location);
	}
	const errorAggregator = new ValidationErrorAggregator();
	const apiEconFunctionRowResult: ApiEconFunctionRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const apiEconFunctionRow: Record<string, ApiEconFunctionRow[ApiEconFunctionRowKey]> = {};
		const data = rows[i];
		Object.entries(data)
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}[${i}].${field}`;
					const apiEconFunctionRowField = getApiRowField(field);

					if (!apiEconFunctionRowField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}
					const { write, parse } = apiEconFunctionRowField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiEconFunctionRow[ApiEconFunctionRowKey]);

					if (write) {
						apiEconFunctionRow[field] = parsedValue;
					}
					return apiEconFunctionRow;
				}),
			);

		if (apiEconFunctionRow.scalePostShutInEndCriteria == 'econ_limit') {
			apiEconFunctionRow.scalePostShutInEnd = ' ';
		}

		apiEconFunctionRowResult.push(apiEconFunctionRow);
	}

	errorAggregator.throwAll();

	return apiEconFunctionRowResult;
};
