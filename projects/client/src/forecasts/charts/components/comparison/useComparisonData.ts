import { MultipleSegments } from '@combocurve/forecast/models';
import produce from 'immer';
import _, { get, set } from 'lodash-es';
import { useMemo } from 'react';

import { VALID_PHASES, VALID_RATIOS } from '@/forecasts/charts/components/graphProperties';
import { dataInit, getHistoricalSegments, useForecastChartWarning } from '@/forecasts/charts/components/helpers';
import { useComparisonForecastCalcs } from '@/forecasts/shared';
import { union } from '@/helpers/sets';
import { phases } from '@/helpers/zing';

import { useComparisonWellData } from '../deterministic/grid-chart/api';
import { getMarkerIndexes, getSwIndexes } from '../deterministic/grid-chart/shared';
import { tabularizeDailyData, tabularizeMonthlyData } from '../deterministic/grid-chart/useDeterministicData';

const multiSeg = new MultipleSegments();

const getAlignedData = (data) => {
	return produce(data, (draft) => {
		const reference = draft?.forecast?.reference?.data;
		const comparisons = draft?.forecast?.comparisons ?? {};

		const referenceStartIdx = phases.reduce(
			(obj, { value: phase }) => {
				const referenceType = get(reference, `${phase}.forecastType`);
				if (referenceType === 'ratio') {
					return { ...obj, [phase]: get(reference, `${phase}.ratio.segments.0.start_idx`, null) };
				}
				return { ...obj, [phase]: get(reference, `${phase}.P_dict.best.segments.0.start_idx`, null) };
			},
			{ oil: null, gas: null, water: null }
		);

		Object.keys(comparisons).forEach((comparisonKey) => {
			const path = `forecast.comparisons.${comparisonKey}.data`;
			Object.keys(get(draft, path)).forEach((phase) => {
				const forecastType = get(draft, `${path}.${phase}.forecastType`);
				if (forecastType === 'no_forecast') {
					return;
				}

				const startIdx = referenceStartIdx[phase];
				if (Number.isFinite(startIdx)) {
					let segPath = `${phase}.P_dict.best.segments`;
					if (forecastType === 'ratio') {
						segPath = `${phase}.ratio.segments`;
					}

					const segments = get(draft, `${path}.${segPath}`, []);
					if (!segments?.length) {
						return;
					}

					const curStartIdx = segments[0].start_idx;
					const newSegments = multiSeg.shiftSegmentsIdx({
						inputSegments: segments,
						deltaT: startIdx - curStartIdx,
					});

					set(draft, `${path}.${segPath}`, newSegments);
				}
			});
		});
	});
};

const adjustDataFreq = (data) => {
	return produce(data, (draft) => {
		const comparisons = draft?.forecast?.comparisons ?? {};
		_.forEach(comparisons, (_value, comparisonKey) => {
			const path = `forecast.comparisons.${comparisonKey}.data`;
			_.forEach(get(draft, path), (_value, phase) => {
				const dataFreqPath = `${path}.${phase}.data_freq`;
				const curDataFreq = get(draft, dataFreqPath);
				set(draft, dataFreqPath, curDataFreq);
			});
		});
	});
};

