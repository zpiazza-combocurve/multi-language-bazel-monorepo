import { get, isArray, isNil, set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { IDollarPerFtHorizontalRow } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { CompletionCostEconFunctionField } from './completion-cost';

export type DollarPerFtHorizontalRowField<T> = IField<IDollarPerFtHorizontalRow, T>;

export const dollarPerFtHorizontalRowsField = (): CompletionCostEconFunctionField<
	ApiDollarPerFtHorizontalRows[] | undefined
> => {
	return {
		type: OpenApiDataType.object,
		properties: API_COMPLETION_COST_ROWS,
		parse: (data: unknown, location?: string) => parseApiDollarPerFtHorizontalRows(data, location),
		read: (fields) => toApiDollarPerFtHorizontalRows(get(fields, ['dollar_per_ft_of_horizontal', 'rows'])),
		write: (fields, value) => {
			if (notNil(value)) {
				set(fields, ['dollar_per_ft_of_horizontal', 'rows'], toDollarPerFtHorizontalRows(value));
			}
		},
		options: { isRequired: false },
	};
};

const dollarPerFtHorizontalRowReadWriteDbField = <
	K extends keyof IDollarPerFtHorizontalRow,
	TParsed = IDollarPerFtHorizontalRow[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDollarPerFtHorizontalRow, K, TParsed>(key, definition, options);

export const API_COMPLETION_COST_ROWS = {
	propLl: dollarPerFtHorizontalRowReadWriteDbField('prop_ll', NUMBER_FIELD),
	unitCost: dollarPerFtHorizontalRowReadWriteDbField('unit_cost', NUMBER_FIELD),
};

export type ApiDollarPerFtHorizontalRowsKey = keyof typeof API_COMPLETION_COST_ROWS;

type TypeOfDollarPerFtHorizontalRow<FT> = FT extends DollarPerFtHorizontalRowField<infer T> ? T : never;

export type ApiDollarPerFtHorizontalRows = {
	[key in ApiDollarPerFtHorizontalRowsKey]?: TypeOfDollarPerFtHorizontalRow<(typeof API_COMPLETION_COST_ROWS)[key]>;
};

export const getApiDollarPerFtHorizontalRows = (
	field: string,
): (typeof API_COMPLETION_COST_ROWS)[ApiDollarPerFtHorizontalRowsKey] | null =>
	getApiField(field, API_COMPLETION_COST_ROWS);

export const getRequiredDollarPerFtHorizontalRows: ApiDollarPerFtHorizontalRowsKey[] = Object.entries(
	API_COMPLETION_COST_ROWS,
)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDollarPerFtHorizontalRowsKey);

export const toDollarPerFtHorizontalRows = (
	apiDollarPerFtHorizontalRowArray: ApiDollarPerFtHorizontalRows[],
): IDollarPerFtHorizontalRow[] | Record<string, unknown> | undefined => {
	if (apiDollarPerFtHorizontalRowArray === undefined) {
		return;
	}
	const rowsResult: IDollarPerFtHorizontalRow[] = [];
	for (const apiDollarPerFtHorizontalRow of apiDollarPerFtHorizontalRowArray) {
		const DollarPerFtHorizontalRowFieldResult = {};

		if (isNil(apiDollarPerFtHorizontalRow)) {
			return DollarPerFtHorizontalRowFieldResult;
		}

		Object.entries(API_COMPLETION_COST_ROWS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (
					DollarPerFtHorizontalRowField: IDollarPerFtHorizontalRow,
					value: unknown,
				) => void;
				coercedWrite(
					DollarPerFtHorizontalRowFieldResult as IDollarPerFtHorizontalRow,
					apiDollarPerFtHorizontalRow[field as ApiDollarPerFtHorizontalRowsKey],
				);
			}
		});
		rowsResult.push(DollarPerFtHorizontalRowFieldResult as IDollarPerFtHorizontalRow);
	}
	return rowsResult;
};

export const parseApiDollarPerFtHorizontalRows = (
	dataRow: unknown,
	location?: string,
): ApiDollarPerFtHorizontalRows[] => {
	if (!isArray(dataRow)) {
		throw new RequestStructureError(`Invalid Completion Cost Dollar Per Horizontal rows data structure`, location);
	}

	const errorAggregator = new ValidationErrorAggregator();
	const rowsParsed: ApiDollarPerFtHorizontalRows[] = [];
	for (const data of dataRow) {
		const DollarPerFtHorizontalRow: Record<string, ApiDollarPerFtHorizontalRows[ApiDollarPerFtHorizontalRowsKey]> =
			{};

		Object.entries(data)
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}.${field}`;
					const DollarPerFtHorizontalRowField = getApiDollarPerFtHorizontalRows(field);

					if (!DollarPerFtHorizontalRowField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}

					const { write, parse } = DollarPerFtHorizontalRowField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiDollarPerFtHorizontalRows[ApiDollarPerFtHorizontalRowsKey]);

					if (write) {
						DollarPerFtHorizontalRow[field] = parsedValue;
					}
				}),
			);
		rowsParsed.push(DollarPerFtHorizontalRow);
	}

	errorAggregator.throwAll();

	return rowsParsed;
};

export const toApiDollarPerFtHorizontalRows = (
	dollarPerFtHorizontalRowFields: IDollarPerFtHorizontalRow[],
): ApiDollarPerFtHorizontalRows[] | undefined => {
	if (dollarPerFtHorizontalRowFields === undefined) {
		return;
	}
	const rows: ApiDollarPerFtHorizontalRows[] = [];
	for (const DollarPerFtHorizontalRowField of dollarPerFtHorizontalRowFields) {
		const apiDollarPerFtHorizontalRow: Record<
			string,
			ApiDollarPerFtHorizontalRows[ApiDollarPerFtHorizontalRowsKey]
		> = {};
		Object.entries(API_COMPLETION_COST_ROWS).forEach(([field, { read }]) => {
			if (read) {
				apiDollarPerFtHorizontalRow[field] = read(DollarPerFtHorizontalRowField);
			}
		});
		rows.push(apiDollarPerFtHorizontalRow);
	}

	return rows;
};
