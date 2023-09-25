// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const TagSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		description: String,
		color: Number, // hex color
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true },
	},
	{ timestamps: true }
);

module.exports = { TagSchema };
