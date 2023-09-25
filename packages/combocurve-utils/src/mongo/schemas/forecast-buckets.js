// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ForecastBucketSchema = new Schema(
	{
		bucket: [{ type: Schema.ObjectId, ref: 'wells' }],
		forecast: { type: Schema.ObjectId, ref: 'forecasts', required: true },
		user: { type: Schema.ObjectId, ref: 'users', required: true },
	},
	{ timestamps: true }
);

ForecastBucketSchema.index({ user: 1, forecast: 1 });

module.exports = { ForecastBucketSchema };
