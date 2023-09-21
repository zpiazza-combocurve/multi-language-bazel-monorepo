import { format, parseISO } from 'date-fns';
import styled from 'styled-components';

import { Box } from '@/components/v2';
import { navigate } from '@/helpers/history';

import { useAgentVersions } from '../agent-instances/Agents.hooks';
import { SimpleTable } from '../components/SimpleTable';
import { useFailedScheduleDataFlows, useOutdatedAgents, useWaitingDataFlows } from './Dashboard.hooks';

const Container = styled(Box)`
	display: flex;
	flexwrap: wrap;
	gap: 1rem;
	margin: 16px 16px 0 16px;
	justifycontent: space-around;
`;

const formatDate = (value) => {
	if (!value) {
		return 'N/A';
	}
	return format(parseISO(value), 'MM/dd/yyyy, HH:mm aa, z');
};

type Version = {
	version: string;
	isPrerelease: boolean;
};

const getLatestVersion = (versions?: Version[]) => {
	if (!versions) {
		return undefined;
	}

	return versions[versions.length - 1].version;
};

export const Dashboard = () => {
	const { data: waitingData, isFetching: waitingLoading } = useWaitingDataFlows();
	const { data: failedScheduleData, isFetching: scheduledLoading } = useFailedScheduleDataFlows();
	const { data: agentsData, isFetching: agentsLoading } = useOutdatedAgents();
	const { data: versions } = useAgentVersions();
	const latestVersion = getLatestVersion(versions);

	return (
		<Container>
			<SimpleTable
				name='Waiting  Data Flows'
				loading={waitingLoading}
				onClick={() => navigate('/data-sync/data-flows')}
				onClickDetail={({ dataFlowId }) => navigate(`data-sync/data-flows/${dataFlowId}/view`)}
				columns={[
					{ name: 'Name', key: 'dataFlowName' },
					{ name: 'Has schedule', key: 'hasSchedulePlan', getValue: ({ value }) => (value ? 'Yes' : 'No') },
					{ name: 'Next run  Starts', key: 'nextRunStartsAt', getValue: ({ value }) => formatDate(value) },
				]}
				data={waitingData}
			/>
			<SimpleTable
				name='Failed Scheduled DataFlows'
				loading={scheduledLoading}
				onClick={() => navigate('/data-sync/data-flows')}
				onClickDetail={({ dataFlowId }) => navigate(`data-sync/data-flows/${dataFlowId}/view`)}
				columns={[
					{ name: 'Name', key: 'dataFlowName' },
					{ name: 'Scheduled', key: 'schedulePlan', getValue: ({ value }) => (value ? 'Yes' : 'No') },
					{
						name: 'Running',
						key: 'currentRunStartedAt',

						getValue: ({ value }) => (value ? 'Yes' : 'No'),
					},

					{
						name: 'Last Successful Run',
						key: 'lastSuccessRunEndedAt',
						getValue: ({ value }) => formatDate(value),
					},
					{
						name: 'Last Run',
						key: 'lastRunEndedAt',

						getValue: ({ value }) => formatDate(value),
					},
					{
						name: 'Next Run',
						key: 'nextRunStartsAt',

						getValue: ({ value }) => formatDate(value),
					},
				]}
				data={failedScheduleData}
			/>

			<SimpleTable
				name='Outdated Agents'
				loading={agentsLoading}
				onClickDetail={({ agentInstanceId }) => navigate(`data-sync/agents/instances/${agentInstanceId}`)}
				onClick={() => navigate('/data-sync/agents/list')}
				columns={[
					{ name: 'Name', key: 'agent' },
					{ name: 'Version', key: 'version', getValue: ({ value }) => value?.split('+')?.[0] },
					{ name: 'Latest Version', key: 'any', getValue: () => latestVersion },
				]}
				data={agentsData}
			/>
		</Container>
	);
};
