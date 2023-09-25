// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const BASE_PHASES = ['oil', 'gas', 'water'];

const SUBTYPES = {
	ratio: ['automatic', 'manual', 'proximity', null],
	stream: ['imported', 'manual', null],
	deterministic: [
		'automatic',
		'manual',
		'flat/zero',
		'ml',
		'typecurve',
		'library',
		'add_segment',
		'external_integration',
		null,
		'proximity',
	],
};

const UNIQUE_SUBTYPES = [
	...Object.values(SUBTYPES).reduce((set, cur) => {
		cur.forEach((val) => set.add(val));
		return set;
	}, new Set()),
];

const TYPE_CURVE_FPD_SOURCES = [
	'first_prod_date',
	'first_prod_date_daily_calc',
	'first_prod_date_monthly_calc',
	'schedule',
	'fixed',
];

const TYPE_CURVE_APPLY_SETTING = {
	applyNormalization: { type: Boolean, default: false },
	fpdSource: {
		type: String,
		default: 'fixed',
		enum: TYPE_CURVE_FPD_SOURCES,
	},
	schedule: { type: Schema.ObjectId, default: null, ref: 'schedules' },
	fixedDateIdx: { type: Number, default: null },
	series: { type: String, default: 'best', enum: ['P10', 'P50', 'P90', 'best'] },
	riskFactor: { type: Number, default: null },
};

const DeterministicForecastDataSchema = new Schema(
	{
		data_freq: { type: String, default: 'monthly', index: true, enum: ['monthly', 'daily'] },
		diagnostics: {},
		diagDate: { type: Date, default: null },
		forecast: { type: Schema.ObjectId, ref: 'forecasts', required: true, index: true },
		forecasted: { type: Boolean, default: false },
		forecastType: {
			default: 'not_forecasted',
			enum: ['rate', 'not_forecasted', 'ratio', 'stream_based'],
			type: String,
		},
		forecastSubType: {
			default: null,
			enum: UNIQUE_SUBTYPES,
			type: String,
		},
		lastAutomaticRun: {
			date: { type: Date, default: null },
			source: { type: String, default: null, enum: ['auto', 'add_segment', 'library', 'typecurve', null] },
			success: { type: Boolean, default: false },
		},
		P_dict: {},
		p_extra: {},
		phase: { type: String, enum: BASE_PHASES, default: 'oil', required: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, index: true },
		runDate: { type: Date, default: null },
		well: { type: Schema.ObjectId, ref: 'wells', index: true },
		warning: {
			status: { type: Boolean, default: false },
			message: { type: String, default: '' },
		},
		ratio: {
			segments: [],
			diagnostics: {},
			basePhase: { type: String, default: null, enum: [...BASE_PHASES, null] },
			x: { type: String, default: null, enum: ['cum', 'time', null] },
			eur: { type: Number, default: null },
			rur: { type: Number, default: null },
		},
		typeCurve: { type: Schema.ObjectId, default: null, ref: 'type-curves' },
		typeCurveApplySetting: { type: new Schema(TYPE_CURVE_APPLY_SETTING, { _id: false }) },
		// streamAssignment: { type: Schema.ObjectId, ref: 'stream-well-assignments', index: true },
		status: {
			default: 'in_progress',
			enum: ['approved', 'rejected', 'in_progress', 'submitted'],
			type: String,
		},
		reviewedAt: { type: Date, default: null },
		reviewedBy: { type: Schema.ObjectId, ref: 'users', default: null },
		forecastedAt: { type: Date, default: null },
		forecastedBy: { type: Schema.ObjectId, ref: 'users', default: null },
	},
	{ timestamps: true, minimize: false }
);

DeterministicForecastDataSchema.index({ forecast: 1, well: 1 });
DeterministicForecastDataSchema.index({ forecast: 1, phase: 1, forecastType: 1, forecastSubType: 1, status: 1 });

module.exports = { DeterministicForecastDataSchema, TYPE_CURVE_APPLY_SETTING, TYPE_CURVE_FPD_SOURCES };
