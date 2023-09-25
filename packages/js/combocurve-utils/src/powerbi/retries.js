// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { backOff } = require('exponential-backoff');

class RetriableError extends Error {
	static shouldRetry = (anyError) => !!anyError.retry;

	constructor(message, retry = true) {
		super(message);

		this.name = this.constructor.name; // get the right name even when sub-classed
		this.retry = retry;
	}
}

const BACK_OFF_OPTIONS = {
	// https://github.com/coveooss/exponential-backoff#ibackoffoptions
	numOfAttempts: 3,
	startingDelay: 5 * 1000, // 5s
	retry: (error) => RetriableError.shouldRetry(error),
};

const retry = (call) => backOff(call, BACK_OFF_OPTIONS);

module.exports = { RetriableError, retry };
