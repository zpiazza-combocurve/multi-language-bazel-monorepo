// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconRunsDataSchema = Schema(
	{
		comboId: { type: Schema.ObjectId }, // we'll be able to make these required soon, but not yet
		comboName: { type: String },
		data: {},
		error: {},
		oneLinerData: {},
		reservesCategory: {},
		project: { type: Schema.ObjectId, ref: 'projects', index: true },
		run: { type: Schema.ObjectId, ref: 'econ-runs' },
		scenario: { type: Schema.ObjectId, ref: 'scenarios' },
		user: { type: Schema.ObjectId, ref: 'users', index: true },
		well: { type: Schema.ObjectId, ref: 'wells' },
		group: { type: Schema.ObjectId, ref: 'econ-groups' },
	},
	{ timestamps: true }
);

EconRunsDataSchema.index({ run: 1, error: 1 });

module.exports = { EconRunsDataSchema };
