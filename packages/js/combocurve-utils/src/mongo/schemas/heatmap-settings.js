// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const HeatmapSettingSchema = new Schema(
	{
		user: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true, index: true },
		header: String,
		gridType: { type: String, enum: ['idw', 'average'] },
		gridCellSize: Number,
		colorScale: { type: String, enum: ['value', 'percentile'] },
	},
	{ timestamps: true }
);

module.exports = { HeatmapSettingSchema };
