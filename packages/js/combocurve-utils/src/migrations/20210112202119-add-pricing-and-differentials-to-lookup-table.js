// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate, createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const COLLECTION_NAME = 'lookup-tables';
const PRICING = 'pricing';
const DIFFERENTIALS = 'differentials';
const PRICING_DIFFERENTIALS = 'pricing_differentials';

const extractAssumptionIds = (field) => {
	return field
		.map(({ pricing_differentials }) => pricing_differentials)
		.filter((id) => id !== null && id !== undefined);
};

const getMappedRules = (rules, mapping) => {
	return rules.map((rule) => {
		const { pricing_differentials } = rule;
		let pricing;
		let differentials;

		if (pricing_differentials) {
			pricing = mapping.pricing[pricing_differentials] || null;
			differentials = mapping.differentials[pricing_differentials] || null;
		}
		return { ...rule, ...(pricing && { pricing }), ...(differentials && { differentials }) };
	});
};

const buildUpdates = async (batch, db) => {
	const assCollection = db.collection('assumptions');

	const assIds = batch.reduce((cum, { rules }) => {
		const values = extractAssumptionIds(rules);
		return [...cum, ...values];
	}, []);

	const assumptions = await assCollection
		.find({ originalId: { $in: assIds } }, { assumptionKey: 1, originalId: 1 })
		.toArray();

	const mapping = assumptions.reduce(
		(cum, { _id, originalId, assumptionKey }) => {
			const { [assumptionKey]: idMapping } = cum;
			return { ...cum, [assumptionKey]: { ...idMapping, [originalId]: _id } };
		},
		{ pricing: {}, differentials: {} }
	);

	return batch.map(({ _id, rules, configuration }) => {
		const mappedRules = getMappedRules(rules, mapping);
		const $set = { rules: mappedRules };

		const { selectedAssumptions } = configuration || {};
		if (selectedAssumptions && selectedAssumptions.includes(PRICING_DIFFERENTIALS)) {
			$set['configuration.selectedAssumptions'] = selectedAssumptions
				.filter((a) => a !== PRICING_DIFFERENTIALS)
				.concat([PRICING, DIFFERENTIALS]);
		}

		return {
			updateOne: {
				filter: { _id },
				update: {
					$set,
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: COLLECTION_NAME,
	selection: { rules: 1, 'configuration.selectedAssumptions': 1 },
	query: {
		$or: [
			{ 'rules.pricing_differentials': { $exists: true } },
			{ 'configuration.selectedAssumptions': PRICING_DIFFERENTIALS },
		],
	},
	buildUpdates,
});

const batchUpdateDown = createBatchUpdate({
	collection: COLLECTION_NAME,
	query: {},
	update: {
		$unset: {
			'rules.$[].pricing': '',
			'rules.$[].differentials': '',
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
