// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const SortingSchema = Schema(
	{
		fields: [
			{
				direction: { type: Number, default: 1 }, // 1 for ascending, -1 for descending
				field: { type: String, required: true },
				group: { type: Boolean, default: false },
			},
		],
		name: { type: String, required: true },
		project: { type: Schema.ObjectId, ref: 'project', immutable: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', immutable: true },
	},
	{ timestamps: true }
);

SortingSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { SortingSchema };
