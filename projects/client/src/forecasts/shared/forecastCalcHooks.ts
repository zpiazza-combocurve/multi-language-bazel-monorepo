import { MultipleSegments } from '@combocurve/forecast/models';
import { useMemo } from 'react';

import {
	getPhaseForecastInfo,
	getPhaseSegments,
} from '@/forecasts/charts/components/deterministic/phase-chart/helpers';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { getCumProd, getEndDataIdx } from '@/forecasts/charts/forecastChartHelper';
import { isNumberAndNotZero } from '@/helpers/math';
import { phases } from '@/helpers/zing';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';

import { ForecastType, Phase } from '../forecast-form/automatic-form/types';

const multiSeg = new MultipleSegments();

// ToDo: define proper types
const generateDeterministicForecastCalc = ({
	benchmarkResolutionDict,
	dailyCums,
	dailyProduction = null,
	forecasts,
	manualPhase,
	manualSeries,
	monthlyCums,
	monthlyProduction = null,
	referenceEur,
	resolutionSource = 'self',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	benchmarkResolutionDict?: any;
	dailyCums: Record<Phase, number>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecasts?: any;
	manualPhase?: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualSeries?: Array<any>;
	monthlyCums: Record<Phase, number>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	referenceEur?: any;
	resolutionSource?: string;
}) =>
	forecasts
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		  Object.entries(forecasts).reduce((obj, [phase, data]: [phase: any, data: any]) => {
				if (!data) {
					return obj;
				}

				const { data_freq, typeCurve, typeCurveModel, typeCurveApplySetting, forecastSubType } = data;
				const {
					forecastType,
					ratio,
					segments: phaseSegments,
				} = getPhaseForecastInfo({ wellData: { data: forecasts }, phase });

				// get forecast props
				let resolution;
				switch (resolutionSource) {
					case 'daily': {
						resolution = 'daily';
						break;
					}
					case 'monthly': {
						resolution = 'monthly';
						break;
					}
					case 'benchmark': {
						resolution = benchmarkResolutionDict?.[phase] ?? data_freq;
						break;
					}
					case 'self': {
						resolution = data_freq;
						break;
					}
					default: {
						resolution = data_freq;
						break;
					}
				}

				const isMonthly = resolution === 'monthly';
				const isRatio = forecastType === 'ratio';

				const cumData = (isMonthly ? monthlyCums : dailyCums)[phase];
				const production = isMonthly ? monthlyProduction : dailyProduction;

				let segments = (isRatio ? ratio.segments : phaseSegments) ?? [];
				if (manualPhase === phase && manualSeries?.length) {
					segments = manualSeries;
				}

				// calculate time positioning
				const endDataIdx = getEndDataIdx(production);
				const leftIdx = segments[0]?.start_idx ?? endDataIdx;
				const rightIdx = segments[segments.length - 1]?.end_idx ?? 0;
				const len = segments?.length - 1;

				const eur = isRatio
					? multiSeg.ratioEurInterval({
							cumData,
							endDataIdx,
							leftIdx,
							rightIdx,
							ratioTSegments: segments,
							baseSegments: getPhaseSegments({ wellData: { data: forecasts }, phase: ratio.basePhase }),
							dataFreq: resolution,
					  })
					: multiSeg.rateEur({
							cumData,
							endDataIdx,
							leftIdx,
							rightIdx,
							forecastSegments: segments,
							dataFreq: resolution,
					  });

				const refEur = referenceEur?.[phase]?.eur;
				const eurDif = isNumberAndNotZero(refEur) ? (eur - refEur) / refEur : null;
				return {
					...obj,
					[phase]: {
						b: segments?.[len]?.b ?? null,
						Deff: segments?.[len]?.D_eff ?? null,
						eur,
						eurDif,
						forecastType,
						typeCurve,
						typeCurveModel,
						typeCurveApplySetting,
						forecastSubType,
					},
				};
		  }, {})
		: {};

// ToDo: define proper types
const generateProbabilisticForecastCalc = ({
	productionCum,
	production = null,
	forecasts,
	manualPhase,
	manualSeries,
}: {
	productionCum: Record<Phase, number>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecasts: any;
	manualPhase?: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualSeries?: Array<any>;
}) =>
	forecasts
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		  Object.entries(forecasts).reduce((obj, [phase, data]: [phase: any, data: any]) => {
				if (!data) {
					return obj;
				}

				const { data_freq, P_dict } = data;
				const pDictObj =
					Object.entries(P_dict ?? {})?.reduce((pObj, [pSeries, pData]) => {
						if (!pData) {
							return pObj;
						}

						const { forecastType, segments: phaseSegments } = getPhaseForecastInfo({
							wellData: { data: forecasts },
							phase,
							pSeries,
						});
						const cumData = productionCum[phase];

						let segments = phaseSegments ?? [];
						if (manualPhase === phase && manualSeries?.length) {
							segments = manualSeries;
						}

						const endDataIdx = getEndDataIdx(production);
						const leftIdx = segments[0]?.start_idx ?? endDataIdx;
						const rightIdx = segments[segments.length - 1]?.end_idx ?? 0;
						const len = segments?.length - 1;
						const eur = multiSeg.rateEur({
							cumData,
							endDataIdx,
							leftIdx,
							rightIdx,
							forecastSegments: segments ?? [],
							dataFreq: data_freq,
						});

						return {
							...pObj,
							[pSeries]: {
								b: segments?.[len]?.b ?? null,
								Deff: segments?.[len]?.D_eff ?? null,
								eur,
								forecastType,
							},
						};
					}, {}) ?? {};

				return {
					...obj,
					[phase]: pDictObj,
				};
		  }, {})
		: {};

