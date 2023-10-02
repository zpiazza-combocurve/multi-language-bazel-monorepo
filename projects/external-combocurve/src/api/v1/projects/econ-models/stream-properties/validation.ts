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

import {
	ApiBtuContentEconFunction,
	ApiBtuContentEconFunctionKey,
	getApiBtuContentEconFunctionField,
} from './fields/btu-content-econ-function';
import {
	ApiLossFlareEconFunction,
	ApiLossFlareEconFunctionKey,
	getApiLossFlareEconFunctionField,
} from './fields/loss-flare-econ-function';
import {
	ApiShrinkageEconFunction,
	ApiShrinkageEconFunctionKey,
	getApiShrinkageEconFunctionField,
} from './fields/shrinkage-econ-function';
import { ApiStreamProperties, ApiStreamPropertiesKey, getApiStreamPropertiesField } from './fields/stream-properties';
import {
	ApiYieldsEconFunction,
	ApiYieldsEconFunctionKey,
	getApiYieldsEconFunctionField,
} from './fields/yields-econ-function';

export class StreamPropertiesNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, StreamPropertiesNotFoundError.name, statusCode);
	}
}

export class DuplicateStreamPropertiesError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateStreamPropertiesError.name;
	}
}

export class StreamPropertiesCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = StreamPropertiesCollisionError.name;
	}
}

export class StreamPropertiesRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = StreamPropertiesRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiStreamProperties = (data: Record<string, unknown>, index?: number): ApiStreamProperties => {
	const streamProperties: Record<string, ApiStreamProperties[ApiStreamPropertiesKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.StreamProperties, data, errorAggregator, index);
	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const streamPropertiesField = getApiStreamPropertiesField(field);

				if (!streamPropertiesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = streamPropertiesField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiStreamProperties[ApiStreamPropertiesKey]);

				if (write) {
					streamProperties[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return streamProperties;
};

export const parseShrinkageEconFunction = (data: unknown, location?: string): ApiShrinkageEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid shrinkage data structure`, location);
	}
	const apiShrinkageEconFunction: Record<string, ApiShrinkageEconFunction[ApiShrinkageEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiShrinkageEconFunctionField = getApiShrinkageEconFunctionField(field);

				if (!apiShrinkageEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiShrinkageEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiShrinkageEconFunction[ApiShrinkageEconFunctionKey]);

				if (write) {
					apiShrinkageEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiShrinkageEconFunction;
};

export const parseLossFlareEconFunction = (data: unknown, location?: string): ApiLossFlareEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid lossFlare data structure`, location);
	}
	const apiLossFlareEconFunction: Record<string, ApiLossFlareEconFunction[ApiLossFlareEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiLossFlareEconFunctionField = getApiLossFlareEconFunctionField(field);

				if (!apiLossFlareEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiLossFlareEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiLossFlareEconFunction[ApiLossFlareEconFunctionKey]);

				if (write) {
					apiLossFlareEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiLossFlareEconFunction;
};

export const parseBtuContentEconFunction = (data: unknown, location?: string): ApiBtuContentEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid btuContent data structure`, location);
	}
	const apiBtuContentEconFunction: Record<string, ApiBtuContentEconFunction[ApiBtuContentEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiBtuContentEconFunctionField = getApiBtuContentEconFunctionField(field);

				if (!apiBtuContentEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiBtuContentEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiBtuContentEconFunction[ApiBtuContentEconFunctionKey]);

				if (write) {
					apiBtuContentEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiBtuContentEconFunction;
};

export const parseYieldsEconFunction = (data: unknown, location?: string): ApiYieldsEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid yields data structure`, location);
	}
	const apiYieldsEconFunction: Record<string, ApiYieldsEconFunction[ApiYieldsEconFunctionKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const apiYieldsEconFunctionField = getApiYieldsEconFunctionField(field);

				if (!apiYieldsEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = apiYieldsEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiYieldsEconFunction[ApiYieldsEconFunctionKey]);

				if (write) {
					apiYieldsEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiYieldsEconFunction;
};

export const parseEconFunctionRowField = (data: unknown, location?: string): ApiEconFunctionRowField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Stream Properties model rows data structure`, location);
	}

	const yieldsEconFunction: Record<string, ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const yieldsEconFunctionField = getApiEconFunctionRowField(field);

				if (!yieldsEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				if (field === 'rows') {
					validateStreamPropertyRows(value, fieldPath);
				}
				const { write, parse } = yieldsEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]);

				if (write) {
					yieldsEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return yieldsEconFunction;
};

export const checkModelDuplicates = (
	apiStreamProperties: Array<ApiStreamProperties | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiStreamProperties | undefined> => {
	const filtered = apiStreamProperties.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiStreamProperties];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateStreamPropertiesError(
					`More than one Stream Properties model data supplied with name \`${name}\``,
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

export const validateStreamPropertyRows = (rows: unknown, location: string): void => {
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
