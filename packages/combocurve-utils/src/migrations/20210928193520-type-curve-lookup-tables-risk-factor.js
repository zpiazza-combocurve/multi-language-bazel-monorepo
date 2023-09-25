// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const buildUpdatesUp = async (batch) => {
	return batch
		.map(({ _id, rules }) => {
			if (!(rules && rules.length)) {
				return false;
			}

			const newRules = rules.map((rule) => {
				const newRule = { ...rule };

				if (newRule.riskFactor) {
					newRule.riskFactorWater = newRule.riskFactor;
					newRule.riskFactorGas = newRule.riskFactor;
					newRule.riskFactorOil = newRule.riskFactor;
					delete newRule.riskFactor;
				}

				return newRule;
			});

			return {
				updateOne: {
					filter: { _id },
					update: {
						$set: {
							rules: newRules,
						},
					},
				},
			};
		})
		.filter(Boolean);
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'forecast-lookup-tables',
	query: {},
	buildUpdates: buildUpdatesUp,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
