import { BigQueryDate } from '@google-cloud/bigquery';
import { ErrorObject } from 'ajv';
import moment from 'moment';
import mongoose from 'mongoose';
import { ParsedQs } from 'qs';
import { uniq } from 'lodash';

import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { DAYS_IN_YEAR } from '@src/constants';
import { IFilterOptionRecord } from '@src/api/v1/fields';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	ApiQueryFiltersBucket,
	PARSE_QUERY_OPERATORS,
	ParsedQueryValue,
	ParseQueryOperator,
} from './fields/field-definition';
import { indexToDate, MAX_DATE } from './dates';

export type ErrorDetails = Record<string, unknown>;

const maxLengthNotSet: number | undefined = undefined;

interface IValidationErrorDetails extends ErrorDetails {
	location?: string;
	chosenID?: string;
}

export class ValidationError extends Error {
	expected = true;
	statusCode?: number;
	details: IValidationErrorDetails;
	constructor(message?: string, location?: string, name?: string, statusCode?: number, chosenId?: string) {
		super(message);
		this.name = name ?? ValidationError.name;
		this.details = { location, chosenID: chosenId };
		this.statusCode = statusCode;
	}

	equals(error: ValidationError): boolean {
		return (
			error &&
			this.message?.toLowerCase() == error.message?.toLowerCase() &&
			this.details.chosenID == error.details.chosenID &&
			compareLocation(this.details.location, error.details.location) &&
			this.expected == error.expected &&
			this.statusCode == error.statusCode
		);
	}
}

function compareLocation(location1: string | undefined, location2: string | undefined): boolean {
	if (!location1 || !location2) {
		return false;
	}

	const loc1HasEndIndex = location1[location1.length - 1] == ']';
	const loc2HasEndIndex = location2[location2.length - 1] == ']';

	if (loc1HasEndIndex == loc2HasEndIndex) {
		return location1 == location2;
	} else if (loc1HasEndIndex) {
		return location1.substring(location1.lastIndexOf('[')) == location2;
	} else {
		return location2.substring(location2.lastIndexOf('[')) == location1;
	}
}

export class RequestStructureError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RequestStructureError.name;
	}
}

export class RecordCountError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RecordCountError.name;
	}
}

export class RequiredFieldError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RequiredFieldError.name;
	}
}

export class RequiredFilterError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = RequiredFilterError.name;
	}
}

export class FieldNameFilterError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FieldNameError.name;
	}
}

export class FieldFilterValueLimitError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FieldNameError.name;
	}
}

export class FieldNameError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FieldNameError.name;
	}
}

export class ValueError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ValueError.name;
	}
}

export class OperatorError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = OperatorError.name;
	}
}

export class TypeError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = TypeError.name;
	}
}

export class DifferentDataSourceError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location);
		this.details.chosenID = chosenId;
		this.name = DifferentDataSourceError.name;
	}
}

export class MissingProductionDataError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = MissingProductionDataError.name;
	}
}

export class InvalidContentTypeError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 415) {
		super(message, location, InvalidContentTypeError.name, statusCode);
	}
}

export const isObject = (item: unknown): item is Record<string, unknown> => {
	return !!item && typeof item === 'object' && !Array.isArray(item);
};

export const isStringRecord = (item: unknown): item is Record<string, string> => {
	return isObject(item) && Object.values(item).every((val) => typeof val == 'string');
};

export const isString = (value: unknown): value is string => {
	return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
	return typeof value === 'number';
};

export const isBoolean = (value: unknown): value is boolean => {
	return typeof value === 'boolean';
};

export const isValidIso8601Date = (value: unknown): value is string => {
	if (!isString(value)) {
		return false;
	}
	return moment(value, moment.ISO_8601, true).isValid();
};

export const isValidDate = (value: unknown): value is string => {
	if (!isString(value)) {
		return false;
	}
	return moment(value, 'YYYY-MM-DD', true).isValid();
};

export const isValidObjectId = (value: unknown): boolean => mongoose.isValidObjectId(value);

