import {
	convertDateToMilli,
	convertIdxToDate,
	convertIdxToMilli,
	convertMilliToIdx,
} from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import _ from 'lodash';

import {
	DAILY_PRODUCTION_COLORS,
	MONTHLY_PRODUCTION_COLORS,
	Y_ITEM_SERIES_TYPES,
} from '@/forecasts/charts/components/graphProperties';
import { genSeriesData } from '@/forecasts/charts/forecastChartHelper';
import { capitalize } from '@/helpers/text';
import {
	genScaleX,
	genScaleY,
	lineSeriesConfig,
	phaseColors,
	phaseColorsEditing,
	phases,
	scatterSeriesConfig,
	zingModify,
} from '@/helpers/zing';

const multiSeg = new MultipleSegments();

const getProductionInfo = (wellData, resolution = 'monthly') => {
	const { [resolution]: production } = wellData;
	const prodIdx = production?.index ?? [];
	return { production, prodIdx };
};

const getPhaseSegments = ({ wellData, phase, pSeries = 'best', dataKey = 'data' }) =>
	wellData?.[dataKey]?.[phase]?.P_dict?.[pSeries]?.segments ?? [];

const getPhaseForecastInfo = ({ wellData, phase, pSeries = 'best', dataKey = 'data' }) => {
	if (!wellData?.[dataKey]?.[phase]) {
		return {};
	}

	const { forecastType, ratio, data_freq: resolution } = wellData[dataKey][phase];
	const segments = getPhaseSegments({ wellData, phase, pSeries, dataKey });
	return { forecastType, ratio, segments, resolution };
};

const getRatioProductionValues = (phaseProductionSeries, basePhaseProductionSeries) => {
	return (phaseProductionSeries?.values ?? []).map((phaseValue, idx) => {
		const basePhaseValue = basePhaseProductionSeries.values?.[idx]?.[1];
		if (phaseValue?.[1] === null || !basePhaseValue) {
			return [phaseValue[0], null];
		}
		return [phaseValue[0], phaseValue[1] / basePhaseValue];
	});
};

const getPadding = ({ value, axis, production, prodIdx, xType }) => {
	let parsedXMin;
	let parsedXMax;
	let parsedYMin;
	let parsedYMax;
	if (production?.length) {
		const prodMin = Math.min(...production);
		const prodMax = Math.max(...production);
		const prodRange = prodMax - prodMin;

		parsedYMin = _.round(prodMin - value * prodRange, 2);
		parsedYMax = _.round(prodMax + value * prodRange, 2);
	}
	if (prodIdx?.length) {
		const idxRange = prodIdx[prodIdx.length - 1] - prodIdx[0];
		parsedXMin = prodIdx[0] - value * idxRange;
		parsedXMax = prodIdx[prodIdx.length - 1] + value * idxRange;
		parsedXMin = xType === 'time' ? convertIdxToDate(Math.floor(parsedXMin)) : _.round(parsedXMin, 2);
		parsedXMax = xType === 'time' ? convertIdxToDate(Math.ceil(parsedXMax)) : _.round(parsedXMax, 2);
	}

	if (axis === 'x') {
		return {
			xMin: parsedXMin,
			xMax: parsedXMax,
		};
	}

	return { yMin: parsedYMin, yMax: parsedYMax };
};

const getAxisTypeItems = ({ loaded, wellData, phase, mode }) => {
	if (loaded) {
		const { forecastType } = getPhaseForecastInfo({ wellData, phase });
		const y = [];
		const x = [{ label: 'Time', value: 'time' }];
		if (mode === 'manual') {
			if (forecastType === 'rate') {
				y.push({ label: 'Production', value: 'production' });
			}
			if (forecastType === 'ratio') {
				y.push({ label: 'Ratio', value: 'ratio' });
			}
		} else {
			y.push({ label: 'Production', value: 'production' });
			y.push({ label: 'Ratio', value: 'ratio' });

			if (forecastType === 'ratio') {
				x.push({ label: 'Cum Base', value: 'cumBase' });
			} else {
				x.push({ label: 'Cum', value: 'cum' });
			}
		}
		return { x, y };
	}

	return { x: [], y: [] };
};

const refreshChartConfig = ({
	chartId,
	loaded,
	series,
	xLogScale,
	xMaxValue,
	xMinValue,
	xType,
	yLogScale,
	yMaxValue,
	yMinValue,
	yType,
}) => {
	if (loaded) {
		let parsedXMin;
		let parsedXMax;
		if (xType === 'time') {
			parsedXMin = xMinValue ? convertDateToMilli(xMinValue) : undefined;
			parsedXMax = xMaxValue ? convertDateToMilli(xMaxValue) : undefined;
		} else {
			parsedXMin = Number.isFinite(xMinValue) ? xMinValue : undefined;
			parsedXMax = Number.isFinite(xMaxValue) ? xMaxValue : undefined;
		}

		const scaleX = genScaleX({
			minValue: parsedXMin,
			maxValue: parsedXMax,
			time: xType === 'time' && !xLogScale,
			xGuide: true,
			xLabel: false,
			xLogScale: false,
		});

		const scaleY = genScaleY({
			log: yLogScale,
			maxValue: Number.isFinite(yMaxValue) ? yMaxValue : undefined,
			minValue: Number.isFinite(yMinValue) ? yMinValue : undefined,
			yGuide: true,
		});

		const newConfig = { series, scaleX, scaleY, title: { text: `${xType} vs ${yType}` } };
		zingModify(chartId, newConfig);
	}
};

