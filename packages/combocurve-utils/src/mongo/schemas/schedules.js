// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

class ScheduleValidationError extends Error {
	constructor(...args) {
		super(...args);
		this.name = ScheduleValidationError.name;
		this.expected = true;
	}
}

const StatusType = ['completed', 'drilled', 'not_started', 'pad_prepared', 'permitted', 'producing', 'spudded'];

const InputFields = ['priority', 'status'];

const assumptionId = { type: Schema.ObjectId, ref: 'assumptions' };
const lookupTableId = { type: Schema.ObjectId, ref: 'lookup-tables' };
const tcLookupTableId = { type: Schema.ObjectId, ref: 'forecast-lookup-tables' };

const getAssumptionSchema = (model = assumptionId, lookup = lookupTableId, tcLookup = tcLookupTableId) => ({
	model,
	lookup,
	tcLookup,
});

const ScheduleSchema = new Schema(
	{
		name: { type: String, required: true },
		createdBy: { type: ObjectId, ref: 'users', immutable: true },
		inputData: [
			{
				_id: false,
				well: { type: ObjectId, ref: 'wells', required: true },
				priority: Number,
				status: {
					type: String,
					enum: StatusType,
				},
				npv: Number,
				capex: getAssumptionSchema(),
				differentials: getAssumptionSchema(),
				expenses: getAssumptionSchema(),
				forecast: getAssumptionSchema({ type: Schema.ObjectId, ref: 'forecasts' }),
				forecast_p_series: getAssumptionSchema(String),
				ownership_reversion: getAssumptionSchema(),
				pricing: getAssumptionSchema(),
				production_taxes: getAssumptionSchema(),
				reserves_category: getAssumptionSchema(),
				risking: getAssumptionSchema(),
				stream_properties: getAssumptionSchema(),
			},
		],
		project: { type: ObjectId, ref: 'projects', required: true, index: true, immutable: true },
		method: { type: String, enum: ['auto', 'manual'], required: true, immutable: true },
		setting: { type: ObjectId, ref: 'schedule-settings' },
		modified: { type: Boolean, default: false },
		qualifiers: [
			{
				_id: false,
				inputField: {
					type: String,
					enum: InputFields,
				},
				qualifier: { type: ObjectId, ref: 'schedule-input-qualifiers' },
				qualifierName: String,
			},
		],
		constructed: { type: Boolean, default: false },
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true }
);

ScheduleSchema.index({ project: 1, name: 1 }, { unique: true });

ScheduleSchema.set('toJSON', { getters: true });

module.exports = { ScheduleSchema, ScheduleValidationError };
