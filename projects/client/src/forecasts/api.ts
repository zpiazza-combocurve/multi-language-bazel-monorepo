import _ from 'lodash';
import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';

import { alerts } from '@/components/v2';
import { CALCULATED_WELL_HEADERS, EXTENDED_WELL_HEADERS } from '@/forecasts/charts/components/graphProperties';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { errorFromInfo } from '@/helpers/errors';
import { DEFAULT_QUERY_OPTIONS, queryClient } from '@/helpers/query-cache';
import { getApi, postApi, putApi } from '@/helpers/routing';

import { Phase } from './forecast-form/automatic-form/types';
import { ProjectForecastItem } from './types';

export const BASE_KEYS: Record<string, { key: Array<string>; forecastScope: boolean; wellScope: boolean }> = {
	allProjectForecasts: {
		key: ['forecastContainer', 'forecast', 'allForecasts'],
		forecastScope: false,
		wellScope: false,
	},
	comparisonChartData: { key: ['forecast', 'comparisonChartData'], forecastScope: true, wellScope: true },
	comparisonGridChartData: { key: ['forecast', 'comparisonGridChartData'], forecastScope: true, wellScope: false },
	detChartData: { key: ['forecast', 'detChartData'], forecastScope: true, wellScope: true },
	detGridChartData: { key: ['forecast', 'detGridChartData'], forecastScope: true, wellScope: false },
	forecastBucket: { key: ['forecastContainer', 'forecast', 'bucket'], forecastScope: true, wellScope: false },
	forecastDocument: { key: ['forecastContainer', 'forecast', 'document'], forecastScope: true, wellScope: false },
	forecastNames: { key: ['forecast', 'forecast-names'], forecastScope: false, wellScope: false },
	forecastNotifications: { key: ['forecast', 'notifications'], forecastScope: true, wellScope: false },
	headers: { key: ['forecast', 'headers'], forecastScope: false, wellScope: false },
	probChartData: { key: ['forecast', 'probChartData'], forecastScope: true, wellScope: true },
	proximityData: { key: ['forecast', 'proximity'], forecastScope: true, wellScope: true },
	proximityForecastData: { key: ['forecast', 'proximityGrid'], forecastScope: true, wellScope: true },
	proximityForecastList: { key: ['forecast', 'proximityList'], forecastScope: true, wellScope: false },
	proximityForecastRawBGData: {
		key: ['forecast', 'proximityGrid', 'rawBackgroundData'],
		forecastScope: true,
		wellScope: true,
	},
	proximityWellList: { key: ['forecast', 'proximity-wells'], forecastScope: true, wellScope: false },
	status: { key: ['forecast', 'status'], forecastScope: true, wellScope: true },
};

const generateForecastScope = (forecastId) => (baseKey) => [...BASE_KEYS[baseKey].key, forecastId];
const generateWellScope = (forecastId, wellId) => (baseKey) => [...generateForecastScope(forecastId)(baseKey), wellId];

export const KEYS_BY_FORECAST = _.mapValues(
	_.pickBy(BASE_KEYS, ({ forecastScope }) => forecastScope),
	(_value, key) =>
		({ forecastId }) =>
			generateForecastScope(forecastId)(key)
);

export const KEYS_BY_WELL = _.mapValues(
	_.pickBy(BASE_KEYS, ({ wellScope }) => wellScope),
	(_value, key) =>
		({ forecastId, wellId }) =>
			generateWellScope(forecastId, wellId)(key)
);

