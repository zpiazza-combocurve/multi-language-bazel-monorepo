// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const AssumptionSchema = Schema(
	{
		assumptionKey: { type: String, required: true, index: true },
		assumptionName: { type: String, required: true },
		copiedFrom: { type: Schema.ObjectId, ref: 'assumptions', default: null },
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		econ_function: {},
		fromHeader: Boolean,
		lastUpdatedBy: { type: Schema.ObjectId, ref: 'users' },
		name: { type: String, required: true },
		options: {},
		project: { type: Schema.ObjectId, required: true, ref: 'projects', index: true },
		scenario: { type: Schema.ObjectId, ref: 'scenarios' }, // new
		unique: { type: Boolean, default: false, index: true }, // new
		well: { type: Schema.ObjectId, ref: 'wells', index: true }, // new
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
		embeddedLookupTables: [{ type: Schema.ObjectId, ref: 'embedded-lookup-tables' }],
	},
	{ timestamps: true }
);

AssumptionSchema.index({ project: 1, assumptionKey: 1, name: 1 }, { unique: true });

module.exports = { AssumptionSchema };
