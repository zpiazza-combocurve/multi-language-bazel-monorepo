import { groupBy } from 'lodash';

import { FieldNameError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiDateSettings, ApiDateSettingsKey, getApiDateSettingsField } from './fields/date-settings';

export class DateSettingsNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, DateSettingsNotFoundError.name, statusCode);
	}
}

export class DuplicateDateSettingsError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateDateSettingsError.name;
	}
}

export class DateSettingsCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DateSettingsCollisionError.name;
	}
}

export class DateSettingsRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DateSettingsRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiDateSettings = (data: Record<string, unknown>, index?: number): ApiDateSettings => {
	const DateSettings: Record<string, ApiDateSettings[ApiDateSettingsKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.DateSettings, data, errorAggregator, index);

	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const DateSettingsField = getApiDateSettingsField(field);

				if (!DateSettingsField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = DateSettingsField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiDateSettings[ApiDateSettingsKey]);

				if (write) {
					DateSettings[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return DateSettings;
};

export const checkModelDuplicates = (
	apiDateSettings: Array<ApiDateSettings | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiDateSettings | undefined> => {
	const filtered = apiDateSettings.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiDateSettings];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateDateSettingsError(
					`More than one DateSettings model supplied with name \`${name}\``,
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
