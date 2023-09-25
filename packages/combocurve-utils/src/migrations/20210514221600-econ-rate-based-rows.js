// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultRateTypeValue = 'gross_well_head';
const defaultCalculationMethodValue = 'non_monotonic';

const defaultRateType = {
	label: 'Gross Well Head',
	value: defaultRateTypeValue,
};

const defaultCalculationMethod = {
	label: 'Non Monotonic',
	value: defaultCalculationMethodValue,
};

const batchUpdateUpExpenses = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'expenses', 'options.water_disposal.rate_type': { $exists: false } },
	update: [
		{
			$set: {
				'options.variable_expenses.oil.subItems.gathering.subItems.rate_type': defaultRateType,
				'options.variable_expenses.oil.subItems.gathering.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.oil.subItems.processing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.oil.subItems.processing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.oil.subItems.transportation.subItems.rate_type': defaultRateType,
				'options.variable_expenses.oil.subItems.transportation.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.oil.subItems.marketing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.oil.subItems.marketing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.oil.subItems.other.subItems.rate_type': defaultRateType,
				'options.variable_expenses.oil.subItems.other.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.variable_expenses.gas.subItems.gathering.subItems.rate_type': defaultRateType,
				'options.variable_expenses.gas.subItems.gathering.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.gas.subItems.processing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.gas.subItems.processing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.gas.subItems.transportation.subItems.rate_type': defaultRateType,
				'options.variable_expenses.gas.subItems.transportation.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.gas.subItems.marketing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.gas.subItems.marketing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.gas.subItems.other.subItems.rate_type': defaultRateType,
				'options.variable_expenses.gas.subItems.other.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.variable_expenses.ngl.subItems.gathering.subItems.rate_type': defaultRateType,
				'options.variable_expenses.ngl.subItems.gathering.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.ngl.subItems.processing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.ngl.subItems.processing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.ngl.subItems.transportation.subItems.rate_type': defaultRateType,
				'options.variable_expenses.ngl.subItems.transportation.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.ngl.subItems.marketing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.ngl.subItems.marketing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.ngl.subItems.other.subItems.rate_type': defaultRateType,
				'options.variable_expenses.ngl.subItems.other.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.variable_expenses.drip_condensate.subItems.gathering.subItems.rate_type': defaultRateType,
				'options.variable_expenses.drip_condensate.subItems.gathering.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.drip_condensate.subItems.processing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.drip_condensate.subItems.processing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.drip_condensate.subItems.transportation.subItems.rate_type': defaultRateType,
				'options.variable_expenses.drip_condensate.subItems.transportation.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.drip_condensate.subItems.marketing.subItems.rate_type': defaultRateType,
				'options.variable_expenses.drip_condensate.subItems.marketing.subItems.rows_calculation_method':
					defaultCalculationMethod,
				'options.variable_expenses.drip_condensate.subItems.other.subItems.rate_type': defaultRateType,
				'options.variable_expenses.drip_condensate.subItems.other.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.fixed_expenses.monthly_well_cost.subItems.rate_type': defaultRateType,
				'options.fixed_expenses.monthly_well_cost.subItems.rows_calculation_method': defaultCalculationMethod,

				'options.fixed_expenses.other_monthly_cost_1.subItems.rate_type': defaultRateType,
				'options.fixed_expenses.other_monthly_cost_1.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.fixed_expenses.other_monthly_cost_2.subItems.rate_type': defaultRateType,
				'options.fixed_expenses.other_monthly_cost_2.subItems.rows_calculation_method':
					defaultCalculationMethod,

				'options.water_disposal.rate_type': defaultRateType,
				'options.water_disposal.rows_calculation_method': defaultCalculationMethod,

				'econ_function.variable_expenses.oil.gathering.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.oil.gathering.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.oil.processing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.oil.processing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.oil.transportation.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.oil.transportation.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.oil.marketing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.oil.marketing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.oil.other.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.oil.other.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.variable_expenses.gas.gathering.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.gas.gathering.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.gas.processing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.gas.processing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.gas.transportation.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.gas.transportation.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.gas.marketing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.gas.marketing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.gas.other.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.gas.other.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.variable_expenses.ngl.gathering.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.ngl.gathering.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.ngl.processing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.ngl.processing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.ngl.transportation.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.ngl.transportation.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.ngl.marketing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.ngl.marketing.rows_calculation_method': defaultCalculationMethodValue,
				'econ_function.variable_expenses.ngl.other.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.ngl.other.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.variable_expenses.drip_condensate.gathering.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.drip_condensate.gathering.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.drip_condensate.processing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.drip_condensate.processing.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.drip_condensate.transportation.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.drip_condensate.transportation.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.drip_condensate.marketing.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.drip_condensate.marketing.rows_calculation_method':
					defaultCalculationMethodValue,
				'econ_function.variable_expenses.drip_condensate.other.rate_type': defaultRateTypeValue,
				'econ_function.variable_expenses.drip_condensate.other.rows_calculation_method':
					defaultCalculationMethodValue,

				'econ_function.fixed_expenses.monthly_well_cost.rate_type': defaultRateTypeValue,
				'econ_function.fixed_expenses.monthly_well_cost.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.fixed_expenses.other_monthly_cost_1.rate_type': defaultRateTypeValue,
				'econ_function.fixed_expenses.other_monthly_cost_1.rows_calculation_method':
					defaultCalculationMethodValue,

				'econ_function.fixed_expenses.other_monthly_cost_2.rate_type': defaultRateTypeValue,
				'econ_function.fixed_expenses.other_monthly_cost_2.rows_calculation_method':
					defaultCalculationMethodValue,

				'econ_function.water_disposal.rate_type': defaultRateTypeValue,
				'econ_function.water_disposal.rows_calculation_method': defaultCalculationMethodValue,
			},
		},
	],
});

