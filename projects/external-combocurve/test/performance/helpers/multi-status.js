const logMultiResponse = (response) => {
	const { body } = response;
	const { failedCount, successCount } = body;
	console.log({ failedCount, successCount });
	if (failedCount) {
		const errorResults = body.results.filter((result) => result.errors);
		console.log(errorResults[0].errors);
	}
};

const logMultiResponseAfterResponse = (requestParams, response, userContext, events, done) => {
	logMultiResponse(response);
	done();
};

module.exports = {
	logMultiResponse,
	logMultiResponseAfterResponse,
};
