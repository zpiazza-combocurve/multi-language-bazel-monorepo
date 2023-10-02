import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { IAdValoremTaxEconFunction } from '@src/models/econ/production-taxes';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';
import { rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

import { escalationModelObjectReadWriteDbField } from './escalation-model-object-fields';

export type AdValoremEconFunctionField<T> = IField<IAdValoremTaxEconFunction, T>;
export type ApiAdValoremEconFunctionKey = keyof typeof API_AD_VALOREM_ECON_FUNCTION;

type TypeOfField<FT> = FT extends AdValoremEconFunctionField<infer T> ? T : never;

export type ApiAdValoremEconFunction = {
	[key in ApiAdValoremEconFunctionKey]?: TypeOfField<(typeof API_AD_VALOREM_ECON_FUNCTION)[key]>;
};

const adValoremEconFunctionReadWriteDbField = <
	K extends keyof IAdValoremTaxEconFunction,
	TParsed = IAdValoremTaxEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IAdValoremTaxEconFunction, K, TParsed>(key, definition, options);

export const API_AD_VALOREM_ECON_FUNCTION = {
	deductSeveranceTax: readWriteYesNoDbField('deduct_severance_tax'),
	shrinkageCondition: adValoremEconFunctionReadWriteDbField('shrinkage_condition', STRING_FIELD),
	calculation: adValoremEconFunctionReadWriteDbField('calculation', STRING_FIELD),
	rateType: adValoremEconFunctionReadWriteDbField('rate_type', STRING_FIELD),
	rowsCalculationMethod: adValoremEconFunctionReadWriteDbField('rows_calculation_method', STRING_FIELD),
	escalationModel: escalationModelObjectReadWriteDbField(),
	rows: rowsReadWriteDbField(),
};

export const getApiAdValoremEconFunctionField = (
	field: string,
): (typeof API_AD_VALOREM_ECON_FUNCTION)[ApiAdValoremEconFunctionKey] | null =>
	getApiField(field, API_AD_VALOREM_ECON_FUNCTION);

export const getRequiredFields: ApiAdValoremEconFunctionKey[] = Object.entries(API_AD_VALOREM_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiAdValoremEconFunctionKey);

export const toAdValoremTaxEconFunction = (
	apiAdValoremEconFunction: ApiAdValoremEconFunction,
): IAdValoremTaxEconFunction | Record<string, unknown> => {
	const productionAdValoremResult = {};

	if (isNil(apiAdValoremEconFunction)) {
		return productionAdValoremResult;
	}

	Object.entries(API_AD_VALOREM_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (AdValorem: IAdValoremTaxEconFunction, value: unknown) => void;
			coercedWrite(
				productionAdValoremResult as IAdValoremTaxEconFunction,
				apiAdValoremEconFunction[field as ApiAdValoremEconFunctionKey],
			);
		}
	});
	return productionAdValoremResult;
};

export const toApiAdValoremTaxEconFunction = (
	adValoremTaxEconFunction: IAdValoremTaxEconFunction,
): ApiAdValoremEconFunction => {
	const apiAdValoremEconFunction: Record<string, ApiAdValoremEconFunction[ApiAdValoremEconFunctionKey]> = {};
	Object.entries(API_AD_VALOREM_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiAdValoremEconFunction[field] = read(adValoremTaxEconFunction);
		}
	});
	return apiAdValoremEconFunction;
};

export const parseApiAdValoremTaxEconFunction = (data: unknown, location?: string): ApiAdValoremEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ProductionTaxes data structure`, location);
	}

	const productionAdValorem: Record<string, ApiAdValoremEconFunction[ApiAdValoremEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const productionAdValoremField = getApiAdValoremEconFunctionField(field);

				if (!productionAdValoremField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateAdValoremRows(value, fieldPath);
				}
				const { write, parse } = productionAdValoremField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiAdValoremEconFunction[ApiAdValoremEconFunctionKey]);

				if (write) {
					productionAdValorem[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionAdValorem;
};

export const getEconFunctionsRowTypesGenerators = (): [
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndRateCriteria,
	typeof GenerateStartEndDatesCriteria,
	typeof GenerateFlatRowCriteria,
] => {
	return [
		GenerateStartEndPeriodCriteria,
		GenerateStartEndRateCriteria,
		GenerateStartEndDatesCriteria,
		GenerateFlatRowCriteria,
	];
};

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];
	return getMatchingValidationFunction(firstRow, getEconFunctionsRowTypesGenerators);
};

export const validateAdValoremRows = (rows: unknown, location: string): void => {
	const errorAggregator = new ValidationErrorAggregator();

	errorAggregator.catch(() => {
		if (!Array.isArray(rows)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		const areRowsObject = rows.map(isObject);
		if (areRowsObject.some((isObject) => !isObject)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		const validateRowsFunction = getRowsValidation(rows);

		for (const rowProperty of validateRowsFunction) {
			errorAggregator.catch(() => {
				rowProperty.validateRows({
					rows,
					location,
				});
			});
		}
	});

	errorAggregator.throwAll();
};
