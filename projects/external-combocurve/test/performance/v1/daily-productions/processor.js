const { createDailyProductionsPayload } = require('../../../helpers/data-generator');
const { injectWells } = require('../wells/processor');
const { logMultiResponseAfterResponse } = require('../../helpers/multi-status');
const {
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
} = require('../../helpers/request-assert');

const injectDailyProductions = (userContext, events, done) => {
	const { vars } = userContext;
	const { createdWells: wells } = vars;

	const dailyProductions = [];
	let wellsDailyImportFinish = vars.wellsDailyImportFinish || 0;

	while (wellsDailyImportFinish < wells.length && dailyProductions.length < vars.dailyRecordCount) {
		const wellsCurrentDailyImported = vars.wellsCurrentDailyImported || 0;
		let wellsDailyPendingToImport = vars.dailyRecordPerWell - wellsCurrentDailyImported;

		const { chosenID, dataSource } = wells[wellsDailyImportFinish];

		const recordCount = Math.min(wellsDailyPendingToImport, vars.dailyRecordCount - dailyProductions.length);

		dailyProductions.push(
			...createDailyProductionsPayload(recordCount, { chosenID, dataSource }, wellsCurrentDailyImported),
		);
		wellsDailyPendingToImport -= recordCount;
		if (wellsDailyPendingToImport === 0) {
			wellsDailyImportFinish += 1;
			Object.assign(vars, { wellsDailyImportFinish });
			Object.assign(vars, { wellsCurrentDailyImported: 0 });
		} else {
			Object.assign(vars, { wellsCurrentDailyImported: wellsCurrentDailyImported + recordCount });
		}
	}

	Object.assign(vars, { dailyProductions });
	done();
};

module.exports = {
	injectDailyProductions,
	injectWells,
	logMultiResponseAfterResponse,
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
};
