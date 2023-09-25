// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { RetriableError } = require('./retries');

const RETRY_STATUSES = [500, 502, 503];

class PBIRequestError extends RetriableError {
	constructor({ method, url, status, requestId, response, pbiErrorInfo }) {
		super(`PowerBI API returned status code ${status}`, RETRY_STATUSES.includes(status));

		this.details = {
			method,
			requestId,
			response,
			status,
			url,
			pbiErrorInfo,
		};
	}
}

module.exports = { PBIRequestError };
