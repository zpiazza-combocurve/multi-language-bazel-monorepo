// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconReportSettingSchema = Schema(
	{
		name: { type: String, required: true },
		headers: [String],
		createdBy: { type: ObjectId, ref: 'users', required: true, immutable: true },
	},
	{ timestamps: true }
);

module.exports = { EconReportSettingSchema };
