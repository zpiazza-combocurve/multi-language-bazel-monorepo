import { groupBy, isNil } from 'lodash';

import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import {
	ApiOwnershipReversion,
	ApiOwnershipReversionKey,
	getApiOwnershipReversionField,
} from './fields/ownership-reversions';
import {
	ApiOwnershipReversionEconFunction,
	ApiOwnershipReversionEconFunctionKey,
	getApiOwnershipReversionEconFunctionField,
} from './fields/ownership-reversions-econ-function';

export class OwnershipReversionNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, OwnershipReversionNotFoundError.name, statusCode);
	}
}

export class DuplicateOwnershipReversionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateOwnershipReversionError.name;
	}
}

export class OwnershipReversionCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = OwnershipReversionCollisionError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiOwnershipReversion = (data: Record<string, unknown>, index?: number): ApiOwnershipReversion => {
	const ownershipReversion: Record<string, ApiOwnershipReversion[ApiOwnershipReversionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.OwnershipReversion, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const ownershipReversionField = getApiOwnershipReversionField(field);

				if (!ownershipReversionField) {
					return;
				}

				const { write, parse } = ownershipReversionField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiOwnershipReversion[ApiOwnershipReversionKey]);

				if (write) {
					ownershipReversion[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return ownershipReversion;
};

export const parseOwnershipReversionEconFunction = (
	data: unknown,
	location?: string,
): ApiOwnershipReversionEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ownership reversion data structure`, location);
	}

	const ownershipReversionEconFunction: Record<
		string,
		ApiOwnershipReversionEconFunction[ApiOwnershipReversionEconFunctionKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	ensureNoSkippedReversions(data, location);

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const ownershipReversionEconFunctionField = getApiOwnershipReversionEconFunctionField(field);

				if (!ownershipReversionEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = ownershipReversionEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiOwnershipReversionEconFunction[ApiOwnershipReversionEconFunctionKey]);

				if (write) {
					ownershipReversionEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return ownershipReversionEconFunction;
};

export const checkDuplicates = (
	apiOwnershipReversion: Array<ApiOwnershipReversion | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiOwnershipReversion | undefined> => {
	const filtered = apiOwnershipReversion.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiOwnershipReversion];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateOwnershipReversionError(
					`More than one ownership reversion data supplied with name \`${name}\``,
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

function ensureNoSkippedReversions(data: Record<string, unknown>, location: string | undefined) {
	const reversionValues = [data.firstReversion, data.secondReversion, data.thirdReversion];

	let previousRecordHadReversionValue = false;

	for (let i = reversionValues.length - 1; i >= 0; i--) {
		const hasCurrentReversionValue = !isNil(reversionValues[i]);

		if (previousRecordHadReversionValue && !hasCurrentReversionValue) {
			throw new RequestStructureError(
				'A reversion can be used only when all previous reversions have been used.',
				location,
			);
		}

		previousRecordHadReversionValue = hasCurrentReversionValue;
	}
}
