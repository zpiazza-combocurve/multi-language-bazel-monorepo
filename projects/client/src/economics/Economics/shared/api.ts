import { IServerSideGetRowsRequest } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { Setting } from '@/economics/shared/types';
import { deleteApi, downloadExport, downloadFileApi, getApi, postApi, putApi } from '@/helpers/routing';
import { useCurrentScenario } from '@/scenarios/api';

const emptyPromiseFn = () => Promise.resolve(undefined);

// TODO revise possible garbage collection issues
function useAsyncFnWrapper(mounted, fn) {
	return useCallback(
		(...params) => {
			if (!mounted.current) {
				return emptyPromiseFn();
			}
			return fn(...params).then((result) => (mounted.current ? result : emptyPromiseFn()));
		},
		[mounted, fn]
	);
}

// TODO remove wrappers
function useApi() {
	const mounted = useRef(true);
	useEffect(() => {
		return () => {
			mounted.current = false;
		};
	}, []);
	return {
		deleteApi: useAsyncFnWrapper(mounted, deleteApi),
		downloadFileApi: useAsyncFnWrapper(mounted, downloadFileApi),
		getApi: useAsyncFnWrapper(mounted, getApi),
		postApi: useAsyncFnWrapper(mounted, postApi),
		putApi: useAsyncFnWrapper(mounted, putApi),
	};
}

export function getUserRun(scenarioId: string) {
	return getApi<Inpt.EconRun>('/economics/getUserRun', { scenario: scenarioId });
}

export function useUserRun(id?: string) {
	const { scenario } = useCurrentScenario();
	const scenarioId = id ?? scenario?._id;

	const queryKey = ['economics', 'run', 'user-run', scenarioId];

	const { data: run, isFetching: loading } = useQuery(queryKey, () =>
		getApi('/economics/getUserRun', { scenario: scenarioId })
	);

	const queryClient = useQueryClient();

	const invalidate = () => queryClient.invalidateQueries(queryKey);

	return { run, loading, queryKey, invalidate };
}

export function useEconomicsApi() {
	const { postApi } = useApi();
	return useMemo(() => {
		function getRunSumByIds(runId, econRunDataIds) {
			return postApi(`/economics/getRunSumByIds/${runId}`, { econRunDataIds });
		}

		function getRunSumAgGrid(runId, request: IServerSideGetRowsRequest, econRunDataIds) {
			return postApi(`/economics/getRunSumAgGrid/${runId}`, { request, econRunDataIds });
		}

		async function loadLastRun(scenarioId) {
			const { econRunData, run } = await getApi(`/economics/getLastRunSum/${scenarioId}`);
			const response = await getRunSumByIds(run._id, [econRunData[0]?._id]);
			const firstEconRun = response[0]?.oneLinerData ?? null;
			return {
				econRunData,
				run,
				firstEconRun,
			};
		}

		function loadPivotTables(scenarioId) {
			return getApi(`/economics/getPivotTables/${scenarioId}`);
		}

		function loadUserRun(scenarioId) {
			return getApi('/economics/getUserRun', { scenario: scenarioId });
		}

		function loadWellHeaderValues(wells, headers, comboName) {
			return postApi('/well/getWellHeaderValues', { wells, headers, comboName });
		}

		function getWellIds(wells, search) {
			return postApi('/well/getWellsBySearch', { wells, search });
		}

		function buildByWellYearly({ fileName, runId, timeZone }) {
			return postApi('/economics/buildByWellYearly', {
				fileName,
				econRun: runId,
				timeZone,
			});
		}

		function buildGroupSumMonthly({ fileName, runId, timeZone }) {
			return postApi('/economics/buildGroupSumMonthly', {
				fileName,
				econRun: runId,
				timeZone,
			});
		}

		function buildGroupSumYearly({ fileName, runId, timeZone }) {
			return postApi('/economics/buildGroupSumYearly', {
				fileName,
				econRun: runId,
				timeZone,
			});
		}

		async function getTaskProgress(id) {
			const { progress } = (await getApi(`/task/get-by-kind-id/${id}`)) ?? {};
			const { complete, failed, total } = progress ?? {
				complete: 2,
				failed: 0,
				total: 100,
			};
			return Math.round(((complete + failed) / total) * 100);
		}

		return {
			downloadExport,
			getRunSumByIds,
			getRunSumAgGrid,
			getTaskProgress,
			getWellIds,
			loadLastRun,
			buildByWellYearly,
			buildGroupSumMonthly,
			buildGroupSumYearly,
			loadPivotTables,
			loadUserRun,
			loadWellHeaderValues,
		};
	}, [postApi]);
}

export function useSettings() {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['economics', 'settings'], []);
	const { isLoading, data: settings } = useQuery(queryKey, () => getApi('/economics/settings') as Promise<Setting[]>);
	const mutate = useCallback(
		(newSettings) => {
			queryClient.setQueryData(queryKey, newSettings);
		},
		[queryClient, queryKey]
	);
	const invalidateSettings = useCallback(() => queryClient.invalidateQueries(queryKey), [queryClient, queryKey]);

	return {
		settings,
		mutate,
		isLoading,
		queryKey,
		invalidateSettings,
	};
}

export function useReportSettings() {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['economics', 'report-settings'], []);
	const { isLoading, data: settings } = useQuery(
		queryKey,
		() => getApi('/economics/report-settings') as Promise<{ _id: string; headers: string[] }[]>
	);
	const mutate = useCallback(
		(newSettings) => {
			queryClient.setQueryData(queryKey, newSettings);
		},
		[queryClient, queryKey]
	);
	const invalidateSettings = useCallback(() => queryClient.invalidateQueries(queryKey), [queryClient, queryKey]);

	return {
		settings,
		mutate,
		isLoading,
		queryKey,
		invalidateSettings,
	};
}

export function useComboSettings(scenarioId, projectId) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['econ-combo', 'settings', scenarioId, projectId], [scenarioId, projectId]);
	const { isLoading, data: settings } = useQuery(queryKey, () =>
		scenarioId
			? getApi('/econ-combo-settings', {
					scenarioId,
					projectId,
			  })
			: Promise.resolve(null)
	);
	const mutate = useCallback(
		(newSettings) => {
			queryClient.setQueryData(queryKey, newSettings);
		},
		[queryClient, queryKey]
	);
	const invalidateSettings = useCallback(() => queryClient.invalidateQueries(queryKey), [queryClient, queryKey]);

	return {
		settings,
		mutate,
		isLoading,
		queryKey,
		invalidateSettings,
	};
}
