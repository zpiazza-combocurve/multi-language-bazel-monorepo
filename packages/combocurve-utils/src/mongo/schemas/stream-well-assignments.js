// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const StreamWellAssignmentSchema = Schema(
	{
		dataFrequency: { type: String, required: true, default: 'monthly', enum: ['monthly', 'daily'] },
		stream: { type: Schema.ObjectId, ref: 'streams', required: true, immutable: true, index: true },
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true, index: true },
	},

	{ timestamps: true }
);

StreamWellAssignmentSchema.index({ stream: 1, well: 1 }, { unique: true });

module.exports = { StreamWellAssignmentSchema };
