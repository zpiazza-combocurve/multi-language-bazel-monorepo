import { useMemo } from 'react';
import { useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

export const useWaitingDataFlows = () => {
	const { data, isFetching } = useQuery(['waiting_dataflows'], () =>
		getApi('/data-sync/analytics/waiting_dataflows', {})
	);
	const mapped = useMemo(() => data?.map((el) => ({ ...el, id: el.dataFlowId })), [data]);

	return { data: mapped, isFetching };
};

export const useOutdatedAgents = () => {
	const { data, isFetching } = useQuery(['outdated_agents'], () =>
		getApi('/data-sync/analytics/outdated_agents', {})
	);
	const mapped = useMemo(() => data?.map((el) => ({ ...el, id: el.agentInstanceId })), [data]);

	return { data: mapped, isFetching };
};

export const useFailedScheduleDataFlows = () => {
	const { data, isFetching } = useQuery(['scheduled_dataflows'], () =>
		getApi('/data-sync/analytics/failing_scheduled_dataflows', {})
	);
	const mapped = useMemo(() => data?.map((el) => ({ ...el, id: el.dataFlowId })) ?? [], [data]);

	return { data: mapped, isFetching };
};
