// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

const ForecastConfiguration = {
	type: {
		configurations: Object,
		defaultConfiguration: String,
	},
	default: {
		configurations: {},
		defaultConfiguration: null,
	},
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ForecastConfigurationSchema = Schema(
	{
		chart: ForecastConfiguration,
		comparisonGridChart: ForecastConfiguration,
		deterministicForecastSettings: ForecastConfiguration,
		deterministicGridChart: ForecastConfiguration,
		forecastChartHeaders: ForecastConfiguration,
		probabilisticForecastSettings: ForecastConfiguration,
		tcChartGrid: ForecastConfiguration,
		tcFitForm: ForecastConfiguration,

		// will be deprecated soon
		tcFitC4Chart: ForecastConfiguration,
		tcFitRateGas: ForecastConfiguration,
		tcFitRateOil: ForecastConfiguration,
		tcFitRateWater: ForecastConfiguration,
		tcFitRatioGas: ForecastConfiguration,
		tcFitRatioOil: ForecastConfiguration,
		tcFitRatioWater: ForecastConfiguration,
		user: { type: ObjectId, ref: 'users', required: true, index: true, immutable: true },
	},
	{ minimize: false, timestamps: true }
);

module.exports = { ForecastConfiguration, ForecastConfigurationSchema };
