// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const RollUpGroupSchema = Schema(
	{
		groupData: {
			onlyProduction: {},
			onlyForecast: {},
			stitch: {},
		},
		groupName: { type: String, required: true },
		run: { type: ObjectId, required: true },
	},
	{ timestamps: true }
);

module.exports = { RollUpGroupSchema };
