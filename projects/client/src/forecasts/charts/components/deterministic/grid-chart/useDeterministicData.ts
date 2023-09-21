import { MultipleSegments } from '@combocurve/forecast/models';
import _ from 'lodash';
import { useMemo } from 'react';

import {
	VALID_DAILY_CUSTOM_FIELDS,
	VALID_MONTHLY_CUSTOM_FIELDS,
	VALID_OTHER_FIELDS,
	VALID_PHASES,
	VALID_PRESSURES,
	VALID_RATIOS,
} from '@/forecasts/charts/components/graphProperties';
import {
	apply_operation,
	calcProdCum,
	dataInit,
	getHistoricalSegments,
	getLongestIncreasingSubsequence,
	useForecastChartWarning,
} from '@/forecasts/charts/components/helpers';
import { adjustedCustomFieldsKeyToData } from '@/forecasts/shared/StreamsMenuBtn';
import { union } from '@/helpers/sets';

import { useDeterministicWellData } from './api';
import { getMarkerIndexes, getSwIndexes } from './shared';

const multiSeg = new MultipleSegments();

// checks input data to see if a key exists and is an array of length greater than 0
const getValids = (validArr, data) => validArr.filter((phase) => data?.[phase]?.length);

const tabularizeMonthlyData = (data) => {
	const collectionKey = 'monthly';
	adjustedCustomFieldsKeyToData(data, collectionKey);
	const validPhases = getValids(VALID_PHASES, data);
	const valids = getValids([...VALID_PHASES, ...VALID_OTHER_FIELDS, ...VALID_MONTHLY_CUSTOM_FIELDS], data);

	const output = dataInit(
		data,
		[...VALID_PHASES, ...VALID_RATIOS, ...VALID_OTHER_FIELDS, ...VALID_MONTHLY_CUSTOM_FIELDS],
		valids
	);

	const monthlyCum = validPhases.reduce((obj, phase) => {
		output.valid.add(`cumsum_${phase}`);
		return calcProdCum(obj, phase, data, collectionKey, data.index);
	}, {});

	const mbts = validPhases.reduce((acc, phase) => {
		const phaseMbtKey = `mbt_${phase}`;
		const phaseCumKey = `cumsum_${phase}`;
		output.valid.add(phaseMbtKey);
		acc[phaseMbtKey] = apply_operation(monthlyCum[phaseCumKey], output[phase], '/');
		return acc;
	}, {});

	const mbtsFiltered = Object.keys(mbts).reduce((acc, mbtKey) => {
		const mbtFilteredkey = `${mbtKey}_filtered`;
		output.valid.add(mbtFilteredkey);
		acc[mbtFilteredkey] = getLongestIncreasingSubsequence(mbts[mbtKey]);
		return acc;
	}, {});

	const retWithoutRanges = { ...output, ...monthlyCum, ...mbts, ...mbtsFiltered };
	const ranges = Object.entries(retWithoutRanges).reduce((curObj, [key, value]) => {
		const range = [Math.min(...((value as Array<number>) ?? [])), Math.max(...((value as Array<number>) ?? []))];
		return { ...curObj, [key]: range };
	}, {});

	return { ...retWithoutRanges, ranges };
};

const tabularizeDailyData = (data) => {
	const collectionKey = 'daily';
	adjustedCustomFieldsKeyToData(data, collectionKey);
	const validPhases = getValids(VALID_PHASES, data);
	const valids = getValids(
		[...VALID_PHASES, ...VALID_PRESSURES, ...VALID_OTHER_FIELDS, ...VALID_DAILY_CUSTOM_FIELDS],
		data
	);

	const output = dataInit(
		data,
		[...VALID_PHASES, ...VALID_RATIOS, ...VALID_PRESSURES, ...VALID_OTHER_FIELDS, ...VALID_DAILY_CUSTOM_FIELDS],
		valids
	);

	const dailyCum = validPhases.reduce((obj, phase) => {
		output.valid.add(`cumsum_${phase}`);
		return calcProdCum(obj, phase, data, collectionKey, data.index);
	}, {});

	const mbts = validPhases.reduce((acc, phase) => {
		const phaseMbtKey = `mbt_${phase}`;
		const phaseCumKey = `cumsum_${phase}`;
		output.valid.add(phaseMbtKey);
		acc[phaseMbtKey] = apply_operation(dailyCum[phaseCumKey], output[phase], '/');
		return acc;
	}, {});

	const mbtsFiltered = Object.keys(mbts).reduce((acc, mbtKey) => {
		const mbtFilteredkey = `${mbtKey}_filtered`;
		output.valid.add(mbtFilteredkey);
		acc[mbtFilteredkey] = getLongestIncreasingSubsequence(mbts[mbtKey]);
		return acc;
	}, {});

	const ranges = Object.entries({ ...output, ...dailyCum }).reduce((curObj, [key, value]) => {
		const range = [Math.min(...(value as Array<number>)), Math.max(...(value as Array<number>))];
		return { ...curObj, [key]: range };
	}, {});
	return { ...output, ...dailyCum, ...mbts, ...mbtsFiltered, ranges };
};

