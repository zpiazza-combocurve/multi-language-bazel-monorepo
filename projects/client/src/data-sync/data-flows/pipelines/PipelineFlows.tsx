import React, { useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, addEdge, useEdgesState, useNodesState } from 'react-flow-renderer';

import { usePipelineConfig } from './PipelineFlows.hooks';

type PipelineFlows = {
	id: string;
	onDetailClick?: (e, node) => void;
	onDelete?: (id: string) => void;
};

export const PipelineFlows: React.FC<PipelineFlows> = ({ id, onDetailClick, onDelete }) => {
	const pipelineConfig = usePipelineConfig(id);

	const [nodes, setNodes, onNodesChange] = useNodesState(pipelineConfig.nodes);
	/* eslint-enable  @typescript-eslint/no-unused-vars */
	const [edges, setEdges, onEdgesChange] = useEdgesState(pipelineConfig.edges);
	const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
	const onNodesDelete = useCallback(
		([node]) => {
			const {
				data: {
					extra: { id },
				},
			} = node;
			onDelete?.(id);
		},
		[onDelete]
	);

	useEffect(() => {
		setEdges(pipelineConfig.edges);
		setNodes(pipelineConfig.nodes);
	}, [pipelineConfig, setEdges, setNodes]);

	if (!id) {
		return null;
	}

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onNodesDelete={onNodesDelete}
			onConnect={onConnect}
			onNodeClick={onDetailClick}
			fitView
			attributionPosition='top-right'
			data-testid='data-flow-body'
		>
			<Controls />
			<Background color='#aaa' gap={16} />
		</ReactFlow>
	);
};
