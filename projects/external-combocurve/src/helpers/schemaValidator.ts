import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import addKeywords from 'ajv-keywords';
import Ajv from 'ajv/dist/2019';
import { sortBy } from 'lodash';

import actualOrForecastSchema from '@src/schemas/econ-models/actual-or-forecast.json';
import baseEconModelSchema from '@src/schemas/econ-models/base-econ-model.json';
import capex from '@src/schemas/econ-models/capex.json';
import criteriaSchemaDefinitions from '@src/schemas/econ-models/criteria.json';
import dateSettings from '@src/schemas/econ-models/date-settings.json';
import depreciation from '@src/schemas/econ-models/depreciation.json';
import differentials from '@src/schemas/econ-models/differentials.json';
import emissionsSchema from '@src/schemas/econ-models/emissions.json';
import escalationSchema from '@src/schemas/econ-models/escalations.json';
import expensesSchema from '@src/schemas/econ-models/expenses.json';
import fluidModelSchema from '@src/schemas/econ-models/fluid-model.json';
import generalSchema from '@src/schemas/econ-models/general-options.json';
import ownershipReversionSchema from '@src/schemas/econ-models/ownership-reversion.json';
import pricing from '@src/schemas/econ-models/pricing.json';
import productionTaxes from '@src/schemas/econ-models/production-taxes.json';
import reservesCategorySchema from '@src/schemas/econ-models/reserves-category.json';
import reversionTypeSchema from '@src/schemas/econ-models/reversion-type.json';
import riskingSchema from '@src/schemas/econ-models/risking.json';
import rowsSchemaDefinitions from '@src/schemas/econ-models/rows-validation-defs.json';
import streamPropertiesSchema from '@src/schemas/econ-models/stream-properties.json';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { convertAjvErrorToValidationError, parseNumber } from './validation';
import { notNil } from './typing';

export enum ValidationSchemas {
	Differentials = 'differentials',
	Emissions = 'emissions',
	Escalations = 'escalations',
	FluidModels = 'fluidModels',
	OwnershipReversion = 'ownershipReversion',
	Pricing = 'pricing',
	Depreciation = 'depreciation',
	ReservesCategory = 'reservesCategory',
	Risking = 'risking',
	ProductionTaxes = 'ProductionTaxes',
	Expenses = 'expenses',
	StreamProperties = 'streamProperties',
	ActualOrForecast = 'ActualOrForecast',
	Capex = 'capex',
	DateSettings = 'dateSettings',
	GeneralOtpions = 'GeneralOptions',
}

function registerAjvSchemas(ajv: Ajv) {
	ajv.addSchema(baseEconModelSchema);
	ajv.addSchema(criteriaSchemaDefinitions);
	ajv.addSchema(emissionsSchema, ValidationSchemas.Emissions);
	ajv.addSchema(escalationSchema, ValidationSchemas.Escalations);
	ajv.addSchema(actualOrForecastSchema, ValidationSchemas.ActualOrForecast);
	ajv.addSchema(generalSchema, ValidationSchemas.GeneralOtpions);
	ajv.addSchema(differentials, ValidationSchemas.Differentials);
	ajv.addSchema(ownershipReversionSchema, ValidationSchemas.OwnershipReversion);
	ajv.addSchema(pricing, ValidationSchemas.Pricing);
	ajv.addSchema(productionTaxes, ValidationSchemas.ProductionTaxes);
	ajv.addSchema(reservesCategorySchema, ValidationSchemas.ReservesCategory);
	ajv.addSchema(reversionTypeSchema);
	ajv.addSchema(riskingSchema, ValidationSchemas.Risking);
	ajv.addSchema(expensesSchema, ValidationSchemas.Expenses);
	ajv.addSchema(rowsSchemaDefinitions);
	ajv.addSchema(streamPropertiesSchema, ValidationSchemas.StreamProperties);
	ajv.addSchema(fluidModelSchema, ValidationSchemas.FluidModels);
	ajv.addSchema(capex, ValidationSchemas.Capex);
	ajv.addSchema(dateSettings, ValidationSchemas.DateSettings);
	ajv.addSchema(depreciation, ValidationSchemas.Depreciation);
}

function registerAjvCustomKeywords(ajv: Ajv) {
	ajv.addKeyword({
		async: false,
		errors: true,
		type: 'number',
		keyword: 'minimumDecimalPrecision',
		validate: (schemaNum: number, testNum: number) =>
			(schemaNum != 0 && typeof testNum == 'number' && isFinite(testNum) && testNum == 0) ||
			Math.abs(testNum) >= Math.abs(schemaNum),
	});
}

function registerAjvCustomFormats(ajv: Ajv) {
	// added because riskings has a polymorphic field that can be either a number or a string
	// and this case is not handled by our built in field definitions
	ajv.addFormat('stringNumber', {
		async: false,
		type: 'string',
		validate: (data: string) => {
			if (!data?.trim()) {
				return false;
			}

			return Number.isFinite(Number(data));
		},
		compare: (data1: string, data2: string): number => {
			try {
				const value1 = parseNumber(data1);
				const value2 = parseNumber(data2);

				if (value1 > value2) {
					return 1;
				} else if (value1 < value2) {
					return -1;
				}
			} catch (error) {
				return 0;
			}

			return 0;
		},
	});
}

function buildAjv(): Ajv {
	const ajv = new Ajv({
		discriminator: true,
		allErrors: true,
		verbose: true,
		allowUnionTypes: true,
		$data: true,
	});

	addFormats(ajv);
	addErrors(ajv);
	addKeywords(ajv, ['regexp', 'oneRequired', 'anyRequired', 'prohibited']);

	registerAjvCustomFormats(ajv);
	registerAjvCustomKeywords(ajv);
	registerAjvSchemas(ajv);

	return ajv;
}

const ajv = buildAjv();

export const validateSchema = (
	schema: ValidationSchemas,
	data: Record<string, unknown>,
	errorAggregator: ValidationErrorAggregator,
	index?: number,
): void => {
	const validate = ajv.getSchema(schema);

	if (!validate) {
		throw `No validation schema registered for ${schema}`;
	}

	const result = validate(data);

	if (!result && validate.errors) {
		const validationErrors = sortBy(
			validate.errors.map((error) => convertAjvErrorToValidationError(error, index)).filter(notNil),
			['name'],
		);

		validationErrors.forEach((validationError) => {
			if (!errorAggregator.errors.find((existingError) => existingError.equals(validationError))) {
				errorAggregator.errors.push(validationError);
			}
		});
	}
};
