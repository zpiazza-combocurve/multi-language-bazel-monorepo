import { parse } from 'date-fns';
import { truncate } from 'lodash-es';
import { useMemo } from 'react';

import { Zingchart } from '@/components';
import { getAxisBoundary } from '@/forecasts/charts/components/helpers';
import { labelWithUnit } from '@/helpers/text';
import {
	PRIMARY_COLOR,
	TEAL_1,
	WELL_COUNT_COLOR,
	genScaleX,
	genScaleY,
	lineSeriesConfig,
	phaseColors,
	scaleColor,
} from '@/helpers/zing';
import { fields as dailyUnits } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as monthlyUnits } from '@/inpt-shared/display-templates/units/monthly-units.json';

import { COLLECTION_TEMPLATE, COLUMN_TEMPLATE } from './RollUpTemplate';

const genScales = ({ prodStartEnd, refDate, yearsBefore, yearsPast, yLogScale, yMax, yMin }) => {
	let xMin;
	let xMax;
	if (refDate) {
		xMin = getAxisBoundary({
			axis: 'x',
			boundary: 'min',
			axisProps: {
				maxProdTime: refDate,
				xType: 'time',
				yearsBefore,
			},
		});
		xMax = getAxisBoundary({
			axis: 'x',
			boundary: 'max',
			axisProps: {
				maxProdTime: refDate,
				xType: 'time',
				yearsPast,
			},
		});
	}

	const scaleX = genScaleX({
		time: true,
		minValue: Number.isFinite(xMin) ? xMin : undefined,
		maxValue: Number.isFinite(xMax) ? xMax : undefined,
	});

	const scaleY = genScaleY({
		maxValue: Number.isFinite(yMax) ? yMax : undefined,
		minValue: Number.isFinite(yMin) ? yMin : undefined,
		log: yLogScale,
	});

	if (prodStartEnd) {
		const slicedProdStartEnd = prodStartEnd.slice(0, 2);
		const markers = slicedProdStartEnd.map((value, idx) => ({
			alpha: 1,
			lineColor: TEAL_1,
			lineStyle: 'dashed',
			lineWidth: '3px',
			placement: 'top',
			range: [new Date(value).getTime()],
			type: 'line',
			valueRange: true,
			tooltip: {
				visible: true,
				'font-size': '20',
				text: idx === 0 ? 'Production Start' : 'Production End',
				textAlign: 'left',
			},
		}));

		return { scaleX: { ...scaleX, markers }, scaleY };
	}

	return { scaleX, scaleY };
};
const COLLECTION_COLOR_MULTIPLIER = { stitch: 1, onlyForecast: 0.6, onlyProduction: 1.3 };

const CHECK_SERIES_LIST = ['gross_oil_well_head_volume', 'gross_gas_well_head_volume', 'gross_water_well_head_volume'];

const getDateArray = (data, resolution) => {
	return (
		data?.[resolution]?.stitch?.date ??
		data?.[resolution]?.onlyForecast?.date ??
		data?.[resolution]?.onlyProduction?.date ??
		[]
	).map((d) => parse(d, 'yyyy-MM-dd', new Date()));
};

const getProdStartEnd = (data, resolution) => {
	const dateCol = getDateArray(data, resolution);
	const len = dateCol.length;
	let start = -1;
	let end = -1;

	if (!data?.[resolution]?.onlyProduction) {
		return false;
	}

	CHECK_SERIES_LIST.forEach((key) => {
		const series = [...(data?.[resolution]?.onlyProduction?.[key] ?? [])];
		const thisStart = series.findIndex((x) => x > 0);
		const thisEnd = len - 1 - series.reverse().findIndex((x) => x > 0);

		if (thisStart >= 0) {
			start = start === -1 ? thisStart : Math.min(start, thisStart);
			end = end === len ? thisStart : Math.max(end, thisEnd);
		}
	});
	start = start === -1 ? 0 : start;
	end = end === -1 ? 0 : end;

	return [dateCol[start], dateCol[end], start, end];
};

const extractPatternIndex = (data, addResolution = false, delta = 30) => {
	let lastStatus = 'flat';
	let lastV = data[0];
	const n = data.length;
	const ret = [0];
	for (let i = 1; i < n; i++) {
		const curV = data[i];
		let curStatus;
		if (curV > lastV) {
			curStatus = 'incline';
		} else if (curV < lastV) {
			curStatus = 'decline';
		} else {
			curStatus = 'flat';
		}
		if (lastStatus !== curStatus) {
			ret.push(i - 1);
		}
		lastStatus = curStatus;
		lastV = curV;
	}
	ret.push(n - 1);

	if (addResolution) {
		const idx = [];
		for (let i = 1; i < ret.length; i++) {
			let points = ret[i] - ret[i - 1] + 1;
			let num = parseInt(points / delta);

			idx.push(ret[i - 1]);

			if (num >= 2) {
				for (let j = ret[i - 1] + delta; j < ret[i]; j += delta) {
					idx.push(j);
				}
			}
		}
		idx.push(ret[ret.length - 1]);
		return idx;
	}

	return ret;
};

