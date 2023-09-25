// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ASSUMPTION_FIELDS } = require('./scenario-well-assignments');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { LOOKUP_TABLES_OPERATORS } = require('./lookup-tables/shared');

const RuleSchema = new Schema({
	_id: false,

	conditions: [
		{
			_id: false,
			key: { type: String, required: true },
			operator: { type: String, enum: LOOKUP_TABLES_OPERATORS, required: true },
			value: Schema.Types.Mixed, // This could be double, string, date, array if we want to use the `in` operator
			childrenValues: { type: [Schema.Types.Mixed], required: false, default: [] }, //e.g. numerical interpolation
		},
	],

	values: [
		{
			_id: false,
			key: { type: String, required: true },
			value: Schema.Types.Mixed,
			childrenValues: { type: [Schema.Types.Mixed], required: false, default: [] }, //e.g. numerical interpolation
		},
	],
});

const LineSchema = new Schema({
	_id: false,

	key: { type: String, required: true }, // key, category, criteria, period, value, description, ...

	value: Schema.Types.Mixed, // oil, opc, flat, flat, 0, description example, [1, 2, 3]

	lookup: String,
});

const EmbeddedLookupTableSchema = new Schema(
	{
		name: { type: String, required: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true },
		copiedFrom: { type: Schema.ObjectId, ref: 'embedded-lookup-tables', default: null },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],

		assumptionKey: { type: String, enum: ASSUMPTION_FIELDS },

		rules: [{ type: RuleSchema, required: true }],

		lines: [[LineSchema]],

		configuration: {
			caseInsensitiveMatching: { type: Boolean, default: false },
			selectedHeaders: [],
			//key is the well header key, value is one of ['regular', 'ratio', 'interpolation'].
			//'ratio' and 'interpolation' are allowed only for the numerical headers.
			//'regular' by default or if a key is missing
			selectedHeadersMatchBehavior: { type: Object, default: {} },
		},
	},
	{ timestamps: true }
);

EmbeddedLookupTableSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { EmbeddedLookupTableSchema };
