import _ from 'lodash-es';
import { useEffect, useRef } from 'react';
import { useQueries } from 'react-query';

import { useCallbackRef, useMergedState } from '@/components/hooks';
import {
	fetchDeterministicChartData,
	fetchWellStatus,
	KEYS as forecastApiKeys,
	KEYS_BY_FORECAST as forecastApiKeysByForecast,
	KEYS_BY_WELL as forecastApiKeysByWell,
	useDeterministicGridChartData,
} from '@/forecasts/api';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDebounce } from '@/helpers/debounce';
import {
	getProjectCustomHeadersData,
	getProjectHeadersDataMap,
	prefetchProjectHeadersDataMap,
	prefetchProjectHeadersQuery,
	useProjectHeadersQuery,
} from '@/helpers/project-custom-headers';
import { DEFAULT_QUERY_OPTIONS, queryClient } from '@/helpers/query-cache';

import {
	fetchComparisonChartData,
	useComparisonGridChartData,
} from '../charts/components/deterministic/grid-chart/api';

type PrefetchArray = Array<Promise<void>>;

const useGridChartData = ({
	curWellIds,
	forecastId,
	getPageIds,
	pagesToCache = 2,
	isComparisonActive,
	comparisonIds,
}: {
	comparisonIds?: string[];
	curWellIds: Array<string>;
	forecastId?: string;
	getPageIds: (pages: number) => string[][];
	isComparisonActive?: boolean;
	pagesToCache?: number;
}) => {
	const { project } = useAlfa();

	const {
		query: { data: detQueryData, isLoading: isLoadingDetQueryData },
	} = useDeterministicGridChartData({
		forecastId,
		wells: curWellIds,
		options: { enabled: Boolean(curWellIds.length && !isComparisonActive) },
	});

	const {
		query: { data: comparisonQueryData, isLoading: isLoadingComparisonQueryData },
	} = useComparisonGridChartData({
		forecastId,
		wells: curWellIds,
		comparisonIds,
		options: { enabled: Boolean(curWellIds?.length) && Boolean(comparisonIds?.length) && isComparisonActive },
	});

	const queryData = isComparisonActive ? comparisonQueryData : detQueryData;
	const isLoadingQueryData = isComparisonActive ? isLoadingComparisonQueryData : isLoadingDetQueryData;

	useProjectHeadersQuery(project?._id, DEFAULT_QUERY_OPTIONS);

	// forecast statuses for current page
	useQueries({
		queries: curWellIds.map((id) => {
			return {
				queryKey: forecastApiKeys.status(forecastId, id),
				queryFn: () => fetchWellStatus(forecastId, id),
			};
		}, DEFAULT_QUERY_OPTIONS),
	});

	// project custom well headers for current page
	useQueries({
		queries: curWellIds.map(
			(id) => {
				return {
					queryKey: ['project-custom-headers-data', project?._id, [id]],
					queryFn: () => getProjectCustomHeadersData(project?._id as string, [id]),
				};
			},
			{
				select: getProjectHeadersDataMap,
				enabled: !!project?._id,
				...DEFAULT_QUERY_OPTIONS,
			}
		),
	});

	const [detGridChartData, setDetGridChartData] = useMergedState({});
	const [comparisonGridChartData, setComparisonGridChartData] = useMergedState({});

	const detDataRef = useRef({});
	const comparisonDataRef = useRef({});

	const gridChartData = isComparisonActive ? comparisonGridChartData : detGridChartData;
	const setGridChartData = isComparisonActive ? setComparisonGridChartData : setDetGridChartData;
	const dataRef = isComparisonActive ? comparisonDataRef : detDataRef;

	const dataIsReady = _.every(curWellIds, (id) => Object.keys(gridChartData).includes(id));

	const runPrefetch = useDebounce(async () => {
		if (!(project?._id && forecastId)) {
			return;
		}

		const nextWellIds = getPageIds(pagesToCache);
		const prevWellIds = getPageIds(-pagesToCache);

		const prefetchProms = _.reduce(
			[..._.flatten(nextWellIds), ..._.flatten(prevWellIds)],
			(acc: PrefetchArray, wellId) => {
				// project custom headers
				acc.push(prefetchProjectHeadersQuery(project._id));
				acc.push(prefetchProjectHeadersDataMap(project._id, [wellId]));

				// wellStatus
				acc.push(
					queryClient.prefetchQuery(
						forecastApiKeys.status(forecastId, wellId),
						() => fetchWellStatus(forecastId, wellId),
						DEFAULT_QUERY_OPTIONS
					)
				);

				return acc;
			},
			[]
		);

		const fetchData = isComparisonActive ? fetchComparisonChartData : fetchDeterministicChartData;
		if (nextWellIds.length) {
			_.forEach(nextWellIds, (nextPageIds) => {
				const body = isComparisonActive ? { wells: nextPageIds, comparisonIds } : { wells: nextPageIds };
				prefetchProms.push(
					queryClient.prefetchQuery(
						isComparisonActive
							? forecastApiKeys.comparisonGridChartData(forecastId, comparisonIds, nextPageIds)
							: forecastApiKeys.detGridChartData(forecastId, nextPageIds),
						() => fetchData(forecastId, body),
						DEFAULT_QUERY_OPTIONS
					)
				);
			});
		}

		if (prevWellIds.length) {
			_.forEach(prevWellIds, (prevPageIds) => {
				const body = isComparisonActive ? { wells: prevPageIds, comparisonIds } : { wells: prevPageIds };
				prefetchProms.push(
					queryClient.prefetchQuery(
						isComparisonActive
							? forecastApiKeys.comparisonGridChartData(forecastId, comparisonIds, prevPageIds)
							: forecastApiKeys.detGridChartData(forecastId, prevPageIds),
						() => fetchData(forecastId, body),
						DEFAULT_QUERY_OPTIONS
					)
				);
			});
		}

		try {
			await Promise.all(prefetchProms);
		} catch (error) {
			genericErrorAlert(error);
		}
	}, 2500);

	const invalidateAll = useCallbackRef(() => {
		queryClient.invalidateQueries(forecastApiKeys.proximityWellList(forecastId));
		queryClient.invalidateQueries(forecastApiKeysByForecast.comparisonGridChartData({ forecastId }));
		queryClient.invalidateQueries(forecastApiKeysByForecast.detGridChartData({ forecastId }));
		queryClient.invalidateQueries(forecastApiKeysByForecast.proximityForecastData({ forecastId }));
		queryClient.invalidateQueries(forecastApiKeysByForecast.status({ forecastId }));

		// removeQueries can be used to prevent showing outdated background data, if necessary.
		// Currently, previous bg data will display shortly until replaced with new data.
		queryClient.invalidateQueries(forecastApiKeysByForecast.proximityForecastRawBGData({ forecastId }));
		runPrefetch();
	});

	const invalidateByWellId = useCallbackRef((wellId) => {
		queryClient.invalidateQueries(forecastApiKeys.proximityWellList(forecastId));

		// clears query for charts using individual well data
		queryClient.invalidateQueries(forecastApiKeysByWell.comparisonChartData({ forecastId, wellId }));
		queryClient.invalidateQueries(forecastApiKeysByWell.detChartData({ forecastId, wellId }));
		queryClient.invalidateQueries(forecastApiKeysByWell.proximityForecastData({ forecastId, wellId }));
		queryClient.invalidateQueries(forecastApiKeysByWell.proximityForecastRawBGData({ forecastId, wellId }));
		queryClient.invalidateQueries(forecastApiKeysByWell.status({ forecastId, wellId }));

		// clears query for charts on grid
		queryClient.invalidateQueries(forecastApiKeysByForecast.detGridChartData({ forecastId }));
		queryClient.invalidateQueries(forecastApiKeysByForecast.comparisonGridChartData({ forecastId }));
	});

	// add uncached wells / wells with new forecasts to the cache
	useEffect(() => {
		if (!isLoadingQueryData) {
			const currentData = dataRef.current;
			const newData = _.reduce(
				queryData,
				(result, forecastData, wellId) => {
					if (!(currentData[wellId] && _.isEqual(forecastData, currentData[wellId]))) {
						result[wellId] = forecastData;
						return result;
					}

					return result;
				},
				{}
			);

			if (Object.keys(newData).length) {
				setGridChartData((curData) => {
					dataRef.current = { ...curData, ...newData };
					return newData;
				});
			}
		}
	}, [dataRef, isLoadingQueryData, queryData, setGridChartData]);

	// run prefetch
	useEffect(() => {
		if (!isLoadingQueryData) {
			runPrefetch();
		}
	}, [isLoadingQueryData, runPrefetch, curWellIds]);

	return {
		gridChartData,
		isLoading: isLoadingQueryData || !dataIsReady,
		invalidateAll,
		invalidateByWellId,
	};
};

export default useGridChartData;
