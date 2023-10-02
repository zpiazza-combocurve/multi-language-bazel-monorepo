import { camelCase, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField } from '@src/api/v1/fields';
import { IEscalationModelRow, ISeveranceTaxTaxesPhases } from '@src/models/econ/production-taxes';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconFunctionRow, rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';
import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from '../../validation';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

import { ApiEscalationModelObject, escalationModelObjectReadWriteDbField } from './escalation-model-object-fields';

export type IProductionTaxesPhasesObjectField<T> = IField<IEscalationModelRow, T>;
export type ApiProductionTaxesPhasesObjectKey = keyof typeof API_SEVERAL_TAX_PHASE;

type TypeOfField<FT> = FT extends IProductionTaxesPhasesObjectField<infer T> ? T : never;

export type ApiProductionTaxesPhasesObject = {
	[key in ApiProductionTaxesPhasesObjectKey]?: TypeOfField<(typeof API_SEVERAL_TAX_PHASE)[key]>;
};

const API_SEVERAL_TAX_PHASE = {
	escalationModel: escalationModelObjectReadWriteDbField(),
	rows: rowsReadWriteDbField(),
};

export const taxPhaseReadWriteDbField = <K extends keyof ISeveranceTaxTaxesPhases>(
	key: K,
): IField<ISeveranceTaxTaxesPhases, ApiProductionTaxesPhasesObject> => ({
	type: OpenApiDataType.object,
	properties: API_SEVERAL_TAX_PHASE,
	parse: (data: unknown, location?: string) => parseTaxPhase(data, key, location),
	read: (severanceTaxEconFunction) => read(severanceTaxEconFunction[key]),
	write: (severanceTaxEconFunction, phasesOject) => {
		set(severanceTaxEconFunction, [key], write(phasesOject));
	},
});

const read = (escalationModel: IEscalationModelRow): ApiProductionTaxesPhasesObject => {
	const apiProductionTaxesPhasesObject: Record<
		string,
		ApiProductionTaxesPhasesObject[ApiProductionTaxesPhasesObjectKey]
	> = {};

	Object.entries(API_SEVERAL_TAX_PHASE).forEach(([field, { read }]) => {
		if (read) {
			apiProductionTaxesPhasesObject[field] = read(escalationModel);
		}
	});
	return apiProductionTaxesPhasesObject as ApiProductionTaxesPhasesObject;
};

const write = (apiEscalationModelObject: ApiProductionTaxesPhasesObject): IEscalationModelRow => {
	const escalationModelObject = {};
	Object.entries(API_SEVERAL_TAX_PHASE).forEach(([field, { write }]) => {
		if (write) {
			const value = apiEscalationModelObject[field as ApiProductionTaxesPhasesObjectKey];
			if (value) {
				write(escalationModelObject, value as ApiEscalationModelObject & ApiEconFunctionRow[]);
			}
		}
	});
	return escalationModelObject as IEscalationModelRow;
};

export const getTaxPhaseField = (
	field: string,
): (typeof API_SEVERAL_TAX_PHASE)[ApiProductionTaxesPhasesObjectKey] | null =>
	getApiField(field, API_SEVERAL_TAX_PHASE);

export const parseTaxPhase = (data: unknown, key: string, location?: string): ApiProductionTaxesPhasesObject => {
	if (!isObject(data)) {
		throw new RequestStructureError(
			`Invalid value for \`${camelCase(key)}\`: \`${(data as string | undefined)?.toString()}\`. \`${camelCase(
				key,
			)}\` must be an object.`,
			location,
		);
	}

	const apiProductionTaxesPhasesObject: Record<
		string,
		ApiProductionTaxesPhasesObject[ApiProductionTaxesPhasesObjectKey]
	> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const parseTaxField = getTaxPhaseField(field);

				if (!parseTaxField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				if (field === 'rows') {
					validateTaxPhasesRows(value, fieldPath);
				}

				const { write, parse } = parseTaxField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiProductionTaxesPhasesObject[ApiProductionTaxesPhasesObjectKey]);

				if (write) {
					apiProductionTaxesPhasesObject[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return apiProductionTaxesPhasesObject;
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

export const validateTaxPhasesRows = (rows: unknown, location: string): void => {
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
