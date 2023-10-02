const { createMonthlyProductionsPayload } = require('../../../helpers/data-generator');
const { injectWells } = require('../wells/processor');
const { logMultiResponseAfterResponse } = require('../../helpers/multi-status');
const {
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
} = require('../../helpers/request-assert');

const injectMonthlyProductions = (userContext, events, done) => {
	const { vars } = userContext;
	const { createdWells: wells } = vars;

	const monthlyProductions = [];
	let wellsMonthlyImportFinish = vars.wellsMonthlyImportFinish || 0;

	while (wellsMonthlyImportFinish < wells.length && monthlyProductions.length < vars.monthlyRecordCount) {
		const wellsCurrentMonthlyImported = vars.wellsCurrentMonthlyImported || 0;
		let wellsMonthlyPendingToImport = vars.monthlyRecordPerWell - wellsCurrentMonthlyImported;

		const { chosenID, dataSource } = wells[wellsMonthlyImportFinish];

		const recordCount = Math.min(wellsMonthlyPendingToImport, vars.monthlyRecordCount - monthlyProductions.length);

		monthlyProductions.push(
			...createMonthlyProductionsPayload(recordCount, { chosenID, dataSource }, wellsCurrentMonthlyImported),
		);
		wellsMonthlyPendingToImport -= recordCount;
		if (wellsMonthlyPendingToImport === 0) {
			wellsMonthlyImportFinish += 1;
			Object.assign(vars, { wellsMonthlyImportFinish });
			Object.assign(vars, { wellsCurrentMonthlyImported: 0 });
		} else {
			Object.assign(vars, { wellsCurrentMonthlyImported: wellsCurrentMonthlyImported + recordCount });
		}
	}

	Object.assign(vars, { monthlyProductions });
	done();
};

module.exports = {
	injectMonthlyProductions,
	injectWells,
	logMultiResponseAfterResponse,
	requestAssertSuccessAfterResponse,
	requestStoreNoSuccessAfterResponse,
};
