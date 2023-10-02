import { groupBy } from 'lodash';

import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	getMatchingValidationFunction,
} from '../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiPricing, ApiPricingKey, getApiPricingField } from './fields/pricing';
import {
	ApiPricingEconFunction,
	ApiPricingEconFunctionKey,
	getApiPricingEconFunctionField,
} from './fields/pricing-econ-function';
import { ApiPricingType, ApiPricingTypeKey, getApiPricingTypeField } from './fields/pricing-type';

const DECIMAL_SCALE = 6 as const;
export class PricingNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, PricingNotFoundError.name, statusCode);
	}
}

export class DuplicatePricingError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicatePricingError.name;
	}
}

export class PricingCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = PricingCollisionError.name;
	}
}

export class PricingRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = PricingRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiPricing = (data: Record<string, unknown>, index?: number): ApiPricing => {
	const pricing: Record<string, ApiPricing[ApiPricingKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Pricing, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const pricingField = getApiPricingField(field);

				if (!pricingField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = pricingField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiPricing[ApiPricingKey]);

				if (write) {
					pricing[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return pricing;
};

export const parsePricingEconFunction = (data: unknown, location?: string): ApiPricingEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Pricing data structure`, location);
	}

	const pricingEconFunction: Record<string, ApiPricingEconFunction[ApiPricingEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const pricingEconFunctionField = getApiPricingEconFunctionField(field);

				if (!pricingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = pricingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiPricingEconFunction[ApiPricingEconFunctionKey]);

				if (write) {
					pricingEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return pricingEconFunction;
};

export const checkModelDuplicates = (
	apiPricings: Array<ApiPricing | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiPricing | undefined> => {
	const filtered = apiPricings.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiPricings];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicatePricingError(
					`More than one Pricing data supplied with name \`${name}\``,
					occurrences.map(({ indexInList }) => `[${indexInList}]`).join(', '),
				);
			}
		}),
	);

	if (!errorAggregator) {
		currentErrorAggregator.throwAll();
	}

	return validElements;
};

export const parsePricingType = (data: unknown, location?: string): ApiPricingType => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Pricing data structure`, location);
	}
	const apiPricingType: Record<string, ApiPricingType[ApiPricingTypeKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	//setting this property default value bc is needed in flex_cc
	if (data.escalationModel == undefined) {
		data.escalationModel = 'none';
	}

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiPricingTypeField = getApiPricingTypeField(field);

				if (!apiPricingTypeField) {
					return;
				}

				if (field === 'rows') {
					validatePricingRows(value, fieldPath);
				}

				const { write, parse } = apiPricingTypeField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiPricingType[ApiPricingTypeKey]);

				if (write) {
					apiPricingType[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiPricingType;
};

export const getEconFunctionsRowTypesGenerators = (): [
	typeof GenerateFlatRowCriteria,
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndDatesCriteria,
] => {
	return [GenerateFlatRowCriteria, GenerateStartEndPeriodCriteria, GenerateStartEndDatesCriteria];
};

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];
	return getMatchingValidationFunction(firstRow, getEconFunctionsRowTypesGenerators);
};

export const validatePricingRows = (rows: unknown, location: string): void => {
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
					rows: rows,
					location,
					valueRange: undefined,
					decimalScale: DECIMAL_SCALE,
				});
			});
		}
	});

	errorAggregator.throwAll();
};
