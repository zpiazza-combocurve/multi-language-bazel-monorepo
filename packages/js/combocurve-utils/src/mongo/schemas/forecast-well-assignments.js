// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ForecastWellAssignmentSchema = new Schema(
	{
		forecast: { type: Schema.ObjectId, ref: 'forecasts' },
		well: { type: Schema.ObjectId, ref: 'wells' },
		data: {
			gas: { type: Schema.ObjectId, ref: 'forecast-datas' },
			oil: { type: Schema.ObjectId, ref: 'forecast-datas' },
			water: { type: Schema.ObjectId, ref: 'forecast-datas' },
		},
	},
	{ timestamps: true }
);

ForecastWellAssignmentSchema.index({ forecast: 1, well: 1 });

module.exports = { ForecastWellAssignmentSchema };
