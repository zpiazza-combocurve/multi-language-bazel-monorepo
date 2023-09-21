/** Put utilities to process text strings on this file */
import _, { camelCase, snakeCase } from 'lodash';

export * from '@/inpt-shared/helpers/text-utils';

/**
 * Example
 *
 * - 'InvalidParams' -> 'Invalid Params'
 * - 'InvalidAPICall' -> 'Invalid API Call'
 */
export function titleize(text: string) {
	return text
		.trim()
		.replace(/[^A-Za-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.split(/\s/)
		.map((camelCase) => {
			const pascalCase = (camelCase[0] || '').toUpperCase() + camelCase.slice(1);
			return (
				pascalCase
					// gC: 'LongCAMELCase' => 'Long CAMELCase'
					.replace(/([a-z])([A-Z])/g, (match, p1, p2) => `${p1} ${p2}`)
					// LCa: 'Long CAMELCase' => 'Long CAMEL Case'
					.replace(/([A-Z])([A-Z])([a-z])/g, (match, p1, p2, p3) => `${p1} ${p2}${p3}`)
			);
		})
		.join(' ');
}

/**
 * @example
 * 	hexToRgba('#fbafff', 0.5); // "rgba(251,175,255, 0.5)"
 */
export function hexToRgba(hex: string, alpha = 1) {
	// see: https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
	if (!(alpha >= 0 && alpha <= 1)) {
		throw new Error('Invalid alpha value');
	}
	let c;
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length === 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c = `0x${c.join('')}`;
		// eslint-disable-next-line no-bitwise
		return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
	}
	return hex;
}

export function rgbToRgba(rgb: string, alpha = 1) {
	if (!(alpha >= 0 && alpha <= 1)) {
		throw new Error('Invalid alpha value');
	}
	const match = /rgb\((\s*\d+\s*,\s*\d+\s*,\s*\d+\s*)\)/.exec(rgb);
	if (!match) {
		throw new Error('Invalid RGB string');
	}
	const [, params] = match;
	const [r, g, b] = params
		.trim()
		.replace(/\s+/g, ' ')
		.split(',')
		.map((value) => Number.parseInt(value, 10));
	if (![r, g, b].every((value) => value >= 0 && value <= 255)) {
		throw new Error('RGB values must be between 0 and 255');
	}

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function colorToRgba(color: string, alpha: number) {
	try {
		return rgbToRgba(color, alpha);
	} catch (e) {
		return hexToRgba(color, alpha);
	}
}

export function capitalizeSingle(word: string) {
	return word.replace(/^\w/, (c) => c.toUpperCase());
}

export function rgbaToRGB(rgba: string) {
	if (/rgba/.test(rgba)) {
		const r = rgba.replace(' ', '').replace('rgba', 'rgb').split(',');
		r.pop();
		r.push(')');
		return r.join(',').replace(',)', ')');
	}
	return rgba;
}

export function isEmail(input = '') {
	return new RegExp(`^[^@\\s]+@[^@\\s.]+\\.[^@\\s]+$`).test(input.trim());
}

export function hasNonWhitespace(input: string) {
	return new RegExp('.*\\S+.*').test(input);
}

/**
 * @example
 * 	labelWithUnit('Oil EUR', 'MBBL'); // 'Oil EUR (MBBL)'
 * 	labelWithUnit('Oil EUR'); // 'Oil EUR'
 *
 * @param {string} label
 * @param {string} [unit]
 */
export const labelWithUnit = (label: string, unit?: string) => (unit ? `${label} (${unit})` : label);

const matchExactString = (str: string) => {
	const escaped = _.escapeRegExp(str);
	return new RegExp(`${escaped}\\b`, 'g');
};

export const replaceVar = (str: string, bar: string, value: string) => str.replace(matchExactString(`$${bar}`), value);

/**
 * Substitute variables in a string with `vars` values
 *
 * A variable is a subset of the string in the format: `$VAR_NAME`
 *
 * @example
 * 	replaceVars('$EUR_UNIT', { EUR_UNIT: 'oil' }); // 'oil'
 *
 * @param str `string` with variables in it
 * @param vars Object containing the variable values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const replaceVars = (str: string, vars: Record<string, any>) =>
	_.reduce(vars, (result, value, key) => replaceVar(result, key, value), str);

export const numberDisplay = (value: unknown, digits = 2) =>
	Number.isFinite(value) ? (value as number).toLocaleString('en-US', { maximumFractionDigits: digits }) : 'N/A';

export const percentileDisplay = (percentile: number, value: number | string) => {
	if (percentile === 0) {
		return `Min (${value})`;
	}
	if (percentile === 1) {
		return `Max (${value})`;
	}
	return `P${Math.round(percentile * 100)} (${value})`;
};

/**
 * Convert all top level keys of a given `object` to snake_case.
 *
 * @param {Object} object
 * @returns {Object}
 */
export const snakelizeObjectKeys = (object: object) => {
	return Object.entries(object).reduce((carry, [key, value]) => {
		carry[snakeCase(key)] = value;

		return carry;
	}, {});
};

/**
 * Convert all top level keys of a given `object` to camelCase.
 *
 * @param {Object} object
 * @returns {Object}
 */
export const camelizeObjectKeys = (object: object) => {
	return Object.entries(object).reduce((carry, [key, value]) => {
		carry[camelCase(key)] = value;

		return carry;
	}, {});
};
