import { groupBy } from 'lodash';

import { FieldNameError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiDepreciation, ApiDepreciationKey, getApiDepreciationField } from './fields/depreciation-econ-function';

export class DepreciationNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, DepreciationNotFoundError.name, statusCode);
	}
}

export class DuplicateDepreciationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateDepreciationError.name;
	}
}

export class DepreciationCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DepreciationCollisionError.name;
	}
}

export class DepreciationRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DepreciationRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiDepreciation = (data: Record<string, unknown>, index?: number): ApiDepreciation => {
	const depreciation: Record<string, ApiDepreciation[ApiDepreciationKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Depreciation, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const depreciationField = getApiDepreciationField(field);

				if (!depreciationField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = depreciationField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiDepreciation[ApiDepreciationKey]);

				if (write) {
					depreciation[field] = parsedValue;
				}
			}),
		);

	return depreciation;
};

export const checkModelDuplicates = (
	apiDepreciations: Array<ApiDepreciation | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiDepreciation | undefined> => {
	const filtered = apiDepreciations.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiDepreciations];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateDepreciationError(
					`More than one Depreciation model supplied with name \`${name}\``,
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
