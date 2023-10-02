import { groupBy } from 'lodash';

import { FieldNameError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiProductionTaxes, ApiProductionTaxesKey, getApiProductionTaxesField } from './fields/production-taxes';

export class ProductionTaxesNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ProductionTaxesNotFoundError.name, statusCode);
	}
}

export class DuplicateProductionTaxesError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateProductionTaxesError.name;
	}
}

export class ProductionTaxesCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ProductionTaxesCollisionError.name;
	}
}

export class ProductionTaxesRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ProductionTaxesRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiProductionTaxes = (data: Record<string, unknown>, index?: number): ApiProductionTaxes => {
	const productionTaxes: Record<string, ApiProductionTaxes[ApiProductionTaxesKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.ProductionTaxes, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const productionTaxesField = getApiProductionTaxesField(field);

				if (!productionTaxesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = productionTaxesField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiProductionTaxes[ApiProductionTaxesKey]);

				if (write) {
					productionTaxes[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return productionTaxes;
};

export const checkModelDuplicates = (
	apiProductionTaxess: Array<ApiProductionTaxes | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiProductionTaxes | undefined> => {
	const filtered = apiProductionTaxess.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiProductionTaxess];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateProductionTaxesError(
					`More than one ProductionTaxes data supplied with name \`${name}\``,
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
