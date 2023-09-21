import { QueryObserverResult, useQuery } from 'react-query';

import { DEFAULT_QUERY_OPTIONS, queryClient } from '@/helpers/query-cache';
import { createMap } from '@/helpers/utilities';
import { KEYS as FIT_KEYS } from '@/type-curves/TypeCurveFit/keys';

import { TypeCurve, TypeCurveNormalizationTemplate, TypeCurveWellData, TypeCurveWellHeaders } from './types';

export const TC_QUERY_KEY_PREFIX = ['tc'];

export const TC_KEYS = {
	// disabled as they have been combined into wellsValidation
	// monthlyProduction: (id) => ['tc', id, 'post', `/type-curve/${id}/get-data`, { items: ['monthly_production'] }],
	// eur: (id) => ['tc', id, 'post', `/type-curve/${id}/get-data`, { items: ['eur'] }],
	view: (id: string) => ['typeCurveView', id, 'get', `/type-curve/${id}/view`],
	dailyProduction: (id: string) => ['tc', id, 'post', `/type-curve/${id}/get-data`, { items: ['daily_production'] }],
	wellsValidation: (id: string) => [
		'tc',
		id,
		'post',
		`/type-curve/${id}/get-data`,
		{ items: ['header', 'forecast_info', 'data_info', 'eur', 'assignment', 'monthly_production', 'peak_rate'] },
	],
	typeCurveWellAssignments: (id: string) => ['tc', id, 'get', `/type-curve/${id}/get-tc-well-assignments`],
	wellHeaders: (id: string) => ['tc', id, 'get', `/type-curve/${id}/headers`],
	step: (id: string) => ['tc', id, 'get', `/type-curve/${id}/normalizations/step`],
	wellsNormalization: (id: string) => ['tc', id, 'get', `/type-curve/${id}/wells-normalization-data`],
	proximityWellsValidation: ({ forecast, wells, basePhase, phaseType, tcType, wellForecastMap }) => [
		'tc',
		{ forecast, wells, phaseType },
		'post',
		`/type-curve/get-prox-data`,
		{ forecast, wells, basePhase, phaseType, tcType, wellForecastMap },
	],
};

export function createMapByWellId<T extends { well_id: string }>(data: T[]): Map<string, T> {
	return createMap(data, 'well_id');
}
function createMapById<T extends { _id: string }>(data: T[]): Map<string, T> {
	return createMap(data, '_id');
}

export const useTypeCurve = (id: string, queryOptions = {}): QueryObserverResult<TypeCurve> =>
	useQuery(TC_KEYS.view(id), {
		...DEFAULT_QUERY_OPTIONS,
		...queryOptions,
	});

type TypeCurveEur = Pick<TypeCurveWellData, 'rep' | 'well_id' | 'eur'>;
export type EurResult = Map<string, TypeCurveEur>;
export const useTypeCurveEur = (id: string): QueryObserverResult<EurResult> =>
	useQuery<TypeCurveEur[], unknown, EurResult>({
		queryKey: TC_KEYS.wellsValidation(id),
		select: createMapByWellId,
		...DEFAULT_QUERY_OPTIONS,
	});

export const useTypeCurveWellHeaders = (
	id: string,
	enabled = true
): QueryObserverResult<Map<string, TypeCurveWellHeaders>> =>
	useQuery<TypeCurveWellHeaders[], unknown, Map<string, TypeCurveWellHeaders>>({
		queryKey: TC_KEYS.wellHeaders(id),
		select: createMapById,
		enabled,
		...DEFAULT_QUERY_OPTIONS,
	});

type TypeCurveWellsData = Pick<
	TypeCurveWellData,
	'header' | 'forecast_info' | 'data_info' | 'eur' | 'assignment' | 'valid' | 'well_id' | 'rep' | 'peak_rate'
>;
type TypeCurveWellsDataValidationResult = Map<string, TypeCurveWellsData>;
export const useTypeCurveWellsData = (
	id: string,
	enabled = true
): QueryObserverResult<TypeCurveWellsDataValidationResult> =>
	useQuery<TypeCurveWellsData[], unknown, TypeCurveWellsDataValidationResult>({
		queryKey: TC_KEYS.wellsValidation(id),
		select: createMapByWellId,
		enabled,
		...DEFAULT_QUERY_OPTIONS,
	});

export function useTcWellAssignments(
	typeCurveId: string,
	enabled = true
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): { query: QueryObserverResult<Record<string, any>> } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const query = useQuery<Record<string, any>>({
		queryKey: TC_KEYS.typeCurveWellAssignments(typeCurveId),
		enabled: Boolean(typeCurveId) && enabled,
		...DEFAULT_QUERY_OPTIONS,
	});

	return { query };
}

export const cacheTcData = (id: string, refetch = false) => {
	const prefetchKeys = ['view', 'wellsValidation', 'wellHeaders', 'step', 'typeCurveWellAssignments'];
	const prefetchFitKeys = ['allFitInit', 'fitInit', 'tcFits'];

	const proms = [
		...prefetchKeys.map((key) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			(queryClient as any)[refetch ? 'refetchQueries' : 'prefetchQuery'](TC_KEYS[key](id), DEFAULT_QUERY_OPTIONS)
		),

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(queryClient as any)[refetch ? 'refetchQueries' : 'prefetchQuery'](
			TC_KEYS.wellsNormalization(id),
			DEFAULT_QUERY_OPTIONS
		),

		...prefetchFitKeys.map((key) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			(queryClient as any)[refetch ? 'refetchQueries' : 'prefetchQuery'](FIT_KEYS[key](id), DEFAULT_QUERY_OPTIONS)
		),
	];

	Promise.all(proms);
};

export const useTypeCurveStep = (id: string): QueryObserverResult<TypeCurveNormalizationTemplate> =>
	useQuery(TC_KEYS.step(id));
