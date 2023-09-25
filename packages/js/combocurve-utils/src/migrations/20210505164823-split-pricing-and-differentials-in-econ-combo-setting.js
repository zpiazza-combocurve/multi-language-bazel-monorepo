// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate, createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const COLLECTION_NAME = 'econ-combo-settings';

const buildUpdates = async (batch) => {
	return batch.map(({ _id, combos }) => {
		const updatedCombos = combos.map((combo) => {
			const updatedCombo = { ...combo };
			const { pricing_differentials, pricing, differentials } = updatedCombo.qualifiers;
			if (!pricing) {
				updatedCombo.qualifiers.pricing = pricing_differentials;
			}
			if (!differentials) {
				updatedCombo.qualifiers.differentials = pricing_differentials;
			}
			return updatedCombo;
		});

		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: { combos: updatedCombos },
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	query: {
		'combos.qualifiers.pricing_differentials': { $exists: true },
	},
	buildUpdates,
});

const batchUpdateDown = createBatchUpdate({
	collection: COLLECTION_NAME,
	query: { 'combos.qualifiers.pricing_differentials': { $exists: true } },
	update: {
		$unset: {
			'combos.$[].qualifiers.pricing': '',
			'combos.$[].qualifiers.differentials': '',
		},
	},
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
