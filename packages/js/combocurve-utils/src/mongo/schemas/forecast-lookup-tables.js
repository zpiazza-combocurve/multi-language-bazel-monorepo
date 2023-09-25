// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { TYPE_CURVE_FPD_SOURCES } = require('./deterministic-forecast-datas');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { BASE_SERIES } = require('./forecasts');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { lookupTableFilter } = require('./lookup-tables/shared');

const PHASE_ENUM = ['all', 'oil', 'gas', 'water'];
const RESOLUTION_ENUM = ['daily', 'monthly'];

// eslint-disable-next-line new-cap -- TODO eslint fix later
const forecastLookupTableRule = Schema({
	_id: false,

	filter: lookupTableFilter,

	typeCurve: {
		type: Schema.ObjectId,
		ref: 'type-curves',
	},

	phase: {
		type: String,
		enum: PHASE_ENUM,
	},

	resolution: {
		type: String,
		enum: RESOLUTION_ENUM,
	},

	applyNormalization: {
		type: Boolean,
	},

	applySeries: {
		type: String,
		enum: BASE_SERIES,
	},

	fpdSource: {
		type: String,
		enum: TYPE_CURVE_FPD_SOURCES,
	},

	riskFactorWater: {
		type: Number,
	},

	riskFactorGas: {
		type: Number,
	},

	riskFactorOil: {
		type: Number,
	},

	schedule: {
		type: Schema.ObjectId,
		ref: 'schedules',
	},

	fixedDateIdx: { type: Number },
});

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ForecastLookupTableSchema = Schema(
	{
		name: { type: String, required: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true },
		configuration: {
			caseInsensitiveMatching: { type: Boolean, default: false },
			selectedHeaders: [],
		},

		rules: [
			{
				required: true,
				type: forecastLookupTableRule,
			},
		],
		copiedFrom: { type: Schema.ObjectId, ref: 'forecast-lookup-tables', default: null },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true }
);

ForecastLookupTableSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { PHASE_ENUM, RESOLUTION_ENUM, ForecastLookupTableSchema };
