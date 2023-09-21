import yaml from 'js-yaml';
import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { getApi, putApi } from '@/helpers/routing';

export function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const dumpJsonAsYaml = (config: Record<string, any>) => yaml.dump(config);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const loadYaml = (configuration: string | Record<string, any>) => {
	if (configuration === '') {
		return {};
	} else {
		try {
			return yaml.load(configuration);
		} catch (e) {
			return {};
		}
	}
};

export const useDataSources = () => {
	const { data } = useQuery(['data-sources'], () => getApi('/data-sync/data-sources'));
	return (
		(data?.items ?? []).map((el) => ({
			value: el.id,
			label: el.name,
		})) ?? []
	);
};

export const useDataDirections = () => {
	const { data } = useQuery(['data-directions'], () => getApi('/data-sync/data-directions'));
	return (
		(data ?? []).map((el) => ({
			value: el.id,
			label: el.name,
		})) ?? []
	);
};

export const useLoadDataType = () => {
	const { data } = useQuery(['data-load-types'], () => getApi('/data-sync/data-load-types'));
	return (
		(data ?? []).map((el) => ({
			value: el.id,
			label: el.name,
		})) ?? []
	);
};

export const usePipeline = (pipelineId: string, flowId: string, queryOptions = {}) => {
	const queryKey = useMemo(() => ['dataSync', 'pipelines', pipelineId], [pipelineId]);
	const {
		isFetching: loading,
		data,
		error,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useQuery(queryKey, () => getApi<any>(`/data-sync/data-flows/${flowId}/pipelines/${pipelineId}`), queryOptions);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const mutation = useMutation((update: Record<string, any>) =>
		putApi(`/data-sync/data-sets/${update.dataSetId}`, update.body)
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const pipelineMutation = useMutation((update: Record<string, any>) =>
		putApi(`/data-sync/data-flows/${update.dataFlowId}/data-pipelines/${update.dataflowPipelineId}`, update.body)
	);

	return { pipelineMutation, mutation, loading, error, data };
};
