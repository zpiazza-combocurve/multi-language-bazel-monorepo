import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { getApi } from '@/helpers/routing';
import { moduleUrls } from '@/routes/generate-routes';

export const dataSyncRoutes = moduleUrls('data-sync/data-flows', {
	view: moduleUrls('view', {
		root: '',
		pipelines: moduleUrls('pipelines', {
			root: '',
		}),
	}),
	runs: moduleUrls('runs', {
		root: '',
		pipelines: 'pipelines',
		pipelineDetails: moduleUrls('pipelines', {
			root: '',
		}),
	}),
});

export const useDataFlow = (id: string, queryOptions = {}) => {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['dataSync', 'dataFlow', id], [id]);
	const {
		isFetching: loading,
		data,
		error,
		refetch,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useQuery(queryKey, () => getApi<any>(`/data-sync/data-flows/${id}`), queryOptions);
	const refresh = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);
	return { refetch, loading, data, refresh, error };
};
