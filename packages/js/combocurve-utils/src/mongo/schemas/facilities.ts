import { Schema } from 'mongoose';

import {
	FacilityEdgeSchema,
	FacilityNodeSchema,
	InputEdgeSchema,
	OutputEdgeSchema,
	enforceValidateBeforeUpdate,
} from './network/shared';
import { Facility } from './network/types';

export const FacilitySchema = new Schema<Facility>(
	{
		createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
		name: { type: String, required: true },
		project: { type: Schema.Types.ObjectId, ref: 'projects', index: true },
		copiedFrom: { type: Schema.Types.ObjectId, ref: 'facilities', default: null },
		// tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }], // TODO tags
		nodes: [FacilityNodeSchema],
		edges: [FacilityEdgeSchema],
		inputs: [InputEdgeSchema], // without the from property
		outputs: [OutputEdgeSchema], // without the to property
		fluidModels: [{ type: Schema.Types.ObjectId, ref: 'assumptions', default: null }], // update this when save facility
	},
	{ timestamps: true }
);

FacilitySchema.index({ project: 1, name: 1 }, { unique: true });

enforceValidateBeforeUpdate(FacilitySchema);
