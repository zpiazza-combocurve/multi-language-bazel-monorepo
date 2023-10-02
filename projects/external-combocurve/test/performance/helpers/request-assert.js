const { isSuccessStatusCode } = require('./status-code');

const requestStoreNoSuccessAfterResponse = (requestParams, response, userContext, events, done) => {
	const { body, statusCode } = response;
	const { failedCount } = body;
	if (!isSuccessStatusCode(statusCode) || (failedCount && failedCount > 0)) {
		const { vars } = userContext;
		const { requestNotFullySuccess = 0 } = vars;
		Object.assign(vars, { requestNotFullySuccess: requestNotFullySuccess + 1 });
	}

	done();
};

const requestAssertSuccessAfterResponse = (userContext, events, done) => {
	const { vars } = userContext;
	const { requestNotFullySuccess = 0 } = vars;

	if (requestNotFullySuccess > 0) {
		throw new Error(`There were ${requestNotFullySuccess} requests with errors.`);
	}

	done();
};

module.exports = {
	requestStoreNoSuccessAfterResponse,
	requestAssertSuccessAfterResponse,
};
