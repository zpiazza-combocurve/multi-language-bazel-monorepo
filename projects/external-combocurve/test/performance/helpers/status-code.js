/**
 *
 * @param {number} statusCode
 * @returns {boolean}
 */
const isSuccessStatusCode = (statusCode) => statusCode >= 200 && statusCode < 300;

module.exports = {
	isSuccessStatusCode,
};
