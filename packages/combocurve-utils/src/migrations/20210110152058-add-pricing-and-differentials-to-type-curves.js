const {
	createBatchUpdate,
	createBatchUpdateFromAggregation,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('../services/helpers/migrations/batch-updater-v2');

const COLLECTION_NAME = 'type-curves';
const PRICING_KEY = 'pricing';
const DIFFERENTIALS_KEY = 'differentials';
const PRICING_PATH = `assumptions.${PRICING_KEY}`;
const DIFFERENTIALS_PATH = `assumptions.${DIFFERENTIALS_KEY}`;

const aggregationPipeline = [
	{
		$lookup: {
			from: 'assumptions',
			let: { pricingDifferentialsId: '$assumptions.pricing_differentials' },
			pipeline: [
				{
					$match: {
						assumptionKey: { $in: [PRICING_KEY, DIFFERENTIALS_KEY] },
						$expr: {
							$eq: ['$$pricingDifferentialsId', '$originalId'],
						},
					},
				},
			],
			as: 'assumptions',
		},
	},
	{
		$project: {
			'assumptions._id': 1,
			'assumptions.assumptionKey': 1,
		},
	},
];
const getUpdate = (doc) => {
	const { assumptions } = doc;
	const [pricing] = assumptions.filter((a) => a.assumptionKey === PRICING_KEY);
	const [differentials] = assumptions.filter((a) => a.assumptionKey === DIFFERENTIALS_KEY);

	return {
		updateOne: {
			filter: { _id: doc._id },
			update: {
				$set: {
					[PRICING_PATH]: pricing ? pricing._id : null,
					[DIFFERENTIALS_PATH]: differentials ? differentials._id : null,
				},
			},
		},
	};
};

const batchUpdateUp = createBatchUpdateFromAggregation({
	collection: COLLECTION_NAME,
	pipeline: aggregationPipeline,
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)),
});

const batchUpdateDown = createBatchUpdate({
	collection: COLLECTION_NAME,
	query: {},
	update: {
		$unset: {
			[PRICING_PATH]: '',
			[DIFFERENTIALS_PATH]: '',
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
