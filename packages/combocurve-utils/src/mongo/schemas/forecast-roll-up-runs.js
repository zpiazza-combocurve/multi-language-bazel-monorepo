// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

const FORECAST_ROLL_UP_BATCH_SIZE = 250;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ForecastRollUpRunSchema = Schema(
	{
		batches: [],
		columns: [{ type: String }],
		createdBy: { type: ObjectId, ref: 'users' },
		data: { monthly: {}, daily: {} },
		project: { type: ObjectId, ref: 'projects' },
		runDate: { type: Date, default: null },
		running: { type: Boolean, default: false },
		forecast: { type: ObjectId, ref: 'forecasts', index: true },
		wells: [{ type: ObjectId, ref: 'wells' }],
		groups: { type: Array, default: [] },
		byWell: { type: Boolean, default: false },
		resolution: {
			default: 'monthly',
			enum: ['monthly', 'daily', 'both'],
			type: String,
		},
		comparedForecast: { type: ObjectId, ref: 'forecasts' },
	},
	{ timestamps: true }
);

ForecastRollUpRunSchema.index({ createdBy: 1, forecast: 1 });

module.exports = { FORECAST_ROLL_UP_BATCH_SIZE, ForecastRollUpRunSchema };