export const KEYS = {
	allProjectForecasts: (projectId) => [...BASE_KEYS.allProjectForecasts.key, projectId],
	comparisonChartData: (forecastId, wellId, body) => [
		...KEYS_BY_WELL.comparisonChartData({ forecastId, wellId }),
		body,
	],
	comparisonGridChartData: (forecastId, comparisonIds, wells) => [
		...KEYS_BY_FORECAST.comparisonGridChartData({ forecastId }),
		comparisonIds,
		wells,
	],
	detChartData: (forecastId, wellId, body) => [...KEYS_BY_WELL.detChartData({ forecastId, wellId }), body],
	detGridChartData: (forecastId, wells) => [...KEYS_BY_FORECAST.detGridChartData({ forecastId }), wells],
	forecastBucket: (forecastId) => KEYS_BY_FORECAST.forecastBucket({ forecastId }),
	forecastDocument: (forecastId) => KEYS_BY_FORECAST.forecastDocument({ forecastId }), // This one should not be removed when we remove all
	forecastNames: (forecastIds) => [...BASE_KEYS.forecastNames.key, forecastIds],
	forecastNotifications: (forecastId) => KEYS_BY_FORECAST.forecastNotifications({ forecastId }),
	headers: (wellId, headers) => [...BASE_KEYS.headers.key, wellId, headers],
	probChartData: (forecastId, wellId, body) => [...KEYS_BY_WELL.probChartData({ forecastId, wellId }), body],
	proximityData: ({ wellId, basePhase, phase, phaseType, forecastId, proximityForm, resolution }) => [
		...KEYS_BY_WELL.proximityData({ forecastId, wellId }),
		phase,
		phaseType,
		basePhase,
		proximityForm,
		resolution,
	],
	proximityForecastData: ({ forecastId, wellId, phase }) => [
		...KEYS_BY_WELL.proximityForecastData({ forecastId, wellId }),
		phase,
	],
	proximityForecastList: (forecastId) => KEYS_BY_FORECAST.proximityForecastList({ forecastId }),
	proximityForecastRawBGData: ({ forecastId, wellId, phases }) => [
		...KEYS_BY_WELL.proximityForecastRawBGData({ forecastId, wellId }),
		phases,
	],
	proximityWellList: (forecastId) => KEYS_BY_FORECAST.proximityWellList({ forecastId }),
	status: (forecastId, wellId) => KEYS_BY_WELL.status({ forecastId, wellId }),
};

const CHART_KEYS = ['comparisonChartData', 'detChartData', 'probChartData', 'status', 'headers'];

// NOTE: sometimes the components using these queries are passed forecastDoc data. this can result in some null fields that cause unnecessary calls to the back-end