const useDeterministicData = ({ dataDep, disableDataQuery, forecastId, wellId }) => {
	const { query: queryResult, queryKey } = useDeterministicWellData({
		forecastId,
		options: { enabled: !(disableDataQuery || dataDep) },
		wellId,
	});

	const { data: queryData, isLoading } = queryResult;
	const data = dataDep ?? queryData;

	const { warnings, showWarning, hasWarning } = useForecastChartWarning({
		forecastData: data,
		queryData,
		forecastId,
		isUsingDep: Boolean(dataDep),
		queryKey,
		refetch: queryResult.refetch,
		wellId,
	});

	const { headers, monthly: monthlyData, daily: dailyData, forecast: forecastData } = data || {};

	// build tabular data
	const monthly = useMemo(() => (monthlyData ? tabularizeMonthlyData(monthlyData) : null), [monthlyData]);
	const daily = useMemo(() => (dailyData ? tabularizeDailyData(dailyData) : null), [dailyData]);

	const forecast = useMemo(() => {
		if (forecastData) {
			const valid = new Set();
			const index: Array<number> = [];
			_.forEach(forecastData, (datum) => {
				const {
					forecastType,
					phase,
					ratio: { basePhase, segments: ratioSegments },
				} = datum;

				const rateSegments = getHistoricalSegments(datum);
				if (forecastType === 'rate' && rateSegments) {
					valid.add(phase);
					rateSegments.forEach((segment) => {
						const { start_idx, end_idx, sw_idx } = segment;
						index.push(parseInt(start_idx, 10));
						index.push(parseInt(end_idx, 10));
						if (sw_idx >= start_idx && sw_idx <= end_idx) {
							index.push(parseInt(sw_idx, 10));
						}
					});
				} else if (forecastType === 'ratio' && ratioSegments) {
					valid.add(`${phase}/${basePhase}`);
					ratioSegments.forEach((segment) => {
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
			_.forEach(forecastData, (datum) => {
				const {
					data_freq,
					forecastType,
					phase,
					ratio: { basePhase, segments: ratioSegments = [] },
				} = datum;

				const rateSegments = getHistoricalSegments(datum);
				const prodData = data_freq === 'monthly' ? monthlyData : dailyData;
				let swIndexes;
				if (forecastType === 'rate') {
					output[phase] = multiSeg.predict({ idxArr: timeArr, segments: rateSegments, toFill: null });
					valid.add(`cumsum_${phase}`);
					output[`cumsum_${phase}`] = multiSeg.cumFromT({
						idxArr: timeArr,
						production: prodData,
						series: rateSegments,
						phase,
						dataFreq: data_freq,
					});
					output.markerIndexes[phase] = getMarkerIndexes(timeArr, rateSegments);
					swIndexes = getSwIndexes(timeArr, rateSegments);
					if (swIndexes.length > 0) {
						output.swIndexes[phase] = swIndexes;
					}
				} else if (forecastType === 'ratio') {
					const baseSegments = getHistoricalSegments(_.filter(forecastData, (x) => x.phase === basePhase)[0]);
					output[`${phase}/${basePhase}`] = multiSeg.predict({
						idxArr: timeArr,
						segments: ratioSegments ?? [],
						toFill: null,
					});
					valid.add(`cumsum_${phase}`);
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
			});

			const ret = dataInit(output, [...VALID_PHASES, ...VALID_RATIOS], [...valid]);

			VALID_PHASES.forEach((phase) => {
				if (ret.valid.has(phase)) {
					const phaseMbtKey = `mbt_${phase}`;
					const phaseCumKey = `cumsum_${phase}`;
					ret.valid.add(phaseMbtKey);
					ret[phaseMbtKey] = apply_operation(ret[phaseCumKey], ret[phase], '/');
					const mbtFilteredkey = `${phaseMbtKey}_filtered`;
					ret.valid.add(mbtFilteredkey);
					ret[mbtFilteredkey] = getLongestIncreasingSubsequence(ret[phaseMbtKey]);
				}
			});
			return ret;
		}

		return null;
	}, [forecastData, monthlyData, dailyData]);

	const dataTable = useMemo(() => {
		const monthlyStartIdx = monthly?.index?.[0] ?? Infinity;
		const dailyStartIdx = daily?.index?.[0] ?? Infinity;
		const forecastStartIdx = forecast?.index?.[0] ?? Infinity;

		const relativeIdx = Math.min(monthlyStartIdx, dailyStartIdx, forecastStartIdx);
		const ret = {
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
				? {
						...forecast,
						relativeTime: forecast.index.map((value) => value - relativeIdx),
						valid: new Set([...forecast.valid, 'relativeTime']),
				  }
				: null,
			relativeIdx,
		};

		return ret;
	}, [monthly, daily, forecast]);
	return {
		dailyData,
		dataLoaded: !!data,
		queryKey,

		// Adjusted from top-level to nested dataTable
		dataTable,
		forecastData,
		hasWarning,
		headers,
		isLoading,
		monthlyData,
		rawData: data,
		showWarning,
		warnings,
	};
};

export default useDeterministicData;
export { tabularizeDailyData, tabularizeMonthlyData };
