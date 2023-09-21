import { faCompress, faExpand } from '@fortawesome/pro-regular-svg-icons';
import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { Box, IconButton } from '@/components/v2';

import { Expandable } from '../../components/Expandable';
import { PipelineDetail } from '../pipelines/PipelineDetail';
import { usePipelineRun } from '../pipelines/PipelineFlows.hooks';
import { PipelinesTable } from '../pipelines/Pipelines';
import { DataFlowRunsTable } from './DataFlowRuns';

export const DataFlowRunDetail = () => {
	const { dataFlowId } = useParams() as { dataFlowId: string };
	const [params] = useSearchParams();
	const initialRun = params.get('runId') ? { id: params.get('runId') } : undefined;
	const [dataFlowRun, setDataFlowRun] = useState(initialRun);

	const [expanded, setExpanded] = useState({
		runs: false,
		pipelines: false,
		pipeline: false,
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [pipelineRun, setPipelineRun] = useState<any>(null);
	const onRowClick = ({ data }) => {
		setDataFlowRun(data);
	};
	const defaultRun = usePipelineRun(params.get('pipelineId'));

	const pipelineLabels = useMemo(() => {
		const runs = pipelineRun ? [{ name: pipelineRun.dataPipelineName }] : undefined;
		if (!runs && defaultRun) {
			return [
				{
					name: defaultRun.dataPipelineName,
				},
			];
		}
	}, [defaultRun, pipelineRun]);

	const onClickRun = ({ data }) => {
		setPipelineRun(data);
	};

	return (
		<Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
			<Expandable
				isExpanded={expanded.runs}
				onChange={() => {
					setExpanded({
						pipelines: false,
						pipeline: false,
						runs: !expanded.runs,
					});
				}}
				style={{ flex: '1 1 auto', width: '100%', height: '100%' }}
			>
				{({ expandStyles, toggleExpand, isExpanded }) => (
					<Box sx={{ flex: '0.20 1 auto', ...expandStyles }}>
						<DataFlowRunsTable
							globalActions={
								<IconButton onClick={toggleExpand}>{isExpanded ? faCompress : faExpand}</IconButton>
							}
							dataFlowId={dataFlowId}
							onClick={onRowClick}
						/>
					</Box>
				)}
			</Expandable>

			<Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 18, flex: '0.78 1 auto' }}>
				<Expandable
					isExpanded={expanded.pipelines}
					onChange={() => {
						setExpanded({
							pipelines: !expanded.pipelines,
							pipeline: false,
							runs: false,
						});
					}}
				>
					{({ isExpanded, expandStyles, toggleExpand }) => (
						<Box sx={{ flex: '0.5 1 auto', height: '300px', ...expandStyles }}>
							<PipelinesTable
								onClick={onClickRun}
								dataFlowId={dataFlowId}
								runId={dataFlowRun?.id}
								labels={dataFlowRun ? [{ name: `id:${dataFlowRun.id}` }] : undefined}
								globalActions={
									<IconButton onClick={toggleExpand}>{isExpanded ? faCompress : faExpand}</IconButton>
								}
							/>
						</Box>
					)}
				</Expandable>
				<Expandable
					isExpanded={expanded.pipeline}
					onChange={() => {
						setExpanded({
							pipelines: false,
							pipeline: !expanded.pipeline,
							runs: false,
						});
					}}
				>
					{({ expandStyles, toggleExpand, isExpanded }) => (
						<Box sx={{ flex: '0.5 1 auto', height: '300px', ...expandStyles }}>
							<PipelineDetail
								dataFlowId={dataFlowId}
								runId={dataFlowRun?.id}
								labels={pipelineLabels}
								pipelineId={pipelineRun?.id || params.get('pipelineId')}
								globalActions={
									<IconButton onClick={toggleExpand}>{isExpanded ? faCompress : faExpand}</IconButton>
								}
							/>
						</Box>
					)}
				</Expandable>
			</Box>
		</Box>
	);
};
