// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
const { ObjectId } = Schema;

const TimeRangeType = { end: { type: Number }, start: { type: Number } };

const EventType = {
	activityStepIdx: { type: Number, required: true },
	activityStepName: { type: String, required: true },
	demob: TimeRangeType,
	mob: TimeRangeType,
	resourceIdx: { type: Number, required: false },
	resourceName: { type: String, required: false },
	work: TimeRangeType,
};

const Method = ['auto', 'manual'];

const ScheduleWellOutputSchema = new Schema({
	construction: { type: ObjectId, ref: 'schedule-constructions', index: true, immutable: true },
	output: {
		events: [EventType],
		FPD: Number,
	},
	method: { type: String, enum: Method, default: 'auto' },
	schedule: { type: ObjectId, ref: 'schedules', required: true, index: true, immutable: true },
	project: { type: ObjectId, ref: 'projects', required: true, index: true, immutable: true },
	well: { type: ObjectId, ref: 'wells', required: true, immutable: true },
});

ScheduleWellOutputSchema.index({ well: 1, schedule: 1 }, { unique: true });
ScheduleWellOutputSchema.index({ well: 1, project: 1 });

module.exports = { ScheduleWellOutputSchema };
