// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

const ROLL_UP_BATCH_SIZE = 250;

const rollUpParseDate = (_date) => {
	if (_date) {
		const date = new Date(_date);
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	}
	return null;
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ScenRollUpRunSchema = Schema(
	{
		batches: [],
		columns: [{ type: String }],
		createdBy: { type: ObjectId, ref: 'users' },
		data: { monthly: {}, daily: {} },
		project: { type: ObjectId, ref: 'projects' },
		runDate: { type: Date, default: null },
		running: { type: Boolean, default: false },
		scenario: { type: ObjectId, ref: 'scenarios', index: true },
		wells: [{ type: ObjectId, ref: 'wells' }],
		groups: { type: Array, default: [] },
		byWell: { type: Boolean, default: false },
		resolution: {
			default: 'monthly',
			enum: ['monthly', 'daily', 'both'],
			type: String,
		},
	},
	{ timestamps: true }
);

ScenRollUpRunSchema.index({ createdBy: 1, scenario: 1 });

module.exports = { ROLL_UP_BATCH_SIZE, rollUpParseDate, ScenRollUpRunSchema };
