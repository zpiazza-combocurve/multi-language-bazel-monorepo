// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const batchUpdateUpDaily = createBatchUpdate({
	collection: 'daily-productions',
	query: { operational_tag: 'NULL' },
	update: { $set: { 'operational_tag.$[element]': null } },
	options: { arrayFilters: [{ element: 'NULL' }] },
});

const batchUpdateUpMonthly = createBatchUpdate({
	collection: 'monthly-productions',
	query: { operational_tag: 'NULL' },
	update: { $set: { 'operational_tag.$[element]': null } },
	options: { arrayFilters: [{ element: 'NULL' }] },
});

async function up({ db }) {
	await batchUpdateUpDaily({ db });
	await batchUpdateUpMonthly({ db });
}

module.exports = { up, uses: ['mongodb'] };
