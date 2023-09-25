import { Schema } from 'mongoose';

const {
	Types: { ObjectId },
} = Schema;

const cashflowReports = ['cashflow-csv', 'cashflow-agg-csv'];
export const reportTypes = ['oneLiner', ...cashflowReports];

const cashflowReportTypes = ['monthly', 'yearly', 'hybrid'];

const yearType = ['calendar', 'fiscal'];

const keyType = ['header', 'column'];

const EconReportExportConfigurationSchema = new Schema(
	{
		name: { type: String, required: true, index: true },
		project: { type: ObjectId, ref: 'projects', required: true, index: true, immutable: true },
		createdBy: { type: ObjectId, ref: 'users', required: true, index: true, immutable: true },
		type: {
			type: String,
			enum: reportTypes,
		},
		columns: {
			type: [
				{
					key: { type: String, required: true },
					keyType: {
						type: String,
						required: true,
						enum: keyType,
					},
					sortingOptions: {
						type: {
							direction: String,
							priority: Number,
						},
					},
				},
			],
			required: true,
		},
		cashflowOptions: {
			type: {
				type: String,
				enum: cashflowReportTypes,
			},
			timePeriods: Number,
			useTimePeriods: Boolean,
			hybridOptions: {
				type: {
					months: Number,
					yearType: { type: String, enum: yearType },
				},
			},
		},
	},
	{ timestamps: true }
);

export { EconReportExportConfigurationSchema };
