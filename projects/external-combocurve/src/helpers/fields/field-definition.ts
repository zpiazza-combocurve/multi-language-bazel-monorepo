import { IFilter } from '../mongo-queries';

import { OpenApiDataType, OpenApiIntegerFormat, OpenApiNumberFormat, OpenApiStringFormat } from './data-type';

export { OpenApiDataType, OpenApiIntegerFormat, OpenApiNumberFormat, OpenApiStringFormat };

export const PARSE_QUERY_OPERATORS = ['lt', 'le', 'gt', 'ge'] as const;

export type ParseQueryOperator = (typeof PARSE_QUERY_OPERATORS)[number];

export interface ParsedQueryValue<T> {
	value: NonNullable<T>;
	operator?: ParseQueryOperator;
}

export type ApiQueryFilters = IFilter<Array<string | Record<string, string>>>;

export type ApiQueryFiltersBucket = { filters: ApiQueryFilters; unknownFilters: ApiQueryFilters };

export interface IFieldDefinition<TParsed> {
	type: OpenApiDataType;
	format?: OpenApiIntegerFormat | OpenApiNumberFormat | OpenApiStringFormat;
	properties?: Record<string, IFieldDefinition<unknown>>;
	items?: IFieldDefinition<unknown>;
	parse?: (value: unknown, location?: string) => NonNullable<TParsed>;
	parseQuery?: (value: unknown[]) => ParsedQueryValue<TParsed>[];
}

export interface IArrayFieldDefinition<TParsedItem = unknown> extends IFieldDefinition<Array<TParsedItem>> {
	type: OpenApiDataType.array;
}

export interface IBooleanFieldDefinition extends IFieldDefinition<boolean> {
	type: OpenApiDataType.boolean;
}

export interface IIntegerFieldDefinition extends IFieldDefinition<number> {
	type: OpenApiDataType.integer;
	format?: OpenApiIntegerFormat;
}

export interface INumberFieldDefinition extends IFieldDefinition<number> {
	type: OpenApiDataType.number;
	format?: OpenApiNumberFormat;
}

export interface IObjectFieldDefinition<TParsed = unknown> extends IFieldDefinition<TParsed> {
	type: OpenApiDataType.object;
}

export interface IStringFieldDefinition<TParsed = string> extends IFieldDefinition<TParsed> {
	type: OpenApiDataType.string;
	format?: OpenApiStringFormat;
	maxLength?: number;
}

export interface IDateFieldDefinition extends IFieldDefinition<Date> {
	type: OpenApiDataType.string;
	format?: OpenApiStringFormat;
	maxLength?: number;
	'x-allow-parameter-operator'?: boolean;
}
