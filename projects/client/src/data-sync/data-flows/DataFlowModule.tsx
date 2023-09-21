import { Route, Routes, useNavigate } from 'react-router-dom';

import { Overview } from './DataFlowOverview';
import { OverviewDetail } from './OverviewDetail';

const pipelinePath = `/pipelines/:pipelineId`;

export const OverviewModule = ({ dataFlowId }) => {
	const navigate = useNavigate();

	const onDetailClick = (e, node) => {
		const pipeline = node.data.extra;
		navigate(`/data-sync/data-flows/${dataFlowId}/view/pipelines/${pipeline.dataPipelineId}`);
	};

	return (
		<Routes>
			<Route path={pipelinePath} element={<OverviewDetail dataFlowId={dataFlowId} />} />
			<Route path='*' element={<Overview onDetailClick={onDetailClick} dataFlowId={dataFlowId} />} />
		</Routes>
	);
};
