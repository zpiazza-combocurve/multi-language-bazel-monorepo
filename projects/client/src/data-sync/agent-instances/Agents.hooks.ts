import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { getApi, postApi } from '@/helpers/routing';

export const useAgentVersions = () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const result = useQuery(['agent-instance', 'updates'], () => getApi<any>(`/data-sync/agent-instances/versions`));
	return result;
};

export const useCompareVersions = (currentVersion, versions) => {
	const currentVersionIndex = (versions ?? []).findIndex(
		// we need to add the trailing dot to avoid false positives on 0.1.0 === 0.1.0.beta.1+2
		({ version }) => currentVersion === version || currentVersion?.startsWith(`${version}.`)
	);
	return versions?.length && currentVersionIndex === 0;
};

export const useAgentInstanceUpdate = () => {
	const mutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(data: Record<string, string>) => postApi('/data-sync/agent-instances/request_update', data) as Promise<any>,
		{}
	);

	return { mutation };
};

export const useAgentInstance = (id: string, queryOptions = {}) => {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['dataSync', 'agentInstance', id], [id]);
	const {
		isFetching: loading,
		data,
		error,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useQuery(queryKey, () => getApi<any>(`/data-sync/agent-instances/${id}`), queryOptions);
	const refresh = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);
	return { loading, data, refresh, error };
};
