import { useParams } from 'react-router-dom';

import { ModuleNavigation } from '@/helpers/Navigation';
import { useLoadingBar } from '@/helpers/alerts';
import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { dataSyncRoutes, useDataFlow } from './DataFlowDetail.hooks';
import { OverviewModule } from './DataFlowModule';
import { DataFlowRunDetail } from './runs/DataFlowRunDetail';

export const DataFlowDetail = () => {
	const { dataFlowId } = useParams() as { dataFlowId: string };
	const { loading, data } = useDataFlow(dataFlowId);
	useLoadingBar(loading);
	const dataFlowName = data?.dataFlow ? data.dataFlow.name : 'Data FLow';
	const viewUrl = `/data-sync/data-flows/${dataFlowId}`;

	return (
		<>
			<Breadcrumb url={dataSyncRoutes(dataFlowId).view('').root} label={loading ? 'Loading' : dataFlowName} />

			<ModuleNavigation
				default={`${viewUrl}/view`}
				sharedProps={{ dataFlowId, data, loading }}
				pages={[
					{
						component: OverviewModule,
						path: `${viewUrl}/view`,
						label: 'Overview',
					},
					{
						component: DataFlowRunDetail,
						path: `${viewUrl}/runs`,
						label: 'Runs',
					},
				]}
			/>
		</>
	);
};
