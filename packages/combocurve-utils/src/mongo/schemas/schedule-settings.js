// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
const { ObjectId } = Schema;

// schedule-constructions also uses ActivityStepType and ResourcesType. Changes to these types should be kept in sync between the two schema.
// src\mongo\schemas\schedule-constructions.js

const PAD_OPERATION_OPTIONS = ['batch', 'disabled', 'parallel', 'sequence'];

const ActivityStepType = {
	_id: false,
	stepIdx: { type: Number, required: true },
	color: { type: String },
	previousStepIdx: { type: [Number] },
	name: { type: String, required: true },
	padOperation: { type: String, enum: PAD_OPERATION_OPTIONS, default: 'disabled', required: true },
	stepDuration: { days: Number, useLookup: { type: Boolean, required: true, default: false } },
	requiresResources: { type: Boolean, default: true, required: true },
};

const AvailabilityType = { end: { type: Number, required: true }, start: { type: Number, required: true } };

const ResourcesType = {
	_id: false,
	active: { type: Boolean, default: true, required: true },
	availability: { type: AvailabilityType, required: true },
	demobilizationDays: Number,
	mobilizationDays: Number,
	name: { type: String, required: true },
	stepIdx: { type: [Number], required: true },
	workOnHolidays: { type: Boolean, default: true, required: true },
};

const ScheduleSettingSchema = new Schema(
	{
		activitySteps: [ActivityStepType],
		createdBy: { type: ObjectId, ref: 'users', immutable: true },
		name: { type: String, required: true },
		project: { type: ObjectId, ref: 'projects', required: true, index: true, immutable: true },
		resources: [ResourcesType],
	},
	{ timestamps: true }
);

// TODO: This is a ridiculous index and should probably be removed.
ScheduleSettingSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = { ScheduleSettingSchema };