export const contains = (value: unknown, list: string[]): boolean => {
	if (!isString(value)) {
		return false;
	}
	return list.includes(value);
};

export const parseBoolean = (value: unknown, location?: string): boolean => {
	if (typeof value !== 'string' && typeof value !== 'boolean') {
		throw new TypeError(`\`${value}\` is not a valid Boolean`, location);
	}

	if (typeof value === 'boolean') {
		return value;
	}

	const lowerCaseValue = value.toLowerCase();

	if (lowerCaseValue !== 'true' && lowerCaseValue !== 'false') {
		throw new TypeError(`\`${value}\` is not a valid Boolean`, location);
	}

	return lowerCaseValue === 'true';
};

export const parseQueryBoolean = (value: unknown[], location?: string): ParsedQueryValue<boolean>[] =>
	value.map((v) => ({ value: parseBoolean(v, location) }));

export const parseInteger = (value: unknown, location?: string, min = -Infinity, max = Infinity): number => {
	const number = typeof value === 'string' ? +value : value;

	return parseIntegerStrict(number, location, min, max);
};

export const parseNumber = (
	value: unknown,
	location?: string,
	min = -Infinity,
	max = Infinity,
	defaultValue?: number | undefined,
): number => {
	const number = typeof value === 'string' ? +value : value;

	return parseNumberStrict(number, location, min, max, defaultValue);
};

export const parseQueryInteger = (
	value: unknown[],
	location?: string,
	min = -Infinity,
	max = Infinity,
): ParsedQueryValue<number>[] => value.map((v) => ({ value: parseInteger(v, location, min, max) }));

export const parseQueryNumber = (
	value: unknown[],
	location?: string,
	min = -Infinity,
	max = Infinity,
	defaultValue?: number | undefined,
): ParsedQueryValue<number>[] => value.map((v) => ({ value: parseNumber(v, location, min, max, defaultValue) }));

export const parseIntegerStrict = (value: unknown, location?: string, min = -Infinity, max = Infinity): number => {
	const number = parseNumberStrict(value, location, min, max);
	if (!Number.isInteger(value)) {
		throw new TypeError(`\`${value}\` is not a valid integer`, location);
	}

	return number;
};

export const parseNumberStrict = (
	value: unknown,
	location?: string,
	min = -Infinity,
	max = Infinity,
	defaultValue?: number | undefined,
): number => {
	if (value === undefined && defaultValue !== undefined) {
		value = defaultValue;
	}

	if (!Number.isFinite(value)) {
		throw new TypeError(`\`${value}\` is not a valid number`, location);
	}

	const number = value as number;
	if (number < min || number > max) {
		throw new ValueError(`\`${number}\` is out of the valid range. Must be between ${min} and ${max}`, location);
	}

	return number;
};

export const parseObjectId = (value: unknown, location?: string): mongoose.Types.ObjectId => {
	if (typeof value !== 'string' && typeof value !== 'number') {
		throw new TypeError(`\`${value}\` is not a valid ObjectId`, location);
	}

	if (!isValidObjectId(value)) {
		throw new TypeError(`\`${value}\` is not a valid ObjectId`, location);
	}

	try {
		return mongoose.Types.ObjectId(value);
	} catch (e) {
		throw new TypeError(`\`${value}\` is not a valid ObjectId`, location);
	}
};

export const parseQueryObjectIdElement = (
	value: unknown,
	location?: string,
): ParsedQueryValue<mongoose.Types.ObjectId> => {
	const filter = parseQueryOperator(value, location);

	return { operator: filter.op as ParseQueryOperator | undefined, value: parseObjectId(filter.value, location) };
};

export const parseQueryObjectId = (value: unknown[], location?: string): ParsedQueryValue<mongoose.Types.ObjectId>[] =>
	value.map((v) => parseQueryObjectIdElement(v, location));

