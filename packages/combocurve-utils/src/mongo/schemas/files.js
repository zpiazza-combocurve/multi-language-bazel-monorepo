// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const FileSchema = Schema(
	{
		bSize: Number,
		mbSize: Number,
		type: { type: String },
		name: { type: String, required: true, index: true },
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		project: { type: Schema.ObjectId, ref: 'projects' },
		gcpName: { type: String, required: true, unique: true, index: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = { FileSchema };
