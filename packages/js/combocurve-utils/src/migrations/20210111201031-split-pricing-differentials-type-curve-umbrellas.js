// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchInsertFromAggregation } = require('../services/helpers/migrations/batch-inserter');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchDelete } = require('../services/helpers/migrations/batch-deleter');

const COLLECTION_NAME = 'type-curves-umbrellas';
const aggregationPipeline = [
	{
		$match: {
			column: 'assumptions.pricing_differentials',
		},
	},
	{
		$lookup: {
			from: 'assumptions',
			let: { pricingDifferentialsId: '$value' },
			pipeline: [
				{
					$match: {
						assumptionKey: { $in: ['pricing', 'differentials'] },
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
			name: 1,
			typeCurve: 1,
			'assumptions._id': 1,
			'assumptions.assumptionKey': 1,
		},
	},
];
const buildDocs = (batch) =>
	batch.reduce((cum, curr) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _id, assumptions, ...rest } = curr;
		const result = assumptions.map((a) => ({
			...rest,
			column: `assumptions.${a.assumptionKey}`,
			value: a._id,
		}));
		return [...cum, ...result];
	}, []);

const batchUpdateUp = createBatchInsertFromAggregation({
	collection: COLLECTION_NAME,
	pipeline: aggregationPipeline,
	buildDocs,
});

const batchUpdateDown = createBatchDelete({
	query: { column: { $in: ['assumptions.pricing', 'assumptions.differentials'] } },
	collection: COLLECTION_NAME,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
