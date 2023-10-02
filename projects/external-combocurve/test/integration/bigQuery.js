const { BigQuery } = require('@google-cloud/bigquery');

/**
 * @param {string} projectId
 * @returns {BigQuery}
 */
const initBigQueryClient = () => new BigQuery();

module.exports = {
	initBigQueryClient,
};
