import { get, isArray, set } from 'lodash';

import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IDepreciationRowObject } from '@src/models/econ/depreciation';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { IDepreciationEconFunctionField } from './depreciation';

const depreciationRowObjectRowReadWriteDbField = <
	K extends keyof IDepreciationRowObject,
	TParsed = IDepreciationRowObject[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDepreciationRowObject, K, TParsed>(key, definition, options);

export const API_Depreciation_MODEL_ROWS = {
	year: depreciationRowObjectRowReadWriteDbField('year', NUMBER_FIELD),
	tanFactor: depreciationRowObjectRowReadWriteDbField('tan_factor', NUMBER_FIELD),
	tanCumulative: depreciationRowObjectRowReadWriteDbField('tan_cumulative', NUMBER_FIELD),
	intanFactor: depreciationRowObjectRowReadWriteDbField('intan_factor', NUMBER_FIELD),
	intanCumulative: depreciationRowObjectRowReadWriteDbField('intan_cumulative', NUMBER_FIELD),
};

export type IDepreciationRowObjectField<T> = IField<IDepreciationRowObject, T>;
type ApiDepreciationRowObjectKey = keyof typeof API_Depreciation_MODEL_ROWS;
type ApiDepreciationRowObject = {
	[key in ApiDepreciationRowObjectKey]?: TypeOfField<(typeof API_Depreciation_MODEL_ROWS)[key]>;
};

export const depreciationRowFields = (): IDepreciationEconFunctionField<ApiDepreciationRowObject[]> => ({
	type: OpenApiDataType.object,
	properties: API_Depreciation_MODEL_ROWS,
	parse: (data, location) => parseDepreciationRowObject(data, location),
	read: (d) => toApiDepreciationRowObject(get(d, ['depreciation', 'rows'])),
	write: (d, v) => set(d, ['depreciation', 'rows'], toDepreciationRowObject(v)),
});

type TypeOfField<FT> = FT extends IDepreciationRowObjectField<infer T> ? T : never;

export const toApiDepreciationRowObject = (
	depreciationRowObjectRows: IDepreciationRowObject[],
): ApiDepreciationRowObject[] => {
	const rows: ApiDepreciationRowObject[] = [];
	for (const depreciationRowObjectRow of depreciationRowObjectRows) {
		const apiDepreciationRowObject: Record<string, ApiDepreciationRowObject[ApiDepreciationRowObjectKey]> = {};
		Object.entries(API_Depreciation_MODEL_ROWS).forEach(([field, { read }]) => {
			if (read) {
				apiDepreciationRowObject[field] = read(depreciationRowObjectRow);
			}
		});
		rows.push(apiDepreciationRowObject);
	}

	return rows;
};

export const toDepreciationRowObject = (
	apiDepreciationRowObjectArray: ApiDepreciationRowObject[],
): IDepreciationRowObject[] => {
	const rowsResult: IDepreciationRowObject[] = [];
	for (const apiDepreciationRowObject of apiDepreciationRowObjectArray) {
		const depreciationRowObject = {};

		if (isNil(apiDepreciationRowObject)) {
			return rowsResult;
		}

		Object.entries(API_Depreciation_MODEL_ROWS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (otherCapexRowField: IDepreciationRowObject, value: unknown) => void;
				coercedWrite(
					depreciationRowObject as IDepreciationRowObject,
					apiDepreciationRowObject[field as ApiDepreciationRowObjectKey],
				);
			}
		});
		rowsResult.push(depreciationRowObject as IDepreciationRowObject);
	}
	return rowsResult;
};

export const getApiDrillingCostRows = (
	field: string,
): (typeof API_Depreciation_MODEL_ROWS)[ApiDepreciationRowObjectKey] | null =>
	getApiField(field, API_Depreciation_MODEL_ROWS);

export const parseDepreciationRowObject = (
	dataRow: unknown | Record<string, unknown>[],
	location?: string,
): ApiDepreciationRowObject[] => {
	if (!isArray(dataRow)) {
		throw new RequestStructureError(`Invalid Capex model rows data structure`, location);
	}

	const errorAggregator = new ValidationErrorAggregator();
	const rowsParsed: ApiDepreciationRowObject[] = [];

	for (let index = 0; index < dataRow.length; index++) {
		const data = dataRow[index];
		const previousRowIndex = index - 1;
		const drillingCostRow: Record<string, ApiDepreciationRowObject[ApiDepreciationRowObjectKey]> = {};
		data.year = index + 1;

		data.tanCumulative = data.tanFactor + (!!dataRow[previousRowIndex] && dataRow[previousRowIndex].tanCumulative);
		data.intanCumulative =
			data.intanFactor + (!!dataRow[previousRowIndex] && dataRow[previousRowIndex].intanCumulative);

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
						: (value as ApiDepreciationRowObject[ApiDepreciationRowObjectKey]);

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