export const parseIsoDate = (value: unknown, location?: string): Date => {
	if (!isValidIso8601Date(value)) {
		throw new TypeError(`\`${value}\` is not a valid ISO date`, location);
	}
	const date = new Date(value);

	if (date > MAX_DATE) {
		throw new ValueError(`\`${value}\` is too far in the future, max date allowed is ${MAX_DATE}`, location);
	}

	return date;
};

/**
 * Converts a date string in the format YYYY-MM-DD to a UTC date object
 * @param {number} startIdx - the start date as an index
 * @param {number} endIdx - the end date as an index
 * @param {number} years - how many years apart the dates can be
 * @param {string} [location] - used to identify the location of the error if one occurs
 * @returns {Date} a date object in UTC time zone
 */
export const validateDateIdxRange = (startIdx: number, endIdx: number, years: number, location?: string): void => {
	if (!Number.isInteger(startIdx) && !Number.isInteger(endIdx)) {
		return;
	}

	if (startIdx && endIdx) {
		if (startIdx > endIdx) {
			throw new ValueError(
				`\`startDate: ${indexToDate(startIdx)}\` is greater than endDate:\`${indexToDate(endIdx)}\``,
				location,
			);
		}

		if (endIdx - startIdx > Math.ceil(years * DAYS_IN_YEAR)) {
			throw new ValueError(
				`\`startDate: ${indexToDate(startIdx)}\` and endDate:\`${indexToDate(
					endIdx,
				)}\` are more than ${years} years apart`,
				location,
			);
		}
	}
};

const parseQueryOperator = (
	value: unknown,
	location?: string,
): { op: ParseQueryOperator | undefined; value: unknown } => {
	let filter: { op?: string; value: unknown } = { value };
	if (isObject(value)) {
		filter = Object.keys(value).map((key) => ({ op: key, value: value[key] }))[0];
	}

	if (filter.op && !PARSE_QUERY_OPERATORS.includes(filter.op as ParseQueryOperator)) {
		throw new OperatorError(`\`${filter.op}\` is not an allowed operator`, location);
	}

	return { op: filter.op as ParseQueryOperator | undefined, value: filter.value };
};

export const parseQueryIsoDateElement = (value: unknown, location?: string): ParsedQueryValue<Date> => {
	const filter = parseQueryOperator(value, location);

	return { operator: filter.op as ParseQueryOperator | undefined, value: parseIsoDate(filter.value) };
};

export const parseQueryIsoDate = (value: unknown[], location?: string): ParsedQueryValue<Date>[] =>
	value.map((v) => parseQueryIsoDateElement(v, location));

export const parseBigQueryDate = (value: unknown, location?: string): BigQueryDate => {
	if (!isValidDate(value)) {
		throw new TypeError(`\`${value}\` is not a valid date`, location);
	}
	return new BigQueryDate(value);
};

export const parseQueryBigQueryDateElement = (value: unknown, location?: string): ParsedQueryValue<BigQueryDate> => {
	const filter = parseQueryOperator(value, location);

	return { operator: filter.op as ParseQueryOperator | undefined, value: parseBigQueryDate(filter.value) };
};

export const parseQueryBigQueryDate = (value: unknown[], location?: string): ParsedQueryValue<BigQueryDate>[] =>
	value.map((v) => parseQueryBigQueryDateElement(v, location));

export const parseString = <T extends string = string>(
	value: unknown,
	location?: string,
	choices?: readonly T[],
	maxLength?: number,
	defaultValue?: T,
): NonNullable<T> => {
	if (value === undefined && defaultValue !== undefined) {
		value = defaultValue;
	}

	if (!isString(value)) {
		throw new TypeError(`\`${value}\` is not a string`, location);
	}

	if (choices && !choices.includes(value as T)) {
		throw new ValueError(
			`\`${value}\` is not a valid value for this field. Valid choices: \`${choices.join('`, `')}\`.`,
			location,
		);
	}

	if (maxLength && value.length > maxLength) {
		throw new ValueError(`${value} can't be longer than ${maxLength} characters`, location);
	}

	return value as NonNullable<T>;
};

