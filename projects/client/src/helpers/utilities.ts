import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { isValid, parse } from 'date-fns';
import _, { isNil } from 'lodash';
import type { Dispatch, SetStateAction } from 'react';

import { CSS_COLOR } from '@/helpers/constants';

import { makeLocal } from './date';

/** @deprecated Use _.cloneDeep */
export const clone = _.cloneDeep;

const LOCAL_ENV = process.env.LOCAL_ENV;

export const isMac = navigator.userAgent.includes('Mac');

/** Shalow equal comparison. taken from https://github.com/lodash/lodash/issues/2340 */
export function isShallowEqual(v, o) {
	for (const key in v) if (!(key in o) || v[key] !== o[key]) return false;

	for (const key in o) if (!(key in v) || v[key] !== o[key]) return false;

	return true;
}
/* eslint-enable */

export const genDate = (datetime: Date, { delimiter = '/', abbreviatedYear = false, convertToLocal = true } = {}) => {
	const date = convertToLocal ? makeLocal(new Date(datetime)) : new Date(datetime);
	assert(date);

	const day = date.getDate();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;

	return `${month}${delimiter}${day}${delimiter}${abbreviatedYear ? year.toString().slice(2) : year}`;
};

export const numberWithCommas = (num): string => {
	if (!num && num !== 0) {
		return 'N/A';
	}

	const parts = num.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const compareArrs = (arr1: any[], arr2: any[]): boolean => {
	const len = arr1.length;
	if (len !== arr2.length) {
		return false;
	}

	let bool = true;
	for (let i = 0; i < len; i++) {
		if (!arr2.includes(arr1[i])) {
			bool = false;
			break;
		}
	}

	return bool;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type ArrayOrSet<T = any> = Array<T> | Set<T>;

function getLength(arrOrSet: ArrayOrSet) {
	if ('size' in arrOrSet) {
		return arrOrSet.size;
	}
	return arrOrSet.length;
}

/**
 * Check if arrays/sets are equals
 *
 * @returns True if they are equal
 */
export function compareSets(set1: ArrayOrSet, set2: ArrayOrSet) {
	if (getLength(set1) !== getLength(set2)) {
		return false;
	}
	const actualSet = new Set(set2);
	for (const item of set1) {
		if (!actualSet.has(item)) {
			return false;
		}
	}
	return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const multiGet = (object: any, paths: string[] = []) => {
	return paths.reduce((curObj, path) => {
		const value = _.get(object, path);
		if (value) {
			return { ...curObj, [path]: value };
		}
		return curObj;
	}, {});
};

export const multiSet = (object, valueObj) => {
	const output = clone(object);
	Object.entries(valueObj).forEach(([key, value]) => _.set(output, key, value));
	return output;
};

// TODO document this function, if it's no longer used remove it
export const getNestedProps = (el, props, simple = true) => {
	const getNestedProp = (e, splitProps) => {
		if (e[splitProps[0]] === null) {
			return '';
		}
		if (splitProps.length === 1) {
			const p = splitProps.shift();
			if (e[p] && p.includes('date')) {
				return genDate(new Date(e[p]));
			}

			return e[p];
		}
		return getNestedProp(e[splitProps.shift()], splitProps);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const output = [] as any[];
	for (let i = 0; i < props.length; i++) {
		const propArr = simple ? props[i].split('.') : props[i].name.split('.');
		const nestedProp = getNestedProp(el, propArr);

		if (simple) {
			output.push(nestedProp);
		} else {
			const { type } = props[i];
			if (type === 'number') {
				output.push(parseFloat(nestedProp));
			}
			if (type === 'nomod') {
				output.push(nestedProp);
			}
			if (type === 'date') {
				const date = new Date(nestedProp);
				output.push(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);
			}
		}
	}

	return output;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function isObject(item): item is Record<any, any> {
	return !!item && typeof item === 'object' && !Array.isArray(item);
}

export function deepMerge<A, B>(obj1: A, obj2: B): A & B {
	const one = obj1 as A & B;
	const two = obj2;
	if (isObject(one) && isObject(two)) {
		Object.keys(two).forEach((key) => {
			if (isObject(two[key])) {
				if (!one[key] || !isObject(one[key])) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					one[key] = two[key];
				}
				deepMerge(one[key], two[key]);
			} else {
				Object.assign(one, { [key]: two[key] });
			}
		});
	}
	return one;
}

export const genSocketName = (kind = 'no-kind', id = 'no-id') => {
	return `${kind}-${id}-${Date.now()}`;
};

export function stringToColor(str: string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		// eslint-disable-next-line no-bitwise
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	let color = '#';
	for (let i = 0; i < 3; i++) {
		// eslint-disable-next-line no-bitwise
		const value = (hash >> (i * 8)) & 0xff;
		color += `00${value.toString(16)}`.substr(-2);
	}
	return color;
}

/**
 * @example
 * 	getAutoIncrementedName('newHeader', ['newHeader'], '_'); // 'newHeader_1'
 * 	getAutoIncrementedName('newHeader', ['newHeader', 'newHeader_1'], '_'); // 'newHeader_2'
 * 	getAutoIncrementedName('newHeader', ['newHeader_1'], '_'); // 'newHeader_2'
 */
export function getAutoIncrementedName(name: string, existingNames: string[], delimiter = ' ') {
	let max;
	const re = new RegExp(`^${name}(${_.escapeRegExp(delimiter)}(\\d+))?$`);
	existingNames.forEach((existing) => {
		const match = re.exec(existing);
		if (match) {
			const [, , numberSuffix] = match;
			max = Math.max(max || 0, parseInt(numberSuffix || '0', 10));
		}
	});
	if (max === undefined) {
		return name;
	}
	return `${name}${delimiter}${max + 1}`;
}

/**
 * Check if a string looks like a date
 *
 * @example
 * 	isDateLike('01/01/2021'); // true
 *
 * @see https://stackoverflow.com/a/28227976
 */
function isDateLike(str: string) {
	return !!['MM/dd/yyyy', "yyyy-MM-dd'T'HH:mm:ss.SSS[Z]"].find((format) => isValid(parse(str, format, new Date())));
}

/*
 * Tries to infer the value type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function inferType(value: any) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return 'number';
	}
	if (typeof value === 'string') {
		if (isDateLike(value)) {
			return 'date';
		}
		return 'string';
	}
	if (value instanceof Date) {
		return 'date';
	}
	if (value === false || value === true) {
		return 'boolean';
	}
	return 'na';
}

/** Like `formatNumber` but will keep all decimal places */
export function formatPreciseNumber(value: unknown): string {
	if (value === undefined || value === null) {
		return 'N/A';
	}

	const casted = Number(value);

	if (Number.isFinite(casted)) {
		return numberWithCommas(casted);
	}

	return 'N/A';
}

export function formatNumber(value, places = 2) {
	if (value === undefined || value === null) {
		return 'N/A';
	}

	const casted = Number(value);

	if (Number.isFinite(casted)) {
		return numberWithCommas(casted.toFixed(places));
	}

	return 'N/A';
}

export function formatDate(value) {
	if (value === undefined || value === null) {
		return 'N/A';
	}

	if (typeof value === 'string') {
		return makeLocal(new Date(value))?.toLocaleDateString();
	}

	return value.toLocaleDateString();
}

export function formatBoolean(value) {
	if (value === undefined || value === null) {
		return 'N/A';
	}

	return value ? 'Yes' : 'No';
}

export function formatString(value) {
	if (value === undefined || value === null) {
		return 'N/A';
	}

	return value.toLocaleString();
}

export function formatIdx(value) {
	if (!value) {
		return 'N/A';
	}

	return formatDate(convertIdxToDate(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function formatValue(value: any, type?: string) {
	switch (type ?? inferType(value)) {
		case 'number':
		case 'percent':
			return formatNumber(value);
		case 'integer':
			return formatNumber(value, 0);
		case 'small-number':
			return formatNumber(value, 4);
		case 'precise-number':
			return formatPreciseNumber(value);
		case 'date':
			return formatDate(value);
		case 'idx':
			return formatIdx(value);
		case 'string':
			return formatString(value);
		case 'boolean':
			return formatBoolean(value);
		default:
			return value?.toString?.() ?? 'N/A';
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function formatValueForExcel(value: any, type?: string, kind?: string) {
	const defaultValue = '';

	if (type === 'scope') {
		if (value) {
			return 'Project';
		}
		return value === null ? 'Company' : defaultValue;
	}

	if (value === undefined || value === null) {
		return defaultValue;
	}

	switch (type ?? inferType(value)) {
		case 'number':
			return Number.isFinite(Number(value)) ? Number(value) : defaultValue;
		case 'date':
			return kind === 'date'
				? makeLocal(new Date(value))?.toLocaleDateString()
				: new Date(value).toLocaleString();
		case 'boolean':
			return value ? 'Yes' : 'No';
		default:
			return value?.toString?.() ?? defaultValue;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function arrayToRecord<T>(array: T[], key = _.identity as any, iteratee = _.identity as any) {
	// could be improved by using _.transform
	return _.mapValues(_.keyBy(array, key), iteratee);
}

// TODO improve typing, if you encounter any issues with this typings before it can be improved feel free to replace generic code with `any`
/** Similar to _.mapValues, but filter them */
export function filterValues<T>(object: T, iteratee: (value: T[keyof T], key: keyof T, index: number) => boolean): T {
	if (object === null) {
		// TODO findout why it checks for null
		return {} as T;
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return Object.keys(object).reduce((acc, key, index) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		if (iteratee(object[key], key as keyof T, index)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			acc[key] = object[key];
		}
		return acc;
	}, {} as T);
}

export function getTenant(): string {
	if (window.location.hostname === 'localhost') {
		return LOCAL_ENV as string;
	}
	const hostname = window.location.hostname.split('.');
	// Check for support subdomain
	if (hostname.length === 4 && hostname[0] === 'support') {
		return hostname[1];
	}
	return hostname[0];
}

/**
 * Creates a map from an array. Supports lodash iterators
 *
 * @example
 * 	createMap([{ _id: 'foo', data: { name: 'Foo' } }], '_id', 'data');
 */
export function createMap<T, K = string, V = T>(
	array: T[],
	key: _.ValueIterateeCustom<T, K>,
	property?: _.ValueIterateeCustom<T, V>
): Map<K, V> {
	const map = new Map();
	const keyIt = _.iteratee(key);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const valueIt = _.iteratee(property);
	array.forEach((element) => {
		map.set(keyIt(element), valueIt(element));
	});
	return map;
}

/**
 * @example
 * 	filterSearch(['Abstract', 'Api12', 'Api14'], 'ab'); // ['Abstract']
 * 	filterSearch([{ name: 'Abstract' }, { name: 'Api12' }, { name: 'Api14' }], 'api', 'name'); // [{ name: 'Api12' }, { name: 'api14' }]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function filterSearch<T>(array: T, text: string, iteratee = _.identity as any): T {
	const fn = _.iteratee(iteratee);
	const regexp = new RegExp(_.escapeRegExp(text), 'i');
	if (Array.isArray(array)) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return _.filter(array, (item) => fn(item).match(regexp));
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return _.pickBy(array, (item) => fn(item).match(regexp));
}

// TODO findout a better name for this
export const objectFromKeys = <T, K extends string | number = string>(
	keys: K[],
	valueResolver: (key: K, index: number) => T
): Record<string, T> =>
	keys.reduce((accumulator, key, index) => {
		accumulator[key as string] = valueResolver(key, index);
		return accumulator;
	}, {});

export function getFileNameExtension(fileName: string) {
	let dotIndex = fileName.lastIndexOf('.');
	if (dotIndex < 0) {
		dotIndex = fileName.length;
	}
	return { fileName: fileName.slice(0, dotIndex), extension: fileName.slice(dotIndex) };
}

export function isValidChildren(el) {
	return el !== null && el !== undefined && el !== false;
}

export function sortIndexes(array) {
	const pairs = array.map((value, index) => [value, index]);

	pairs.sort(([value1], [value2]) => value1 - value2);

	return pairs.map((pair) => pair[1]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type ValueOrFunction<T, P extends any[] = []> = ((...params: P) => T) | T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function resolveValueOrFunction<T, P extends any[] = []>(fn: ValueOrFunction<T, P>, ...params: P): T {
	if (typeof fn === 'function') {
		return (fn as (...rest: P) => T)(...params);
	}
	return fn;
}

/**
 * Asserts `value`, throws an error if value is falsy
 *
 * @example
 * 	const { project } = useAlfa();
 *
 * 	assert(project, 'Expected project to be in context');
 *
 * 	project._id; // typescript doesn't complain because covered by assertion
 *
 * @param debugValue Optionally pass a function that returns a value that will show op in the logs
 * @see original typescript PR https://github.com/microsoft/TypeScript/pull/32695
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function assert(value: unknown, message = 'Assertion Failed', debugValue?: () => any): asserts value {
	if (!value) {
		if (debugValue) {
			try {
				// eslint-disable-next-line no-console
				console.debug(debugValue());
			} catch (err) {
				// ignore if extra debug fails
			}
		}
		throw new Error(message);
	}
}

/** Alias to second value of the return type of `useState` react hook reexported here for convenience */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type SetStateFunction<S = any> = Dispatch<SetStateAction<S>>;

/**
 * Helper for filtering falsy values in an array
 *
 * @example
 * 	const filtering = false;
 * 	const numbersOnly = [1, 2, 3, 4, filtering && 8].filter(isTruthy); // numbersOnly is an array of numbers
 *
 * @note even though it is possible to pass true and will not be filtered out, typescript will not recognize it properly, this is fine most of the time. This is the desired behavior
 */
export function isTruthy<T>(v: boolean | T): v is T {
	return Boolean(v);
}

const indexToGradient = (index: number): number => {
	const denom = 2 ** Math.ceil(Math.log2(index + 1));
	const numerator = (index % (denom / 2)) * 2 + 1;
	return numerator / denom;
};

/**
 * Hue is a number between 0 and 360 saturation and lightness are numbers between 0% and 100%
 * https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex/54014428#54014428
 * https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
 */
function hslToHex(hue: number, saturation: number, lightness: number): string {
	lightness /= 100;
	const a = (saturation * Math.min(lightness, 1 - lightness)) / 100;
	const f = (n) => {
		const k = (n + hue / 30) % 12;
		const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0'); // convert to Hex and prefix "0" if needed
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

export const getColorFromIndex = (index: number): string => {
	const gradientVal = indexToGradient(index);
	const hue = 360 * gradientVal;
	const saturation = 100 - index / 4;
	const lightness = 50;

	return hslToHex(hue, saturation, lightness);
};

// this function sorts an array of strings and returns string/color pairs in an object

export const getColorObjectFromStringArray = (values: string[]) => {
	const sortedStrings = values.sort((a: string, b: string) => {
		return a.localeCompare(b, undefined, {
			numeric: true,
			sensitivity: 'base',
		});
	});

	const colorObject = {};
	sortedStrings.forEach((string, index) => {
		colorObject[string] = getColorFromIndex(index + 1);
	});
	return colorObject;
};

// This function makes a colored debug message

export type ColorCSS = (typeof CSS_COLOR)[number];

interface colorDebugArgs {
	message: string;
	bgColor?: ColorCSS | string;
	textColor?: ColorCSS | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	payload?: any;
}

export const coloredDebug = ({ message, bgColor = 'yellow', textColor = 'black', payload = '' }: colorDebugArgs) => {
	// eslint-disable-next-line
	console.debug(`%c #### ${message} ####`, `background: ${bgColor}; color: ${textColor}`, payload);
};

export const coloredDebugWithTrace = ({
	message,
	bgColor = 'yellow',
	textColor = 'black',
	payload = '',
}: colorDebugArgs) => {
	/* eslint-disable */
	console.groupCollapsed(`%c #### ${message} ####`, `background: ${bgColor}; color: ${textColor}`);
	console.trace();
	if (payload) {
		console.log('%c Additional data:', 'background: black; color: yellow;');
		console.log(payload);
	}
	console.groupEnd();
	/* eslint-enable */
};

export const getViewport = () => {
	const viewportHeight = isNil(window?.document?.documentElement?.clientHeight)
		? window?.innerHeight ?? 0
		: window?.document.documentElement.clientHeight;
	const viewportWidth = isNil(window?.document?.documentElement?.clientWidth)
		? window?.innerWidth ?? 0
		: window?.document.documentElement.clientWidth;

	return { viewportHeight, viewportWidth };
};

export const getScreenResolutionInfo = () => {
	const screenHeight = window?.screen?.height ?? 0;
	const screenWidth = window?.screen?.width ?? 0;
	const devicePixelRatio = window?.devicePixelRatio ?? 0;

	return { screenHeight, screenWidth, devicePixelRatio };
};
