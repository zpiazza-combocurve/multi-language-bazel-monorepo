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
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiCapex, ApiCapexKey, getApiCapexField } from './fields/capex';
import {
	ApiOtherCapexEconFunction,
	ApiOtherCapexEconFunctionKey,
	getApiOtherCapexEconFunctionField,
} from './fields/other-capex';

export class CapexNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, CapexNotFoundError.name, statusCode);
	}
}

export class DuplicateCapexError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateCapexError.name;
	}
}

export class CapexCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = CapexCollisionError.name;
	}
}

export class CapexRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = CapexRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiCapex = (data: Record<string, unknown>, index?: number): ApiCapex => {
	const capex: Record<string, ApiCapex[ApiCapexKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Capex, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const capexField = getApiCapexField(field);

				if (!capexField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = capexField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiCapex[ApiCapexKey]);

				if (write) {
					capex[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return capex;
};

export const parseRecompletionWorkoverFunction = (data: unknown, location?: string): ApiOtherCapexEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid btuContent data structure`, location);
	}
	const apiBtuContentEconFunction: Record<string, ApiOtherCapexEconFunction[ApiOtherCapexEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiBtuContentEconFunctionField = getApiOtherCapexEconFunctionField(field);

				if (!apiBtuContentEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiBtuContentEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiOtherCapexEconFunction[ApiOtherCapexEconFunctionKey]);

				if (write) {
					apiBtuContentEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiBtuContentEconFunction;
};

export const parseEconFunctionRowField = (data: unknown, location?: string): ApiEconFunctionRowField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Capex model rows data structure`, location);
	}

	const otherCapexEconFunction: Record<string, ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const otherCapexEconFunctionField = getApiEconFunctionRowField(field);

				if (!otherCapexEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateCapexRows(value, fieldPath);
				}
				const { write, parse } = otherCapexEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]);

				if (write) {
					otherCapexEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return otherCapexEconFunction;
};

export const checkModelDuplicates = (
	apiCapex: Array<ApiCapex | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiCapex | undefined> => {
	const filtered = apiCapex.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiCapex];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateCapexError(
					`More than one Capex model data supplied with name \`${name}\``,
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
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndRateCriteria,
	typeof GenerateStartEndDatesCriteria,
	typeof GenerateFlatRowCriteria,
] => {
	return [
		GenerateStartEndPeriodCriteria,
		GenerateStartEndRateCriteria,
		GenerateStartEndDatesCriteria,
		GenerateFlatRowCriteria,
	];
};

const getRowsValidation = (rows: Record<string, unknown>[]): ReturnType<typeof getMatchingValidationFunction> => {
	const firstRow = rows[0];
	return getMatchingValidationFunction(firstRow, getEconFunctionsRowTypesGenerators);
};

export const validateCapexRows = (rows: unknown, location: string): void => {
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
					rows,
					location,
				});
			});
		}
	});

	errorAggregator.throwAll();
};
