// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchDelete } = require('../services/helpers/migrations/batch-deleter');

const COLLECTION_NAME = 'assumptions';
const PRICING_DIFFERENTIALS_KEY = 'pricing_differentials';
const PRICING_KEY = 'pricing';
const DIFFERENTIALS_KEY = 'differentials';
const TEMPORARY_ASSUMPTION_ORIGINAL_ID_INDEX = 'originalId';

function buildPricingDoc(doc) {
	const { _id, options, econ_function, ...rest } = doc;

	return {
		updateOne: {
			filter: { assumptionKey: PRICING_KEY, originalId: _id },
			update: {
				$set: {
					...rest,
					originalId: _id,
					assumptionName: 'Pricing',
					assumptionKey: PRICING_KEY,
					options: { price_model: options.price_model, breakeven: options.breakeven },
					econ_function: { price_model: econ_function.price_model, breakeven: econ_function.breakeven },
					copiedFrom: null,
				},
			},
			upsert: true,
		},
	};
}

function buildDifferentialDoc(doc) {
	const { _id, options, econ_function, ...rest } = doc;

	return {
		updateOne: {
			filter: { assumptionKey: DIFFERENTIALS_KEY, originalId: _id },
			update: {
				$set: {
					...rest,
					originalId: _id,
					assumptionName: 'Differentials',
					assumptionKey: DIFFERENTIALS_KEY,
					options: { differentials: options.differentials },
					econ_function: { differentials: econ_function.differentials },
					copiedFrom: null,
				},
			},
			upsert: true,
		},
	};
}

const getDocs = (batch, buildDoc) => {
	return batch.map((doc) => {
		return buildDoc(doc);
	});
};

const pricingBatchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	query: { assumptionKey: PRICING_DIFFERENTIALS_KEY },
	buildUpdates: (batch) => getDocs(batch, buildPricingDoc),
});

const differentialsBatchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	query: { assumptionKey: PRICING_DIFFERENTIALS_KEY },
	buildUpdates: (batch) => getDocs(batch, buildDifferentialDoc),
});

const pricingBatchUpdateDown = createBatchDelete({
	query: { assumptionKey: PRICING_KEY },
	collection: COLLECTION_NAME,
});

const differentialsBatchUpdateDown = createBatchDelete({
	query: { assumptionKey: DIFFERENTIALS_KEY },
	collection: COLLECTION_NAME,
});

async function up({ db }) {
	const assumption = db.collection(COLLECTION_NAME);
	await assumption.createIndex({ originalId: 1 }, { name: TEMPORARY_ASSUMPTION_ORIGINAL_ID_INDEX });

	await pricingBatchUpdateUp({ db });
	await differentialsBatchUpdateUp({ db });
}

async function down({ db }) {
	await pricingBatchUpdateDown({ db });
	await differentialsBatchUpdateDown({ db });

	const assumption = db.collection(COLLECTION_NAME);
	await assumption.dropIndex(TEMPORARY_ASSUMPTION_ORIGINAL_ID_INDEX);
}

module.exports = { up, down, uses: ['mongodb'] };
