// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const BASE_PHASES = ['oil', 'gas', 'water'];

const PROXIMITY_FITS_CONTAINER = {
	fitted: {},
	unfitted: {},
};

const ABSOLUTE_RANGE = {
	start: Number,
	end: Number,
};

const PROXIMITY_CRITERIA = {
	criteria_type: String,
	mandatory: Boolean,
	absolute_range: { type: new Schema(ABSOLUTE_RANGE, { _id: false }) },
	relative_value: Number,
	relative_percentage: Number,
};

const PROXIMITY_CRITERIA_SETTINGS = {
	search_radius: Number,
	criteria: { type: [new Schema(PROXIMITY_CRITERIA, { _id: false })] },
};

const NORMALIZATION_BASE_AXIS = {
	label: String,
	start_feature: String,
	op_chain: [{}],
	operator: {},
	default_min: Number,
	default_max: Number,
	unit: String,
};

const NORMALIZATION_BASE = {
	x: { type: new Schema(NORMALIZATION_BASE_AXIS, { _id: false }) },
	y: { type: new Schema(NORMALIZATION_BASE_AXIS, { _id: false }) },
};

const NORMALIZATION_HEADERS = {
	eur: Number,
	first_fluid_volume: Number,
	first_prop_weight: Number,
	horizontal_spacing: Number,
	perf_lateral_length: Number,
	vertical_spacing: Number,
	well_name: String,
};

const PROXIMITY_NORMALIZATION_SETTINGS = {
	range_start: Number,
	range_end: Number,
	diverged: Boolean,
	key: String,
	name: String,
	base: { type: new Schema(NORMALIZATION_BASE, { _id: false }) },
	type: String,
	headers: { type: new Schema(NORMALIZATION_HEADERS, { _id: false }) },
};

const BEST_FIT_Q_PEAK_DICT = {
	method: String,
	range: [Number],
};

const BUILDUP_DICT = {
	apply_ratio: Boolean,
	apply: Boolean,
	buildup_ratio: Number,
	days: Number,
};

const PROXIMITY_FIT_SETTINGS = {
	add_series: String,
	add_series_fit_range: [{ type: Date }],
	apply_series: String,
	b0: [Number],
	b: [Number],
	b2: [Number],
	best_fit_q_peak: { type: new Schema(BEST_FIT_Q_PEAK_DICT, { _id: false }) },
	buildup: { type: new Schema(BUILDUP_DICT, { _id: false }) },
	D_lim_eff: Number,
	D1_eff: [Number],
	fit_complexity: String,
	minus_t_decline_t_0: [Number],
	minus_t_elf_t_peak: [Number],
	minus_t_peak_t0: [Number],
	p1_range: [Number],
	q_final: Number,
	q_peak: [Number],
	TC_model: String,
	well_life: Number,
};

const PROXIMITY_SETTINGS = {
	neighbor_criteria_settings: { type: new Schema(PROXIMITY_CRITERIA_SETTINGS, { _id: false }) },
	normalization_settings: { type: new Schema(PROXIMITY_NORMALIZATION_SETTINGS, { _id: false }) },
	fit_settings: { type: new Schema(PROXIMITY_FIT_SETTINGS, { _id: false }) },
};

const WELL_FORECAST_PAIRS = {
	well: { type: Schema.ObjectId, ref: 'wells' },
	forecast: { type: Schema.ObjectId, ref: 'forecasts' },
};

const NORMALIZATION_PAIR = {
	qPeak: Number,
	eur: Number,
};

const ProximityForecastDataSchema = new Schema(
	{
		resolution: { type: String, default: 'monthly', enum: ['monthly', 'daily'] },
		forecast: { type: Schema.ObjectId, ref: 'forecasts', required: true },
		well: { type: Schema.ObjectId, ref: 'wells', index: true, required: true },
		phase: { type: String, enum: BASE_PHASES, default: 'oil', required: true },
		phase_type: {
			default: 'rate',
			enum: ['rate', 'ratio'],
			type: String,
		},
		base_phase: { type: String, default: null, enum: [...BASE_PHASES, null] },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, index: true },
		fits: { type: new Schema(PROXIMITY_FITS_CONTAINER, { _id: false }) },
		normalization_multipliers: [{ type: new Schema(NORMALIZATION_PAIR, { _id: false }) }],
		wells: [{ type: new Schema(WELL_FORECAST_PAIRS, { _id: false }) }],
		settings: { type: new Schema(PROXIMITY_SETTINGS, { _id: false }) },
	},
	{ timestamps: true, minimize: false }
);

ProximityForecastDataSchema.index({ 'wells.forecast': 1 });
ProximityForecastDataSchema.index({ 'wells.well': 1 });
ProximityForecastDataSchema.index({ forecast: 1, well: 1, phase: 1 }, { unique: true });

module.exports = {
	ProximityForecastDataSchema,
};
