import { get, isArray, isNil, set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { ICompletionCostRow } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { CompletionCostEconFunctionField } from './completion-cost';

export type CompletionCostRowField<T> = IField<ICompletionCostRow, T>;

export const completionCostRowsField = (): CompletionCostEconFunctionField<ApiCompletionCostRows[] | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: API_COMPLETION_COST_ROWS,
		parse: (data: unknown, location?: string) => parseApiCompletionCostRows(data, location),
		read: (fields) => toApiCompletionCostRows(get(fields, ['rows'])),
		write: (fields, value) => {
			if (notNil(value)) {
				set(fields, ['rows'], toCompletionCostRows(value));
			}
		},
		options: { isRequired: false },
	};
};

const completionCostRowReadWriteDbField = <K extends keyof ICompletionCostRow, TParsed = ICompletionCostRow[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ICompletionCostRow, K, TParsed>(key, definition, options);

export const API_COMPLETION_COST_ROWS = {
	date: completionCostRowReadWriteDbField('date', STRING_FIELD),
	pctOfTotalCost: completionCostRowReadWriteDbField('pct_of_total_cost', NUMBER_FIELD),
	offsetToFpd: completionCostRowReadWriteDbField('offset_to_fpd', NUMBER_FIELD),
	offsetToAsOf: completionCostRowReadWriteDbField('offset_to_as_of_date', NUMBER_FIELD),
	offsetToDiscountDate: completionCostRowReadWriteDbField('offset_to_discount_date', NUMBER_FIELD),
	offsetToFirstSegment: completionCostRowReadWriteDbField('offset_to_first_segment', NUMBER_FIELD),
	scheduleStart: completionCostRowReadWriteDbField('schedule_start', NUMBER_FIELD),
	scheduleEnd: completionCostRowReadWriteDbField('schedule_end', NUMBER_FIELD),
};

export type ApiCompletionCostRowsKey = keyof typeof API_COMPLETION_COST_ROWS;

type TypeOfCompletionCostRow<FT> = FT extends CompletionCostRowField<infer T> ? T : never;

export type ApiCompletionCostRows = {
	[key in ApiCompletionCostRowsKey]?: TypeOfCompletionCostRow<(typeof API_COMPLETION_COST_ROWS)[key]>;
};

export const getApiCompletionCostRows = (
	field: string,
): (typeof API_COMPLETION_COST_ROWS)[ApiCompletionCostRowsKey] | null => getApiField(field, API_COMPLETION_COST_ROWS);

export const getRequiredCompletionCostRows: ApiCompletionCostRowsKey[] = Object.entries(API_COMPLETION_COST_ROWS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiCompletionCostRowsKey);

export const toCompletionCostRows = (
	apiCompletionCostRowArray: ApiCompletionCostRows[],
): ICompletionCostRow[] | Record<string, unknown> | undefined => {
	if (apiCompletionCostRowArray === undefined) {
		return;
	}
	const rowsResult: ICompletionCostRow[] = [];
	for (const apiCompletionCostRow of apiCompletionCostRowArray) {
		const CompletionCostRowFieldResult = {};

		if (isNil(apiCompletionCostRow)) {
			return CompletionCostRowFieldResult;
		}

		Object.entries(API_COMPLETION_COST_ROWS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (CompletionCostRowField: ICompletionCostRow, value: unknown) => void;
				coercedWrite(
					CompletionCostRowFieldResult as ICompletionCostRow,
					apiCompletionCostRow[field as ApiCompletionCostRowsKey],
				);
			}
		});
		rowsResult.push(CompletionCostRowFieldResult as ICompletionCostRow);
	}
	return rowsResult;
};

export const parseApiCompletionCostRows = (dataRow: unknown, location?: string): ApiCompletionCostRows[] => {
	if (!isArray(dataRow)) {
		throw new RequestStructureError(`Invalid Completion Cost rows data structure`, location);
	}

	const errorAggregator = new ValidationErrorAggregator();
	const rowsParsed: ApiCompletionCostRows[] = [];
	for (const data of dataRow) {
		const CompletionCostRow: Record<string, ApiCompletionCostRows[ApiCompletionCostRowsKey]> = {};

		Object.entries(data)
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}.${field}`;
					const CompletionCostRowField = getApiCompletionCostRows(field);

					if (!CompletionCostRowField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}

					const { write, parse } = CompletionCostRowField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiCompletionCostRows[ApiCompletionCostRowsKey]);

					if (write) {
						CompletionCostRow[field] = parsedValue;
					}
				}),
			);
		rowsParsed.push(CompletionCostRow);
	}

	errorAggregator.throwAll();

	return rowsParsed;
};

export const toApiCompletionCostRows = (
	completionCostRowFields: ICompletionCostRow[],
): ApiCompletionCostRows[] | undefined => {
	if (completionCostRowFields === undefined) {
		return;
	}
	const rows: ApiCompletionCostRows[] = [];
	for (const CompletionCostRowField of completionCostRowFields) {
		const apiCompletionCostRow: Record<string, ApiCompletionCostRows[ApiCompletionCostRowsKey]> = {};
		Object.entries(API_COMPLETION_COST_ROWS).forEach(([field, { read }]) => {
			if (read) {
				apiCompletionCostRow[field] = read(CompletionCostRowField);
			}
		});
		rows.push(apiCompletionCostRow);
	}

	return rows;
};
