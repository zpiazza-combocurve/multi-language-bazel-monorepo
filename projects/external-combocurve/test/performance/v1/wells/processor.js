const { createWellsPayload } = require('../../../helpers/data-generator');
const { logMultiResponseAfterResponse } = require('../../helpers/multi-status');
const {
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
} = require('../../helpers/request-assert');

const injectWells = (userContext, events, done) => {
	const { vars } = userContext;
	const createdWells = vars.createdWells || [];
	const wells = createWellsPayload(vars.wellsRecordCount);
	createdWells.push(...wells.map(({ chosenID, dataSource }) => ({ chosenID, dataSource })));
	Object.assign(vars, { wells });
	Object.assign(vars, { createdWells });
	done();
};

module.exports = {
	injectWells,
	logMultiResponseAfterResponse,
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
};
