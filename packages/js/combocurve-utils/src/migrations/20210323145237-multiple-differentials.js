// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultDiffOptions = {
	oil: {
		subItems: {
			row_view: {
				headers: {
					differential: {
						label: '$/BBL',
						value: 'dollar_per_bbl',
					},
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						differential: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	gas: {
		subItems: {
			row_view: {
				headers: {
					differential: {
						label: '$/MMBTU',
						value: 'dollar_per_mmbtu',
					},
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						differential: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	ngl: {
		subItems: {
			row_view: {
				headers: {
					differential: {
						label: '$/BBL',
						value: 'dollar_per_bbl',
					},
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						differential: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
	drip_condensate: {
		subItems: {
			row_view: {
				headers: {
					differential: {
						label: '$/BBL',
						value: 'dollar_per_bbl',
					},
					criteria: {
						label: 'Flat',
						value: 'entire_well_life',
					},
				},
				rows: [
					{
						differential: 0,
						criteria: 'Flat',
					},
				],
			},
		},
	},
};

const defaultDiffEconFunction = {
	oil: {
		rows: [
			{
				dollar_per_bbl: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	gas: {
		rows: [
			{
				dollar_per_mmbtu: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	ngl: {
		rows: [
			{
				dollar_per_bbl: 0,
				entire_well_life: 'Flat',
			},
		],
	},
	drip_condensate: {
		rows: [
			{
				dollar_per_bbl: 0,
				entire_well_life: 'Flat',
			},
		],
	},
};

async function up({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'differentials', 'options.differentials.differentials_1': { $exists: false } },
		update: [
			{
				$set: {
					options_differentials_migration: '$options.differentials',
					econ_function_migration: '$econ_function.differentials',
				},
			},
			{
				$unset: ['options.differentials', 'econ_function.differentials'],
			},
			{
				$set: {
					'options.differentials.differentials_1.subItems': '$options_differentials_migration',
					'econ_function.differentials.differentials_1': '$econ_function_migration',
				},
			},
			{
				$unset: ['options_differentials_migration', 'econ_function_migration'],
			},
			{
				$set: {
					'options.differentials.differentials_2.subItems': { $literal: defaultDiffOptions },
					'econ_function.differentials.differentials_2': { $literal: defaultDiffEconFunction },
				},
			},
		],
	});

	await batchUpdate({ db });
}

async function down({ db }) {
	const batchUpdate = createBatchUpdate({
		collection: 'assumptions',
		query: { assumptionKey: 'differentials', 'options.differentials.differentials_1': { $exists: true } },
		update: [
			{
				$unset: ['options.differentials.differentials_2', 'econ_function.differentials.differentials_2'],
			},
			{
				$set: {
					options_differentials_migration: '$options.differentials.differentials_1.subItems',
					econ_function_migration: '$econ_function.differentials.differentials_1',
				},
			},
			{
				$unset: ['options.differentials', 'econ_function.differentials'],
			},
			{
				$set: {
					'options.differentials': '$options_differentials_migration',
					'econ_function.differentials': '$econ_function_migration',
				},
			},
			{
				$unset: ['options_differentials_migration', 'econ_function_migration'],
			},
		],
	});

	await batchUpdate({ db });
}

module.exports = { up, down, defaultDiffOptions, defaultDiffEconFunction, uses: ['mongodb'] };
