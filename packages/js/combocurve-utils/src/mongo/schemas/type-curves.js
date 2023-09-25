// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { BASE_SERIES, Q_FINAL_DICT_DEFINITION } = require('./forecasts');

const TC_NO_NORMALIZATION = 'no_normalization';

const TypeCurveSchema = new Schema(
	{
		basePhase: { type: String, enum: [null, 'oil', 'gas', 'water'], default: null },
		copiedFrom: { type: Schema.ObjectId, ref: 'type-curves', default: null },
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		fits: {
			oil: { type: Schema.ObjectId, ref: 'type-curve-fits', default: null },
			gas: { type: Schema.ObjectId, ref: 'type-curve-fits', default: null },
			water: { type: Schema.ObjectId, ref: 'type-curve-fits', default: null },
		},
		fitted: { type: Boolean, default: false },
		forecast: { type: Schema.ObjectId, ref: 'forecasts' },
		forecastSeries: { type: String, enum: BASE_SERIES, default: 'best' },
		name: { type: String, required: true },
		normalizations: [{ type: Schema.ObjectId, ref: 'type-curve-normalizations' }],
		phaseType: {
			oil: { type: String, enum: ['rate', 'ratio'], default: 'rate' },
			gas: { type: String, enum: ['rate', 'ratio'], default: 'rate' },
			water: { type: String, enum: ['rate', 'ratio'], default: 'rate' },
		},
		project: { type: Schema.ObjectId, ref: 'projects', index: true },
		qFinalDict: Q_FINAL_DICT_DEFINITION,
		regressionType: { type: String, enum: ['cum', 'rate'], default: 'cum' },
		resolutionPreference: {
			type: String,
			enum: ['daily_only', 'monthly_only', 'daily_preference', 'monthly_preference', 'forecast'],
			default: 'forecast',
		},
		tcType: { type: String, enum: ['rate', 'ratio'], required: true },
		wells: [{ type: Schema.ObjectId, ref: 'wells' }],
		wellsAdded: { type: Boolean, default: false },
		wellsRemoved: { type: Boolean, default: false },

		// Econ
		activeUmbrellas: { type: {}, default: {} },
		assumptions: {
			capex: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			dates: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			risking: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			expenses: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			escalation: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			depreciation: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			general_options: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			production_taxes: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			production_vs_fit: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			stream_properties: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			ownership_reversion: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			pricing: { type: Schema.ObjectId, ref: 'assumptions', default: null },
			differentials: { type: Schema.ObjectId, ref: 'assumptions', default: null },
		},
		headers: {
			first_prod_date: { type: Date, default: null },
			perf_lateral_length: { type: Number, default: null },
			true_vertical_depth: { type: Number, default: null },
			total_prop_weight: { type: Number, default: null },
		},
		pSeries: {
			default: {
				percentile: 'P50',
			},
			type: {
				percentile: { type: String }, // best, P10, P20, ...
			},
		},
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
		wellValidationCriteria: {
			type: String,
			enum: [
				'must_have_prod_and_forecast',
				'must_have_prod',
				'must_have_forecast',
				'either_have_prod_or_forecast',
			],
			default: 'must_have_prod_and_forecast',
		},
	},
	{ timestamps: true }
);

TypeCurveSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { TypeCurveSchema, TC_NO_NORMALIZATION };
