import type { ObjectId } from 'mongodb';

import type { NodeByTypeMap, NodeType } from './network-shared';

interface NodeModelCustom<T extends NodeType = NodeType> {
	_id: ObjectId;

	createdAt: Date;
	updatedAt: Date;

	createdBy: ObjectId;
	updatedBy: ObjectId;

	name: string;
	project: ObjectId;

	type: T;
	params: NodeByTypeMap[T]['params'];
	description: string;

	tags: ObjectId[];
}

export type NodeModel = {
	[K in NodeType]: NodeModelCustom<K>;
}[NodeType];
