// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DEFAULT_QUALIFIER_KEY } = require('./scenarios');

const SCEN_WELL_ASSIGNMENT_SCHEMA_VERSION = 3;

const QUALIFIERS = [
	'default',
	'qualifier1',
	'qualifier2',
	'qualifier3',
	'qualifier4',
	'qualifier5',
	'qualifier6',
	'qualifier7',
	'qualifier8',
	'qualifier9',
	'qualifier10',
	'qualifier11',
	'qualifier12',
	'qualifier13',
	'qualifier14',
	'qualifier15',
	'qualifier16',
	'qualifier17',
	'qualifier18',
	'qualifier19',
	'qualifier20',
];

const ASSUMPTION_FIELDS = [
	'capex',
	'dates',
	'expenses',
	'ownership_reversion',
	'pricing',
	'differentials',
	'production_taxes',
	'production_vs_fit',
	'reserves_category',
	'risking',
	'stream_properties',
	'emission',
];

const SCEN_WELL_ASSIGNMENT_QUALIFIER_FIELDS = [
	...ASSUMPTION_FIELDS,
	'forecast',
	'forecast_p_series',
	'schedule',
	'network',
];

const SCEN_WELL_ASSIGNMENT_DEFAULT_VALUES = {
	/** These are read defaults, not actually written to db */
	forecast_p_series: { model: 'P50' },
};

const assumptionId = { type: Schema.ObjectId, ref: 'assumptions' };
const lookupTableId = { type: Schema.ObjectId, ref: 'lookup-tables' };
const tcLookupTableId = { type: Schema.ObjectId, ref: 'forecast-lookup-tables' };

const getSchemaWithQualifiers = (model = assumptionId, lookup = lookupTableId, tcLookup = tcLookupTableId) => ({
	default: {
		[DEFAULT_QUALIFIER_KEY]: { model: null },
	},
	type: QUALIFIERS.reduce((accumulator, field) => ({ ...accumulator, [field]: { model, lookup, tcLookup } }), {}),
});

const scenarioWellAssignmentsEconModelsSchema = {
	capex: getSchemaWithQualifiers(),
	dates: getSchemaWithQualifiers(),
	depreciation: getSchemaWithQualifiers(),
	escalation: getSchemaWithQualifiers(),
	expenses: getSchemaWithQualifiers(),
	network: getSchemaWithQualifiers({ type: Schema.ObjectId, ref: 'networks' }),
	ownership_reversion: getSchemaWithQualifiers(),
	pricing: getSchemaWithQualifiers(),
	differentials: getSchemaWithQualifiers(),
	production_taxes: getSchemaWithQualifiers(),
	production_vs_fit: getSchemaWithQualifiers(),
	reserves_category: getSchemaWithQualifiers(),
	risking: getSchemaWithQualifiers(),
	stream_properties: getSchemaWithQualifiers(),
	emission: getSchemaWithQualifiers(),
};

const scenarioWellAssignmentsAssumptionsSchema = {
	...scenarioWellAssignmentsEconModelsSchema,
	forecast: getSchemaWithQualifiers({ type: Schema.ObjectId, ref: 'forecasts' }),
	forecast_p_series: getSchemaWithQualifiers(String),
	schedule: getSchemaWithQualifiers({ type: Schema.ObjectId, ref: 'schedules' }),
};

const scenarioWellAssignmentSchema = {
	project: { type: Schema.ObjectId, ref: 'projects', index: true },
	scenario: { type: Schema.ObjectId, ref: 'scenarios', index: true },
	schemaVersion: { type: Number },
	well: { type: Schema.ObjectId, ref: 'wells', index: true },
	general_options: { type: Schema.Types.Mixed }, // can be either string (bug in phdwin importer) or ObjectId
	// editable columns
	...scenarioWellAssignmentsAssumptionsSchema,
	index: { type: Number },
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ScenarioWellAssignmentSchema = Schema(scenarioWellAssignmentSchema, { timestamps: true });

ScenarioWellAssignmentSchema.index({ scenario: 1, well: 1 });

module.exports = {
	ScenarioWellAssignmentSchema,
	ASSUMPTION_FIELDS,
	QUALIFIERS,
	SCEN_WELL_ASSIGNMENT_DEFAULT_VALUES,
	SCEN_WELL_ASSIGNMENT_QUALIFIER_FIELDS,
	SCEN_WELL_ASSIGNMENT_SCHEMA_VERSION,
	scenarioWellAssignmentsEconModelsSchema,
};