const genSeries = ({ data: dataIn, columns, selectedCollections, resolution = 'monthly', comparisonData = [] }) => {
	const series = [];
	const isScenario = !!dataIn?.scenarioName;
	[dataIn, ...(comparisonData?.map((datum) => datum.data) ?? [])].forEach((data, dataIdx) => {
		const date = getDateArray(data, resolution);
		const collections = Object.entries(selectedCollections)
			.filter(([, v]) => v)
			.map((x) => x[0]);
		const comparisonsColorScaling = dataIdx < 2 ? 1 : 0.5;

		collections.forEach((collectionKey) => {
			columns.forEach((col) => {
				const columnData = data?.[resolution]?.[collectionKey]?.[col] ?? data?.[col] ?? [];
				if (!columnData.length) {
					return;
				}

				const template = COLUMN_TEMPLATE[col];
				const { label, unit_key } = template;
				const color =
					col === 'well_count_curve'
						? WELL_COUNT_COLOR
						: scaleColor(phaseColors[unit_key])(
								COLLECTION_COLOR_MULTIPLIER[collectionKey] * comparisonsColorScaling
						  );

				const lineStyle = dataIdx === 0 ? 'solid' : (dataIdx - 1) % 2 ? 'solid' : 'dashed';
				const config = lineSeriesConfig({
					color,
					lineStyle,
				});

				const labelUnits = (resolution === 'monthly' ? monthlyUnits : dailyUnits)?.[unit_key];

				let name;
				if (isScenario) {
					name = data.scenarioName;
				} else {
					// HACK: clean up API so that the comparison data structure matches the base forecast's data structure
					name = dataIdx === 0 ? data.forecastName : comparisonData[dataIdx - 1].forecast?.name;
				}

				const seriesName = `${truncate(name, { length: 20 })} - ${
					COLLECTION_TEMPLATE[collectionKey].label
				} ${label}`;
				let values = [];
				if (resolution === 'daily') {
					const keepIndex = extractPatternIndex(columnData, true);
					values = keepIndex.map((index) => [new Date(date[index]).getTime(), columnData[index]]);
				} else {
					values = date.map((d, i) => [new Date(d).getTime(), columnData[i]]);
				}

				series.push({
					...config,
					values,
					text: labelWithUnit(seriesName, labelUnits),
					showInLegend: true,
					tooltip: {
						text: labelWithUnit(seriesName, labelUnits),
						backgroundColor: PRIMARY_COLOR,
						color: '#FFFFFF',
						fontSize: '9',
						padding: '5px',
					},
				});
			});
		});
	});
	return series;
};

const getRefDate = (data, resolution) => {
	let refDate;
	if (data[resolution]?.stitch?.date?.[0]) {
		refDate = data[resolution]?.stitch?.date?.[0];
	} else if (data[resolution]?.onlyForecast?.date?.[0]) {
		refDate = data[resolution]?.onlyForecast?.date?.[0];
	} else {
		refDate = data[resolution]?.onlyProduction?.date?.[0];
	}
	return new Date(refDate).getTime();
};

const RollUpChart = (props) => {
	const {
		category,
		categoryKeys,
		chartSettings,
		comparisonData,
		data,
		isComparisonActive,
		resolution,
		rollUpType,
		selectedCollections,
	} = props;

	const { yMax, yMin, yLogScale, yearsPast, yearsBefore } = chartSettings;
	const prodStartEnd = useMemo(() => getProdStartEnd(data, resolution), [data, resolution]);
	const seriesProps = useMemo(() => {
		if (data?.[resolution]) {
			const needColumn =
				rollUpType === 'scenario'
					? categoryKeys[category]
					: [
							'gross_oil_well_head_volume',
							'gross_gas_well_head_volume',
							'gross_water_well_head_volume',
							'gross_boe_well_head_volume',
							'gross_mcfe_well_head_volume',
							'well_count_curve',
					  ];

			return {
				series: genSeries({
					columns: needColumn,
					comparisonData: isComparisonActive ? comparisonData ?? [] : [],
					data,
					resolution,
					selectedCollections,
					prodStartEnd,
				}),
				...genScales({
					prodStartEnd,
					refDate: getRefDate(data, resolution),
					yearsBefore,
					yearsPast,
					yLogScale,
					yMax,
					yMin,
				}),
			};
		}

		return { series: [], scaleX: {}, scaleY: {} };
	}, [
		category,
		categoryKeys,
		comparisonData,
		isComparisonActive,
		data,
		prodStartEnd,
		resolution,
		rollUpType,
		selectedCollections,
		yearsBefore,
		yearsPast,
		yLogScale,
		yMax,
		yMin,
	]);

	return (
		<Zingchart
			data={{
				type: 'fastline',
				tooltip: { visible: true },
				legend: { visible: true },
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				plotarea: { marginRight: '38rem' },
				...seriesProps,
			}}
			debounce={500}
			disableContextMenu
			modules='fastline'
		/>
	);
};

export default RollUpChart;
