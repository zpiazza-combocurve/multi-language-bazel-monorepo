import { groupBy } from 'lodash';

import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiEmission, ApiEmissionKey, getApiEmissionField } from './fields/emission';
import {
	ApiEmissionEconFunction,
	ApiEmissionEconFunctionKey,
	getApiEmissionEconFunctionField,
} from './fields/emission-econ-function';

export class EmissionNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, EmissionNotFoundError.name, statusCode);
	}
}

export class DuplicateEmissionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateEmissionError.name;
	}
}

export class EmissionCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = EmissionCollisionError.name;
	}
}

export class EmissionRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = EmissionRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiEmission = (data: Record<string, unknown>, index?: number): ApiEmission => {
	const emission: Record<string, ApiEmission[ApiEmissionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Emissions, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const emissionField = getApiEmissionField(field);

				if (!emissionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = emissionField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiEmission[ApiEmissionKey]);

				if (write) {
					emission[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return emission;
};

export const parseEmissionEconFunction = (data: unknown, location?: string): ApiEmissionEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Emission data structure`, location);
	}

	const emissionEconFunction: Record<string, ApiEmissionEconFunction[ApiEmissionEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const emissionEconFunctionField = getApiEmissionEconFunctionField(field);

				if (!emissionEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = emissionEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEmissionEconFunction[ApiEmissionEconFunctionKey]);

				if (write) {
					emissionEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return emissionEconFunction;
};

export const checkModelDuplicates = (
	apiEmissions: Array<ApiEmission | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiEmission | undefined> => {
	const filtered = apiEmissions.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiEmissions];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateEmissionError(
					`More than one Emission model supplied with name \`${name}\``,
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
