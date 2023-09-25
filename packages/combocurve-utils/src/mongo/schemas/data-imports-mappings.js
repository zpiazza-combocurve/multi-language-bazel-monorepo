// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DATA_SOURCES } = require('./constants/data-sources');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const DataImportMappingSchema = Schema(
	{
		description: String,

		createdBy: { type: Schema.ObjectId, ref: 'users', index: true },

		fileType: { type: String },
		dataSource: { type: String, enum: DATA_SOURCES }, // TODO remove enum or keep in sync with flex-cc

		// Record of { [fileKey]: CCKey },
		// actually is being saved as array of [fileKey, CCKey] because of mongo limitations with '.' in key names: Array<[fileKey, CCKey]>
		mappings: {},
	},
	{ timestamps: true }
);

module.exports = { DataImportMappingSchema };
