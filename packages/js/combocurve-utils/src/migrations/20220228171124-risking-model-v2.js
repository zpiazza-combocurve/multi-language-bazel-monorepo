// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultRiskHeader = {
	multiplier: 'Multiplier',
	criteria: {
		label: 'Flat',
		value: 'entire_well_life',
	},
};

const upPhaseRiskingOption = (phase) => {
	return {
		subItems: {
			row_view: {
				headers: defaultRiskHeader,
				rows: [
					{
						multiplier: `$options.risking_model.volume_multiplier.subItems.${phase}`,
						criteria: 'Flat',
					},
				],
			},
		},
	};
};

const upPhaseRiskingEconFunc = (phase) => {
	return {
		rows: [
			{
				multiplier: `$econ_function.risking_model.volume_multiplier.${phase}`,
				entire_well_life: 'Flat',
			},
		],
	};
};

const downPhaseRiskingOption = (phase) => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: [`$options.risking_model.${phase}.subItems.row_view.rows`, 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const downPhaseRiskingEconFunc = (phase) => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: [`$econ_function.risking_model.${phase}.rows`, 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const phases = ['oil', 'gas', 'ngl', 'drip_condensate', 'water'];

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'risking',
		'options.risking_model.volume_multiplier': { $exists: true },
	},
	update: [
		{
			$set: phases.reduce(
				(array, key) => ({
					...array,
					[`options.risking_model.${key}`]: upPhaseRiskingOption(key),
					[`econ_function.risking_model.${key}`]: upPhaseRiskingEconFunc(key),
				}),
				{}
			),
		},
		{
			$unset: ['options.risking_model.volume_multiplier', 'econ_function.risking_model.volume_multiplier'],
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'risking',
		'options.risking_model.oil': { $exists: true },
	},
	update: [
		{
			$set: phases.reduce(
				(array, key) => ({
					...array,
					[`options.risking_model.volume_multiplier.subItems.${key}`]: downPhaseRiskingOption(key),
					[`econ_function.risking_model.volume_multiplier.${key}`]: downPhaseRiskingEconFunc(key),
				}),
				{}
			),
		},
		{
			$unset: [
				...phases.map((phase) => `options.risking_model.${phase}`),
				...phases.map((phase) => `econ_function.risking_model.${phase}`),
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

module.exports = { up, down, uses: ['mongodb'] };
