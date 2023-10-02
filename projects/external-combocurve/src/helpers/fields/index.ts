import { BigQueryDate } from '@google-cloud/bigquery';
import { Types } from 'mongoose';

import {
	getParseQueryString,
	getParseStringWithChoices,
	parseBigQueryDate,
	parseBoolean,
	parseIntegerStrict,
	parseIsoDate,
	parseNumberStrict,
	parseObjectId,
	parseQueryBigQueryDate,
	parseQueryBoolean,
	parseQueryInteger,
	parseQueryIsoDate,
	parseQueryNumber,
	parseQueryObjectId,
	parseQueryString,
	parseString,
} from '../validation';

import {
	IArrayFieldDefinition,
	IBooleanFieldDefinition,
	IDateFieldDefinition,
	IFieldDefinition,
	IIntegerFieldDefinition,
	INumberFieldDefinition,
	IStringFieldDefinition,
	OpenApiDataType,
	OpenApiStringFormat,
} from './field-definition';

export { IFieldDefinition };

export const BOOLEAN_FIELD: IBooleanFieldDefinition = {
	type: OpenApiDataType.boolean,
	parse: parseBoolean,
	parseQuery: parseQueryBoolean,
};

export const DATE_FIELD: IDateFieldDefinition = {
	type: OpenApiDataType.string,
	format: OpenApiStringFormat.date,
	parse: parseIsoDate,
	parseQuery: parseQueryIsoDate,
	'x-allow-parameter-operator': true,
};

export const BIG_QUERY_DATE_FIELD: IStringFieldDefinition<BigQueryDate> = {
	type: OpenApiDataType.string,
	format: OpenApiStringFormat.date,
	parse: parseBigQueryDate,
	parseQuery: parseQueryBigQueryDate,
};

export const INTEGER_FIELD: IIntegerFieldDefinition = {
	type: OpenApiDataType.integer,
	parse: parseIntegerStrict,
	parseQuery: parseQueryInteger,
};

export const NUMBER_FIELD: INumberFieldDefinition = {
	type: OpenApiDataType.number,
	parse: parseNumberStrict,
	parseQuery: parseQueryNumber,
};

export const STRING_FIELD: IStringFieldDefinition = {
	type: OpenApiDataType.string,
	maxLength: 16384,
	parse: parseString,
	parseQuery: parseQueryString,
};

export const getStringEnumField = <T extends string>(
	choices: readonly T[],
	defaultValue?: T | undefined,
): IStringFieldDefinition<T> => ({
	type: OpenApiDataType.string,
	parse: (value: unknown, location: string | undefined) =>
		getParseStringWithChoices(choices, location, defaultValue)(value),
	parseQuery: getParseQueryString(choices),
});

export const getRangeField = (min = -Infinity, max = +Infinity, defaultValue?: number): INumberFieldDefinition => ({
	type: OpenApiDataType.number,
	parse: (value: unknown, location: string | undefined) => parseNumberStrict(value, location, min, max, defaultValue),
	parseQuery: (value: unknown[]) => parseQueryNumber(value, undefined, min, max, defaultValue),
});

export const ARRAY_OBJECT_FIELD: IArrayFieldDefinition<Record<string, unknown>> = {
	type: OpenApiDataType.array,
	items: {
		type: OpenApiDataType.object,
	},
};

export const OBJECT_ID_FIELD: IFieldDefinition<Types.ObjectId> = {
	type: OpenApiDataType.string,
	parse: parseObjectId,
	parseQuery: parseQueryObjectId,
};

export const STRING_OBJECT_ID_FORMAT_FIELD: IFieldDefinition<string> = {
	type: OpenApiDataType.string,
	parse: (value) => {
		parseObjectId(value);
		return parseString(value);
	},
	parseQuery: (value) => {
		parseQueryObjectId(value);
		return parseQueryString(value);
	},
};
