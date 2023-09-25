// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const EconVisualizationSetupSchema = new Schema(
	{
		econDatasetId: String,
		reports: {
			/*
            Each key will have a value with the schema: { datasetId: String }
            */
		},
	},
	{ timestamps: true }
);

module.exports = { EconVisualizationSetupSchema };
