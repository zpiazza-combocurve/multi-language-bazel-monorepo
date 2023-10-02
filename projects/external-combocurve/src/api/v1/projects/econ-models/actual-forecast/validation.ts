import { Types } from 'mongoose';

import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { errorLocation } from '../../validation';

import { ActualForecastKey, ApiActualForecast, getActualForecastField } from './fields/actual-forecast';
import { ApiAFCriteriaType, ApiAFReplaceActualType } from './fields/actual-forecast-criteria';

export class ActualForecastNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ActualForecastNotFoundError.name, statusCode);
	}
}

export const parseActualOrForecastPayload = (
	data: Array<Record<string, unknown>>,
	projectID: Types.ObjectId,
	errors: ValidationErrorAggregator,
): (ApiActualForecast | undefined)[] => {
	return data.map((element, index) =>
		errors.catch(() => {
			const errorCount = errors.errors.length;

			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Actual or Forecast model data structure', `[${index}]`);
			}

			validateSchema(ValidationSchemas.ActualOrForecast, element, errors, index);

			// if no errors on schema validation, return the new request object
			if (errors.errors.length === errorCount) {
				return createRequestFromBody(element, errors, index);
			}
		}),
	);
};

export const createRequestFromBody = (
	data: Record<string, unknown>,
	errors: ValidationErrorAggregator,
	index: number,
): ApiActualForecast | undefined => {
	const actualForecast: Record<string, ApiActualForecast[ActualForecastKey]> = {};
	const errorCount = errors.errors.length;

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errors.catch(() => {
				const escalationField = getActualForecastField(field);

				if (!escalationField) {
					throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
				}

				const { write, parse } = escalationField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiActualForecast[ActualForecastKey]);

				if (write) {
					actualForecast[field] = parsedValue;
				}
			}),
		);

	// Custom validations
	errors.catch(() => checkIgnoreHistoryProd(actualForecast, index));
	errors.catch(() => checkReplaceActualType(actualForecast, index));

	return errors.errors.length === errorCount ? actualForecast : undefined;
};

function checkIgnoreHistoryProd(request: ApiActualForecast | undefined, index: number) {
	const ignoreValue = request?.actualOrForecast?.ignoreHistoryProd as string | undefined;
	const replaceForecast = request?.actualOrForecast?.replaceActualWithForecast as ApiAFReplaceActualType | undefined;

	if (ignoreValue === 'yes' && replaceForecast) {
		throw new FieldNameError(
			'Cannot have replaceActualWithForecast when ignoreHistoryProd is yes',
			`[${index}].replaceActualWithForecast`,
		);
	}

	// The frontend always save this value as default
	else if (ignoreValue === 'yes' && request && request.actualOrForecast && !replaceForecast) {
		const aux = request.actualOrForecast as Record<string, unknown>;
		aux['replaceActualWithForecast'] = {
			oil: { never: '' },
			gas: { never: '' },
			water: { never: '' },
		};
	}
}

function checkReplaceActualType(request: ApiActualForecast | undefined, index: number) {
	const replaceForecast = request?.actualOrForecast?.replaceActualWithForecast as ApiAFReplaceActualType | undefined;

	checkCriteriaType(replaceForecast?.oil, 'oil', index);
	checkCriteriaType(replaceForecast?.gas, 'gas', index);
	checkCriteriaType(replaceForecast?.water, 'water', index);
}

function checkCriteriaType(request: ApiAFCriteriaType | undefined, criteria: string, index: number) {
	if (request === undefined || 'never' in request || 'date' in request || 'asOfDate' in request) {
		return;
	}

	throw new RequestStructureError(
		'One of the properties never, date or asOfDate must be present',
		`[${index}].replaceActualWithForecast.${criteria}`,
	);
}