export const parseQueryString = <T extends string = string>(
	value: unknown[],
	location?: string,
	choices?: readonly T[],
): ParsedQueryValue<T>[] => value.map((v) => ({ value: parseString(v, location, choices) }));

export const getParseString =
	<T extends string = string>(maxLength: number) =>
	(value: unknown, location?: string): NonNullable<T> =>
		parseString(value, location, undefined, maxLength);

export const getParseStringWithChoices =
	<T extends string = string>(choices?: readonly T[], location?: string, defaultValue?: T | undefined) =>
	(value: unknown): NonNullable<T> =>
		parseString(value, location, choices, maxLengthNotSet, defaultValue);

export const getParseQueryString =
	<T extends string = string>(choices?: readonly T[], location?: string) =>
	(value: unknown[]): ParsedQueryValue<T>[] =>
		value.map((v) => ({ value: parseString(v, location, choices) }));

export const getSort = (value: unknown, location?: string, fields = ['_id']): ISort => {
	if (typeof value !== 'string') {
		throw new TypeError(`\`${value}\` is not a valid sort parameter`, location);
	}

	const re = RegExp(`^([+-]?)(${fields.join('|')})$`);
	const match = re.exec(value);

	if (!match) {
		throw new TypeError(`\`${value}\` is not a valid sort parameter`, location);
	}

	return { [match[2]]: match[1] === '-' ? -1 : 1 };
};

export const getValidFilters = (
	filters: IFilter,
	fields: IFilterOptionRecord,
	allowUnknownFields = false,
): ApiQueryFiltersBucket => {
	const res = Object.entries(filters).reduce<ApiQueryFiltersBucket>(
		(res, [k, rawValue]) => {
			const value = Array.isArray(rawValue) ? rawValue : [rawValue];
			value.forEach((v) => {
				if (typeof v !== 'string' && !isStringRecord(v)) {
					throw new TypeError(`Invalid filter value \`${v}\``, k);
				}
			});

			const filter =
				fields[k] !== undefined
					? {
							...res,
							filters: {
								...res.filters,
								[k]: uniq(value),
							},
					  }
					: { ...res, unknownFilters: { ...res.unknownFilters, [k]: value } };

			if (
				typeof fields[k]?.filterValues === 'number' &&
				filter.filters[k]?.length !== undefined &&
				filter.filters[k].length > (fields[k].filterValues as number)
			) {
				throw new FieldFilterValueLimitError(
					`Can't filter by \`${k}\` with more than ${fields[k].filterValues} values`,
				);
			}

			return filter;
		},
		{ filters: {}, unknownFilters: {} },
	);

	if (!allowUnknownFields) {
		const errorAggregator = new ValidationErrorAggregator();

		Object.entries(res.unknownFilters).forEach(([fieldName]) =>
			errorAggregator.errors.push(new FieldNameFilterError(`Unrecognized filter \`${fieldName}\``)),
		);

		errorAggregator.throwAll();
	}

	return res;
};

export const checkRecordCount = (records: unknown[], max: number, min = 1): void => {
	if (records.length < min) {
		throw new RecordCountError(`Invalid number of records in request. Must send at least ${min} records`);
	}
	if (records.length > max) {
		throw new RecordCountError(
			`Too many records in a single request. Please split your data in batches of at most ${max} records.`,
		);
	}
};

export const validatePaginationFilters = (query: ParsedQs): void => {
	if (query.skip !== undefined && query.cursor !== undefined) {
		throw new ValidationError('Can only use `skip` or `cursor` but not both at once');
	}
};