const batchUpdateUpProductionTaxes = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'production_taxes', 'options.ad_valorem_tax.rate_type': { $exists: false } },
	update: [
		{
			$set: {
				'options.severance_tax.rate_type': defaultRateType,
				'options.severance_tax.rows_calculation_method': defaultCalculationMethod,

				'options.ad_valorem_tax.rate_type': defaultRateType,
				'options.ad_valorem_tax.rows_calculation_method': defaultCalculationMethod,

				'econ_function.severance_tax.rate_type': defaultRateTypeValue,
				'econ_function.severance_tax.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.ad_valorem_tax.rate_type': defaultRateTypeValue,
				'econ_function.ad_valorem_tax.rows_calculation_method': defaultCalculationMethodValue,
			},
		},
	],
});

const batchUpdateUpStreamProperties = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'stream_properties', 'options.yields.rate_type': { $exists: false } },
	update: [
		{
			$set: {
				'options.yields.rate_type': defaultRateType,
				'options.yields.rows_calculation_method': defaultCalculationMethod,

				'options.shrinkage.rate_type': defaultRateType,
				'options.shrinkage.rows_calculation_method': defaultCalculationMethod,

				'options.loss_flare.rate_type': defaultRateType,
				'options.loss_flare.rows_calculation_method': defaultCalculationMethod,

				'econ_function.yields.rate_type': defaultRateTypeValue,
				'econ_function.yields.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.shrinkage.rate_type': defaultRateTypeValue,
				'econ_function.shrinkage.rows_calculation_method': defaultCalculationMethodValue,

				'econ_function.loss_flare.rate_type': defaultRateTypeValue,
				'econ_function.loss_flare.rows_calculation_method': defaultCalculationMethodValue,
			},
		},
	],
});

async function up({ db }) {
	await batchUpdateUpExpenses({ db });
	await batchUpdateUpProductionTaxes({ db });
	await batchUpdateUpStreamProperties({ db });
}

