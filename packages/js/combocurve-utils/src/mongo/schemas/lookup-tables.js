// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { lookupTableFilter } = require('./lookup-tables/shared');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ASSUMPTION_FIELDS } = require('./scenario-well-assignments');

const assumptionId = { type: Schema.ObjectId, ref: 'assumptions' };

// eslint-disable-next-line new-cap -- TODO eslint fix later
const lookupTableRule = Schema({
	_id: false,

	...ASSUMPTION_FIELDS.reduce((accumulator, field) => ({ ...accumulator, [field]: assumptionId }), {}),

	forecast: { type: Schema.ObjectId, ref: 'forecasts' },
	forecast_p_series: { type: String },
	schedule: { type: Schema.ObjectId, ref: 'schedules' },

	filter: lookupTableFilter,
});

// eslint-disable-next-line new-cap -- TODO eslint fix later
const LookupTableSchema = Schema(
	{
		name: { type: String, required: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true },
		configuration: {
			caseInsensitiveMatching: { type: Boolean, default: false },
			selectedHeaders: [],
			selectedAssumptions: [],
		},

		rules: [
			{
				required: true,
				type: lookupTableRule,
			},
		],
		copiedFrom: { type: Schema.ObjectId, ref: 'lookup-tables', default: null },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true }
);

LookupTableSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { LookupTableSchema };
