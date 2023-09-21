import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import produce from 'immer';
import _, { capitalize, cloneDeep, isArray, isBoolean, merge, pick } from 'lodash-es';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useDerivedState, useSelection } from '@/components/hooks';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { genericErrorAlert, useDoggo, warningAlert } from '@/helpers/alerts';
import { calculatePercentile } from '@/helpers/math';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';
import {
	// removeAllTypeCurveFitQueries,
	useFitInit,
	useRawBackgroundData,
	useTcFits,
} from '@/type-curves/TypeCurveFit/api';
import { cacheTcData, useTcWellAssignments, useTypeCurveWellHeaders, useTypeCurveWellsData } from '@/type-curves/api';
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

import { shiftNonMatchingSegments } from '../charts/shared';

const genMinMaxLabel = (label, value) => `${capitalize(label)} (${value})`;

const multiSeg = new MultipleSegments();
const SERIES = ['P10', 'P50', 'P90', 'best'];

const TypeCurveFitDataContext = createContext();

const DEFAULT_DAILY_RANGE = [0, 2000];

const getMergedDataToggles = (obj1, obj2) => {
	const mergeKeys = ['align', 'eurPercentile', 'normalize', 'resolution'];

	const obj1KeyValues = pick(obj1, mergeKeys);
	const obj2KeyValues = pick(obj2, mergeKeys);

	return merge(obj1KeyValues, obj2KeyValues);
};

const getSeriesInfo = (savedFit, phaseType) => {
	if (!savedFit) {
		return { series: {}, validSeries: false };
	}
	const { P_dict, ratio_P_dict } = savedFit;
	const series = phaseType === 'rate' ? P_dict : ratio_P_dict;

	// HACK: enforcing 4 series for now; subject to change, needs discussion
	const validSeries = series && isValidPDict(series);
	return { series: cloneDeep(series), validSeries };
};

const EMPTY_OBJ = {};