const parseForecastData = (data, monthlyData, dailyData) => {
	const valid = new Set();
	const index: Array<number> = [];
	_.forEach(data, (datum) => {
		if (!datum) {
			return;
		}

		// forecastType is the type of the forecast-data, type is the type of the parent forecast
		const { forecastType, phase, type } = datum;
		let segments;
		if (type === 'probabilistic') {
			if (forecastType !== 'not_forecasted') {
				segments = getHistoricalSegments(datum);
				valid.add(phase);
				valid.add(`cumsum_${phase}`);
			}
		}
		if (type === 'deterministic') {
			if (forecastType === 'rate') {
				segments = getHistoricalSegments(datum);
				valid.add(phase);
				valid.add(`cumsum_${phase}`);
			}
			if (forecastType === 'ratio') {
				const {
					ratio: { basePhase, segments: ratioSegments },
				} = datum;
				segments = ratioSegments;
				valid.add(`${phase}/${basePhase}`);
				valid.add(`cumsum_${phase}`);
			}
		}

		if (segments?.length) {
			segments.forEach((segment) => {
				const { start_idx, end_idx, sw_idx } = segment;
				index.push(parseInt(start_idx, 10));
				index.push(parseInt(end_idx, 10));
				if (sw_idx >= start_idx && sw_idx <= end_idx) {
					index.push(parseInt(sw_idx, 10));
				}
			});
		}
	});

	const minIndex = Math.min(...index);
	const maxIndex = Math.max(...index);

	let timeSet: Set<number> = new Set();
	for (let i = minIndex; i < maxIndex; i += 30) {
		timeSet.add(i);
	}

	timeSet = union(timeSet, index);
	const timeArr = [...timeSet].sort((a, b) => a - b);

	const output = { index: timeArr, markerIndexes: {}, swIndexes: {} };
	_.forEach(data, (datum) => {
		if (!datum) {
			return;
		}

		const { forecastType, phase, type, data_freq } = datum;
		const prodData = data_freq === 'monthly' ? monthlyData : dailyData;
		let swIndexes;
		if (type === 'probabilistic') {
			if (forecastType !== 'not_forecasted') {
				const segments = getHistoricalSegments(datum);
				output[phase] = multiSeg.predict({ idxArr: timeArr, segments, toFill: null });
				output[`cumsum_${phase}`] = multiSeg.cumFromT({
					idxArr: timeArr,
					production: prodData,
					series: segments,
					phase,
					dataFreq: data_freq,
				});
				output.markerIndexes[phase] = getMarkerIndexes(timeArr, segments);
				swIndexes = getSwIndexes(timeArr, segments);
				if (swIndexes.length > 0) {
					output.swIndexes[phase] = swIndexes;
				}
			}
		}
		if (type === 'deterministic') {
			if (forecastType === 'rate') {
				const segments = getHistoricalSegments(datum);
				output[phase] = multiSeg.predict({ idxArr: timeArr, segments, toFill: null });
				output[`cumsum_${phase}`] = multiSeg.cumFromT({
					idxArr: timeArr,
					production: prodData,
					series: segments,
					phase,
					dataFreq: data_freq,
				});
				output.markerIndexes[phase] = getMarkerIndexes(timeArr, segments);
				swIndexes = getSwIndexes(timeArr, segments);
				if (swIndexes.length > 0) {
					output.swIndexes[phase] = swIndexes;
				}
			}
			if (forecastType === 'ratio') {
				const {
					ratio: { basePhase, segments: ratioSegments },
				} = datum;
				const baseSegments = getHistoricalSegments(_.filter(data, (x) => x.phase === basePhase)[0]);
				output[`${phase}/${basePhase}`] = multiSeg.predict({
					idxArr: timeArr,
					segments: ratioSegments,
					toFill: null,
				});
				output[`cumsum_${phase}`] = multiSeg.cumFromTRatio({
					idxArr: timeArr,
					production: prodData,
					ratioSeries: ratioSegments ?? [],
					baseSeries: baseSegments,
					phase,
					dataFreq: data_freq,
				});
				output.markerIndexes[`${phase}/${basePhase}`] = getMarkerIndexes(timeArr, ratioSegments);
				swIndexes = getSwIndexes(timeArr, ratioSegments);
				if (swIndexes.length > 0) {
					output.swIndexes[`${phase}/${basePhase}`] = swIndexes;
				}
			}
		}
	});

	return dataInit(output, [...VALID_PHASES, ...VALID_RATIOS], [...valid]);
};