/** @param {string} forecastId */
export async function fetchForecast(forecastId) {
	try {
		if (!forecastId) {
			return null;
		}

		return getApi(`/forecast/${forecastId}`);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function fetchWellsAndCollections(forecastId?: string) {
	try {
		if (!forecastId) {
			return null;
		}

		return getApi(`/forecast/${forecastId}/wells-and-collections`);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

async function fetchNotifications(forecastId) {
	try {
		if (!forecastId) {
			return null;
		}

		return getApi(`/notifications`);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/** @param {string} forecastId */
export async function fetchForecastBucket(forecastId) {
	return getApi(`/forecast/${forecastId}/manual-bucket`);
}

/**
 * @param {string} forecastId
 * @param {any} body
 */
export async function fetchDeterministicChartData(forecastId, body) {
	try {
		// avoid making unnecessary calls when not provided ids
		if (!(forecastId && body?.wells)) {
			return null;
		}

		return getApi(`/forecast/${forecastId}/deterministic-chart-data`, body);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/**
 * @param {string} forecastId
 * @param {object} body
 */
export async function fetchComparisonChartData(forecastId, body) {
	try {
		// avoid making unnecessary calls when not provided ids
		if (!(forecastId && body?.wells)) {
			return null;
		}

		return getApi(`/forecast/${forecastId}/comparison-chart-data`, body);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/**
 * @param {string} forecastId
 * @param {object} body
 */
async function fetchProbabilisticChartData(forecastId, body) {
	try {
		if (!(forecastId && body?.wells)) {
			return null;
		}
		return (await getApi(`/forecast/${forecastId}/data`, body))[0];
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function fetchWellHeaders(wellId?: string, headers: Array<string> | string = []) {
	if (!wellId) {
		return null;
	}
	try {
		return (
			await postApi('/well/getWellHeaderValues', {
				wells: [wellId],
				headers: headers === 'all' ? 'all' : ['well_name', ...headers],
			})
		)[0];
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/**
 * @param {string | undefined} forecastId
 * @param {string} wellId
 */
export async function fetchWellStatus(forecastId, wellId) {
	try {
		if (!wellId || !forecastId) {
			return null;
		}

		return getApi(`/forecast/${forecastId}/well-forecast-status/${wellId}`);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/** @param {string} forecastId */
async function fetchProximityWellList(forecastId) {
	try {
		const result = await getApi(`/forecast/${forecastId}/proximity-well-list`);
		return result;
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function fetchProximityData({
	basePhase,
	forecastId,
	phase,
	phaseType,
	proximityForm,
	resolution,
	suppressWarning,
	wellId,
}: {
	basePhase: Phase;
	forecastId: string;
	phase: Phase;
	phaseType: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	proximityForm: any;
	resolution: string;
	suppressWarning?: boolean;
	wellId: string;
}) {
	try {
		const result = await postApi('/well/neighbor-wells', {
			wellId,
			basePhase,
			phase,
			phaseType,
			resolution,
			proximityForecastId: forecastId,
			...proximityForm,
		});

		if (result?.warning?.status && !suppressWarning) {
			alerts.confirm({
				title: 'Warning Proximity Wells',
				children: result.warning?.message,
				confirmText: 'Close',
				hideCancelButton: true,
			});
		}
		return result;
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function fetchProximityForecastData({ forecastId, wellId, phase }) {
	try {
		const data = await getApi(`/forecast/${forecastId}/proximity-documents`, {
			forecast: forecastId,
			well: wellId,
			phase,
		});
		return data;
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function fetchProximityForecastRawBgData({ forecastId, wellId, phases }) {
	try {
		const data = await postApi(`/forecast/${forecastId}/proximity-background-data`, {
			well: wellId,
			phases,
		});
		return data;
	} catch (error) {
		return genericErrorAlert(error);
	}
}

/** @param {string} projectId */
export async function fetchProjectForecasts(projectId?: string): Promise<ProjectForecastItem[]> {
	try {
		if (!projectId) {
			return [];
		}

		return getApi(`/forecast/project/${projectId}/all`);
	} catch (error) {
		// @ts-expect-error exception return type is not a ProjectForecastItem[], messes with ts in other files
		return genericErrorAlert(error);
	}
}

/**
 * @param {string} forecastId
 * @param {string} wellId
 * @param {object} body
 */
export async function updateSinglePhaseForecast(forecastId, wellId, body) {
	if (!forecastId || !wellId) {
		throw errorFromInfo({ name: 'Invalid forecastId or wellId', expected: true });
	}

	const response = await putApi(`/forecast/${forecastId}/update-single-phase-forecast/${wellId}`, body);
	confirmationAlert(response);
	return wellId;
}

/** @param {string} forecastId */
export function useAllProjectForecasts(projectId) {
	return useQuery(KEYS.allProjectForecasts(projectId), () => fetchProjectForecasts(projectId), {
		enabled: !!projectId,
	});
}

export function useForecastBucket(forecastId) {
	const key = KEYS.forecastBucket(forecastId);
	return {
		query: useQuery(key, () => fetchForecastBucket(forecastId), {
			enabled: !!forecastId,
			placeholderData: new Set(),
			select: useCallback((data) => new Set(data), []),
		}),
		queryKey: key,
	};
}

export function useDeterministicGridChartData({ forecastId, wells, options }) {
	const body = { wells };
	const key = useMemo(() => KEYS.detGridChartData(forecastId, wells), [forecastId, wells]);
	const query = useQuery(key, () => fetchDeterministicChartData(forecastId, body), {
		...DEFAULT_QUERY_OPTIONS,
		enabled: Boolean(wells?.length),
		...options,
	});
	return { query, queryKey: key };
}

// for grid wells
export function useComparisonGridChartData({ forecastId, wells, comparisonIds, options }) {
	const body = { wells, comparisonIds };
	const key = useMemo(
		() => KEYS.comparisonGridChartData(forecastId, comparisonIds, wells),
		[comparisonIds, forecastId, wells]
	);
	const query = useQuery(key, () => fetchComparisonChartData(forecastId, body), {
		...DEFAULT_QUERY_OPTIONS,
		...options,
	});
	return { query, queryKey: key };
}

export function useDeterministicWellData({ forecastId, wellId, options = {} }) {
	const body = { wells: [wellId] };
	const key = KEYS.detChartData(forecastId, wellId, body);
	const query = useQuery(key, () => fetchDeterministicChartData(forecastId, body), {
		...DEFAULT_QUERY_OPTIONS,
		enabled: Boolean(forecastId && wellId),
		select: useCallback((data) => data[wellId], [wellId]),
		...options,
	});
	return { query, queryKey: key };
}

// for 1 well
export function useComparisonWellData({ forecastId, wellId, comparisonIds, options = {} }) {
	const body = { wells: [wellId], comparisonIds };
	const key = KEYS.comparisonChartData(forecastId, wellId, body);
	const query = useQuery(key, () => fetchComparisonChartData(forecastId, body), {
		...DEFAULT_QUERY_OPTIONS,
		...options,
		select: useCallback((data) => data[wellId], [wellId]),
	});
	return { query, queryKey: key };
}

export function useProbabilisticWellData(forecastId, wellId) {
	const key = KEYS.probChartData(forecastId, wellId, { wellId });
	const query = useQuery(key, () => fetchProbabilisticChartData(forecastId, { wells: [wellId] }));
	return query;
}

export function useProximityWellList(forecastId) {
	const key = KEYS.proximityWellList(forecastId);
	const query = useQuery(key, () => fetchProximityWellList(forecastId), {
		enabled: Boolean(forecastId),
	});
	return query;
}

export function useProximityForecastWellData({ enabled, forecastId, phase, wellId }) {
	const key = KEYS.proximityForecastData({ forecastId, wellId, phase });
	const query = useQuery(key, () => fetchProximityForecastData({ forecastId, wellId, phase }), {
		...DEFAULT_QUERY_OPTIONS,
		enabled,
	});

	return { query, queryKey: key };
}

export function useProximityForecastRawBGData({ enabled, forecastId, phases, wellId }) {
	const key = KEYS.proximityForecastRawBGData({ forecastId, wellId, phases });
	const query = useQuery(key, () => fetchProximityForecastRawBgData({ forecastId, wellId, phases }), {
		...DEFAULT_QUERY_OPTIONS,
		enabled,
	});

	return { query, queryKey: key };
}

export function useProximityData({
	basePhase,
	forecastId,
	phase,
	phaseType,
	proximityMergedStates: { proximityActive, proximityForm },
	resolution,
	wellId,
}) {
	const queryBasePhase = phaseType === 'ratio' ? basePhase : null;

	const key = KEYS.proximityData({
		basePhase: queryBasePhase,
		forecastId,
		phase,
		phaseType,
		proximityForm,
		resolution,
		wellId,
	});
	const isProximityWellValid = useCheckWellValidForProximity(wellId);
	const enabled =
		proximityActive &&
		!!proximityForm &&
		isProximityWellValid &&
		!(phaseType === 'ratio' && phase === queryBasePhase);

	const query = useQuery(
		key,
		() =>
			fetchProximityData({
				basePhase: queryBasePhase,
				forecastId,
				phase,
				phaseType,
				proximityForm,
				resolution,
				wellId,
			}),
		{
			...DEFAULT_QUERY_OPTIONS,
			enabled, // ensure data is only fetched when proximityForm is set and active
		}
	);
	const reload = useCallback(() => queryClient.refetchQueries(key), [key]);
	return [query, reload];
}

export function useCheckWellValidForProximity(wellId) {
	const { data, isSuccess } = useWellHeaderValues(wellId, 'all');
	return Boolean(isSuccess && data?.surfaceLatitude && data?.surfaceLongitude);
}

export function useWellHeaderValues(
	wellId?: string,
	headers: Array<string> | 'all' | undefined = [...CALCULATED_WELL_HEADERS, ...EXTENDED_WELL_HEADERS],
	options = {}
) {
	return useQuery(KEYS.headers(wellId, headers), () => fetchWellHeaders(wellId, headers), {
		...DEFAULT_QUERY_OPTIONS,
		...options,
	});
}

// NOTE: refresh may be needed in the future
export function useWellForecastStatus(forecastId, wellId) {
	const key = KEYS.status(forecastId, wellId);
	return useQuery(key, () => fetchWellStatus(forecastId, wellId), DEFAULT_QUERY_OPTIONS);
}

export function useForecast(forecastId, options = {}) {
	return useQuery(KEYS.forecastDocument(forecastId), () => fetchForecast(forecastId), options);
}

export function useProximityForecastList(forecastId, options = {}) {
	return useQuery(KEYS.proximityForecastList(forecastId), () => fetchForecast(forecastId), options);
}

export function useForecastNotifications(forecastId) {
	return useQuery(KEYS.forecastNotifications(forecastId), () => fetchNotifications(forecastId), {
		...DEFAULT_QUERY_OPTIONS,
		select: useCallback(
			(data) => {
				return data.filter((notification) => notification.extra?.body?.forecastId === forecastId);
			},
			[forecastId]
		),
	});
}

export function invalidateForecastChartQueries(forecastId) {
	CHART_KEYS.forEach((key) => queryClient.invalidateQueries(['forecast', key, forecastId]));
}

// exact match to be false to remove forecastDocument query as well
// default = true does not remove ['forecastContainer', 'forecast']
export function invalidateAllForecastQueries(invalidateForecastContainer = false) {
	queryClient.invalidateQueries(['forecast']);
	if (invalidateForecastContainer) {
		queryClient.invalidateQueries(['forecastContainer']);
	}
}
