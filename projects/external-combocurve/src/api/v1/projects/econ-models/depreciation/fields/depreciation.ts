import { get, isNil, set } from 'lodash';

import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IDepreciationEconFunction } from '@src/models/econ/depreciation';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	API_ECON_FUNCTION_ROW_FIELD,
	ApiEconFunctionRowField,
	ApiEconFunctionRowFieldKey,
	getApiEconFunctionRowField,
} from '../../row-fields/econ-function-row-field';
import {
	ApiEconFunctionRow,
	parseApiEconFunctionRow,
	toApiEconFunctionRow,
	toEconFunctionRow,
} from '../../row-fields/econ-function-row-fields';
import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { depreciationRowFields } from './depreciation-rows';

const depreciationModeTypeReadWriteDbField = <
	K extends keyof IDepreciationEconFunction,
	TParsed = IDepreciationEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IDepreciationEconFunction, K, TParsed>(key, definition, options);

const bonusDepreciationEconFunctionRowField = (): IDepreciationEconFunctionField<ApiEconFunctionRow[]> => {
	return {
		type: OpenApiDataType.object,
		properties: API_ECON_FUNCTION_ROW_FIELD,
		parse: (data: unknown, location?: string) => parseApiEconFunctionRow(data, location),
		read: (depreciationEconModel) => toApiEconFunctionRow(get(depreciationEconModel, ['bonus_depreciation'])),
		write: (depreciationEconModel, value) => {
			if (notNil(value)) {
				set(depreciationEconModel, ['bonus_depreciation', 'rows'], toEconFunctionRow(value));
			}
		},
		options: { isRequired: false },
	};
};

export const API_Depreciation__ECON_FUNCTION = {
	modelType: depreciationModeTypeReadWriteDbField('depreciation_or_depletion', STRING_FIELD),
	prebuilt: depreciationModeTypeReadWriteDbField('prebuilt', STRING_FIELD), // write custom as default coming from the API
	taxCredit: depreciationModeTypeReadWriteDbField('tax_credit', NUMBER_FIELD),
	tangibleImmediateDepletion: depreciationModeTypeReadWriteDbField('tangible_immediate_depletion', NUMBER_FIELD),
	intangibleImmediateDepletion: depreciationModeTypeReadWriteDbField('intangible_immediate_depletion', NUMBER_FIELD),
	tangibleDepletionModel: depreciationModeTypeReadWriteDbField('tangible_depletion_model', STRING_FIELD),
	intangibleDepletionModel: depreciationModeTypeReadWriteDbField('intangible_depletion_model', STRING_FIELD),
	tcjaBonus: readWriteYesNoDbField('tcja_bonus'),
	bonusDepreciation: bonusDepreciationEconFunctionRowField(),
	depreciation: depreciationRowFields(),
};

export type IDepreciationEconFunctionField<T> = IField<IDepreciationEconFunction, T>;
export type ApiDepreciationEconFunctionKey = keyof typeof API_Depreciation__ECON_FUNCTION;

type TypeOfField<FT> = FT extends IDepreciationEconFunctionField<infer T> ? T : never;

export type ApiDepreciationEconFunction = {
	[key in ApiDepreciationEconFunctionKey]?: TypeOfField<(typeof API_Depreciation__ECON_FUNCTION)[key]>;
};

export const getApiDepreciationEconFunctionField = (
	field: string,
): (typeof API_Depreciation__ECON_FUNCTION)[ApiDepreciationEconFunctionKey] | null =>
	getApiField(field, API_Depreciation__ECON_FUNCTION);

export const getRequiredFields: ApiDepreciationEconFunctionKey[] = Object.entries(API_Depreciation__ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiDepreciationEconFunctionKey);

export const toDepreciationEconFunction = (
	apiDepreciationEconFunction: ApiDepreciationEconFunction,
): IDepreciationEconFunction | Record<string, unknown> => {
	const depreciationEconFunctionResult = {};

	if (isNil(apiDepreciationEconFunction)) {
		return depreciationEconFunctionResult;
	}

	Object.entries(API_Depreciation__ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (Depreciation: IDepreciationEconFunction, value: unknown) => void;
			coercedWrite(
				depreciationEconFunctionResult as IDepreciationEconFunction,
				apiDepreciationEconFunction[field as ApiDepreciationEconFunctionKey],
			);
		}
	});
	return depreciationEconFunctionResult;
};

export const parseBonusDepreciationEconFunctionRowField = (
	data: unknown,
	location?: string,
): ApiEconFunctionRowField => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid risking model rows data structure`, location);
	}

	const bonusDepreciationEconFunction: Record<string, ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const bonusDepreciationEconFunctionField = getApiEconFunctionRowField(field);

				if (!bonusDepreciationEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = bonusDepreciationEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEconFunctionRowField[ApiEconFunctionRowFieldKey]);

				if (write) {
					bonusDepreciationEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return bonusDepreciationEconFunction;
};

export const toApiDepreciationEconFunction = (depreciation: IDepreciationEconFunction): ApiDepreciationEconFunction => {
	const apiDepreciationEconFunction: Record<string, ApiDepreciationEconFunction[ApiDepreciationEconFunctionKey]> = {};
	Object.entries(API_Depreciation__ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiDepreciationEconFunction[field] = read(depreciation);
		}
	});
	return apiDepreciationEconFunction;
};

export const parseDepreciationEconFunction = (data: unknown, location?: string): ApiDepreciationEconFunction => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid Depreciation  data structure`, location);
	}

	const depreciationEconFunction: Record<string, ApiDepreciationEconFunction[ApiDepreciationEconFunctionKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();
	data.prebuilt = 'custom';
	if (data.modelType === 'depletion') {
		data = withDepreciationModelDefaultFieldValues(data);
	} else if (data.modelType === 'depreciation') {
		data = withDepletionModelDefaultFieldValues(data);
	}

	Object.entries(data as Record<string, unknown>)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const depreciationEconFunctionField = getApiDepreciationEconFunctionField(field);

				if (!depreciationEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = depreciationEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiDepreciationEconFunction[ApiDepreciationEconFunctionKey]);

				if (write) {
					depreciationEconFunction[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return depreciationEconFunction;
};

const withDepreciationModelDefaultFieldValues = (data: Record<string, unknown>): Record<string, unknown> => {
	const innerData: Record<string, unknown> = { ...data };
	innerData.depreciation = [
		{
			tanFactor: 0,
			intanFactor: 0,
		},
	];
	innerData.bonusDepreciation = [
		{
			tangibleBonusDepreciation: 0,
			intangibleBonusDepreciation: 0,
		},
	];
	innerData.taxCredit = 0;
	innerData.tcjaBonus = false;

	return innerData;
};

const withDepletionModelDefaultFieldValues = (data: Record<string, unknown>): Record<string, unknown> => {
	const innerData: Record<string, unknown> = { ...data };
	innerData.tangibleImmediateDepletion = 0;
	innerData.intangibleImmediateDepletion = 0;
	innerData.tangibleDepletionModel = 'unit_of_production_major';
	innerData.intangibleDepletionModel = 'unit_of_production_major';
	return innerData;
};