// eslint-disable-next-line complexity
export const convertAjvErrorToValidationError = (error: ErrorObject, index?: number): ValidationError | undefined => {
	const propertyPathName = getAjvErrorPropertyFullName(error);
	const propertyName = getAjvErrorPropertyName(error);

	const location = index || index == 0 ? `[${index}].${propertyPathName}` : propertyPathName;

	if (error.keyword == 'if' || error.keyword == 'discriminator' || error.message === 'ignore') {
		return undefined;
	}

	if (error.keyword == 'format' && error.schema == 'stringNumber') {
		return new TypeError(`\`${error.data ? error.data : 'value'}\` is not a valid number`, location);
	}

	if (error.keyword == 'unevaluatedProperties') {
		return new FieldNameError(
			`\`${error.params.unevaluatedProperty}\` is not a valid field name`,
			`[${index}]${error.instancePath
				.split('/')
				.filter((text) => text !== '/')
				.map((text) => (text && !isNaN(Number(text)) ? `[${text}]` : text))
				.join('.')
				.replace('.[', '[')}`,
		);
	}

	if (error.keyword == 'required') {
		return new RequiredFieldError(`Missing required field: \`${propertyPathName}\``, `[${index}]`);
	}

	if (
		error.keyword == 'minimum' ||
		error.keyword == 'maximum' ||
		error.keyword == 'exclusiveMinimum' ||
		error.keyword == 'exclusiveMaximum'
	) {
		return new ValueError(`\`${propertyPathName}\` ${error.message}`, `[${index}]`);
	}

	if (error.keyword == 'enum') {
		return new ValueError(
			`\`${propertyPathName}\` must be one of the following values: ${error.params.allowedValues.join(', ')}`,
			`[${index}]`,
		);
	}

	if (error.keyword == 'format' && (error.params?.format == 'date' || error.params?.format == 'date-time')) {
		return new TypeError(`\`${error.data ? error.data : 'value'}\` is not a valid ISO date`, location);
	}

	// TODO: determine which error message format is correct
	// if (error.keyword == 'type') {
	// 	return new TypeError(`\`${propertyPathName}\` ${stripDoubleQuotes(error.message)}`, location);
	// }

	if (error.keyword == 'type') {
		if (error.params.type == 'object') {
			return new ValidationError(
				`Invalid value for \`${propertyName}\`: \`${error.data}\`. \`${propertyName}\` must be an object.`,
				location,
			);
		}

		return new TypeError(
			`\`${error.data}\` is not a ${error.params.type !== 'string' ? 'valid ' : ''}${getAvjParameterTypeName(
				error,
			)}`,
			location,
		);
	}

	if (error.keyword == 'minimumDecimalPrecision') {
		return new ValueError(
			`Invalid value for \`${propertyName}\`: the value sent was ${error.data}, which is smaller than the minimum decimal precision allowed which is ${error.schema}.`,
			location,
		);
	}

	return new TypeError(`${stripDoubleQuotes(error.message)}`, location);
};

function getAvjParameterTypeName(error: ErrorObject) {
	let returnType = error?.params?.type;

	if (returnType == 'boolean') {
		returnType = 'Boolean';
	}

	return returnType;
}

function stripDoubleQuotes(input: string | undefined) {
	return input ? input.replace(/"/g, '') : input;
}

function getAjvErrorPropertyFullName(error: ErrorObject): string {
	const { instancePath, params } = error;

	let propertyName = '';

	if (instancePath) {
		propertyName = instancePath.replace(/\//g, '.');
	}

	propertyName = propertyName.replace(/([.]+([\d]+)[.]+)/g, '[$2].');

	if (params.missingProperty) {
		if (propertyName) {
			propertyName += '.';
		}

		propertyName += params.missingProperty;
	}

	if (propertyName.charAt(0) == '.') {
		propertyName = propertyName.slice(1);
	}

	return propertyName;
}

function getAjvErrorPropertyName(error: ErrorObject): string {
	const { instancePath } = error;

	let propertyName = '';

	if (instancePath) {
		const pathParts: string[] = instancePath.split('/');
		propertyName = pathParts[pathParts.length - 1];
	}

	// if (params.missingProperty) {
	// 	if (propertyName) {
	// 		propertyName += '.';
	// 	}

	// 	propertyName += params.missingProperty;
	// }

	return propertyName;
}
