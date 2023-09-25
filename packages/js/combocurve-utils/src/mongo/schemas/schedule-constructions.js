// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
const { ObjectId } = Schema;

// schedule-settings also uses ActivityStepType and ResourcesType. Changes to these types should be kept in sync between the two schema.
// src\mongo\schemas\schedule-settings.js

const PAD_OPERATION_OPTIONS = ['batch', 'disabled', 'parallel', 'sequence'];

const ActivityStepType = {
	_id: false,
	stepIdx: { type: Number, required: true },
	color: { type: String },
	previousStepIdx: { type: [Number] },
	name: { type: String, required: true },
	padOperation: {
		type: String,
		enum: PAD_OPERATION_OPTIONS,
		default: 'disabled',
		required: true,
	},
	stepDuration: {
		days: Number,
		useLookup: { type: Boolean, required: true, default: false },
	},
	requiresResources: { type: Boolean, default: true, required: true },
};

const AvailabilityType = {
	end: { type: Number, required: true },
	start: { type: Number, required: true },
};

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

const ScheduleConstructionSchema = new Schema({
	schedule: {
		type: ObjectId,
		ref: 'schedules',
		required: true,
		index: true,
		immutable: true,
	},
	project: { type: ObjectId, ref: 'projects', required: true, immutable: true },
	method: { type: String, enum: ['auto', 'manual'], required: true },
	scheduleSettings: {
		activitySteps: [ActivityStepType],
		startProgram: { type: Number },
		name: { type: String },
		resources: [ResourcesType],
		overwriteManual: { type: Boolean, default: true },
	},

	run: {
		status: {
			type: String,
			enum: ['running', 'succeeded', 'failed'],
			required: true,
		},
		error: {},
		user: { type: ObjectId, ref: 'users' },
		start: Date,
		finish: Date,
	},
	edit: {
		user: { type: ObjectId, ref: 'users' },
		date: Date,
	},
});

module.exports = { ScheduleConstructionSchema };
