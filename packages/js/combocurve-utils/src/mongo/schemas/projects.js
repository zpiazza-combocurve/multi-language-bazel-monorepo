// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ProjectSchema = Schema(
	{
		name: { type: String, required: true, unique: true },
		wells: [{ type: Schema.ObjectId, ref: 'wells' }],
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		copiedFrom: { type: Schema.ObjectId, ref: 'projects' },
		scenarios: [{ type: Schema.ObjectId, ref: 'scenarios' }],
		status: {
			closedAt: Date,
			deletedAt: Date,
			closed: Boolean,
			deleted: Boolean,
			closedBy: { type: Schema.ObjectId, ref: 'users' },
			reviewedBy: { type: Schema.ObjectId, ref: 'users' },
		},
		companyForecastSetting: { type: Schema.ObjectId, ref: 'company-forecast-settings' },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true }
);

module.exports = { ProjectSchema };
