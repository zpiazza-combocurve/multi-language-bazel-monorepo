import type { ObjectId } from 'mongodb';

import type { Edge, Node } from './network-shared';

export interface Network {
	_id: ObjectId;
	createdAt: Date;
	updatedAt: Date;

	createdBy: ObjectId;
	project: ObjectId;

	name: string;

	nodes: Node[];
	edges: Edge[];

	wells: ObjectId[];
	facilities: ObjectId[];
	fluidModels: ObjectId[];
	nodeModels: ObjectId[];
}
