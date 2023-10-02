/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
// This module can not use TS because it's imported by `artillery`
const padZero = (source, digits) => String(source).padStart(digits, '0');

const timestamp = (time = Date.now()) => {
	// e.g: 20200311t203251m955
	const now = new Date(time);
	const YYYY = padZero(now.getUTCFullYear(), 4);
	const MM = padZero(now.getUTCMonth() + 1, 2);
	const DD = padZero(now.getUTCDate(), 2);
	const hh = padZero(now.getUTCHours(), 2);
	const mm = padZero(now.getUTCMinutes(), 2);
	const ss = padZero(now.getUTCSeconds(), 2);
	const mss = padZero(now.getUTCMilliseconds(), 3);
	return `${YYYY}${MM}${DD}t${hh}${mm}${ss}m${mss}`;
};

const randomizer = (base = 10, digits = 1) => {
	if (!(base >= 2 && base <= 36 && Math.trunc(base) === base)) {
		throw new Error(`Invalid 'base': ${base}. Must be an integer in the range 2..36`);
	}
	if (!(digits >= 1 && digits <= 64 && Math.trunc(digits) === digits)) {
		throw new Error(`Invalid 'digits': ${digits}. Must be an integer in the range 1..64`);
	}
	const max = base ** digits;
	return () => {
		const str = Math.floor(Math.random() * max).toString(base);
		return padZero(str, digits);
	};
};

const base36Random5 = randomizer(36, 5);

const timeId = (time = Date.now()) => {
	/**
	 * Generates a 24 bytes long unique id based on a given time
	 * - Because Date.now() is not readable and Math.random() is not useful information
	 * - Lexicographical order matches chronological order
	 * - Uses UTC time
	 * - Only contains alphanumeric characters
	 * e.g: `20200311t203251m955cv80l`
	 */
	return `${timestamp(time)}${base36Random5()}`;
};

module.exports = { randomizer, timeId };
