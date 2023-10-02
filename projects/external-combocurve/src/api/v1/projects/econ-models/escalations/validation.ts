/* eslint-disable complexity */
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
import { validateKeyLength } from '../row-validations/helpers';

import { ApiEscalation, ApiEscalationKey, getApiEscalationField } from './fields/escalations';
import {
	ApiEscalationEconFunction,
	ApiEscalationEconFunctionKey,
	getApiEscalationEconFunctionField,
} from './fields/escalation-econ-function';

const DECIMAL_SCALE = 6 as const;
export class EscalationNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, EscalationNotFoundError.name, statusCode);
	}
}

export class DuplicateEscalationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateEscalationError.name;
	}
}

export class EscalationCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = EscalationCollisionError.name;
	}
}

export class EscalationRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = EscalationRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiEscalation = (data: Record<string, unknown>, index?: number): ApiEscalation => {
	const escalation: Record<string, ApiEscalation[ApiEscalationKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Escalations, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const escalationField = getApiEscalationField(field);

				if (!escalationField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = escalationField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiEscalation[ApiEscalationKey]);

				if (write) {
					escalation[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return escalation;
};

export const parseEscalationEconFunction = (data: unknown, location?: string): ApiEscalationEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid escalation model data structure`, location);
	}

	const escalationEconFunction: Record<string, ApiEscalationEconFunction[ApiEscalationEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const escalationEconFunctionField = getApiEscalationEconFunctionField(field);

				if (!escalationEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					value = validateEscalationRows(value, fieldPath);
				}
				const { write, parse } = escalationEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEscalationEconFunction[ApiEscalationEconFunctionKey]);

				if (write) {
					escalationEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();
	return escalationEconFunction;
};

export const checkModelDuplicates = (
	apiEscalations: Array<ApiEscalation | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiEscalation | undefined> => {
	const filtered = apiEscalations.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiEscalations];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateEscalationError(
					`More than one escalation model data supplied with name \`${name}\``,
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

type MergeKeys<Type> = {
	[Property in keyof Type]?: Type[Property];
};

export const getEconFunctionsRowTypesGenerators = (): [
	typeof GenerateFlatRowCriteria,
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndDatesCriteria,
] => {
	return [GenerateFlatRowCriteria, GenerateStartEndPeriodCriteria, GenerateStartEndDatesCriteria];
};

export type EconRowsTypes = MergeKeys<ReturnType<typeof getEconFunctionsRowTypesGenerators>>;

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];
	return getMatchingValidationFunction(firstRow, getEconFunctionsRowTypesGenerators);
};

export const validateEscalationRows = (rows: unknown, location: string): unknown => {
	const errorAggregator = new ValidationErrorAggregator();
	errorAggregator.catch(() => {
		if (!Array.isArray(rows)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		const areRowsObject = rows.map(isObject);
		if (areRowsObject.some((isObject) => !isObject)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		rows.forEach((row, i) => {
			errorAggregator.catch(() => {
				validateKeyLength(row, `${location}[${i}]`, 2);
			});
		});

		const validateRowsFunction = getRowsValidation(rows);

		for (const rowProperty of validateRowsFunction) {
			errorAggregator.catch(() => {
				rowProperty.validateRows({
					rows,
					location,
					decimalScale: DECIMAL_SCALE,
				});
			});
		}
	});

	errorAggregator.throwAll();
	return rows;
};
