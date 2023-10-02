/* eslint-disable import/no-commonjs */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BigQueryDate } = require('@google-cloud/bigquery');

const START_OF_TIME = Date.UTC(1900, 0, 1);

/**
 * @param {number} days
 * @returns {number}
 */
const daysToMS = (days) => days * 24 * 60 * 60 * 1000;

/**
 * @param {number} index
 * @returns {Date}
 */
const indexToDate = (index) => new Date(START_OF_TIME + daysToMS(index));

/**
 * @param {Date} date
 * @returns {string}
 */
const toDateString = (date) => date.toISOString().split('T')[0];

/**
 *
 * @param {Date} date
 * @returns {BigQueryDate}
 */
const toBigQueryDate = (date) => new BigQueryDate(toDateString(date));

/**
 * @param {Date | string} baseDate
 * @param {number} index
 * @returns {Date}
 */
const generateDate = (baseDate, index) => {
	const date = new Date(baseDate);
	date.setUTCDate(date.getUTCDate() + index);
	return date;
};

/**
 * @param {Date | string} baseDate
 * @param {number} index
 * @returns {BigQueryDate}
 */
const generateBigQueryDate = (baseDate, index) => {
	const date = generateDate(baseDate, index);
	return toBigQueryDate(date);
};

module.exports = {
	generateBigQueryDate,
	generateDate,
	indexToDate,
	toBigQueryDate,
};
