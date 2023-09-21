/* eslint-disable @typescript-eslint/no-explicit-any */
import { MultipleSegments } from '@combocurve/forecast/models';
import { capitalize, isArray } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { genericErrorAlert, useDoggo } from '@/helpers/alerts';
import { calculatePercentile } from '@/helpers/math';
import { convertIdxToDate } from '@/helpers/zing';
import { getSeriesInfo } from '@/type-curves/TypeCurveIndex/fit/helpers';
import { shiftNonMatchingSegments } from '@/type-curves/charts/shared';
import {
	getCumData,
	getEurData,
	getMonthlyTargetPhaseData,
	getProdData,
	getProdFit,
	get_align_daily_resolution,
	get_align_monthly_resolution,
	get_noalign_daily_resolution,
	get_noalign_monthly_resolution,
} from '@/type-curves/shared/fit-tc/daily-helpers';

const genMinMaxLabel = (label, value) => `${capitalize(label)} (${value})`;

const multiSeg = new MultipleSegments();
const SERIES = ['P10', 'P50', 'P90', 'best'];

const EMPTY_OBJ = {};

const useCBD = ({
	baseSegments,
	dailyRange,
	fitSeries,
	fitPhaseTypes,
	getShiftBaseSegments,
	normalize,
	phase,
	phaseLoaded,
	phaseType,
	proximitySelection,
	rawBackgroundData,
	resolution,
	tcFits = {},
}) => {
	const calculatedBackgroundData = useMemo(() => {
		// do not apply normalization here
		if (rawBackgroundData && phaseLoaded) {
			const isMonthly = resolution === 'monthly';

			// check phaseType - rate or ratio
			if (phaseType === 'rate') {
				// used to when filtering out/to
				const wellIndexesToUse: number[] = [];
				const {
					cum_dict: raw_cum_dict,
					eur: raw_eur,
					well_information_s: raw_well_information_s,
					normalization: raw_normalization,
				} = rawBackgroundData;

				const multipliers = raw_normalization.map((eur) => ({ eur: eur[0] }));
				// filter based on selection for proximity. will always include all wells in TCFit
				const well_information_s = raw_well_information_s
					.map((value, index) => {
						const includeWell = proximitySelection
							? proximitySelection.filteredArray.includes(value.header.well_id)
							: true;
						if (includeWell) {
							wellIndexesToUse.push(index);
							return value;
						}
						return null;
					})
					.filter((value) => value !== null);

				const eur = raw_eur.filter((_value, index) => wellIndexesToUse.includes(index));
				const normalization = raw_normalization.filter((_value, index) => wellIndexesToUse.includes(index));

				if (!well_information_s) return null;
				const monthly_prod = get_noalign_monthly_resolution(well_information_s);
				return {
					align: (isMonthly ? get_align_monthly_resolution : get_align_daily_resolution)(
						well_information_s,
						dailyRange.align
					),
					align_monthly_prod: get_align_monthly_resolution(well_information_s),
					cum_dict: {
						...raw_cum_dict,
						cum_subind: raw_cum_dict.cum_subind.filter((_value, index) => wellIndexesToUse.includes(index)),
					},
					eur,
					monthly_prod,
					noalign: isMonthly
						? monthly_prod
						: get_noalign_daily_resolution(well_information_s, dailyRange.noalign),
					normalization,
					multipliers,
				};
			}

			if (phaseType === 'ratio') {
				// used to when filtering out/to
				const wellIndexesToUse: number[] = [];

				const { ratio, target_phase, normalization: raw_normalization } = rawBackgroundData;
				if (!ratio) return null;
				const { well_information_s: _rationWellInformation } = ratio;
				const { cum_dict: target_cum_dict, eur: targetEur, well_information_s } = target_phase;

				// filter based on selection for proximity. will always include all wells in TCFit
				const targetWellInformation = well_information_s
					.map((value, index) => {
						const includeWell = proximitySelection
							? proximitySelection.filteredArray.includes(value.header.well_id)
							: true;
						if (includeWell) {
							wellIndexesToUse.push(index);
							return value;
						}
						return null;
					})
					.filter((value) => value !== null);

				const ratioWellInformation = _rationWellInformation.filter((_value, index) =>
					wellIndexesToUse.includes(index)
				);
				const eur = targetEur.filter((_value, index) => wellIndexesToUse.includes(index));
				const normalization = raw_normalization.filter((_value, index) => wellIndexesToUse.includes(index));

				const monthlyTarget = get_noalign_monthly_resolution(targetWellInformation);
				return {
					align: null,
					cum_dict: {
						...target_cum_dict,
						cum_subind: target_cum_dict.cum_subind.filter((_value, index) =>
							wellIndexesToUse.includes(index)
						),
					},
					eur,
					monthly_prod: monthlyTarget,
					noalign: (isMonthly ? get_noalign_monthly_resolution : get_noalign_daily_resolution)(
						ratioWellInformation,
						dailyRange.noalign
					),
					normalization,
					targetPhase: {
						c4use:
							resolution === 'daily'
								? get_noalign_daily_resolution(targetWellInformation, dailyRange.noalign)
								: monthlyTarget,
						noalign: monthlyTarget,
					},
				};
			}
		}

		return null;
	}, [
		rawBackgroundData,
		phaseLoaded,
		resolution,
		phaseType,
		dailyRange.align,
		dailyRange.noalign,
		proximitySelection,
	]);

	// main purpose is to apply normalization
	const phaseData = useMemo(() => {
		if (calculatedBackgroundData) {
			const { align: alignData, noalign: noalignData } = getMonthlyTargetPhaseData(
				calculatedBackgroundData,
				phaseType === 'rate',
				normalize
			);

			return {
				cumData: getCumData(calculatedBackgroundData, normalize),
				eurData: getEurData(calculatedBackgroundData, normalize),
				prodData: getProdData(calculatedBackgroundData, phaseType === 'rate' && normalize)['noalign'],
				noalignMonthlyTargetProdData: noalignData,
				alignMonthlyTargetPhaseData: alignData,
			};
		}
		return { cumData: null, eurData: null, prodData: null, noalignMonthlyTargetProdData: null };
	}, [calculatedBackgroundData, phaseType, normalize]);

	const eurs = useMemo(() => {
		const retEurs = {
			oil: { P10: 0, P50: 0, P90: 0, best: 0 },
			gas: { P10: 0, P50: 0, P90: 0, best: 0 },
			water: { P10: 0, P50: 0, P90: 0, best: 0 },
		};

		// eurs
		const activeFitSeries = Object.entries(tcFits).reduce(
			(acc, [thisPhase, thisFit]) => {
				if (thisPhase === phase) {
					return acc;
				}

				const thisPhaseType = fitPhaseTypes?.[thisPhase];
				acc[thisPhase] = {
					phaseType: thisPhaseType,
					fitSeries: thisFit?.[thisPhaseType === 'ratio' ? 'ratio_P_dict' : 'P_dict'] ?? null,
				};
				return acc;
			},
			{ [phase]: { phaseType, fitSeries } }
		);

		VALID_PHASES.forEach((thisPhase) => {
			const thisPhaseType = activeFitSeries?.[thisPhase]?.phaseType;
			if (thisPhaseType) {
				SERIES.forEach((series) => {
					const segments = activeFitSeries[thisPhase]?.fitSeries?.[series]?.segments ?? [];
					if (segments?.length) {
						const endDataIdx = -10000;
						const leftIdx = segments[0]?.start_idx ?? endDataIdx;
						const rightIdx = segments[segments.length - 1]?.end_idx ?? 0;
						if (thisPhaseType === 'rate') {
							retEurs[thisPhase][series] = multiSeg.rateEur({
								cumData: 0,
								endDataIdx,
								leftIdx,
								rightIdx,
								forecastSegments: segments,
								dataFreq: 'monthly',
							});
						} else if (baseSegments?.length) {
							retEurs[thisPhase][series] = multiSeg.ratioEurInterval({
								cumData: 0,
								endDataIdx,
								leftIdx,
								rightIdx,
								ratioTSegments: segments,
								baseSegments: getShiftBaseSegments(segments),
								dataFreq: 'monthly',
							});
						}
					}
				});
			}
		});
		return retEurs;
	}, [baseSegments?.length, fitPhaseTypes, fitSeries, getShiftBaseSegments, phase, phaseType, tcFits]);

	return { calculatedBackgroundData, eurs, phaseData };
};

