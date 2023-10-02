import { groupBy } from 'lodash';

import { isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiReservesCategory, ApiReservesCategoryKey, getApiReservesCategoryField } from './fields/reserves-category';
import {
	ApiReservesCategoryEconFunction,
	ApiReservesCategoryEconFunctionKey,
	getApiReservesCategoryEconFunctionField,
} from './fields/reserves-category-econ-function';

export class ReservesCategoryNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ReservesCategoryNotFoundError.name, statusCode);
	}
}

export class DuplicateReservesCategoryError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateReservesCategoryError.name;
	}
}

export class ReservesCategoryCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ReservesCategoryCollisionError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiReservesCategory = (data: Record<string, unknown>, index?: number): ApiReservesCategory => {
	const reservesCategory: Record<string, ApiReservesCategory[ApiReservesCategoryKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();
	validateSchema(ValidationSchemas.ReservesCategory, data, errorAggregator, index);

	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const reservesCategoryField = getApiReservesCategoryField(field);

				if (!reservesCategoryField) {
					return;
				}

				const { write, parse } = reservesCategoryField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiReservesCategory[ApiReservesCategoryKey]);

				if (write) {
					reservesCategory[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return reservesCategory;
};

export const parseReservesCategoryEconFunction = (
	data: unknown,
	location?: string,
): ApiReservesCategoryEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid reserves category data structure`, location);
	}

	const reservesCategoryEconFunction: Record<
		string,
		ApiReservesCategoryEconFunction[ApiReservesCategoryEconFunctionKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const reservesCategoryEconFunctionField = getApiReservesCategoryEconFunctionField(field);

				if (!reservesCategoryEconFunctionField) {
					return;
				}

				const { write, parse } = reservesCategoryEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiReservesCategoryEconFunction[ApiReservesCategoryEconFunctionKey]);

				if (write) {
					reservesCategoryEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return reservesCategoryEconFunction;
};

export const checkDuplicates = (
	apiReservesCategories: Array<ApiReservesCategory | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiReservesCategory | undefined> => {
	const filtered = apiReservesCategories.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiReservesCategories];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateReservesCategoryError(
					`More than one reserves category data supplied with name \`${name}\``,
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