const useComparisonData = ({
	comparisonIds,
	comparisonResolutions,
	dataDep,
	disableDataQuery,
	enableAlign,
	refForecastId,
	wellId,
}) => {
	const { query: queryResult, queryKey } = useComparisonWellData({
		comparisonIds,
		forecastId: refForecastId,
		options: { enabled: !(disableDataQuery || dataDep) && !!comparisonIds },
		wellId,
	});

	const data = useMemo(() => {
		const baseData = dataDep ?? queryResult.data;
		if (baseData) {
			const alignData = enableAlign ? getAlignedData(baseData) : baseData;
			return adjustDataFreq(alignData);
		}
		return null;
	}, [dataDep, enableAlign, queryResult.data]);

	const { warnings, showWarning, hasWarning } = useForecastChartWarning({
		forecastData: data,
		queryData: queryResult.data,
		forecastId: refForecastId,
		forecastPath: 'forecast.reference.data',
		isUsingDep: Boolean(dataDep),
		refetch: queryResult.refetch,
		queryKey,
		wellId,
	});

	// todo: fix typing for `data`
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { headers, monthly: monthlyData, daily: dailyData, forecast: forecastData } = (data ?? {}) as any;

	const forecastCalcs = useComparisonForecastCalcs({
		comparisonResolutions,
		dailyProduction: dailyData,
		forecast: forecastData,
		monthlyProduction: monthlyData,
	});

	const monthly = useMemo(() => (monthlyData ? tabularizeMonthlyData(monthlyData) : null), [monthlyData]);
	const daily = useMemo(() => (dailyData ? tabularizeDailyData(dailyData) : null), [dailyData]);

	const forecast = useMemo(() => {
		const { comparisons, reference } = forecastData ?? {};
		if (comparisons && reference) {
			const allData = {
				[reference.forecastId]: { ...reference.data },
				..._.mapValues(comparisons, (value) => value.data),
			};

			const parsedData = _.mapValues(allData, (dataValue) =>
				parseForecastData(dataValue, monthlyData, dailyData)
			);

			return parsedData;
		}
		return null;
	}, [dailyData, forecastData, monthlyData]);

	const dataTable = useMemo(() => {
		const monthlyStartIdx = monthly?.index?.[0] ?? Infinity;
		const dailyStartIdx = daily?.index?.[0] ?? Infinity;
		const forecastStartIdx = forecast
			? Math.min(..._.map(forecast, (value: { index: Array<number> }) => value?.index?.[0] ?? Infinity))
			: Infinity;

		const relativeIdx = Math.min(monthlyStartIdx, dailyStartIdx, forecastStartIdx);
		return {
			monthly: monthly
				? {
						...monthly,
						ranges: {
							...monthly.ranges,
							relativeTime: [0, monthly.index[monthly.index.length - 1] - monthlyStartIdx],
						},
						relativeTime: monthly.index.map((value) => value - relativeIdx),
						valid: new Set([...monthly.valid, 'relativeTime']),
				  }
				: null,
			daily: daily
				? {
						...daily,
						ranges: {
							...daily.ranges,
							relativeTime: [0, daily.index[daily.index.length - 1] - dailyStartIdx],
						},
						relativeTime: daily.index.map((value) => value - relativeIdx),
						valid: new Set([...daily.valid, 'relativeTime']),
				  }
				: null,
			forecast: forecast
				? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				  _.mapValues(forecast, (fValue: any) => ({
						...fValue,
						relativeTime: fValue.index.map((value) => value - relativeIdx),
						valid: new Set([...fValue.valid, 'relativeTime']),
				  }))
				: null,
			relativeIdx,
		};
	}, [monthly, daily, forecast]);

	return {
		dailyData,
		dataLoaded: !!data,
		dataTable,
		forecastCalcs,
		forecastData: forecastData?.reference?.data,
		hasWarning,
		headers,
		isLoading: queryResult.isLoading,
		monthlyData,
		queryKey,
		rawData: data,
		showWarning,
		warnings,
	};
};

export default useComparisonData;
