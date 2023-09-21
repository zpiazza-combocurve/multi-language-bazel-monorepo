import _ from 'lodash-es';
import { useCallback } from 'react';
import { useQuery } from 'react-query';

import { genericErrorAlert } from '@/helpers/alerts';
import { DEFAULT_QUERY_OPTIONS, queryClient } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { useTypeCurveInfo } from '@/type-curves/shared/useTypeCurveInfo';

import { TC_QUERY_KEY_PREFIX } from '../api';
import { KEYS } from './keys';

const EMPTY_OBJ = {};

export function generateRawBackgroundDataBody({ phase, resolution, tcId, wells, wellsInfoMap }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let wellsValidInfo: Record<string, any> | null = null;
	if (wellsInfoMap) {
		wellsValidInfo = _.reduce(
			wells,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			(acc: Record<string, any>, well: string) => {
				const thisWell = wellsInfoMap.get(well);
				acc.wellsResolvedResolution[well] = thisWell?.resolved_resolution;
				acc.wellsDataInfo[well] = thisWell?.data_info;
				acc.wellsForecastInfo[well] = thisWell?.forecast_info;
				acc.wellsEurInfo[well] = thisWell?.eur;
				acc.wellsValidInfo[well] = thisWell?.valid;
				return acc;
			},
			{
				wellsDataInfo: {},
				wellsEurInfo: {},
				wellsForecastInfo: {},
				wellsResolvedResolution: {},
				wellsValidInfo: {},
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			} as Record<string, any>
		);
	}

	return {
		init_para_dict: { TC_life: 60, forecast_series: 'best', TC_target_data_freq: resolution },
		phase,
		tc_id: tcId,
		wells_valid_info: wellsValidInfo,
		wells,
	};
}

export async function fetchRawBackgroundData({ tcId, body }) {
	try {
		return postApi(`/type-curve/${tcId}/generate-data`, body);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export function useFitInit(tcId) {
	const key = KEYS.fitInit(tcId);
	const query = useQuery(key, DEFAULT_QUERY_OPTIONS);
	const reload = useCallback(() => queryClient.invalidateQueries(key), [key]);
	return Object.assign([query, reload], { query, reload });
}

export function useTcInfo(tcId, phase, validWells) {
	const key = KEYS.tcInfo(tcId, phase, validWells);
	return useQuery(key, DEFAULT_QUERY_OPTIONS);
}

export function useRawBackgroundData({ enabled = true, phase, phaseTypes, resolution, tcId, wells }) {
	const { wellsInfoMap, success: tcInfoSuccess } = useTypeCurveInfo(tcId);

	// wellCount is changed when the rep wells changes which will re run the query
	return useQuery(
		KEYS.tcRawBackgroundData({ phase, phaseTypes, resolution, tcId, wells }),
		() =>
			fetchRawBackgroundData({
				body: generateRawBackgroundDataBody({ phase, resolution, tcId, wells, wellsInfoMap }),
				tcId,
			}),
		{
			enabled: !!tcId && tcInfoSuccess && Boolean(phaseTypes) && enabled,
			...DEFAULT_QUERY_OPTIONS,
		}
	);
}

export function useTcFits(tcId) {
	const key = KEYS.tcFits(tcId);
	return useQuery(key, { ...DEFAULT_QUERY_OPTIONS, placeholderData: EMPTY_OBJ });
}

export function removeAllTypeCurveFitQueries() {
	queryClient.removeQueries(TC_QUERY_KEY_PREFIX);
}
