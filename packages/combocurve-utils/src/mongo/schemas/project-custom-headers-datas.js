// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ProjectCustomHeadersDataSchema = Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects' },
		well: { type: Schema.ObjectId, ref: 'wells', index: true },
		customHeaders: {},
	},
	{ timestamps: true }
);

ProjectCustomHeadersDataSchema.index({ project: 1, well: 1 }, { unique: true });

module.exports = { ProjectCustomHeadersDataSchema };
