// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdateFromAggregation } = require('../services/helpers/migrations/batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { convertIdxToDate } = require('../services/helpers/dates');

const pipeline = [
	{ $match: { has_monthly: true, first_prod_date_monthly_calc: null } },
	{ $project: { _id: 1 } },
	{
		$lookup: {
			from: 'monthly-productions',
			let: { well: '$_id' },
			pipeline: [
				{ $match: { $expr: { $eq: ['$$well', '$well'] } } },
				{ $project: { startIndex: 1, index: 1 } },
				{ $sort: { startIndex: 1 } },
				{ $limit: 1 },
			],
			as: 'monthlyProduction',
		},
	},
];

const getUpdate = (doc) => {
	const { _id, monthlyProduction } = doc;

	let index;

	if (monthlyProduction && monthlyProduction.length && monthlyProduction[0] && monthlyProduction[0].index) {
		index = monthlyProduction[0].index.find((idx) => idx !== null);
	}

	return {
		updateOne: {
			filter: { _id },
			update: { $set: { first_prod_date_monthly_calc: index && convertIdxToDate(index) } },
		},
	};
};

const batchUpdateUp = createBatchUpdateFromAggregation({
	collection: 'wells',
	pipeline,
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)),
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
