// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const StreamSchema = Schema(
	{
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		dataFrequency: { type: String, required: true, default: 'monthly', enum: ['monthly', 'daily'] },
		name: { type: String, required: true },
		project: { type: Schema.ObjectId, ref: 'projects', default: null, immutable: true, index: true },
	},

	{ timestamps: true }
);

StreamSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { StreamSchema };
