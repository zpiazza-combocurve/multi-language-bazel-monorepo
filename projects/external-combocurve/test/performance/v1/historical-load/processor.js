const { logMultiResponseAfterResponse } = require('../../helpers/multi-status');
const { injectDailyProductions } = require('../daily-productions/processor');
const { injectMonthlyProductions } = require('../monthly-productions/processor');
const { injectWells } = require('../wells/processor');
const {
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
} = require('../../helpers/request-assert');

module.exports = {
	injectDailyProductions,
	injectMonthlyProductions,
	injectWells,
	logMultiResponseAfterResponse,
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
};
