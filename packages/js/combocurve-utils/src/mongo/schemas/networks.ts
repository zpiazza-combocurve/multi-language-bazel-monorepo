import { Schema } from 'mongoose';

import { NetworkEdgeSchema, NetworkNodeSchema, enforceValidateBeforeUpdate } from './network/shared';
import { Network } from './network/types';

export const NetworkSchema = new Schema<Network>(
	{
		createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
		name: { type: String, required: true },
		project: { type: Schema.Types.ObjectId, ref: 'projects', index: true },
		// tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }], // TODO tags
		nodes: [NetworkNodeSchema],
		edges: [NetworkEdgeSchema],
		// they will be updated when click save networks
		fluidModels: [{ type: Schema.Types.ObjectId, ref: 'assumptions', default: null }],
		wells: [{ type: Schema.Types.ObjectId, ref: 'wells', default: null }],
		facilities: [{ type: Schema.Types.ObjectId, ref: 'facilities', default: null }],
		copiedFrom: { type: Schema.Types.ObjectId, ref: 'networks', default: null },
	},
	{ timestamps: true }
);

NetworkSchema.index({ project: 1, name: 1 }, { unique: true });
enforceValidateBeforeUpdate(NetworkSchema);

export default { NetworkSchema };
