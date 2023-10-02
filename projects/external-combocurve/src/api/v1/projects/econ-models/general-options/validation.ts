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
import { errorLocation } from '../../validation';

import { ApiGeneralOptionsFieldsKeys, ApiGeneralOptionsType, getGeneralOptionsField } from './fields/econ-function';

export class GeneralOptionsNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, GeneralOptionsNotFoundError.name, statusCode);
	}
}

export const parseGeneralOptionsPayload = (
	data: Array<Record<string, unknown>>,
	errors: ValidationErrorAggregator,
): (ApiGeneralOptionsType | undefined)[] => {
	return data.map((element, index) =>
		errors.catch(() => {
			const errorCount = errors.errors.length;

			if (!isObject(element)) {
				throw new RequestStructureError('Invalid General Options model data structure', `[${index}]`);
			}

			validateSchema(ValidationSchemas.GeneralOtpions, element, errors, index);

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
): ApiGeneralOptionsType | undefined => {
	const request: Record<string, ApiGeneralOptionsType[ApiGeneralOptionsFieldsKeys]> = {};
	const errorCount = errors.errors.length;

	// Fill default options:
	data.discountTable = data.discountTable || {};
	data.boeConversion = data.boeConversion || {};
	data.reportingUnits = data.reportingUnits || {};

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errors.catch(() => {
				const escalationField = getGeneralOptionsField(field);

				if (!escalationField) {
					throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
				}

				const { write, parse } = escalationField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiGeneralOptionsType[ApiGeneralOptionsFieldsKeys]);

				if (write) {
					request[field] = parsedValue;
				}
			}),
		);

	// Custom validations:
	errors.catch(() => checkIncomeTax(request, index));
	errors.catch(() => completeDiscounts(request));
	errors.catch(() => checkMainOptionsFical(request, index));

	return errors.errors.length === errorCount ? request : undefined;
};

const transformRowsEdgeFields = (): [
	typeof GenerateFlatRowCriteria,
	typeof GenerateStartEndPeriodCriteria,
	typeof GenerateStartEndDatesCriteria,
] => {
	return [GenerateFlatRowCriteria, GenerateStartEndPeriodCriteria, GenerateStartEndDatesCriteria];
};

export function completeIncomeTaxRows(input: unknown, location?: string): void {
	const rows = input as Record<string, unknown>[];
	if (rows.length === 0) {
		return;
	}

	const errorAggregator = new ValidationErrorAggregator();
	const validateRowsFunction = getMatchingValidationFunction(rows[0], transformRowsEdgeFields);

	for (const rowProperty of validateRowsFunction) {
		errorAggregator.catch(() => {
			rowProperty.validateRows({
				rows: rows,
				location: location ?? '',
				valueRange: undefined,
				decimalScale: 6,
			});
		});
	}
}

function checkMainOptionsFical(request: ApiGeneralOptionsType, index: number) {
	const reporting = request?.mainOptions?.reportingPeriod;
	if (reporting === 'fiscal' && request.mainOptions?.fiscal === undefined) {
		throw new ValidationError(
			'The Fiscal Year is required when the Reporting Period is Fiscal',
			`[${index}]`,
			'FiscalYearRequired',
		);
	}

	if (reporting === 'calendar' && request && request.mainOptions) {
		request.mainOptions.fiscal = '';
	}
}

function checkIncomeTax(request: ApiGeneralOptionsType | undefined, index: number) {
	const incomeTax = request?.mainOptions?.incomeTax || false;
	const incomeTaxObj = request?.incomeTax;

	if (incomeTax === true) {
		if (!incomeTaxObj) {
			throw new RequestStructureError(
				'The Income Tax settings are required when the Income Tax is enabled',
				`[${index}]`,
			);
		}
	}

	if (incomeTaxObj && incomeTaxObj.fifteenDepletion === undefined) {
		incomeTaxObj.fifteenDepletion = false;
	}

	if (incomeTaxObj && incomeTaxObj.carryForward === undefined) {
		incomeTaxObj.carryForward = false;
	}
}

// The field discounts into discuntTable is not required on payload, but must have a value
// It's a weird 'rows' field and must to have 16 exactly rows
function completeDiscounts(request: ApiGeneralOptionsType | undefined) {
	if (request && request.discountTable && !request.discountTable.discounts) {
		request.discountTable.discounts = [
			{ discountTable: 0 },
			{ discountTable: 2 },
			{ discountTable: 5 },
			{ discountTable: 8 },
			{ discountTable: 10 },
			{ discountTable: 12 },
			{ discountTable: 15 },
			{ discountTable: 20 },
			{ discountTable: 25 },
			{ discountTable: 30 },
			{ discountTable: 40 },
			{ discountTable: 50 },
			{ discountTable: 60 },
			{ discountTable: 70 },
			{ discountTable: 80 },
			{ discountTable: 100 },
		];
	}
}