const TypeCurveFitProviderRender = (props) => {
	const {
		activeFormConfig,
		basePhase,
		children,
		defaultFormConfig,
		fitInit,
		fitPhaseTypes,
		formConfigDialog,
		headersMap,
		loadingInitialization,
		location = 'typecurve',
		phase,
		phaseRepWells,
		phaseType,
		proximityProps = EMPTY_OBJ,
		rawBackgroundData,
		reloadFitInit,
		resolution,
		setPhase: _setPhase,
		setResolution: _setResolution,
		showFormConfigDialog,
		tcFits,
		tcId,
	} = props;

	const isProximity = location === 'proximity';

	const [align, _setAlign] = useDerivedState(isProximity ? 'noalign' : 'align', location);
	const [basePhaseSeries, setBasePhaseSeries] = useState('best');
	const [dailyRange, setDailyRange] = useState({
		align: [...DEFAULT_DAILY_RANGE],
		noalign: [...DEFAULT_DAILY_RANGE],
	});
	const [eurPercentile, setEurPercentile] = useState(false);
	const [fitEdited, setFitEdited] = useState(false);
	const [fitSeries, setFitSeries] = useState({});
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState('auto');
	const [normalize, setNormalize] = useState(isProximity);
	const [percentileFit, setPercentileFit] = useState(null);
	const [phaseLoaded, setPhaseLoaded] = useState(false);
	const [hasRun, setHasRun] = useState(false);
	const [peakMethod, setPeakMethod] = useState(null);

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
			return Object.entries(fitSeries).reduce((acc, [pKey, { segments }]) => {
				acc[pKey] = { segments: alignIsMatching ? segments : shiftNonMatchingSegments(segments, fitAlign) };
				return acc;
			}, {});
		}
		return null;
	}, [align, fit?.align, fitSeries]);

	// selection is defined from the top layer
	const { selection: proximitySelection, filterTo, filterOut } = proximityProps?.proximityWellSelection ?? EMPTY_OBJ;
	const selection = useSelection(phaseRepWells);

	const calculatedBackgroundData = useMemo(() => {
		// do not apply normalization here
		if (rawBackgroundData && phaseLoaded) {
			const isMonthly = resolution === 'monthly';

			// check phaseType - rate or ratio
			if (phaseType === 'rate') {
				// used to when filtering out/to
				const wellIndexesToUse = [];
				const {
					cum_dict: raw_cum_dict,
					eur: raw_eur,
					well_information_s: raw_well_information_s,
					normalization: _raw_normalization,
				} = rawBackgroundData;
				const raw_normalization = _raw_normalization.map((eur) => [eur]);
				const multipliers = _raw_normalization.map((eur) => ({ eur }));
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
				const wellIndexesToUse = [];

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
	const { cumData, eurData, prodData, noalignMonthlyTargetProdData, alignMonthlyTargetPhaseData } = useMemo(() => {
		if (calculatedBackgroundData) {
			const { align: alignData, noalign: noalignData } = getMonthlyTargetPhaseData(
				calculatedBackgroundData,
				phaseType === 'rate',
				normalize
			);

			return {
				cumData: getCumData(calculatedBackgroundData, normalize),
				eurData: getEurData(calculatedBackgroundData, normalize),
				prodData: getProdData(calculatedBackgroundData, phaseType === 'rate' && normalize)[align],
				noalignMonthlyTargetProdData: noalignData,
				alignMonthlyTargetPhaseData: alignData,
			};
		}
		return { cumData: null, eurData: null, prodData: null, noalignMonthlyTargetProdData: null };
	}, [align, calculatedBackgroundData, normalize, phaseType]);

	const dailyRangeMinMax = useMemo(() => {
		const base = { max: 2000, endLabel: 'Max (2000)' };
		if (align === 'align' && rawBackgroundData && phaseType === 'rate') {
			const minValue = rawBackgroundData.well_information_s.reduce((num, el) => {
				const { first_data, maximum_data } = el.indexes;
				return Math.min(num, first_data.idx - maximum_data.idx);
			}, 0);

			return {
				minMax: { min: minValue, startLabel: `Min (${minValue})`, ...base },
				default: { min: Math.max(-2000, minValue), max: 2000 },
			};
		}

		return { minMax: { min: 0, startLabel: 'Min (0)', ...base }, default: { min: 0, max: 2000 } };
	}, [align, rawBackgroundData, phaseType]);

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

	const setAlign = useCallback(
		(checked) => {
			if (checked) {
				_setAlign('align');
			} else {
				_setAlign('noalign');
			}
		},
		[_setAlign]
	);

	const setResolution = useCallback(
		(checked) => {
			if (checked) {
				_setResolution('daily');
			} else {
				_setResolution('monthly');
			}
		},
		[_setResolution]
	);

	const setPhase = useCallback(
		(value) => {
			setPhaseLoaded(false);
			setFitEdited(false);
			_setPhase(value);
		},
		[_setPhase]
	);

	const setDataTogglesState = useCallback(
		(state1, state2) => {
			const newState = getMergedDataToggles(state1, state2);
			const {
				align: alignState,
				eurPercentile: eurPercentileState,
				normalize: normalizeState,
				resolution: resolutionState,
			} = newState;

			if (alignState) {
				if (phaseType === 'rate') {
					setAlign(alignState === 'align');
				} else {
					setAlign(false);
				}
			}
			if (isBoolean(eurPercentileState)) {
				setEurPercentile(eurPercentileState);
			}
			if (isBoolean(normalizeState)) {
				setNormalize(normalizeState);
			}
			if (resolutionState) {
				_setResolution(resolutionState);
			}
		},
		[_setResolution, phaseType, setAlign]
	);

	const requiredMinMax = useMemo(() => {
		const output = {};

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
		const method = peakMethod;
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

		return Object.entries(output).reduce((obj, [key, value]) => {
			const { min, max } = value;
			obj[key] = {
				...value,
				startLabel: genMinMaxLabel('min', min),
				endLabel: genMinMaxLabel('max', max),
			};

			return obj;
		}, {});
	}, [align, calculatedBackgroundData, peakMethod, phaseRepWells.length, prodData]);

	// check if phase is valid (ex ratio with valid base phase fit)
	useEffect(() => {
		if (tcFits) {
			if (phaseType === 'rate' || isProximity) {
				setPhaseLoaded(true);
			} else {
				const { validSeries } = getSeriesInfo(tcFits[basePhase], 'rate');
				if (validSeries) {
					setPhaseLoaded(true);
					setAlign(false);
				} else {
					warningAlert(
						`${capitalize(phase)} is a ratio type curve based on ${capitalize(
							basePhase
						)}. Please ensure that there is a saved fit for ${capitalize(basePhase)} first.`,
						5000
					);
					setPhase(basePhase);
				}
			}
		}
	}, [basePhase, isProximity, phase, phaseType, setAlign, setPhase, tcFits]);

	// adjust toggles when default config or initSettings change
	useEffect(() => {
		setDataTogglesState(defaultFormConfig ?? {}, fit);
	}, [defaultFormConfig, fit, setDataTogglesState]);

	// adjust toggles when active config changes
	useEffect(() => {
		setDataTogglesState({}, activeFormConfig ?? {});
	}, [activeFormConfig, setDataTogglesState]);

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

	// changing align or calculatedBackgroundData should change the dailyRange
	useEffect(() => {
		if (dailyRangeMinMax) {
			setDailyRange(
				produce((draft) => {
					const { min, max } = dailyRangeMinMax.default;
					draft[align] = [min, max];
				})
			);
		}
	}, [align, dailyRangeMinMax]);

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

	// Sets the proximity normalization array when normalized
	const _setProximityBgNormalization = proximityProps?.setProximityBgNormalization;

	useEffect(() => {
		_setProximityBgNormalization?.(normalize ? rawBackgroundData?.normalization : null);
	}, [normalize, _setProximityBgNormalization, rawBackgroundData?.normalization]);

	useEffect(() => {
		if (isProximity) {
			setFitSeries({});
			setHasRun(false);
		}
	}, [phase, basePhase, phaseType, proximityProps.wellId, isProximity]);

	// show dog when fetching data
	useDoggo(loading, 'Loading...');

	const contextObj = useMemo(
		() => ({
			activeFormConfig,
			align,
			alignAdjustedFitSeries,
			alignMonthlyTargetPhaseData,
			basePhase,
			basePhaseSeries,
			baseSegments,
			calculatedBackgroundData,
			cumData,
			dailyRange,
			dailyRangeMinMax,
			defaultFormConfig,
			eurData,
			eurPercentile,
			eurs,
			fit,
			fitEdited,
			fitInit,
			fitSeries,
			formConfigDialog,
			getShiftBaseSegments,
			hasRun,
			headersMap,
			isProximity,
			loadingInitialization,
			location,
			mode,
			noalignMonthlyTargetProdData,
			normalize,
			noWells: !phaseRepWells.length,
			percentileFit,
			phase,
			phaseRepWells,
			phaseType,
			prodData,
			proximityProps,
			rawBackgroundData,
			reloadFitInit,
			resolution,
			requiredMinMax,
			selection: isProximity ? proximitySelection : selection,
			selectionFilterTo: filterTo,
			selectionFilterOut: filterOut,
			setAlign,
			setBasePhaseSeries,
			setDailyRange,
			setEurPercentile,
			setFitEdited,
			setFitSeries,
			setHasRun,
			setMode,
			setNormalize,
			setPeakMethod,
			setPercentileFit,
			setPhase,
			setResolution,
			showFormConfigDialog,
			tcFits,
			tcId,
			withLoading,
		}),
		[
			activeFormConfig,
			align,
			alignAdjustedFitSeries,
			alignMonthlyTargetPhaseData,
			basePhase,
			basePhaseSeries,
			baseSegments,
			calculatedBackgroundData,
			cumData,
			dailyRange,
			dailyRangeMinMax,
			defaultFormConfig,
			eurData,
			eurPercentile,
			eurs,
			filterOut,
			filterTo,
			fit,
			fitEdited,
			fitInit,
			fitSeries,
			formConfigDialog,
			getShiftBaseSegments,
			hasRun,
			headersMap,
			isProximity,
			loadingInitialization,
			location,
			mode,
			noalignMonthlyTargetProdData,
			normalize,
			percentileFit,
			phase,
			phaseRepWells,
			phaseType,
			prodData,
			proximityProps,
			proximitySelection,
			rawBackgroundData,
			reloadFitInit,
			requiredMinMax,
			resolution,
			selection,
			setAlign,
			setPeakMethod,
			setPhase,
			setResolution,
			showFormConfigDialog,
			tcFits,
			tcId,
			withLoading,
		]
	);

	return <TypeCurveFitDataContext.Provider value={contextObj}>{children}</TypeCurveFitDataContext.Provider>;
};

const TypeCurveFitDataProvider = ({ children }) => {
	const { id: tcId } = useParams();

	const [phase, setPhase] = useState('oil');
	const [resolution, setResolution] = useState('monthly');

	const { data: headersMap, isLoading: headersMapIsLoading } = useTypeCurveWellHeaders(tcId);

	const {
		query: { data: fitInit, isLoading: fitInitIsLoading },
		reload: reloadFitInit,
	} = useFitInit(tcId);

	const repInitQuery = useTypeCurveWellsData(tcId);
	const { data: repInitDataMap, isLoading: repInitLoading } = repInitQuery;

	const { query: assignmentsQuery } = useTcWellAssignments(tcId);
	const { data: assignmentData, isLoading: assignmentsLoading } = assignmentsQuery;

	const phaseValidWells = useMemo(() => {
		if (repInitLoading) {
			return [];
		}
		const wells = Array.from(repInitDataMap.keys());
		const ret = wells.filter((well) => repInitDataMap.get(well)?.valid?.[phase] ?? false);
		return ret?.length ? ret : [];
	}, [repInitLoading, repInitDataMap, phase]);

	const phaseRepWells = useMemo(() => {
		if (!assignmentsLoading && assignmentData) {
			return _.filter(phaseValidWells, (wellId) => assignmentData[wellId][phase]);
		}
		return [];
	}, [assignmentData, assignmentsLoading, phase, phaseValidWells]);

	// maps to old C4 data
	const { data: validBackgroundData, isLoading: rawBackgroundDataIsLoading } = useRawBackgroundData({
		phase,
		resolution,
		repInitQuery,
		tcId,
		wells: phaseValidWells,
	});

	const phaseType = useMemo(() => fitInit?.phaseType?.[phase] ?? 'rate', [fitInit?.phaseType, phase]);

	const rawBackgroundData = useMemo(() => {
		if (!rawBackgroundDataIsLoading && validBackgroundData) {
			const adjustData = (draft) => {
				const { well_information_s, cum_dict, normalization, eur } = draft;
				const informationMap = _.reduce(
					well_information_s,
					(acc, value, key) => {
						acc[value.header.well_id] = { ...value, index: key };
						return acc;
					},
					{}
				);

				const sortedRemainingIndices = _.reduce(
					informationMap,
					(acc, value, key) => {
						if (phaseRepWells.includes(key)) {
							acc.push(value.index);
						}
						return acc;
					},
					[]
				);

				// filtered well info
				if (well_information_s) {
					draft.well_information_s = _.map(sortedRemainingIndices, (idx) => well_information_s[idx]);
				}

				// adjust cum_dict
				if (cum_dict) {
					const filteredSubind = _.map(sortedRemainingIndices, (idx) => cum_dict.cum_subind[idx]);
					const subindMin = Math.min(..._.map(filteredSubind, (value) => value[0]));
					const subindMax = Math.max(..._.map(filteredSubind, (value) => value[1]));

					const filteredCumIdx = cum_dict.idx.slice(subindMin, subindMax);
					const filteredCumSubind = _.map(filteredSubind, (value) => [
						value[0] - subindMin,
						value[1] - subindMin,
					]);

					draft.cum_dict = {
						cum_subind: filteredCumSubind,
						idx: filteredCumIdx,
					};
				}
				if (normalization) {
					draft.normalization = _.map(sortedRemainingIndices, (idx) => normalization[idx]);
				}
				if (eur) {
					draft.eur = _.map(sortedRemainingIndices, (idx) => eur[idx]);
				}
			};

			if (phaseType === 'rate') {
				return produce(validBackgroundData, adjustData);
			}
			if (phaseType === 'ratio') {
				return {
					...validBackgroundData,
					ratio: produce(validBackgroundData.ratio, adjustData),
					target_phase: produce(validBackgroundData.target_phase, adjustData),
				};
			}
		}
	}, [rawBackgroundDataIsLoading, validBackgroundData, phaseType, phaseRepWells]);

	const { data: tcFits = {}, isLoading: tcFitsIsLoading, isFetching: tcFitsIsFetching } = useTcFits(tcId);

	const fitPhaseTypes = useMemo(() => fitInit?.phaseType, [fitInit?.phaseType]);
	const basePhase = useMemo(() => fitInit?.basePhase, [fitInit?.basePhase]);

	const formConfigKey = `tcFit${capitalize(phaseType)}${capitalize(phase)}`;

	const {
		activeConfig: activeFormConfig,
		defaultConfig: defaultFormConfig,
		dialog: formConfigDialog,
		showConfigDialog: showFormConfigDialog,
	} = useConfigurationDialog({
		applyDefaultAsActive: false,
		key: formConfigKey,
		title: `${capitalize(phase)} ${capitalize(phaseType)} Configuration`,
	});

	const loadingInitialization =
		repInitLoading || headersMapIsLoading || fitInitIsLoading || rawBackgroundDataIsLoading || tcFitsIsLoading;

	const providerProps = {
		activeFormConfig,
		basePhase,
		defaultFormConfig,
		fitInit,
		fitPhaseTypes,
		formConfigDialog,
		headersMap,
		loadingInitialization,
		phase,
		phaseRepWells,
		phaseType,
		rawBackgroundData,
		reloadFitInit,
		resolution,
		setPhase,
		setResolution,
		showFormConfigDialog,
		tcFits,
		tcFitsIsFetching,
		tcId,
	};

	const hasRunCache = useRef(false);
	useEffect(() => {
		if (!(loadingInitialization || hasRunCache.current)) {
			// @hack: delay cache load;
			setTimeout(() => {
				cacheTcData(tcId);
			}, 5000);
			hasRunCache.current = true;
		}
	}, [loadingInitialization, tcId]);

	return <TypeCurveFitProviderRender {...providerProps}>{children}</TypeCurveFitProviderRender>;
};

export default TypeCurveFitDataProvider;
export { TypeCurveFitDataContext, TypeCurveFitProviderRender };
