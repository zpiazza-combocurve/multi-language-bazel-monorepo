import { isValid, parse } from 'date-fns';

import { BOOLEAN, DATE, FIXED_DATE, FIXED_NUMBER, NUMBER, PERCENT } from '@/lookup-tables/shared/constants';

// check for mm/dd/yyyy format
export function isValidDate(date) {
	return isValid(parse(date, 'MM/dd/yyyy', new Date()));
}

export function isValidNumber(value) {
	return !Number.isNaN(Number(value));
}

export function isValidPercent(value) {
	return value >= 0 && value <= 100;
}

export function validateRange(low, high) {
	const showWarning = high && low && low > high;
	const showLowWarning = low !== null && (showWarning || !isValidNumber(low));
	const showHighWarning = high !== null && (showWarning || !isValidNumber(high));
	return !(showWarning || showLowWarning || showHighWarning);
}

export function getRangeWarnings(low, high, type) {
	let showLowWarning = false;
	let showHighWarning = false;

	if (type === NUMBER || type === PERCENT) {
		showLowWarning = !!low && !isValidNumber(low);
		showHighWarning = !!high && !isValidNumber(high);
	}

	if (type === NUMBER) {
		const lowNumber = parseFloat(low);
		const highNumber = parseFloat(high);
		const showWarning = high && low && highNumber < lowNumber;
		showLowWarning = showLowWarning || (!!low && showWarning);
		showHighWarning = showHighWarning || (!!high && showWarning);
	} else if (type === PERCENT) {
		const lowNumber = parseFloat(low);
		const highNumber = parseFloat(high);
		const showWarning = high && low && highNumber < lowNumber;
		showLowWarning = showLowWarning || (!!low && (showWarning || !isValidPercent(lowNumber)));
		showHighWarning = showHighWarning || (!!high && (showWarning || !isValidPercent(highNumber)));
	} else if (type === DATE) {
		const lowDate = Date.parse(low);
		const highDate = Date.parse(high);
		const showWarning = high && low && highDate < lowDate;
		showLowWarning = !!low && (showWarning || !isValidDate(low));
		showHighWarning = !!high && (showWarning || !isValidDate(high));
	}
	return [showLowWarning, showHighWarning];
}

function formatNumber(value) {
	return value ? parseFloat(value.toString().replace(/,/g, '')) : null;
}

function formatDateAsUTC(value) {
	const formattedDate = isValidDate(value) ? new Date(value) : NaN;
	if (isNaN(formattedDate)) return null;
	formattedDate.setUTCFullYear(formattedDate.getFullYear());
	formattedDate.setUTCMonth(formattedDate.getMonth());
	formattedDate.setUTCDate(formattedDate.getDate());
	formattedDate.setUTCHours(0, 0, 0, 0);
	return value ? formattedDate : null;
}

export function getFormattedValue(low, high, type) {
	if (type === DATE) {
		return [formatDateAsUTC(low), formatDateAsUTC(high)];
	}
	return [formatNumber(low), formatNumber(high)];
}

export function isRangeType(type) {
	return type === NUMBER || type === DATE || type === PERCENT;
}

export function isBooleanType(type) {
	return type === BOOLEAN || type === DATE; // TODO Ask David why date here
}

export function isFixedDateType(type) {
	return type === FIXED_DATE;
}

export function isFixedNumberType(type) {
	return type === FIXED_NUMBER;
}

const booleanValues = {
	Yes: true,
	No: false,
	'': null,
};

const validBooleanValues = Object.keys(booleanValues);

export function getBooleanWarning(value) {
	return !validBooleanValues.includes(value);
}

export function getBooleanValue(value) {
	return booleanValues[value];
}

export function getFixedDateWarning(value) {
	return value && !isValidDate(value);
}

export function getFixedNumberWarning(value) {
	return value && !isValidNumber(value);
}
