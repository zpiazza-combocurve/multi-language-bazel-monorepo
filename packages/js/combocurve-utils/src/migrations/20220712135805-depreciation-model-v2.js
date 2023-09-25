// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const depreciationHeadersV1 = {
	year: 'Year',
	factor: 'Factor',
	cumulative: 'Cumulative',
};

const depreciationHeadersV2 = {
	year: 'Year',
	tan_factor: 'Tan Factor',
	tan_cumulative: 'Tan Cumulative',
	intan_factor: 'Intan Factor',
	intan_cumulative: 'Intan Cumulative',
};

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'depreciation',
		'options.depreciation_model.prebuilt': { $exists: false },
	},
	update: [
		{
			$set: {
				'options.depreciation_model.prebuilt': {
					label: 'Custom',
					value: 'custom',
				},

				'options.depreciation_model.depreciation_or_depletion': {
					label: 'Depreciation',
					value: 'depreciation',
				},

				'options.depreciation_model.tangible_depletion_model': {
					label: 'Unit Of Production (Major Phase)',
					value: 'unit_of_production_major',
				},

				'options.depreciation_model.intangible_depletion_model': {
					label: 'Unit Of Production (Major Phase)',
					value: 'unit_of_production_major',
				},

				'options.depreciation_model.depreciation.subItems.row_view.headers': depreciationHeadersV2,

				'options.depreciation_model.depreciation.subItems.row_view.rows': {
					$map: {
						input: '$econ_function.depreciation_model.rows',
						as: 'row',
						in: {
							year: '$$row.year',
							tan_factor: '$$row.factor',
							tan_cumulative: '$$row.cumulative',
							intan_factor: { $cond: [{ $eq: ['$$row.year', 1] }, 100, 0] },
							intan_cumulative: 100,
						},
					},
				},

				'econ_function.depreciation_model.prebuilt': 'custom',
				'econ_function.depreciation_model.depreciation_or_depletion': 'depletion',
				'econ_function.depreciation_model.tangible_depletion_model': 'unit_of_production_major',
				'econ_function.depreciation_model.intangible_depletion_model': 'unit_of_production_major',

				'econ_function.depreciation_model.depreciation.rows': {
					$map: {
						input: '$econ_function.depreciation_model.rows',
						as: 'row',
						in: {
							year: '$$row.year',
							tan_factor: '$$row.factor',
							tan_cumulative: '$$row.cumulative',
							intan_factor: { $cond: [{ $eq: ['$$row.year', 1] }, 100, 0] },
							intan_cumulative: 100,
						},
					},
				},
			},
		},
		{
			$unset: ['options.depreciation_model.row_view', 'econ_function.depreciation_model.rows'],
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'depreciation',
		'options.depreciation_model.prebuilt': { $exists: true },
	},
	update: [
		{
			$set: {
				'options.depreciation_model.row_view.headers': depreciationHeadersV1,
				'options.depreciation_model.row_view.rows': {
					$map: {
						input: '$options.depreciation_model.depreciation.subItems.row_view.rows',
						as: 'row',
						in: {
							year: '$$row.year',
							factor: '$$row.tan_factor',
							cumulative: '$$row.tan_cumulative',
						},
					},
				},
				'econ_function.depreciation_model.rows': {
					$map: {
						input: '$econ_function.depreciation_model.depreciation.rows',
						as: 'row',
						in: {
							year: '$$row.year',
							factor: '$$row.tan_factor',
							cumulative: '$$row.tan_cumulative',
						},
					},
				},
			},
		},
		{
			$unset: [
				'options.depreciation_model.prebuilt',
				'options.depreciation_model.depreciation_or_depletion',
				'options.depreciation_model.tangible_depletion_model',
				'options.depreciation_model.intangible_depletion_model',
				'options.depreciation_model.depreciation',
				'econ_function.depreciation_model.prebuilt',
				'econ_function.depreciation_model.depreciation_or_depletion',
				'econ_function.depreciation_model.tangible_depletion_model',
				'econ_function.depreciation_model.intangible_depletion_model',
				'econ_function.depreciation_model.depreciation',
			],
		},
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, depreciationHeadersV1, depreciationHeadersV2, uses: ['mongodb'] };
