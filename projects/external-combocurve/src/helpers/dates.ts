import { isValidDate } from './validation';

const START_OF_TIME = Date.UTC(1900, 0, 1);

const MAX_INDEX = 401767; // 3000-01-01

export const MAX_DATE = new Date(3000, 0, 1);

const daysToMS = (days: number) => days * 24 * 60 * 60 * 1000;

const MSToDays = (ms: number) => ms / (24 * 60 * 60 * 1000);

export const indexToDate = (index: number): Date => new Date(START_OF_TIME + daysToMS(Math.min(index, MAX_INDEX)));

export const dateToIndex = (date: Date): number => Math.round(MSToDays(date.getTime() - START_OF_TIME));

export const getStartIndexDailyDate = (date: Date): number =>
	dateToIndex(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));

export const getStartIndexDaily = (index: number): number => getStartIndexDailyDate(indexToDate(index));

export const getStartIndexMonthlyDate = (date: Date): number =>
	dateToIndex(new Date(Date.UTC(date.getUTCFullYear(), 0, 1)));

export const getStartIndexMonthly = (index: number): number => getStartIndexMonthlyDate(indexToDate(index));

export const getNextMonthStartIndex = (startIndex: number): number => {
	const startDate = indexToDate(startIndex);
	const nextMonthStartDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1));

	return dateToIndex(nextMonthStartDate);
};

/**
 * Converts a date string in the format YYYY-MM-DD to a UTC date object
 * @param {string} date - the date to convert
 * @returns {Date} a date object in UTC time zone
 */
export const convertDateStringToUTC = (date: string): Date => {
	return new Date(date + 'T00:00:00.000Z');
};

/**
 * Converts a UTC date object into a date object with the time zone offset adjusted for the machine's time zone
 * @param {Date} date - the date to convert
 * @returns {Date} a date object with the time zone offset adjusted for the machine's time zone
 */
export const adjustTimeZoneOffset = (date: Date): Date => {
	const offset = date.getTimezoneOffset() * 60 * 1000;
	date.setTime(date.getTime() + offset);
	return date;
};

/**
 * Converts a date string in the format YYYY-MM-DD to a date object with the time zone offset adjusted for the machine's time zone.
 * If the date string is invalid, returns a new date object.
 * @param {string} date - the date to convert
 * @returns {Date} a date object with the time zone offset adjusted for the machine's time zone
 */
export const getDateWithOffset = (date: string): Date => {
	if (!isValidDate(date)) {
		return date;
	}
	const utcDate = convertDateStringToUTC(date);
	return adjustTimeZoneOffset(utcDate);
};

/**
 * Gets the number of months between two dates
 * @param startDate
 * @param endDate
 * @returns {number} the number of months between the two dates
 */
export const getMonthsApart = (startDate: Date, endDate: Date): number => {
	const monthsApart = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12;
	return monthsApart + endDate.getUTCMonth() - startDate.getUTCMonth();
};

/**
 * Returns a date string in the format YYYY-MM-DD, returns the previous day in the same format
 * with the time zone offset adjusted for the machine's time zone.
 * @param date
 * @returns {string} the day as a date before the dates entered in the format YYYY-MM-DD
 */
export function getPreviousDayWithOffset(date: string): string {
	const currentDay = getDateWithOffset(date);
	currentDay.setDate(currentDay.getDate() - 1);
	const year = currentDay.getFullYear();
	const month = (currentDay.getMonth() + 1).toString().padStart(2, '0');
	const day = currentDay.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}
