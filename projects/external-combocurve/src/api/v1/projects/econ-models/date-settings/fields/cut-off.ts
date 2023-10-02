import { BOOLEAN_FIELD, IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { isNil, notNil } from '@src/helpers/typing';
import { ICutOffEconFunction } from '@src/models/econ/date-settings';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { cutOffMinLifeFields } from './cut-off-min-life-fields';

export type CutOffEconFunctionField<T> = IField<ICutOffEconFunction, T>;

const cutOffWriteDbField = <K extends keyof ICutOffEconFunction, TParsed = ICutOffEconFunction[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<ICutOffEconFunction, K, TParsed>(key, definition, options);

const emptyValueFieldWrapper = <K extends keyof ICutOffEconFunction>(key: K) => {
	const baseFieldDefinition = cutOffWriteDbField(key, BOOLEAN_FIELD);
	baseFieldDefinition.read = (value) => {
		if (value[key] !== undefined) {
			return true as ICutOffEconFunction[K];
		}
		return undefined as ICutOffEconFunction[K];
	};

	baseFieldDefinition.write = (object, value) => {
		if (value !== undefined) {
			object[key] = true as ICutOffEconFunction[K];
		}
	};
	return baseFieldDefinition;
};

export const API_CUT_OFF_ECON_FUNCTION = {
	maxCumCashFlow: emptyValueFieldWrapper('max_cum_cash_flow'),
	firstNegativeCashFlow: emptyValueFieldWrapper('first_negative_cash_flow'),
	lastPositiveCashFlow: emptyValueFieldWrapper('last_positive_cash_flow'),
	noCutOff: emptyValueFieldWrapper('no_cut_off'),
	oilRate: cutOffWriteDbField('oil_rate', NUMBER_FIELD),
	gasRate: cutOffWriteDbField('gas_rate', NUMBER_FIELD),
	waterRate: cutOffWriteDbField('water_rate', NUMBER_FIELD),
	date: cutOffWriteDbField('date', STRING_FIELD),
	yearsFromAsOf: cutOffWriteDbField('years_from_as_of', NUMBER_FIELD),
	linkToWells: cutOffWriteDbField('link_to_wells_ecl', STRING_FIELD),
	minLife: cutOffMinLifeFields(),
	triggerEclCapex: readWriteYesNoDbField<ICutOffEconFunction>('capex_offset_to_ecl'),
	includeCapex: readWriteYesNoDbField<ICutOffEconFunction>('include_capex'),
	discount: cutOffWriteDbField('discount', NUMBER_FIELD),
	econLimitDelay: cutOffWriteDbField('econ_limit_delay', NUMBER_FIELD),
	alignDependentPhases: readWriteYesNoDbField<ICutOffEconFunction>('side_phase_end'),
	tolerateNegativeCF: cutOffWriteDbField('consecutive_negative', NUMBER_FIELD),
};

export type ApiCutOffEconFunctionKey = keyof typeof API_CUT_OFF_ECON_FUNCTION;

type TypeOfCutOffEconFunctionField<FT> = FT extends CutOffEconFunctionField<infer T> ? T : never;

export type ApiCutOffEconFunction = {
	[key in ApiCutOffEconFunctionKey]?: TypeOfCutOffEconFunctionField<(typeof API_CUT_OFF_ECON_FUNCTION)[key]>;
};

export const getApiCutOffEconFunction = (
	field: string,
): (typeof API_CUT_OFF_ECON_FUNCTION)[ApiCutOffEconFunctionKey] | null => getApiField(field, API_CUT_OFF_ECON_FUNCTION);

export const getRequiredcutOffEconFunction: ApiCutOffEconFunctionKey[] = Object.entries(API_CUT_OFF_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiCutOffEconFunctionKey);

export const toCutOffEconFunction = (
	apiCutOffEconFunctionField: ApiCutOffEconFunction,
): ICutOffEconFunction | Record<string, unknown> => {
	const cutOffEconFunctionFieldResult = {};

	if (isNil(apiCutOffEconFunctionField)) {
		return cutOffEconFunctionFieldResult;
	}

	Object.entries(API_CUT_OFF_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (cutOffEconFunctionField: ICutOffEconFunction, value: unknown) => void;
			coercedWrite(
				cutOffEconFunctionFieldResult as ICutOffEconFunction,
				apiCutOffEconFunctionField[field as ApiCutOffEconFunctionKey],
			);
		}
	});
	return cutOffEconFunctionFieldResult as ICutOffEconFunction;
};

export const parseApiCutOffEconFunction = (data: unknown, location?: string): ApiCutOffEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid DateSettings model data structure`, location);
	}

	const asOfDiscount: Record<string, ApiCutOffEconFunction[ApiCutOffEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();
	const completeData = withDefaultValues(data);
	Object.entries(completeData)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const asOfDiscountField = getApiCutOffEconFunction(field);

				if (!asOfDiscountField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = asOfDiscountField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiCutOffEconFunction[ApiCutOffEconFunctionKey]);

				if (write) {
					asOfDiscount[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return asOfDiscount;
};

export const toApiCutOffEconFunction = (cutOffEconFunctionField: ICutOffEconFunction): ApiCutOffEconFunction => {
	const apiCutOffEconFunctionField: Record<string, ApiCutOffEconFunction[ApiCutOffEconFunctionKey]> = {};
	Object.entries(API_CUT_OFF_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiCutOffEconFunctionField[field] = read(cutOffEconFunctionField);
		}
	});
	return apiCutOffEconFunctionField;
};
const withDefaultValues = (data: Record<string, unknown>): { [s: string]: unknown } | ArrayLike<unknown> => {
	const propetiesToSetDefaultValues = {
		tolerateNegativeCF: 0,
		econLimitDelay: 0,
		discount: 0,
		includeCapex: false,
		triggerEclCapex: false,
	};

	return {
		...propetiesToSetDefaultValues,
		...data,
	};
};
