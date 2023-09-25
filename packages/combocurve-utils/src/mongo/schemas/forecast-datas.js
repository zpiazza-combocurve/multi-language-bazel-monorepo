// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { TYPE_CURVE_APPLY_SETTING } = require('./deterministic-forecast-datas');

const BASE_PHASES = ['oil', 'gas', 'water'];

const NO_FORECAST_FORECAST_TYPE = ['not_forecasted', 'typecurve'];

const ForecastDataSchema = new Schema(
	{
		data_freq: { type: String, default: 'monthly', index: true, enum: ['monthly', 'daily'] },
		diagDate: { type: Date, default: null },
		forecast: { type: Schema.ObjectId, ref: 'forecasts', required: true, index: true },
		forecasted: { type: Boolean, default: false },
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
		forecastType: {
			default: 'not_forecasted',
			enum: [
				'flat/zero',
				'manual',
				'ml',
				'not_forecasted',
				'prob',
				'typecurve',
				'warning',
				'library',
				'add_segment',
				'imported',
			],
			type: String,
		},
		warning: {
			status: { type: Boolean, default: false },
			message: { type: String, default: '' },
		},
		ratio: {
			enabled: { type: Boolean, default: false },
			phase: { type: String, enum: BASE_PHASES, default: 'oil' },
			value: { type: Number, default: 1 },
		},
		typeCurve: { type: Schema.ObjectId, default: null, ref: 'type-curves' },
		typeCurveApplySetting: { type: new Schema(TYPE_CURVE_APPLY_SETTING, { _id: false }) },
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

ForecastDataSchema.index({ forecast: 1, well: 1 });
ForecastDataSchema.index({ forecast: 1, phase: 1, forecastType: 1, status: 1 });

ForecastDataSchema.virtual('hasForecast').get(function hasForecastDoc() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	return !NO_FORECAST_FORECAST_TYPE.includes(this.forecastType);
});

module.exports = { ForecastDataSchema };
