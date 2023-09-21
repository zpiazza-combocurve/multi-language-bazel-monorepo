import _ from 'lodash';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { withLoadingBar } from '@/helpers/alerts';
import { makeLocal } from '@/helpers/date';
import { getApi, postApi } from '@/helpers/routing';
import { convertDateToIdx } from '@/helpers/zing';

const fetchLookups = ({ projectId }) => withLoadingBar(getApi(`/forecast/getForecastLookupTables`, { projectId }));
const fetchTcFit = (tcId, phase) => withLoadingBar(getApi(`/type-curve/${tcId}/fit`, { phase }));
const fetchSchedules = ({ projectId }) => withLoadingBar(getApi(`/schedules/getProjectSchedules`, { projectId }));
const fetchWellInfo = async (wellId, projectId) => {
	return (
		await withLoadingBar(
			postApi(`/type-curve/generate-application-info`, {
				wellIds: [wellId],
				projectId,
			})
		)
	)[wellId];
};

const fetchTcDict = async ({
	fit,
	tc,
	fpd,
	fpdSource,
	forecastId,
	enableNormalize,
	riskFactorStr,
	schedule,
	well,
	projectId,
}) => {
	if (!fit || !tc) {
		return null;
	}

	const { phase, resolution, typeCurve } = fit;
	const isRate = tc.phaseType[phase] === 'rate';
	const pDict = isRate ? fit.P_dict : fit.ratio_P_dict;
	const series = isRate ? Object.keys(pDict) : ['best'];

	const ret = await withLoadingBar(
		postApi(`/forecast/${forecastId}/applySingleWellTC`, {
			date: fpd,
			fpd: fpdSource,
			normalize: enableNormalize,
			phase,
			phaseRiskFactors: { [phase]: Number(riskFactorStr) },
			resolution,
			schedule,
			series,
			tcId: typeCurve,
			well,
			projectId,
		})
	);

	// we should consider adjusting python side to return consistent data shapes for rate/ratio
	if (isRate) return ret;
	return _.isEmpty(ret) ? ret : { best: ret.segments };
};

const FALLBACK_FPD_SOURCE = 'fixed';

// type-curve usually isn't concerned with the forecast type. but for the front-end charts we can only allow 'rate' type-curves for 'probabilistic' forecasts
// eslint-disable-next-line max-params
const fetchTcList = async (phase, phaseType, forecastType = 'probabilistic', projectId) => {
	if (phase === 'all') {
		return getApi('/type-curve/all-phase-project-list', { forecastType, projectId });
	}
	return getApi(`/type-curve/user-project-list`, { phase, phaseType, projectId });
};
const NO_MULTIPLIER = { eur: 1, qPeak: null };

const DEFAULT_MULTIPLIERS = { oil: NO_MULTIPLIER, gas: NO_MULTIPLIER, water: NO_MULTIPLIER };

const ManualEditingTypeCurveContext = createContext();

// should be up for a re-work
const ManualEditingTypeCurveProvider = ({ children }) => {
	// type curve specific state
	const [enableNormalize, setEnableNormalize] = useState(false);
	const [fit, setFit] = useState(null);
	const [fpd, setFpd] = useState(convertDateToIdx(makeLocal(new Date())));
	const [fpdSource, setFpdSource] = useState(FALLBACK_FPD_SOURCE);
	const [phaseType, setPhaseType] = useState('rate');
	const [pSeries, setPSeries] = useState('best');
	const [riskFactorStr, setRiskFactorStr] = useState('1');
	const [schedule, setSchedule] = useState(null);
	const [segIdx, setSegIdx] = useState(0);
	const [tc, setTc] = useState(null);
	const [typeCurveDict, setTypeCurveDict] = useState(null);

	const reset = useCallback(() => {
		setEnableNormalize(false);
		setFit(null);
		setPSeries('best');
		setSegIdx(0);
		setTc(null);
	}, []);

	const generateSaveTCInfo = useCallback(
		() => ({
			saveTCId: tc?._id,
			saveTCSetting: {
				applyNormalization: enableNormalize,
				fpdSource,
				schedule: fpdSource === 'schedule' ? schedule : null,
				fixedDateIdx: fpdSource === 'fixed' ? fpd : null,
				series: pSeries,
				riskFactor: Number(riskFactorStr),
			},
		}),
		[fpdSource, fpd, schedule, tc?._id, enableNormalize, pSeries, riskFactorStr]
	);

	const canSave = useMemo(() => {
		if (!typeCurveDict) {
			return false;
		}
		if (fpdSource === 'schedule' && !schedule) {
			return false;
		}
		if (generateSaveTCInfo?.()?.saveTCSetting?.riskFactor <= 0) {
			return false;
		}

		return true;
	}, [fpdSource, generateSaveTCInfo, schedule, typeCurveDict]);

	useEffect(() => {
		setSegIdx(0);
	}, [pSeries]);

	const contextObj = useMemo(
		() => ({
			canSave,
			enableNormalize,
			fit,
			fpd,
			fpdSource,
			generateSaveTCInfo,
			phaseType,
			pSeries,
			reset,
			riskFactorStr,
			schedule,
			segIdx,
			setEnableNormalize,
			setFit,
			setFpd,
			setFpdSource,
			setPhaseType,
			setPSeries,
			setRiskFactorStr,
			setSchedule,
			setSegIdx,
			setTc,
			setTypeCurveDict,
			tc,
			typeCurveDict,
		}),
		[
			canSave,
			enableNormalize,
			fit,
			fpd,
			fpdSource,
			generateSaveTCInfo,
			pSeries,
			phaseType,
			reset,
			riskFactorStr,
			schedule,
			segIdx,
			tc,
			typeCurveDict,
		]
	);

	return (
		<ManualEditingTypeCurveContext.Provider value={contextObj}>{children}</ManualEditingTypeCurveContext.Provider>
	);
};

export default ManualEditingTypeCurveProvider;
export {
	DEFAULT_MULTIPLIERS,
	fetchLookups,
	fetchSchedules,
	fetchTcDict,
	fetchTcFit,
	fetchTcList,
	fetchWellInfo,
	ManualEditingTypeCurveContext,
};
