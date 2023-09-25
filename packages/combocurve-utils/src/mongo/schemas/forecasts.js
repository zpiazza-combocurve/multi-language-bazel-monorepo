// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const FORECAST_BASE_PHASES = ['oil', 'gas', 'water'];
const BASE_SERIES = ['P10', 'P50', 'P90', 'best'];
const DIAGNOSTIC_BATCH_SIZE = 50; // wells per batch
const FORECAST_BATCH_SIZE = [
	{ threshold: 50, size: 2 },
	{ threshold: Infinity, size: 4 },
];
const MAX_WELLS_IN_FORECAST = 25000; // max wells per forecast
const MTD_DENOM = 30.4375;

const Q_FINAL_PHASES = [
	...FORECAST_BASE_PHASES,
	'oil/gas',
	'oil/water',
	'gas/oil',
	'gas/water',
	'water/oil',
	'water/gas',
];

const Q_FINAL_DICT_DEFINITION = Q_FINAL_PHASES.reduce(
	(acc, phase) => ({ ...acc, [phase]: { type: { q_final: Number, well_life_dict: Object }, default: null } }),
	{}
);

const forecastDataObj = () => {
	return {
		forecasted: false,
		forecastType: 'not_forecasted',
		P_dict: {},
		p_extra: {},
		warning: { status: false, message: '' },
	};
};

const comparisonObj = { ids: [{ type: Schema.ObjectId, ref: 'forecasts' }], resolutions: {} };

const ForecastSchema = new Schema(
	{
		comparisonIds: {
			diagnostics: comparisonObj,
			manual: comparisonObj,
			view: comparisonObj,
		},
		copiedFrom: { type: Schema.ObjectId, ref: 'forecasts', default: null },
		diagDate: { type: Date, default: null },
		forecasted: { type: Boolean, default: false, index: true },
		imported: { type: Boolean, default: false },
		name: { type: String, required: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, index: true },
		// deprecated
		// qFinal: {
		// 	gas: { type: Number, default: null },
		// 	oil: { type: Number, default: null },
		// 	water: { type: Number, default: null },
		// },
		// wellLife: {
		// 	gas: { type: Object, default: null },
		// 	oil: { type: Object, default: null },
		// 	water: { type: Object, default: null },
		// },
		qFinalDict: Q_FINAL_DICT_DEFINITION,
		runDate: Date,
		running: { type: Boolean, default: false },
		libUserInput: {},
		settings: {},
		user: { type: Schema.ObjectId, ref: 'users', index: true },
		prodPref: {
			default: 'monthly_preference',
			enum: ['daily_only', 'daily_preference', 'monthly_only', 'monthly_preference'],
			required: true,
			type: String,
		},
		type: { type: String, enum: ['probabilistic', 'deterministic'], default: 'probabilistic' },
		wells: [{ type: Schema.ObjectId, ref: 'wells' }],
		isForecastLibrary: { type: Boolean, default: false },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true, minimize: false }
);

ForecastSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = {
	FORECAST_BASE_PHASES,
	BASE_SERIES,
	DIAGNOSTIC_BATCH_SIZE,
	FORECAST_BATCH_SIZE,
	forecastDataObj,
	ForecastSchema,
	MAX_WELLS_IN_FORECAST,
	MTD_DENOM,
	Q_FINAL_DICT_DEFINITION,
};
