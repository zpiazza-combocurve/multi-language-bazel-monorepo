import { get, isArray, isNil, set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IDrillingCostRow } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { DrillingCostEconFunctionField } from './drilling-cost';

export type DrillingCostRowField<T> = IField<IDrillingCostRow, T>;

export const drillingCostRowField = (): DrillingCostEconFunctionField<ApiDrillingCostRows[] | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: API_DRILLING_COST_ROWS,
		parse: (data: unknown, location?: string) => parseApiDrillingCostRows(data, location),
		read: (fields) => toApiDrillingCostRows(get(fields, ['rows'])),
		write: (fields, value) => {
			if (notNil(value)) {
				set(fields, ['rows'], toDrillingCostRows(value));
			}
		},
		options: { isRequired: false },
	};
};

const drillingCostRowReadWriteDbField = <K extends keyof IDrillingCostRow, TParsed = IDrillingCostRow[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDrillingCostRow, K, TParsed>(key, definition, options);

export const API_DRILLING_COST_ROWS = {
	date: drillingCostRowReadWriteDbField('date', STRING_FIELD),
	pctOfTotalCost: drillingCostRowReadWriteDbField('pct_of_total_cost', NUMBER_FIELD),
	offsetToFpd: drillingCostRowReadWriteDbField('offset_to_fpd', NUMBER_FIELD),
	offsetToAsOf: drillingCostRowReadWriteDbField('offset_to_as_of_date', NUMBER_FIELD),
	offsetToDiscountDate: drillingCostRowReadWriteDbField('offset_to_discount_date', NUMBER_FIELD),
	offsetToFirstSegment: drillingCostRowReadWriteDbField('offset_to_first_segment', NUMBER_FIELD),
	scheduleStart: drillingCostRowReadWriteDbField('schedule_start', NUMBER_FIELD),
	scheduleEnd: drillingCostRowReadWriteDbField('schedule_end', NUMBER_FIELD),
};

export type ApiDrillingCostRowsKey = keyof typeof API_DRILLING_COST_ROWS;

type TypeOfDrillingCostRow<FT> = FT extends DrillingCostRowField<infer T> ? T : never;

export type ApiDrillingCostRows = {
	[key in ApiDrillingCostRowsKey]?: TypeOfDrillingCostRow<(typeof API_DRILLING_COST_ROWS)[key]>;
};

export const getApiDrillingCostRows = (field: string): (typeof API_DRILLING_COST_ROWS)[ApiDrillingCostRowsKey] | null =>
	getApiField(field, API_DRILLING_COST_ROWS);

export const getRequiredDrillingCostRows: ApiDrillingCostRowsKey[] = Object.entries(API_DRILLING_COST_ROWS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDrillingCostRowsKey);

export const toDrillingCostRows = (
	apiDrillingCostRowArray: ApiDrillingCostRows[],
): IDrillingCostRow[] | Record<string, unknown> | undefined => {
	if (apiDrillingCostRowArray === undefined) {
		return;
	}
	const rowsResult: IDrillingCostRow[] = [];
	for (const apiDrillingCostRow of apiDrillingCostRowArray) {
		const drillingCostRowFieldResult = {};

		if (isNil(apiDrillingCostRow)) {
			return drillingCostRowFieldResult;
		}

		Object.entries(API_DRILLING_COST_ROWS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (drillingCostRowField: IDrillingCostRow, value: unknown) => void;
				coercedWrite(
					drillingCostRowFieldResult as IDrillingCostRow,
					apiDrillingCostRow[field as ApiDrillingCostRowsKey],
				);
			}
		});
		rowsResult.push(drillingCostRowFieldResult as IDrillingCostRow);
	}
	return rowsResult;
};

export const parseApiDrillingCostRows = (dataRow: unknown, location?: string): ApiDrillingCostRows[] => {
	if (!isArray(dataRow)) {
		throw new RequestStructureError(`Invalid Capex model rows data structure`, location);
	}

	const errorAggregator = new ValidationErrorAggregator();
	const rowsParsed: ApiDrillingCostRows[] = [];
	for (const data of dataRow) {
		const drillingCostRow: Record<string, ApiDrillingCostRows[ApiDrillingCostRowsKey]> = {};

		Object.entries(data)
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}.${field}`;
					const drillingCostRowField = getApiDrillingCostRows(field);

					if (!drillingCostRowField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}

					const { write, parse } = drillingCostRowField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiDrillingCostRows[ApiDrillingCostRowsKey]);

					if (write) {
						drillingCostRow[field] = parsedValue;
					}
				}),
			);
		rowsParsed.push(drillingCostRow);
	}

	errorAggregator.throwAll();

	return rowsParsed;
};

export const toApiDrillingCostRows = (drillingCostRowFields: IDrillingCostRow[]): ApiDrillingCostRows[] | undefined => {
	if (drillingCostRowFields === undefined) {
		return;
	}
	const rows: ApiDrillingCostRows[] = [];
	for (const drillingCostRowField of drillingCostRowFields) {
		const apiDrillingCostRow: Record<string, ApiDrillingCostRows[ApiDrillingCostRowsKey]> = {};
		Object.entries(API_DRILLING_COST_ROWS).forEach(([field, { read }]) => {
			if (read) {
				apiDrillingCostRow[field] = read(drillingCostRowField);
			}
		});
		rows.push(apiDrillingCostRow);
	}

	return rows;
};