const useCums = ({
	dailyProduction = null,
	monthlyProduction = null,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any> | null;
}) => {
	const dailyCums = useMemo(
		() =>
			phases.reduce(
				(obj, { value: phase }) => ({
					...obj,
					[phase]: getCumProd(dailyProduction, phase, 'daily'),
				}),
				{} as Record<Phase, number>
			),
		[dailyProduction]
	);

	const monthlyCums = useMemo(
		() =>
			phases.reduce(
				(obj, { value: phase }) => ({
					...obj,
					[phase]: getCumProd(monthlyProduction, phase, 'monthly'),
				}),
				{} as Record<Phase, number>
			),
		[monthlyProduction]
	);

	return Object.assign([dailyCums, monthlyCums], { dailyCums, monthlyCums });
};

// ToDo: define proper types
const useCumsAndEur = ({
	dailyProduction,
	monthlyProduction,
	forecasts,
	manualPhase,
	manualSeries,
	type = 'deterministic',
	resolution,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecasts?: any;
	manualPhase?: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualSeries?: Array<any>;
	type?: ForecastType;
	resolution?: FitResolution;
}): { dailyCums; monthlyCums; forecastCalcs } => {
	const [dailyCums, monthlyCums] = useCums({ dailyProduction, monthlyProduction });

	const forecastCalcs = useMemo(
		() =>
			type === 'deterministic'
				? generateDeterministicForecastCalc({
						dailyCums,
						dailyProduction,
						forecasts,
						manualPhase,
						manualSeries,
						monthlyCums,
						monthlyProduction,
						resolutionSource: resolution,
				  })
				: generateProbabilisticForecastCalc({
						productionCum: resolution === 'monthly' ? monthlyCums : dailyCums,
						production: resolution === 'monthly' ? monthlyProduction : dailyProduction,
						forecasts,
						manualPhase,
						manualSeries,
				  }),
		[
			type,
			dailyCums,
			dailyProduction,
			forecasts,
			manualPhase,
			manualSeries,
			monthlyCums,
			monthlyProduction,
			resolution,
		]
	);

	return Object.assign([dailyCums, monthlyCums, forecastCalcs], { dailyCums, monthlyCums, forecastCalcs });
};

// ToDo: define proper types
const useComparisonForecastCalcs = ({
	dailyProduction,
	monthlyProduction,
	forecast = {},
	comparisonResolutions,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecast: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	comparisonResolutions?: any;
}) => {
	const [dailyCums, monthlyCums] = useCums({ dailyProduction, monthlyProduction });

	const { comparisons, reference } = forecast;

	const sharedInput = useMemo(
		() => ({ dailyCums, dailyProduction, monthlyCums, monthlyProduction }),
		[dailyCums, dailyProduction, monthlyCums, monthlyProduction]
	);

	const benchmarkResolutionDict = VALID_PHASES.reduce((acc, k) => {
		acc[k] = reference?.data?.[k]?.data_freq ?? 'monthly';
		return acc;
	}, {});

	const referenceEur = useMemo(
		() =>
			reference
				? generateDeterministicForecastCalc({
						...sharedInput,
						forecasts: reference?.data,
						benchmarkResolutionDict,
				  })
				: null,
		[sharedInput, reference, benchmarkResolutionDict]
	);

	const comparisonEurs = useMemo(
		() =>
			comparisons && comparisonResolutions
				? Object.entries(comparisons).reduce(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						(obj, [forecastId, comparison]: [forecastId: any, comparison: any]) => {
							const resolutionSource = comparisonResolutions[forecastId] ?? 'monthly';
							const output = generateDeterministicForecastCalc({
								...sharedInput,
								forecasts: comparison?.data,
								resolutionSource,
								benchmarkResolutionDict,
								referenceEur,
							});

							return { ...obj, [forecastId]: output };
						},
						{}
				  )
				: null,
		[comparisons, comparisonResolutions, sharedInput, benchmarkResolutionDict, referenceEur]
	);

	return forecast?.reference ? { [forecast.reference.forecastId]: referenceEur, ...comparisonEurs } : {};
};

export { useCums, useCumsAndEur, useComparisonForecastCalcs };
