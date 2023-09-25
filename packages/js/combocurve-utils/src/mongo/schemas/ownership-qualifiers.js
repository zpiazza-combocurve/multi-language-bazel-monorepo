// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DATA_SOURCES } = require('./constants/data-sources');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const OwnershipQualifierSchema = Schema(
	{
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true },
		chosenID: { type: Schema.Types.Mixed, index: true },
		dataSource: {
			type: String,
			enum: DATA_SOURCES,
			default: 'other',
			index: true,
		},
		qualifierKey: { type: String, required: true },
		ownership: {
			type: {
				name: { type: String, required: true },
				assumptionKey: { type: String, default: 'ownership_reversion', enum: ['ownership_reversion'] },
				assumptionName: { type: String, default: 'Ownership and Reversion', enum: ['Ownership and Reversion'] },
				econ_function: {},
				options: {},
			},
			required: true,
		},
	},
	{ timestamps: true }
);

OwnershipQualifierSchema.index({ qualifierKey: 1, well: 1 }, { unique: true });

module.exports = { OwnershipQualifierSchema };
