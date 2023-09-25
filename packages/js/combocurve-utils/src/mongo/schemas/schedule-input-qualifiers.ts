import { Schema, Types } from 'mongoose';

const { ObjectId } = Types;

enum AvailableQualifiers {
	ScheduleStatus = 'status',
}

//Duplicated from schedules.js
enum StatusType {
	Completed = 'completed',
	Drilled = 'drilled',
	NotStarted = 'not_started',
	PadPrepared = 'pad_prepared',
	Permitted = 'permitted',
	Producing = 'producing',
	Spudded = 'spudded',
}

export const ScheduleInputQualifiersSchema = new Schema(
	{
		createdBy: { type: ObjectId, ref: 'users', immutable: true },
		//Right now, only StatusType is available as a qualifier. Expect that to change soon.
		inputField: { type: AvailableQualifiers, required: true },
		name: { type: String, required: true },
		project: {
			type: ObjectId,
			ref: 'projects',
			required: true,
			index: true,
			immutable: true,
		},
		schedule: {
			type: ObjectId,
			ref: 'schedules',
			required: true,
			index: true,
			immutable: true,
		},
		qualifierAssignments: [
			{
				_id: false,
				well: { type: ObjectId, ref: 'wells' },
				value: { type: String, enum: StatusType },
			},
		],
	},
	{ timestamps: true }
);

ScheduleInputQualifiersSchema.index({ project: 1, schedule: 1 });
