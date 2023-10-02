import { set } from 'lodash';

import { BOOLEAN_FIELD, IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import {
	IActualForecastReplaceActual,
	IActualOrForecastOption,
	IActualOrForecastPhase,
} from '@src/models/econ/actual-forecast';
import { IField, readWriteDbField } from '@src/api/v1/fields';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

// Replace Options:
// never or as_of_date or date

export type ApiAFCriteriaTypeKey = keyof typeof AF_CRITERIA_FIELDS;
export type AFCriteriaField<T> = IField<IActualOrForecastOption, T>;
export type TypeOfAFCriteriaField<FT> = FT extends AFCriteriaField<infer T> ? T : never;

export type ApiAFCriteriaType = {
	[key in ApiAFCriteriaTypeKey]?: TypeOfAFCriteriaField<(typeof AF_CRITERIA_FIELDS)[key]>;
};

const emptySourceFieldWrapper = <K extends keyof IActualOrForecastPhase>(key: K) => {
	const baseFieldDefinition = AFCriteriaRWDBField(key, BOOLEAN_FIELD);
	baseFieldDefinition.read = (value) => {
		if (value[key] !== undefined) {
			return true;
		}
		return;
	};

	baseFieldDefinition.write = (object, value) => {
		if (value !== undefined) {
			object[key] = '';
		}
	};
	return baseFieldDefinition;
};

const AF_CRITERIA_FIELDS = {
	never: emptySourceFieldWrapper('never'),
	asOfDate: emptySourceFieldWrapper('as_of_date'),
	date: AFCriteriaRWDBField('date', STRING_FIELD),
};

function AFCriteriaRWDBField<K extends keyof IActualOrForecastPhase, TParsed = IActualOrForecastPhase[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
) {
	return readWriteDbField<IActualOrForecastPhase, K, TParsed>(key, definition, {});
}

function getAFCriteriaTypeField<K extends keyof IActualForecastReplaceActual>(
	key: K,
): AFReplaceActualField<ApiAFCriteriaType> {
	return {
		type: OpenApiDataType.object,
		properties: AF_CRITERIA_FIELDS,
		parse: (data: unknown, location?: string) =>
			parseRequestFromPayload<ApiAFCriteriaType, ApiAFCriteriaTypeKey>(
				'Actual Or Forecast',
				AF_CRITERIA_FIELDS,
				data,
				location,
			),
		read: (actualForecast) =>
			readRequestFromDocument<IActualOrForecastPhase, ApiAFCriteriaType, ApiAFCriteriaTypeKey>(
				actualForecast[key],
				AF_CRITERIA_FIELDS,
			),
		write: (actualForecast, value) =>
			set(
				actualForecast,
				[key],
				writeDocumentWithRequest<IActualOrForecastOption, ApiAFCriteriaType, ApiAFCriteriaTypeKey>(
					value,
					AF_CRITERIA_FIELDS,
				),
			),
	};
}

// Replace Actual Fields:
// - oil
// - gas
// - water

export type AFReplaceActualField<T> = IField<IActualForecastReplaceActual, T>;
export type TypeOfAFReplaceActualField<FT> = FT extends AFReplaceActualField<infer T> ? T : never;
export type ApiAFReplaceActualTypeKey = keyof typeof AF_REPLACE_CRITERIA_FIELDS;

export type ApiAFReplaceActualType = {
	[key in ApiAFReplaceActualTypeKey]?: TypeOfAFReplaceActualField<(typeof AF_REPLACE_CRITERIA_FIELDS)[key]>;
};

export const AF_REPLACE_CRITERIA_FIELDS = {
	oil: getAFCriteriaTypeField('oil'),
	gas: getAFCriteriaTypeField('gas'),
	water: getAFCriteriaTypeField('water'),
};
