import type { ObjectId } from 'mongodb';

import type { Edge, InputEdge, Node, OutputEdge } from './network-shared';

export interface Facility {
	_id: ObjectId;
	createdAt: Date;
	updatedAt: Date;

	createdBy: ObjectId;
	project: ObjectId;

	name: string;

	nodes: Node[];
	edges: Edge[];
	inputs: InputEdge[];
	outputs: OutputEdge[];

	fluidModels: ObjectId[];
	nodeModels: ObjectId[];
}
