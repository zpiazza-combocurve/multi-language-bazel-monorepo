// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { asyncSeries } = require('../services/helpers/utilities');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const WELL_DEFAULTS = {
	dataPool: 'internal',
	dataSource: 'other',
	project: null,
	lateral_length: null,
	perf_lateral_length: null,
	primary_product: null,
	true_vertical_depth: null,
	copied: false,
	first_fluid_volume: null,
	first_prop_weight: null,
	measured_depth: null,
	surfaceLatitude: null,
	surfaceLongitude: null,
	first_proppant_per_fluid: null,
	refrac_proppant_per_perforated_interval: null,
	refrac_fluid_per_perforated_interval: null,
	refrac_proppant_per_fluid: null,
	total_fluid_volume: null,
	total_prop_weight: null,
	total_proppant_per_fluid: null,
	first_proppant_per_perforated_interval: null,
	first_fluid_per_perforated_interval: null,
	total_fluid_per_perforated_interval: null,
	total_proppant_per_perforated_interval: null,
	first_prod_date_daily_calc: null,
	first_prod_date_monthly_calc: null,
};

const batchUpdateField = (field, defaultValue) =>
	createBatchUpdate({
		collection: 'wells',
		query: { [field]: { $exists: false } },
		update: { $set: { [field]: defaultValue } },
	});

async function up({ db }) {
	await asyncSeries(Object.entries(WELL_DEFAULTS), ([field, defaultValue]) =>
		batchUpdateField(field, defaultValue)({ db })
	);
}

module.exports = { up, uses: ['mongodb'] };
