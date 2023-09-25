// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ARCHIVE_PROJECT_VERSIONS = {
	V_1: null, // initial version, everything comes from the Mongodb
	V_2: 'V2: Production data DAL', // app retrieves production data from the DAL
};

const LATEST_ARCHIVE_PROJECT_VERSION = ARCHIVE_PROJECT_VERSIONS.V_2;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ArchivedProjectSchema = Schema(
	{
		projectId: { type: Schema.ObjectId, ref: 'projects', required: true, index: true },
		versionName: { type: String, required: true },
		projectName: { type: String, required: true, index: true },
		storageDirectory: { type: String, required: true },
		wellsCount: { type: Number, index: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', index: true },
		scenarios: [{ name: { type: String, required: true }, updated: Date }],
		forecasts: [{ name: { type: String, required: true }, updated: Date }],
		typecurves: [{ name: { type: String, required: true }, updated: Date }],
		assumptions: [{ name: { type: String, required: true }, updated: Date }],
		schedules: [{ name: { type: String, required: true }, updated: Date }],
		version: { type: String, default: null, required: false }, //should be one of the ARCHIVE_PROJECT_VERSIONS above
	},
	{ timestamps: true }
);

ArchivedProjectSchema.index({ createdAt: 1 });

module.exports = { ARCHIVE_PROJECT_VERSIONS, LATEST_ARCHIVE_PROJECT_VERSION, ArchivedProjectSchema };