const getManualChartSettings = ({ wellData, phase, setGraphSettings }) => {
	const { forecastType } = getPhaseForecastInfo({ wellData, phase });
	const newGraphSettings = { xType: 'time' };
	if (forecastType === 'rate') {
		newGraphSettings.yType = 'production';
	}
	if (forecastType === 'ratio') {
		newGraphSettings.yType = 'ratio';
	}

	setGraphSettings({ ...newGraphSettings });
};

const genRateProduction = ({ production, phase, resolution, useDateTime = true, lineScatter }) => {
	const values = [];
	if (!production?.[phase]) {
		return null;
	}

	const isMonthly = resolution === 'monthly';
	const color = (isMonthly ? MONTHLY_PRODUCTION_COLORS : DAILY_PRODUCTION_COLORS)[phase];
	const { type: seriesType, props: yItemProps } = Y_ITEM_SERIES_TYPES[resolution].production;

	production[phase].forEach((prod, i) => {
		if (prod !== null) {
			values.push([useDateTime ? convertIdxToMilli(production.index[i]) : production.index[i], prod]);
		}
	});

	return {
		...(lineScatter ? seriesType : scatterSeriesConfig)({ color, ...yItemProps }),
		text: `${capitalize(resolution)} ${capitalize(phase)}`,
		values,
	};
};

const getFinalIdx = (prodIdx, segments) => {
	if (!prodIdx?.length || !segments?.length) {
		return null;
	}

	return prodIdx?.[prodIdx?.length - 1] ?? segments[0].start_idx;
};

const getTimeArrFromSeries = (series) => series.map((val) => convertMilliToIdx(val[0]));

const genSeriesDataWithTimeArr = ({
	beginIdx = 0,
	frequency = 5,
	index = false,
	prodIdx,
	relative = false,
	relativeIdx = null,
	segments,
	yearsPast = 0,
}) => {
	const finalIdx = getFinalIdx(prodIdx, segments);
	const series = genSeriesData({
		beginIdx,
		chartResolution: frequency,
		finalIdx,
		index,
		relative,
		relativeIdx,
		segments,
		yearsPast,
	});
	const timeArr = getTimeArrFromSeries(series);

	return { series, timeArr };
};

const getCumArr = (ratioSegments) =>
	ratioSegments.reduce((_arr, segment) => {
		const arr = _arr;
		const { start_cum, end_cum } = segment;

		for (let i = start_cum; i < end_cum; i += 1000) {
			arr.push(i);
		}

		arr.push(end_cum - 0.1);
		return arr;
	}, []);

const getManualPlot = ({ frequency, phase, segments, segIdx }) => {
	const output = [];
	segments.forEach((segment, i) => {
		const sData = genSeriesData({
			chartResolution: frequency,
			finalIdx: segment.end_idx,
			segments: [segment],
		});

		const config = lineSeriesConfig({
			color: phaseColorsEditing[phase],
			lineWidth: '3px',
			tooltip: false,
		});

		if (segIdx === i) {
			config.lineStyle = 'dashed';
		}

		output.push({
			...config,
			values: sData,
			text: `${segment.name}`,
		});
	});

	return output;
};

const getRatioTimeByTimePlot = ({
	baseSegments,
	frequency,
	mode,
	phase,
	phaseProductionSeries,
	prodIdx,
	ratioProductionValues,
	ratioSegments,
	segIdx,
	yearsPast,
	yType,
}) => {
	const output = [];
	const ratioProductionSeries = {
		...scatterSeriesConfig({ color: phaseColors[phase] }),
		values: ratioProductionValues,
		text: 'Ratio Production',
	};

	if (yType === 'production') {
		// plot phase production
		const { series: basePhaseSeries, timeArr: baseTimeArr } = genSeriesDataWithTimeArr({
			prodIdx,
			frequency: 5,
			segments: baseSegments,
			yearsPast,
		});

		const ratioSeries = multiSeg.predict({ idxArr: baseTimeArr, segments: ratioSegments, toFill: 0 });
		const calculatedSeries = basePhaseSeries.map((datum, idx) => [datum[0], datum[1] * ratioSeries[idx]]);

		output.push(phaseProductionSeries);
		output.push({
			...lineSeriesConfig({ color: phaseColors[phase] }),
			text: 'Calculated Series',
			values: calculatedSeries,
		});
	}
	if (yType === 'ratio') {
		// plot ratio production
		const { series: ratioPhaseSeries } = genSeriesDataWithTimeArr({
			prodIdx,
			frequency: 5,
			segments: ratioSegments,
			yearsPast,
		});

		const ratioProductionSeriesConfig =
			mode === 'view'
				? [
						{
							...lineSeriesConfig({ color: phaseColors[phase] }),
							text: 'Ratio Series',
							values: ratioPhaseSeries,
						},
				  ]
				: getManualPlot({ frequency, phase, segments: ratioSegments, segIdx });

		output.push(...ratioProductionSeriesConfig);

		if (ratioProductionValues?.length) {
			output.push(ratioProductionSeries);
		}
	}

	return output;
};

const getNextPhase = (phase) => {
	const phaseValues = phases.map(({ value }) => value);
	const nextIdx = (phaseValues.findIndex((curPhase) => curPhase === phase) + 1) % phaseValues.length;
	return phaseValues[nextIdx];
};

export {
	genRateProduction,
	genSeriesDataWithTimeArr,
	getAxisTypeItems,
	getCumArr,
	getFinalIdx,
	getManualChartSettings,
	getManualPlot,
	getNextPhase,
	getPadding,
	getPhaseForecastInfo,
	getPhaseSegments,
	getProductionInfo,
	getRatioProductionValues,
	getRatioTimeByTimePlot,
	getTimeArrFromSeries,
	refreshChartConfig,
};
