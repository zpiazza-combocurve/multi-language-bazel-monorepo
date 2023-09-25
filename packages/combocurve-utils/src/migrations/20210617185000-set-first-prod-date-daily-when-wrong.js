// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdateFromAggregation } = require('../services/helpers/migrations/batch-updater-v2');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { convertIdxToDate } = require('../services/helpers/dates');

const pipeline = [
	{ $match: { has_daily: true } },
	{ $project: { _id: 1, first_prod_date_daily_calc: 1 } },
	{
		$lookup: {
			from: 'daily-productions',
			let: { well: '$_id' },
			pipeline: [
				{ $match: { $expr: { $eq: ['$$well', '$well'] } } },
				{ $project: { startIndex: 1, index: 1 } },
				{ $sort: { startIndex: 1 } },
				{ $limit: 1 },
			],
			as: 'dailyProduction',
		},
	},
];

const getUpdate = (doc) => {
	const { _id, first_prod_date_daily_calc, dailyProduction } = doc;

	let index;

	if (dailyProduction && dailyProduction.length && dailyProduction[0] && dailyProduction[0].index) {
		index = dailyProduction[0].index.find((idx) => idx !== null);
	}

	const correctDate = index && convertIdxToDate(index);

	if (first_prod_date_daily_calc === correctDate) {
		return null;
	}

	return {
		updateOne: {
			filter: { _id },
			update: { $set: { first_prod_date_daily_calc: correctDate } },
		},
	};
};

const batchUpdateUp = createBatchUpdateFromAggregation({
	collection: 'wells',
	pipeline,
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)).filter((upd) => upd),
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
