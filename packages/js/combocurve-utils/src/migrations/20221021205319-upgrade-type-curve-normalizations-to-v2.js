// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const normalizationsUp = createBatchUpdate({
	collection: 'type-curve-normalizations',
	query: { steps: { $gte: [] } },
	update: [
		{
			$set: {
				temp: {
					eur: { $arrayElemAt: ['$steps', 0] },
					qPeak: null,
					normalizationType: 'eur',
				},
			},
		},
		{
			$unset: 'steps',
		},
		{
			$set: { steps: '$temp' },
		},
		{
			$unset: 'temp',
		},
	],
});

const normalizationDown = createBatchUpdate({
	collection: 'type-curve-normalizations',
	query: { 'steps.eur': { $exists: true } },
	update: [
		{
			$set: { temp: ['$steps.eur'] },
		},
		{
			$unset: 'steps',
		},
		{
			$set: { steps: '$temp' },
		},
		{
			$unset: 'temp',
		},
	],
});

const wellsNormalizationUp = createBatchUpdate({
	collection: 'type-curve-normalization-wells',
	query: { multipliers: { $gte: [] } },
	update: [
		{
			$set: {
				temp: { eur: { $arrayElemAt: ['$multipliers', 0] }, qPeak: null },
				nominalMultipliers: { eur: { $arrayElemAt: ['$multipliers', 0] }, qPeak: null },
			},
		},
		{
			$unset: 'multipliers',
		},
		{
			$set: { multipliers: '$temp' },
		},
		{
			$unset: 'temp',
		},
	],
});

const wellsNormalizationDown = createBatchUpdate({
	collection: 'type-curve-normalization-wells',
	query: { multipliers: { $type: 'object' } },
	update: [
		{
			$set: { multipliers: ['$multipliers.eur'] },
		},
		{
			$unset: 'nominalMultipliers',
		},
	],
});

async function up({ db }) {
	await normalizationsUp({ db });
	await wellsNormalizationUp({ db });
}

async function down({ db }) {
	await normalizationDown({ db });
	await wellsNormalizationDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
