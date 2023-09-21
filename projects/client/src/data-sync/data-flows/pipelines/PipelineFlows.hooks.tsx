import { sortBy } from 'lodash-es';
import { useMemo } from 'react';
import { MarkerType, Node } from 'react-flow-renderer';
import { useQuery } from 'react-query';

import { Typography } from '@/components/v2';
import { getApi } from '@/helpers/routing';

const calculateCoordinates = (index, position = 'x') => {
	if (position === 'x') {
		return index * 220;
	}
	if (position === 'y') {
		return 40;
	}
};

export const usePipelineRun = (pipelineId?: string | null) => {
	const { data } = useQuery(
		['queries', 'pipelineRun', pipelineId],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		() => getApi<any>(`/data-sync/data-flows/pipeline-runs/${pipelineId}`),
		{
			enabled: !!pipelineId,
		}
	);
	return data;
};

export const usePipelineConfig = (id: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { data, isLoading } = useQuery(['queries', id], () => getApi<any>(`/data-sync/data-flows/${id}/pipelines`));
	return useMemo(() => {
		if (isLoading) {
			return {
				nodes: [],
				edges: [],
			};
		}

		const nodes = sortBy(data?.items ?? [], ['dataPipelineOrder']).map(
			(pipeline, index) =>
				({
					id: pipeline.id,
					type: 'default',
					data: {
						label: (
							<Typography variant='body2' color='primary'>
								{pipeline.name}
							</Typography>
						),
						extra: pipeline,
					},
					targetPosition: 'left',
					sourcePosition: 'right',
					position: { x: calculateCoordinates(index, 'x'), y: calculateCoordinates(index, 'y') },
					style: {
						background: 'var(--background-opaque)',
						border: '1px solid ##12c498',
					},
				} as Node)
		);
		const edges = nodes
			.map((node, idx) => [node, nodes[idx + 1]])
			.filter(([left, right]) => !!right && !!left)
			.map(([edgeLeft, edgeRight]) => ({
				id: `${edgeLeft.id}-${edgeRight.id}`,
				source: edgeLeft.id,
				target: edgeRight.id,
				type: 'step',
				animated: true,
				markerEnd: {
					type: MarkerType.Arrow,
				},
				markerStart: {
					type: MarkerType.Arrow,
				},
			}));
		return {
			nodes,
			edges,
		};
	}, [data, isLoading]);
};
