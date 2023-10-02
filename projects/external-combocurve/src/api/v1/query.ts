import { pickBy } from 'lodash';

import { getSort, parseIsoDate, parseNumber, parseString } from '@src/helpers/validation';
import { dateToIndex } from '@src/helpers/dates';
import { ISort } from '@src/helpers/mongo-queries';

interface IQueryParamOptions<T> {
	parse: (value: unknown, location?: string) => T;
	defaultValue?: T;
}

type QueryOptions = Record<string, IQueryParamOptions<unknown>>;
type CastQueryReturn<T extends QueryOptions> = {
	[K in keyof T]: T[K] extends IQueryParamOptions<infer TV> ? TV : never;
};

export const castQuery = <T extends QueryOptions>(query: Record<string, unknown>, options: T): CastQueryReturn<T> => {
	return <CastQueryReturn<T>>Object.entries(options)
		.map<[string, unknown]>(([key, { parse, defaultValue }]) => [
			key,
			query[key] === undefined ? defaultValue : parse(query[key], key),
		])
		.reduce<Partial<CastQueryReturn<T>>>((res, [key, value]) => ({ ...res, [key]: value }), {});
};

export const getFilterQuery = <T extends QueryOptions>(
	query: Record<string, unknown>,
	options: T,
): Record<string, unknown> => pickBy(query, (value, key) => !Object.keys(options).includes(key));

export const NumberParser =
	(min = -Infinity, max = Infinity) =>
	(value: unknown, location?: string): number =>
		parseNumber(value, location, min, max);

export const SortParser =
	(fields = ['_id']) =>
	(value: unknown, location?: string): ISort =>
		getSort(value, location, fields);

export const parseCursor = (value: unknown, location?: string): string => {
	const cursor64 = parseString(value, location);

	return Buffer.from(cursor64, 'base64').toString('utf-8');
};

export const dateToIdxParser = (value: unknown, location?: string): number => {
	const isoDate = parseIsoDate(value, location);

	return dateToIndex(isoDate);
};
