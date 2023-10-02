/* eslint-disable complexity */
import { groupBy } from 'lodash';

import { FieldNameError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiFluidModel, ApiFluidModelKey, getApiFluidModelField } from './fields/fluid-model';

export class FluidModelNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, FluidModelNotFoundError.name, statusCode);
	}
}

export class DuplicateFluidModelError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateFluidModelError.name;
	}
}

export class FluidModelCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FluidModelCollisionError.name;
	}
}

export class FluidModelRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FluidModelRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiFluidModel = (data: Record<string, unknown>, index?: number): ApiFluidModel => {
	const fluidModel: Record<string, ApiFluidModel[ApiFluidModelKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.FluidModels, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fluidModelField = getApiFluidModelField(field);

				if (!fluidModelField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = fluidModelField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiFluidModel[ApiFluidModelKey]);

				if (write) {
					fluidModel[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return fluidModel;
};

export const checkModelDuplicates = (
	apiFluidModels: Array<ApiFluidModel | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiFluidModel | undefined> => {
	const filtered = apiFluidModels.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiFluidModels];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateFluidModelError(
					`More than one fluidModel model data supplied with name \`${name}\``,
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
