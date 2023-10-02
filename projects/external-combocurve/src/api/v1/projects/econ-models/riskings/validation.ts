import { groupBy } from 'lodash';

import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	ApiEconFunctionRowField,
	ApiEconFunctionRowFieldKey,
	getApiEconFunctionRowField,
} from '../row-fields/econ-function-row-field';
import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	getMatchingValidationFunction,
} from '../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';
import { validateKeyLength } from '../row-validations/helpers';

import { ApiRisking, ApiRiskingKey, getApiRiskingField } from './fields/risking';
import {
	ApiRiskingEconFunction,
	ApiRiskingEconFunctionKey,
	getApiRiskingEconFunctionField,
} from './fields/risking-econ-function';

const DECIMAL_SCALE = 6 as const;
export class RiskingNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, RiskingNotFoundError.name, statusCode);
	}
}

export class DuplicateRiskingError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateRiskingError.name;
	}
}

export class RiskingCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RiskingCollisionError.name;
	}
}

export class RiskingRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RiskingRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiRisking = (data: Record<string, unknown>, index?: number): ApiRisking => {
	const risking: Record<string, ApiRisking[ApiRiskingKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Risking, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const riskingField = getApiRiskingField(field);

				if (!riskingField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = riskingField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiRisking[ApiRiskingKey]);

				if (write) {
					risking[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return risking;
};

export const parseRiskingEconFunction = (data: unknown, location?: string): ApiRiskingEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid risking model data structure`, location);
	}

	const riskingEconFunction: Record<string, ApiRiskingEconFunction[ApiRiskingEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const riskingEconFunctionField = getApiRiskingEconFunctionField(field);

				if (!riskingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateRiskingRows(value, fieldPath);
				}
				const { write, parse } = riskingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiRiskingEconFunction[ApiRiskingEconFunctionKey]);

				if (write) {
					riskingEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return riskingEconFunction;
};

export const parseRiskingEconFunctionRowField = (data: unknown, location?: string): ApiEconFunctionRowField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid risking model rows data structure`, location);
	}

	const riskingEconFunction: Record<string, ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const riskingEconFunctionField = getApiEconFunctionRowField(field);

				if (!riskingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateRiskingRows(value, fieldPath);
				}
				const { write, parse } = riskingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]);

				if (write) {
					riskingEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return riskingEconFunction;
};

export const checkModelDuplicates = (
	apiRiskings: Array<ApiRisking | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiRisking | undefined> => {
	const filtered = apiRiskings.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiRiskings];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateRiskingError(
					`More than one risking model data supplied with name \`${name}\``,
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

export const getMultiplierRowTypesGenerators = (): [
	typeof GenerateFlatRowCriteria,
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndDatesCriteria,
] => {
	return [GenerateFlatRowCriteria, GenerateStartEndPeriodCriteria, GenerateStartEndDatesCriteria];
};

export const getCountPercentRowTypesGenerators = (): [
	typeof GenerateFlatRowCriteria,
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndDatesCriteria,
] => {
	return [GenerateFlatRowCriteria, GenerateStartEndPeriodCriteria, GenerateStartEndDatesCriteria];
};

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];

	if (firstRow.multiplier) {
		return getMatchingValidationFunction(firstRow, getMultiplierRowTypesGenerators);
	}

	return getMatchingValidationFunction(firstRow, getCountPercentRowTypesGenerators);
};

export const validateRiskingRows = (rows: unknown, location: string): void => {
	const errorAggregator = new ValidationErrorAggregator();

	errorAggregator.catch(() => {
		if (!Array.isArray(rows)) {
			throw new RequestStructureError(`The field \`rows\` must be an array of object(s).`, location);
		}

		if (rows.length <= 0) {
			throw new RequestStructureError(`The \`rows\` array must contain at least one object.`, location);
		}

		if (rows.length > 100) {
			throw new RequestStructureError(`The \`rows\` array must contain less than 100 objects.`, location);
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
};
