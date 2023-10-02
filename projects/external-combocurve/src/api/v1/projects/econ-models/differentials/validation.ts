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

import { ApiDifferentials, ApiDifferentialsKey, getApiDifferentialsField } from './fields/differentials';
import {
	ApiDifferentialsEconFunction,
	ApiDifferentialsEconFunctionKey,
	getApiDifferentialsEconFunctionField,
} from './fields/differentials-econ-function';
import { ApiPhaseFields, ApiPhaseFieldsKey, getApiPhaseField } from './fields/phase-fields';
import { ApiPhaseGroup, ApiPhaseGroupKey, getApiPhaseGroupField } from './fields/phase-group-fields';

const DECIMAL_SCALE = 6 as const;
export class DifferentialsNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, DifferentialsNotFoundError.name, statusCode);
	}
}

export class DuplicateDifferentialsError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateDifferentialsError.name;
	}
}

export class DifferentialsCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DifferentialsCollisionError.name;
	}
}

export class DifferentialsRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DifferentialsRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiDifferentials = (data: Record<string, unknown>, index?: number): ApiDifferentials => {
	const Differentials: Record<string, ApiDifferentials[ApiDifferentialsKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Differentials, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const differentialsField = getApiDifferentialsField(field);

				if (!differentialsField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = differentialsField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiDifferentials[ApiDifferentialsKey]);

				if (write) {
					Differentials[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return Differentials;
};

export const parseDifferentialsEconFunction = (data: unknown, location?: string): ApiDifferentialsEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid differentials model data structure`, location);
	}

	const differentialsEconFunction: Record<string, ApiDifferentialsEconFunction[ApiDifferentialsEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const differentialsEconFunctionField = getApiDifferentialsEconFunctionField(field);

				if (!differentialsEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = differentialsEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiDifferentialsEconFunction[ApiDifferentialsEconFunctionKey]);

				if (write) {
					differentialsEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return differentialsEconFunction;
};

export const parsePhaseGroup = (data: unknown, location?: string): ApiPhaseGroup => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid differentials data structure`, location);
	}
	const apiPhaseGroup: Record<string, ApiPhaseGroup[ApiPhaseGroupKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiPhaseGroupField = getApiPhaseGroupField(field);

				if (!apiPhaseGroupField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = apiPhaseGroupField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiPhaseGroup[ApiPhaseGroupKey]);

				if (write) {
					apiPhaseGroup[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiPhaseGroup;
};

export const parsePhaseFields = (data: unknown, location?: string): ApiPhaseFields => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid differentials data structure`, location);
	}
	const apiPhaseFields: Record<string, ApiPhaseFields[ApiPhaseFieldsKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	if (data.escalationModel == undefined) {
		data.escalationModel = 'none';
	}

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiPhaseField = getApiPhaseField(field);

				if (!apiPhaseField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateDifferentialsRows(value, fieldPath);
				}

				const { write, parse } = apiPhaseField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiPhaseFields[ApiPhaseFieldsKey]);

				if (write) {
					apiPhaseFields[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiPhaseFields;
};

export const checkModelDuplicates = (
	apiDifferentials: Array<ApiDifferentials | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiDifferentials | undefined> => {
	const filtered = apiDifferentials.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiDifferentials];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateDifferentialsError(
					`More than one differentials model data supplied with name \`${name}\``,
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

export const validateDifferentialsRows = (rows: unknown, location: string): void => {
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
