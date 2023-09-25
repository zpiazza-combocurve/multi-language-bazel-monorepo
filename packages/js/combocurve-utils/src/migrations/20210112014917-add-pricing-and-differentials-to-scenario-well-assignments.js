// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate, createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const COLLECTION_NAME = 'scenario-well-assignments';

const extractAssumptionIds = (field) => {
	return Object.values(field)
		.filter((q) => q)
		.map(({ model }) => model)
		.filter((id) => id);
};

const buildQualifiers = (field, mapping) => {
	return Object.entries(field).reduce(
		(cum, [qualifier, value]) => {
			const { model, lookup } = value || {};
			const { pricing, differentials } = cum;

			pricing[qualifier] = { model: mapping.pricing[model] || null, ...(lookup && { lookup }) };
			differentials[qualifier] = {
				model: mapping.differentials[model] || null,
				...(lookup && { lookup }),
			};
			return cum;
		},
		{ pricing: {}, differentials: {} }
	);
};

const buildUpdates = async (batch, db) => {
	const assumptionsCollection = db.collection('assumptions');

	const assumptionIds = batch.reduce((cum, { pricing_differentials }) => {
		const ids = extractAssumptionIds(pricing_differentials);
		return [...cum, ...ids];
	}, []);

	const assumptions = await assumptionsCollection
		.find({ originalId: { $in: assumptionIds } }, { assumptionKey: 1, originalId: 1 })
		.toArray();

	const mapping = assumptions.reduce(
		(cum, { _id, originalId, assumptionKey }) => {
			const { [assumptionKey]: idMapping } = cum;
			return { ...cum, [assumptionKey]: { ...idMapping, [originalId]: _id } };
		},
		{ pricing: {}, differentials: {} }
	);

	return batch.map(({ _id, pricing_differentials }) => {
		const result = buildQualifiers(pricing_differentials, mapping);
		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: {
						pricing: result.pricing,
						differentials: result.differentials,
					},
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	selection: { pricing_differentials: 1 },
	query: { pricing_differentials: { $exists: true } },
	buildUpdates,
});

const batchUpdateDown = createBatchUpdate({
	collection: COLLECTION_NAME,
	query: {},
	update: {
		$unset: {
			pricing: '',
			differentials: '',
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
