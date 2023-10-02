import { get, isArray } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	API_ECON_FUNCTION_ROW_FIELDS,
	ApiEconFunctionRow,
	IEconFunctionRow,
} from '../../row-fields/econ-function-row-fields';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

export interface IRiskingShutInRows {
	rows: IRiskingShutInRow[];
}
export type IRiskingShutInRowsField<T> = IField<IRiskingShutInRow, T>;
export interface ApiRiskingShutInRows {
	rows: ApiRiskingShutInRow[];
}
export interface IRiskingShutInRow extends IEconFunctionRow {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any | undefined;
	start_date: string;
	end_date: string;
	start: number;
	end: number;
}
export interface ApiRiskingShutInRow extends ApiEconFunctionRow {
	startDate?: string;
	endDate?: string;
	start?: number;
	end?: number;
}

const startEndOffsetReadWriteField = (
	key: string | keyof IRiskingShutInRow,
	definition: IFieldDefinition<number | undefined>,
): IRiskingShutInRowsField<ApiRiskingShutInRow | undefined> => {
	const { parse } = definition;

	return {
		type: OpenApiDataType.object,
		parse: (data: unknown, location?: string) => {
			if (parse) {
				return {
					start: parse(get(data, ['start']), location),
					end: parse(get(data, ['end']), location),
				};
			}

			return {};
		},
		read: (value) => {
			if (isNil(value)) {
				return;
			}

			const start = get(value, [key, 'start']);
			const end = get(value, [key, 'end']);

			if (isNil(start) || isNil(end)) {
				return;
			}

			return { start, end };
		},
		write: (object, value) => {
			if (isNil(value)) {
				return;
			}

			const start = get(value, ['start']);
			const end = get(value, ['end']);

			if (isNil(start) || isNil(end)) {
				return;
			}

			object[key] = { start, end };
		},
	};
};

const startEndDateReadWriteField = (
	key: string | keyof IRiskingShutInRow,
	definition: IFieldDefinition<string | undefined>,
): IRiskingShutInRowsField<ApiRiskingShutInRow | undefined> => {
	const { parse } = definition;

	return {
		type: OpenApiDataType.object,
		parse: (data: unknown, location?: string) => {
			if (parse) {
				return {
					startDate: parse(get(data, ['startDate']), location),
					endDate: parse(get(data, ['endDate']), location),
				};
			}

			return {};
		},
		read: (value) => {
			if (isNil(value)) {
				return;
			}

			const startDate = get(value, [key, 'start_date']);
			const endDate = get(value, [key, 'end_date']);

			if (isNil(startDate) || isNil(endDate)) {
				return;
			}

			return { startDate, endDate };
		},
		write: (object, value) => {
			if (isNil(value)) {
				return;
			}

			const start_date = get(value, ['startDate']);
			const end_date = get(value, ['endDate']);

			if (isNil(start_date) || isNil(end_date)) {
				return;
			}

			object[key] = { start_date, end_date };
		},
	};
};

const RISKING_SHUT_IN_ROWS = {
	...API_ECON_FUNCTION_ROW_FIELDS,
	dates: startEndDateReadWriteField('dates', STRING_FIELD),
	offsetToAsOf: startEndOffsetReadWriteField('offset_to_as_of_date', NUMBER_FIELD),
};

type ApiRiskingShutInRowKey = keyof typeof RISKING_SHUT_IN_ROWS;

export const readShutInRows = (shutInRow: IRiskingShutInRows): ApiRiskingShutInRows | undefined => {
	if (!shutInRow) {
		return;
	}
	const apiRows: ApiRiskingShutInRows = { rows: [] };

	for (const row of shutInRow.rows) {
		const apiRowDateField: Record<string, ApiRiskingShutInRow[ApiRiskingShutInRowKey]> = {};

		Object.entries(RISKING_SHUT_IN_ROWS).forEach(([field, { read }]) => {
			if (read) {
				apiRowDateField[field] = read(row);
			}
		});
		apiRows.rows.push(apiRowDateField);
	}

	return apiRows;
};

export const writeShutInRows = (
	apiRiskingShutInRow: Partial<ApiRiskingShutInRows> | undefined,
): IRiskingShutInRows | undefined => {
	if (!apiRiskingShutInRow?.rows) {
		return;
	}

	const shutInRows: IRiskingShutInRows = { rows: [] };
	for (const row of apiRiskingShutInRow.rows) {
		const apiRowDateField: Record<string, IRiskingShutInRow[keyof IRiskingShutInRow]> = {};
		Object.entries(RISKING_SHUT_IN_ROWS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (dateField: ApiRiskingShutInRow, value: unknown) => void;

				coercedWrite(apiRowDateField, row[field as ApiRiskingShutInRowKey]);
			}
		});
		shutInRows.rows.push(apiRowDateField as unknown as IRiskingShutInRow);
	}

	return shutInRows;
};

const getApiRowOffsetAsOfField = (field: string): (typeof RISKING_SHUT_IN_ROWS)[ApiRiskingShutInRowKey] | null =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getApiField(field, RISKING_SHUT_IN_ROWS as any);

export const parseApiShutInRowField = (data: unknown, location?: string): ApiRiskingShutInRows => {
	const { rows } = data as { rows: unknown };
	if (!isArray(rows)) {
		throw new RequestStructureError(`Invalid shut in data structure`, location);
	}

	const shutInRows: ApiRiskingShutInRows = { rows: [] };
	const errorAggregator = new ValidationErrorAggregator();
	for (const row of rows) {
		const apiRiskingShutInRow: Record<string, ApiRiskingShutInRow[ApiRiskingShutInRowKey]> = {};

		if (row.scalePostShutInEndCriteria == 'econ_limit') {
			row.scalePostShutInEnd = ' ';
		}

		if (row.offsetToAsOf) {
			row.repeatRangeOfDates = 'no_repeat';
			row.totalOccurrences = 1;
		} else {
			row.unit = 'day';
		}

		Object.entries(row)
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}.${field}`;
					const apiRowOffsetAsOfField = getApiRowOffsetAsOfField(field);

					if (!apiRowOffsetAsOfField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}
					const { write, parse } = apiRowOffsetAsOfField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiRiskingShutInRow[ApiRiskingShutInRowKey]);

					if (write) {
						apiRiskingShutInRow[field] = parsedValue as ApiRiskingShutInRow[ApiRiskingShutInRowKey];
					}
				}),
			);
		shutInRows.rows.push(apiRiskingShutInRow);
	}

	errorAggregator.throwAll();
	return shutInRows;
};