const batchUpdateDownExpenses = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'expenses', 'options.water_disposal.rate_type': { $exists: true } },
	update: [
		{
			$unset: [
				'options.variable_expenses.oil.subItems.gathering.subItems.rate_type',
				'options.variable_expenses.oil.subItems.gathering.subItems.rows_calculation_method',
				'options.variable_expenses.oil.subItems.processing.subItems.rate_type',
				'options.variable_expenses.oil.subItems.processing.subItems.rows_calculation_method',
				'options.variable_expenses.oil.subItems.transportation.subItems.rate_type',
				'options.variable_expenses.oil.subItems.transportation.subItems.rows_calculation_method',
				'options.variable_expenses.oil.subItems.marketing.subItems.rate_type',
				'options.variable_expenses.oil.subItems.marketing.subItems.rows_calculation_method',
				'options.variable_expenses.oil.subItems.other.subItems.rate_type',
				'options.variable_expenses.oil.subItems.other.subItems.rows_calculation_method',

				'options.variable_expenses.gas.subItems.gathering.subItems.rate_type',
				'options.variable_expenses.gas.subItems.gathering.subItems.rows_calculation_method',
				'options.variable_expenses.gas.subItems.processing.subItems.rate_type',
				'options.variable_expenses.gas.subItems.processing.subItems.rows_calculation_method',
				'options.variable_expenses.gas.subItems.transportation.subItems.rate_type',
				'options.variable_expenses.gas.subItems.transportation.subItems.rows_calculation_method',
				'options.variable_expenses.gas.subItems.marketing.subItems.rate_type',
				'options.variable_expenses.gas.subItems.marketing.subItems.rows_calculation_method',
				'options.variable_expenses.gas.subItems.other.subItems.rate_type',
				'options.variable_expenses.gas.subItems.other.subItems.rows_calculation_method',

				'options.variable_expenses.ngl.subItems.gathering.subItems.rate_type',
				'options.variable_expenses.ngl.subItems.gathering.subItems.rows_calculation_method',
				'options.variable_expenses.ngl.subItems.processing.subItems.rate_type',
				'options.variable_expenses.ngl.subItems.processing.subItems.rows_calculation_method',
				'options.variable_expenses.ngl.subItems.transportation.subItems.rate_type',
				'options.variable_expenses.ngl.subItems.transportation.subItems.rows_calculation_method',
				'options.variable_expenses.ngl.subItems.marketing.subItems.rate_type',
				'options.variable_expenses.ngl.subItems.marketing.subItems.rows_calculation_method',
				'options.variable_expenses.ngl.subItems.other.subItems.rate_type',
				'options.variable_expenses.ngl.subItems.other.subItems.rows_calculation_method',

				'options.variable_expenses.drip_condensate.subItems.gathering.subItems.rate_type',
				'options.variable_expenses.drip_condensate.subItems.gathering.subItems.rows_calculation_method',
				'options.variable_expenses.drip_condensate.subItems.processing.subItems.rate_type',
				'options.variable_expenses.drip_condensate.subItems.processing.subItems.rows_calculation_method',
				'options.variable_expenses.drip_condensate.subItems.transportation.subItems.rate_type',
				'options.variable_expenses.drip_condensate.subItems.transportation.subItems.rows_calculation_method',
				'options.variable_expenses.drip_condensate.subItems.marketing.subItems.rate_type',
				'options.variable_expenses.drip_condensate.subItems.marketing.subItems.rows_calculation_method',
				'options.variable_expenses.drip_condensate.subItems.other.subItems.rate_type',
				'options.variable_expenses.drip_condensate.subItems.other.subItems.rows_calculation_method',

				'options.fixed_expenses.monthly_well_cost.subItems.rate_type',
				'options.fixed_expenses.monthly_well_cost.subItems.rows_calculation_method',

				'options.fixed_expenses.other_monthly_cost_1.subItems.rate_type',
				'options.fixed_expenses.other_monthly_cost_1.subItems.rows_calculation_method',

				'options.fixed_expenses.other_monthly_cost_2.subItems.rate_type',
				'options.fixed_expenses.other_monthly_cost_2.subItems.rows_calculation_method',

				'options.water_disposal.rate_type',
				'options.water_disposal.rows_calculation_method',

				'econ_function.variable_expenses.oil.gathering.rate_type',
				'econ_function.variable_expenses.oil.gathering.rows_calculation_method',
				'econ_function.variable_expenses.oil.processing.rate_type',
				'econ_function.variable_expenses.oil.processing.rows_calculation_method',
				'econ_function.variable_expenses.oil.transportation.rate_type',
				'econ_function.variable_expenses.oil.transportation.rows_calculation_method',
				'econ_function.variable_expenses.oil.marketing.rate_type',
				'econ_function.variable_expenses.oil.marketing.rows_calculation_method',
				'econ_function.variable_expenses.oil.other.rate_type',
				'econ_function.variable_expenses.oil.other.rows_calculation_method',

				'econ_function.variable_expenses.gas.gathering.rate_type',
				'econ_function.variable_expenses.gas.gathering.rows_calculation_method',
				'econ_function.variable_expenses.gas.processing.rate_type',
				'econ_function.variable_expenses.gas.processing.rows_calculation_method',
				'econ_function.variable_expenses.gas.transportation.rate_type',
				'econ_function.variable_expenses.gas.transportation.rows_calculation_method',
				'econ_function.variable_expenses.gas.marketing.rate_type',
				'econ_function.variable_expenses.gas.marketing.rows_calculation_method',
				'econ_function.variable_expenses.gas.other.rate_type',
				'econ_function.variable_expenses.gas.other.rows_calculation_method',

				'econ_function.variable_expenses.ngl.gathering.rate_type',
				'econ_function.variable_expenses.ngl.gathering.rows_calculation_method',
				'econ_function.variable_expenses.ngl.processing.rate_type',
				'econ_function.variable_expenses.ngl.processing.rows_calculation_method',
				'econ_function.variable_expenses.ngl.transportation.rate_type',
				'econ_function.variable_expenses.ngl.transportation.rows_calculation_method',
				'econ_function.variable_expenses.ngl.marketing.rate_type',
				'econ_function.variable_expenses.ngl.marketing.rows_calculation_method',
				'econ_function.variable_expenses.ngl.other.rate_type',
				'econ_function.variable_expenses.ngl.other.rows_calculation_method',

				'econ_function.variable_expenses.drip_condensate.gathering.rate_type',
				'econ_function.variable_expenses.drip_condensate.gathering.rows_calculation_method',
				'econ_function.variable_expenses.drip_condensate.processing.rate_type',
				'econ_function.variable_expenses.drip_condensate.processing.rows_calculation_method',
				'econ_function.variable_expenses.drip_condensate.transportation.rate_type',
				'econ_function.variable_expenses.drip_condensate.transportation.rows_calculation_method',
				'econ_function.variable_expenses.drip_condensate.marketing.rate_type',
				'econ_function.variable_expenses.drip_condensate.marketing.rows_calculation_method',
				'econ_function.variable_expenses.drip_condensate.other.rate_type',
				'econ_function.variable_expenses.drip_condensate.other.rows_calculation_method',

				'econ_function.fixed_expenses.monthly_well_cost.rate_type',
				'econ_function.fixed_expenses.monthly_well_cost.rows_calculation_method',

				'econ_function.fixed_expenses.other_monthly_cost_1.rate_type',
				'econ_function.fixed_expenses.other_monthly_cost_1.rows_calculation_method',

				'econ_function.fixed_expenses.other_monthly_cost_2.rate_type',
				'econ_function.fixed_expenses.other_monthly_cost_2.rows_calculation_method',

				'econ_function.water_disposal.rate_type',
				'econ_function.water_disposal.rows_calculation_method',
			],
		},
	],
});

