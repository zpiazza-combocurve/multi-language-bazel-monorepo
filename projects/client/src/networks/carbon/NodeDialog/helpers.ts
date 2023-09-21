import { NodeModel } from '@combocurve/types/client';
import { Client } from '@combocurve/types/helpers';
import { Node } from '@combocurve/types/schemas/network-shared-nodes';

import { assert } from '@/helpers/utilities';

import { DEFAULT_NODE_DATA } from '../shared';
import { NodeType } from '../types';
import { FormValues, NodeDialogMode } from './NodeDialog.types';

interface InitialNodeFormData {
	type: NodeType;
	nodeModel?: string | null;
	initialValues: FormValues;
}

export function getInitialNodeFormData({
	mode,
	node,
	type,
	nodeModel,
}: {
	mode: NodeDialogMode;
	node?: Client<Node>;
	type?: NodeType;
	nodeModel?: NodeModel;
}): InitialNodeFormData {
	if (mode === NodeDialogMode.node) {
		assert(node, 'Node is required in node mode');
		return {
			type: node.type,
			nodeModel: node.nodeModel,
			initialValues: {
				mode,
				type: node.type,
				name: node.name,
				description: node.description ?? '',
				nodeModelName: '',
				nodeModelDescription: nodeModel?.description ?? '',
				...(nodeModel?.params ?? node.params),
			},
		};
	} else {
		if (!nodeModel) {
			assert(type, 'Type is required when creating new model');
			return {
				type,
				nodeModel: undefined,
				initialValues: {
					mode,
					type,
					// TODO: fix schema instead of passing dummy values
					name: 'Dummy',
					description: 'Dummy',
					nodeModelName: '',
					nodeModelDescription: '',
					...DEFAULT_NODE_DATA[type],
				},
			};
		}
		return {
			type: nodeModel.type,
			nodeModel: nodeModel._id,
			initialValues: {
				mode,
				type: nodeModel.type,
				name: 'Dummy',
				description: 'Dummy',
				nodeModelName: '',
				nodeModelDescription: nodeModel.description,
				...nodeModel.params,
			},
		};
	}
}
