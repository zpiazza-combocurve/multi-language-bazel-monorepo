// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { defaultDiffOptions, defaultDiffEconFunction } = require('./20210323145237-multiple-differentials');

async function up({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'differentials', 'options.differentials.differentials_3': { $exists: false } },
		update: [
			{
				$set: {
					'options.differentials.differentials_3.subItems': { $literal: defaultDiffOptions },
					'econ_function.differentials.differentials_3': { $literal: defaultDiffEconFunction },
				},
			},
		],
	});

	await batchUpdate({ db });
}

async function down({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'differentials', 'options.differentials.differentials_3': { $exists: true } },
		update: [
			{
				$unset: ['options.differentials.differentials_3', 'econ_function.differentials.differentials_3'],
			},
		],
	});

	await batchUpdate({ db });
}

module.exports = { up, down, defaultDiffOptions, defaultDiffEconFunction, uses: ['mongodb'] };
