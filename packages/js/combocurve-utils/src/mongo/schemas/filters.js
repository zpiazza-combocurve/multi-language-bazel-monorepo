// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const FilterSchema = Schema(
	{
		filter: {},
		name: { type: String, required: true },
		projectId: { type: String, required: true },
	},
	{ timestamps: true }
);

module.exports = { FilterSchema };
