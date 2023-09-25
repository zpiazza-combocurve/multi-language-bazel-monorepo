// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const SCENARIO_SCHEMA_VERSION = 2;

const DEFAULT_QUALIFIER_KEY = 'default';
const MAX_WELLS_IN_SCENARIO = 25000;
const SCENARIO_MAX_QUALIFIERS_PER_COLUMN = 20;

class ScenarioError extends Error {
	constructor(...params) {
		super(...params);
		this.name = 'ScenarioError';
		this.expected = true;
	}
}

const ScenarioColumn = {
	type: {
		activeQualifier: String,
		qualifiers: Object,
	},
	default: () => ({
		activeQualifier: DEFAULT_QUALIFIER_KEY,
		qualifiers: {
			[DEFAULT_QUALIFIER_KEY]: {
				name: 'Default',
				createdAt: new Date(),
			},
		},
	}),
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ScenarioSchema = Schema(
	{
		columns: {
			capex: ScenarioColumn,
			dates: ScenarioColumn,
			depreciation: ScenarioColumn,
			escalation: ScenarioColumn,
			expenses: ScenarioColumn,
			forecast: ScenarioColumn,
			forecast_p_series: ScenarioColumn,
			network: ScenarioColumn,
			ownership_reversion: ScenarioColumn,
			pricing: ScenarioColumn,
			differentials: ScenarioColumn,
			production_taxes: ScenarioColumn,
			production_vs_fit: ScenarioColumn,
			reserves_category: ScenarioColumn,
			risking: ScenarioColumn,
			schedule: ScenarioColumn,
			stream_properties: ScenarioColumn,
			emission: ScenarioColumn,
		},
		copiedFrom: { type: Schema.ObjectId, ref: 'scenarios' },
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		general_options: { type: Schema.ObjectId, ref: 'assumptions' },
		name: { type: String, required: true },
		project: { type: Schema.ObjectId, ref: 'projects', index: true, required: true },
		schemaVersion: { type: Number },
		status: {
			deletedAt: Date,
			deleted: Boolean,
			reviewedBy: { type: Schema.ObjectId, ref: 'users' },
		},
		wells: [{ type: Schema.ObjectId, ref: 'wells' }],
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
		// for modular econ
		modular: { type: Boolean, default: false },
		forecast: { type: Schema.ObjectId, ref: 'forecast' },
	},

	{ timestamps: true }
);

ScenarioSchema.index({ project: 1, name: 1 }, { unique: true });

ScenarioSchema.pre('save', function preSave() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	this.schemaVersion = SCENARIO_SCHEMA_VERSION;
});

module.exports = {
	DEFAULT_QUALIFIER_KEY,
	MAX_WELLS_IN_SCENARIO,
	SCENARIO_MAX_QUALIFIERS_PER_COLUMN,
	SCENARIO_SCHEMA_VERSION,
	ScenarioError,
	ScenarioSchema,
};