const batchUpdateDownProductionTaxes = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'production_taxes', 'options.ad_valorem_tax.rate_type': { $exists: true } },
	update: [
		{
			$unset: [
				'options.severance_tax.rate_type',
				'options.severance_tax.rows_calculation_method',

				'options.ad_valorem_tax.rate_type',
				'options.ad_valorem_tax.rows_calculation_method',

				'econ_function.severance_tax.rate_type',
				'econ_function.severance_tax.rows_calculation_method',

				'econ_function.ad_valorem_tax.rate_type',
				'econ_function.ad_valorem_tax.rows_calculation_method',
			],
		},
	],
});
const batchUpdateDownStreamProperties = createBatchUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'stream_properties', 'options.yields.rate_type': { $exists: true } },
	update: [
		{
			$unset: [
				'options.yields.rate_type',
				'options.yields.rows_calculation_method',

				'options.shrinkage.rate_type',
				'options.shrinkage.rows_calculation_method',

				'options.loss_flare.rate_type',
				'options.loss_flare.rows_calculation_method',

				'econ_function.yields.rate_type',
				'econ_function.yields.rows_calculation_method',

				'econ_function.shrinkage.rate_type',
				'econ_function.shrinkage.rows_calculation_method',

				'econ_function.loss_flare.rate_type',
				'econ_function.loss_flare.rows_calculation_method',
			],
		},
	],
});

async function down({ db }) {
	await batchUpdateDownExpenses({ db });
	await batchUpdateDownProductionTaxes({ db });
	await batchUpdateDownStreamProperties({ db });
}

module.exports = {
	up,
	down,
	defaultRateTypeValue,
	defaultCalculationMethodValue,
	defaultRateType,
	defaultCalculationMethod,
	uses: ['mongodb'],
};
