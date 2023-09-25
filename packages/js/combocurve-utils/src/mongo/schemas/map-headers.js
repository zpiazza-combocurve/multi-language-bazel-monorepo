// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const MapHeaderSchema = new Schema(
	{
		header: { type: String },
		headerValues: [String],
		colors: [String],
		sizeBy: { header: String, min: Number, max: Number },
		projectId: String,
		projectScope: Boolean,
		wellLabel: String,
	},
	{ timestamps: true }
);

module.exports = { MapHeaderSchema };