const useProximityFit = (props) => {
	const {
		basePhase,
		calculatedBackgroundData,
		dailyRange,
		defaultFormConfig,
		fitInit,
		fitSeries,
		headersMap,
		loadingInitialization,
		normalize,
		phase,
		phaseData,
		phaseRepWells,
		phaseType,
		proximityProps = EMPTY_OBJ,
		rawBackgroundData,
		resolution,
		setDailyRange,
		setFitSeries,
		setNormalize,
		setPhaseLoaded,
		tcFits,
	} = props;

	const prodData = phaseData?.prodData;

	const align = 'noalign';
	const [basePhaseSeries, setBasePhaseSeries] = useState('best');

	const [loading, setLoading] = useState(false);
	const [percentileFit, setPercentileFit] = useState<any>(null);

	const [hasRunFit, setHasRunFit] = useState(false);

	const baseSegments = useMemo(
		() => tcFits?.[basePhase]?.P_dict?.[basePhaseSeries]?.segments ?? [],
		[basePhase, basePhaseSeries, tcFits]
	);

	const getShiftBaseSegments = useCallback(
		(ratioSegments) => {
			if (ratioSegments?.length && baseSegments?.length) {
				const deltaT = ratioSegments[0].start_idx - baseSegments[0].start_idx;
				return multiSeg.shiftSegmentsIdx({ inputSegments: baseSegments, deltaT });
			}
			return baseSegments;
		},
		[baseSegments]
	);

	const fit = useMemo(() => tcFits?.[phase] ?? null, [phase, tcFits]);

	const alignAdjustedFitSeries = useMemo(() => {
		if (fitSeries) {
			const fitAlign = fit?.align;
			const alignIsMatching = fitAlign === align;
			return Object.entries(fitSeries).reduce((acc, [pKey, { segments }]: [string, any]) => {
				acc[pKey] = { segments: alignIsMatching ? segments : shiftNonMatchingSegments(segments, fitAlign) };
				return acc;
			}, {});
		}
		return null;
	}, [align, fit?.align, fitSeries]);

	// selection is defined from the top layer
	const { selection: proximitySelection, filterTo, filterOut } = proximityProps?.proximityWellSelection ?? EMPTY_OBJ;

	const dailyRangeMinMax = useMemo(() => {
		const base = { max: 2000, endLabel: 'Max (2000)' };
		return { minMax: { min: 0, startLabel: 'Min (0)', ...base }, default: { min: 0, max: 2000 } };
	}, []);

	const withLoading = useCallback(
		(asyncFn) =>
			async (...args) => {
				setLoading(true);
				try {
					await asyncFn(...args);
				} catch (error) {
					genericErrorAlert(error);
				} finally {
					setLoading(false);
				}
			},
		[]
	);

	const requiredMinMax = useMemo(() => {
		const output: any = {};

		// p1_range
		const dataIdx = calculatedBackgroundData?.[align]?.idx;
		if (isArray(dataIdx)) {
			const min = dataIdx[0];
			const max = Math.round(dataIdx[dataIdx.length - 1]);
			output.p1_range = {
				min,
				max,
				defaultValues: [min, Math.round(max / 2)],
			};
		} else {
			output.p1_range = {
				min: -10_000,
				max: 25_000,
				defaultValues: [-10_000, 25_000],
			};
		}

		// addSeriesFitRange
		const rollUpDateIdx = calculatedBackgroundData?.cum_dict?.idx;
		if (isArray(rollUpDateIdx)) {
			const min = convertIdxToDate(rollUpDateIdx[0]);
			const max = convertIdxToDate(rollUpDateIdx[rollUpDateIdx.length - 1]);
			output.addSeriesFitRange = { min, max, defaultValues: [min, max] };
		} else {
			output.addSeriesFitRange = {
				min: new Date(),
				max: new Date(),
				defaultValues: [new Date(), new Date()],
			};
		}

		// best_fit_q_peak.range
		const method = null;
		if (method !== 'absolute_range') {
			output['best_fit_q_peak.range'] = {
				min: 1,
				max: 99,
				defaultValues: [30, 70],
			};
		} else if (method === 'absolute_range') {
			const { data, idx } = prodData ?? {};
			if (!phaseRepWells.length || !(data && idx)) {
				output['best_fit_q_peak.range'] = {
					min: 0.01,
					max: 20_000,
					defaultValues: [0.01, 20_000],
				};
			} else {
				const peak_ind = idx.findIndex((value) => value === 0) ?? 0;
				const dataColumn = data.map((datum) => datum[peak_ind]);
				const defaultRange = calculatePercentile(dataColumn, [70, 30]).map((value) => Math.floor(value));

				// hard set min/max for now
				output['best_fit_q_peak.range'] = {
					min: 0.01,
					max: 20_000,
					defaultValues: defaultRange,
				};
			}
		}

		return Object.entries(output).reduce((obj, [key, value]: [string, any]) => {
			const { min, max } = value;
			obj[key] = {
				...value,
				startLabel: genMinMaxLabel('min', min),
				endLabel: genMinMaxLabel('max', max),
			};

			return obj;
		}, {});
	}, [align, calculatedBackgroundData, phaseRepWells.length, prodData]);

	useEffect(() => {
		if (tcFits) {
			setPhaseLoaded(true);
		}
	}, [setPhaseLoaded, tcFits]);

	// adjusts the fitSeries if the fit (from phase change) changes
	useEffect(() => {
		const { series, validSeries } = getSeriesInfo(fit, phaseType);
		setPercentileFit(null);
		if (validSeries) {
			setFitSeries(series);
		} else {
			setFitSeries({});
		}
	}, [fit, phase, phaseType, setFitSeries]);

	const eurPercentile = false;
	// adjusts the current fitSeries based on eurPercentile
	useEffect(() => {
		if (percentileFit && percentileFit.phase === phase) {
			const series =
				eurPercentile && percentileFit.phaseType === 'rate'
					? getProdFit(percentileFit, 'after')
					: getProdFit(percentileFit, 'before');

			setFitSeries(series);
		}
	}, [eurPercentile, percentileFit, phase, setFitSeries]);

	// show dog when fetching data
	useDoggo(loading, 'Loading...');

	return {
		align,
		alignAdjustedFitSeries,
		basePhase,
		basePhaseSeries,
		baseSegments,
		dailyRange,
		dailyRangeMinMax,
		defaultFormConfig,
		fit,
		fitInit,
		fitSeries,
		getShiftBaseSegments,
		hasRunFit,
		headersMap,
		loadingInitialization,
		normalize,
		percentileFit,
		phase,
		phaseRepWells,
		phaseType,
		rawBackgroundData,
		resolution,
		requiredMinMax,
		selection: proximitySelection,
		selectionFilterTo: filterTo,
		selectionFilterOut: filterOut,
		setBasePhaseSeries,
		setDailyRange,
		setFitSeries,
		setHasRunFit,
		setNormalize,
		setPercentileFit,
		tcFits,
		withLoading,
	};
};

export default useProximityFit;
export { useCBD };
