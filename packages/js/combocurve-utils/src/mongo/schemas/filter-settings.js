// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const FilterSettingSchema = new Schema(
	{
		user: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true, index: true },
		selectedHeaders: [String],
		selectedProjectHeaders: [
			{ project: { type: Schema.ObjectId, ref: 'projects' }, selectedProjectHeaders: [String] },
		],
	},
	{ timestamps: true }
);

module.exports = { FilterSettingSchema };
