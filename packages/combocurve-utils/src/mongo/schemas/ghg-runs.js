// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const GhgRunSchema = Schema(
	{
		batchSize: { type: Number, required: true },
		error: {},
		outputParams: {
			type: {
				combos: {
					type: [
						{
							// _id: { type: Schema.ObjectId } // automatically added by mongoose
							name: { type: String, required: true },
							qualifiers: { type: Object, required: true },
						},
					],
					required: true,
				},
			},
			required: true,
		},
		reports: {
			// [PowerBITemplate]: {lastRefreshUserRequestId: String},
		},
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true, index: true },
		runDate: { type: Date, required: true, immutable: true, index: true },
		scenario: { type: Schema.ObjectId, ref: 'scenarios', required: true, immutable: true },
		status: { type: String, enum: ['pending', 'complete', 'failed'], required: true },
		user: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true, index: true },
		scenarioWellAssignments: {
			type: [{ type: Schema.ObjectId, ref: 'scenario-well-assignments' }],
			required: true,
			immutable: true,
		},
	},
	{ timestamps: true }
);

GhgRunSchema.index({ scenario: 1, user: 1 }, { unique: true });

module.exports = { GhgRunSchema };
