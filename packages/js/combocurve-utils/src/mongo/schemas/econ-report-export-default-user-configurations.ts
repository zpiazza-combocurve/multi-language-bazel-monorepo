import { Schema } from 'mongoose';

import { reportTypes } from './econ-report-export-configurations';

const {
	Types: { ObjectId },
} = Schema;

const EconReportExportDefaultUserConfigurationSchema = new Schema({
	econReportExportConfiguration: { type: ObjectId, ref: 'econ-report-export-configurations' },
	suggestedConfiguration: { type: String }, // Special configurations not stored on DB
	project: { type: ObjectId, ref: 'projects', required: true },
	type: {
		type: String,
		enum: reportTypes,
		required: true,
	},
	user: { type: ObjectId, ref: 'users', required: true },
});

EconReportExportDefaultUserConfigurationSchema.index({ user: 1, project: 1, type: 1 }, { unique: true });

export { EconReportExportDefaultUserConfigurationSchema };
