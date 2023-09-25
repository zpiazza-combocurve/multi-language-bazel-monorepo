import { Schema } from 'mongoose';

import { scenarioWellAssignmentsEconModelsSchema } from './scenario-well-assignments';
import { wellSchema } from './wells';

const econGroupPropertiesSchema = {
	econLimit: { type: String },
	allocation: {
		timing: { type: String },
		properties: { type: String },
		basis: { type: String },
		method: { type: String },
		methodType: { type: String },
	},
	exclusion: {
		volumnOptions: { type: String },
		group: { type: String },
	},
};

const EconGroupSchema = new Schema(
	{
		...scenarioWellAssignmentsEconModelsSchema,
		project: { type: Schema.Types.ObjectId, ref: 'projects', index: true },
		scenario: { type: Schema.Types.ObjectId, ref: 'scenarios', index: true },
		well: wellSchema,
		assignments: [{ type: Schema.Types.ObjectId, ref: 'scenario-well-assignments' }],
		name: { type: String, required: true },
		properties: econGroupPropertiesSchema,
	},
	{ timestamps: true }
);

EconGroupSchema.index({ scenario: 1, name: 1 }, { unique: true });

export { EconGroupSchema, econGroupPropertiesSchema };
