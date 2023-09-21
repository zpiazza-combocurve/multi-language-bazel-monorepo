import { MultipleSegments } from '@combocurve/forecast/models';
import { map, pick } from 'lodash';
import { useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { Divider, SwitchItem } from '@/components/v2';
import AxisControlSelection from '@/forecasts/charts/components/AxisControlSelection';
import { daysToYears, yearsToDays } from '@/forecasts/charts/components/graphProperties';
import {
	AdditionalChartActions,
	ChartArea,
	Container,
	XControlsContainer,
	YControlsArea,
	YControlsContainer,
} from '@/forecasts/charts/components/gridChartLayout';
import { getAxisBoundary, getProbXBoundaries, useLegendItemClick } from '@/forecasts/charts/components/helpers';
import { getSwPlaceIndex, visualTimeArr } from '@/forecasts/charts/forecastChartHelper';
import useChartSettings from '@/forecasts/charts/useChartSettings';
import { ManualChartContainer } from '@/forecasts/deterministic/manual/layout';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { ForecastChartOptionsMenu, useUnitTemplates } from '@/forecasts/shared';
import {
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
	yMaxItems,
	yMinItems,
	yearsBeforeItems,
	yearsPastItems,
} from '@/forecasts/shared/ForecastMenuItems';
import { ifProp } from '@/helpers/styled';
import { capitalize } from '@/helpers/text';
import { getConvertFunc } from '@/helpers/units';
import { deepMerge } from '@/helpers/utilities';
import {
	DEFAULT_ITEM_FONT_FAMILY,
	GRAY_1,
	GRAY_2,
	SCALE_LABEL_FONT_COLOR,
	TEAL_1,
	forecastEditingColor,
	genScaleX,
	genScaleY,
	isZingchartZoomed,
	lineSeriesConfig,
	markerScatterSeriesConfig,
	phaseColors,
	phaseColorsEditing,
	scaleItemFontSize,
	scatterConfig,
	scatterSeriesConfig,
	zingDestroy,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { fields as segModelTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { bSeriesMenuItems } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/controlsFormValues';
import { getTcDefaultGui, getUserLines } from '@/type-curves/charts/shared';

const userLineConfigs = (phaseColor) => ({
	average: scatterSeriesConfig({ color: phaseColor, alpha: 0.5 }),
	colAverage: scatterSeriesConfig({ color: phaseColor, alpha: 0.5 }),
	colMedian: scatterSeriesConfig({ color: phaseColor, alpha: 0.5 }),
	max: scatterSeriesConfig({ color: GRAY_1, alpha: 0.3 }),
	median: scatterSeriesConfig({ color: phaseColor, alpha: 0.5 }),
	min: scatterSeriesConfig({ color: GRAY_1, alpha: 0.3 }),
});

const scaleXControls = {
	scaleToView: yearsToDays,
	scaleToCalc: daysToYears,
};

// Need to rework the code in current gridChartLayout.js to make it work here
const ChartContainer = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 100%;
	width: 100%;
`;

const ChartTitle = styled.div`
	align-items: center;
	display: flex;
	padding: 0.25rem 0.5rem;
	width: 100%;
	${ifProp('disablePadding', 'padding: unset;')}
	& > * {
		margin: 0 0.25rem;
		&:first-child {
			margin-left: 0;
		}
		&:last-child {
			margin-right: 0;
		}
	}
`;

const CHART_ID = 'manual-fit-chart';

const ManualFitChart = ({
	align: inputAlign,
	basePhase,
	bKey,
	calculatedBackgroundData,
	fitSeries,
	keyboardTooltipButton,
	noWells,
	phase,
	phaseType,
	prodData,
	resolution,
}) => {
	const isRate = phaseType === 'rate';
	const align = isRate ? inputAlign : 'noalign';

	const { chartSettings, setChartSettings } = useChartSettings({
		chartSettings: { showDailyRate: true, xAxis: 'relativeTime', xLogScale: false, yLogScale: true },
	});

	const { showDailyRate, yMax, yMin, yearsBefore, yearsPast } = chartSettings;
	// Ratio for gas to liquid is in CF/BBL by default, not MCF/BBL. Same case in C4 chart.
	const useConvertForWellSeries = !isRate;
	const displayMonthlyData = isRate && !showDailyRate;

	const { dailyUnitTemplate, defaultUnitTemplate, monthlyUnitTemplate } = useUnitTemplates();

	const templateKey = useMemo(() => (isRate ? phase : `${phase}/${basePhase}`), [basePhase, isRate, phase]);

	const { targetYUnit, convert } = useMemo(() => {
		const targetYUnit = displayMonthlyData ? monthlyUnitTemplate[templateKey] : defaultUnitTemplate[templateKey];
		return {
			targetYUnit,
			convert: getConvertFunc(dailyUnitTemplate[templateKey], targetYUnit),
		};
	}, [dailyUnitTemplate, defaultUnitTemplate, displayMonthlyData, monthlyUnitTemplate, templateKey]);

	const { manualSeries, multipleSegments, pKey, segIdx, setOnForm } = useContext(ManualEditingContext);

	const rateLabel = displayMonthlyData ? monthlyUnitTemplate[phase] : defaultUnitTemplate[phase];
	const yAxisLabel = isRate ? rateLabel : defaultUnitTemplate[`${phase}/${basePhase}`];

	const userLineSeries = useMemo(() => {
		if (calculatedBackgroundData && !noWells) {
			const { idx } = calculatedBackgroundData[align];
			const { data: _data, data_part_idx, days_in_month_arr: daysInMonthArr } = prodData;
			let data = _data;
			if (displayMonthlyData && daysInMonthArr) {
				data = map(_data, (datum, wellIndex) =>
					map(datum, (data, dataIndex) => {
						return data ? data * daysInMonthArr[wellIndex][dataIndex] : data;
					})
				);
			}

			// TODO: check with forecast-ds on the other keys
			const userLines = pick(
				getUserLines(data, data_part_idx),
				map(bSeriesMenuItems, (item) => item.value)
			);

			const output = {};
			for (let i = 0, keys = Object.keys(userLines), len = keys.length; i < len; i++) {
				const key = keys[i];
				const config = userLineConfigs(phaseColors[phase])[key];
				output[key] = {
					...config,
					plotid: 'best-fit',
					text: `${bSeriesMenuItems.filter((item) => item.value === key)[0].label} ${targetYUnit}`,
					// removed use of convert function use. Check if it's necessary
					values: userLines[key].map((k, j) => [idx[j], useConvertForWellSeries ? convert(k) : k]),
				};
			}

			return output;
		}

		return null;
	}, [
		calculatedBackgroundData,
		noWells,
		align,
		prodData,
		displayMonthlyData,
		phase,
		targetYUnit,
		useConvertForWellSeries,
		convert,
	]);

	const series = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const output: Array<any> = [];
		if (!noWells && userLineSeries) {
			const userLine = userLineSeries[bKey];
			output.push(userLine);
		}

		if (multipleSegments.segmentObjects?.length) {
			const chartResolution = 30;
			const endIdx = manualSeries[manualSeries.length - 1].end_idx;
			if (pKey === 'P10' || pKey === 'P90') {
				const GRAYS = [GRAY_1, GRAY_2];
				const keySet = new Set(['P10', 'P50', 'P90']);
				keySet.delete(pKey);

				const sKeys = [...keySet];
				GRAYS.forEach((gray, i) => {
					const color = gray;
					const config = lineSeriesConfig({ color, lineWidth: '3px' });
					const segments = fitSeries?.[sKeys[i]]?.segments;
					const mainSeriesId = capitalize(sKeys[i]);
					if (segments && segments.length > 0) {
						const multiSegments = new MultipleSegments(segments ?? []);
						const segmentTimeArrs = segments.map((segment) =>
							visualTimeArr(segment, chartResolution, endIdx)
						);
						const timeArr = segmentTimeArrs.flat();

						const values = multiSegments.predictSelf(timeArr);
						output.push({
							...config,
							values: values.map((value, valueIdx) => [
								timeArr[valueIdx],
								value === null ? null : convert(value),
							]),
							text: mainSeriesId,
							id: mainSeriesId,
						});

						// start marker
						const startIndexes = segmentTimeArrs.slice(0, segments.length - 1).reduce(
							(ret, segmentTimeArr) => {
								ret.push(ret[ret.length - 1] + segmentTimeArr.length);
								return ret;
							},
							[0]
						);
						if (startIndexes.length) {
							const markerScatter = {
								...markerScatterSeriesConfig({
									plotId: `marker-${mainSeriesId}`,
									markerColor: color,
									markerShape: 'square',
								}),
								values: startIndexes.map((index) => [timeArr[index], convert(values[index])]),
							};
							output.push(markerScatter);
						}
						// switch marker
						const swIndexes = segments
							.map((segment) => getSwPlaceIndex(timeArr, segment))
							.filter((x) => x !== null);
						if (swIndexes.length) {
							const switchScatter = {
								...markerScatterSeriesConfig({
									plotId: `sw-${mainSeriesId}`,
									markerColor: color,
									markerShape: 'triangle',
								}),
								values: swIndexes.map((index) => [timeArr[index], convert(values[index])]),
							};
							output.push(switchScatter);
						}
					}
				});
			}

			multipleSegments.segmentObjects.forEach((curSegmentObject, i) => {
				const curSegment = curSegmentObject.segment;
				const timeArr = visualTimeArr(curSegment, chartResolution, endIdx);
				const values = curSegmentObject.predict(timeArr);
				const color = segIdx === i ? forecastEditingColor : phaseColorsEditing[phase];
				const config = lineSeriesConfig({
					color,
					lineWidth: '3px',
				});
				const mainSeriesId = `${capitalize(pKey)}-${curSegmentObject.type}`;
				output.push({
					...config,
					id: mainSeriesId,
					text: segModelTemplate[curSegmentObject.type].label,
					values: values.map((value, valueIdx) => [
						timeArr[valueIdx],
						value === null ? null : convert(value),
					]),
				});

				const swIndex = getSwPlaceIndex(timeArr, curSegment);
				if (swIndex !== null) {
					const switchScatter = {
						...markerScatterSeriesConfig({
							plotId: `sw-${mainSeriesId}`,
							markerColor: color,
							markerShape: 'triangle',
						}),
						values: [[timeArr[swIndex], convert(values[swIndex])]],
					};
					output.push(switchScatter);
				}

				if (i) {
					const startIndex = 0;
					const markerScatter = {
						...markerScatterSeriesConfig({
							plotId: `marker-${mainSeriesId}`,
							markerColor: color,
							markerShape: 'square',
						}),
						values: [[timeArr[startIndex], convert(values[startIndex])]],
					};
					output.push(markerScatter);
				}
			});
		}

		return output;
	}, [bKey, convert, phase, fitSeries, manualSeries, multipleSegments, noWells, pKey, segIdx, userLineSeries]);

	const register = (key) => ({ value: chartSettings[key], onChange: (value) => setChartSettings({ [key]: value }) });
	const onControlsForm = {
		onClose: () => setOnForm(false),
		onClick: () => setOnForm(true),
	};

	const onAxisControls = {
		onBlur: () => setOnForm(false),
		onFocus: () => setOnForm(true),
	};

	// onMount
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const config: any = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			plotarea: { marginRight: '35rem' },
			showGUIbtn: false,
			xGuide: false,
		});

		config.series = [];
		config.scaleY.minValue = 0.1;
		config.scaleX.markers =
			align === 'align'
				? [
						{
							alpha: 1,
							lineColor: TEAL_1,
							lineStyle: 'dashed',
							lineWidth: '3px',
							placement: 'top',
							range: [0],
							type: 'line',
							valueRange: true,
						},
				  ]
				: undefined;

		zingMixed(CHART_ID, deepMerge(config, getTcDefaultGui()));
		return () => {
			zingDestroy(CHART_ID);
		};
	}, [align, defaultUnitTemplate, templateKey]);

	const settingsConfig = useMemo(() => {
		const { yMax, yMin, yLogScale, yearsBefore, yearsPast, xLogScale } = chartSettings;

		// get userLine min and max to generate padding
		let maxProdValue;
		let minProdValue;
		let generatedProduction = { index: [0] };
		if (!noWells && userLineSeries) {
			const userLine = userLineSeries[bKey];
			const userLineValues = userLine.values.map((seriesValue) => seriesValue[1]);
			maxProdValue = Math.max(...userLineValues);
			minProdValue = Math.min(...userLineValues);
			generatedProduction = { index: [userLine.values[0][0]] };
		}

		const [xMin, xMax] = getProbXBoundaries({
			production: generatedProduction,
			xLogScale: true,
			xType: 'relativeTime',
			yearsBefore,
			yearsPast,
		});

		const scaleX = genScaleX({
			maxValue: xMax,
			minValue: xMin,
			time: false,
			xGuide: true,
			xLogScale,
		});

		const parsedYMax = getAxisBoundary({
			axis: 'y',
			axisProps: { maxProdValue, minProdValue, value: yMax },
			boundary: 'max',
		});

		const scaleY = genScaleY({
			log: yLogScale,
			// @ts-expect-error TODO fix later: cannot compare string|number with number
			maxValue: !Number.isFinite(yMin) || (parsedYMax && yMin && parsedYMax > yMin) ? parsedYMax : undefined,
			minValue: Number.isFinite(yMin) ? Number(yMin) : undefined,
		});

		return { scaleX, scaleY, series };
	}, [bKey, chartSettings, noWells, series, userLineSeries]);

	const legendItemClick = useLegendItemClick(CHART_ID);

	useEffect(() => {
		zingModify(CHART_ID, settingsConfig);
		zingchart.bind(CHART_ID, 'legend_item_click', legendItemClick);
		return () => {
			zingchart.unbind(CHART_ID, 'legend_item_click', legendItemClick);
		};
	}, [legendItemClick, settingsConfig]);

	useEffect(() => {
		if (isZingchartZoomed(CHART_ID)) {
			zingchart.exec(CHART_ID, 'viewall', { update: false });
		}
	}, [yearsBefore, yearsPast, yMin, yMax]);

	useEffect(() => {
		if (resolution === 'daily' && !showDailyRate) {
			setChartSettings({ showDailyRate: true });
		}
	}, [resolution, setChartSettings, showDailyRate]);

	/** @todo: adjust this component to be wrapped by ForecastChartControls */
	return (
		<ManualChartContainer>
			<Container>
				<YControlsContainer>
					<YControlsArea>
						<AxisControlSelection items={yMaxItems} rotateTop {...register('yMax')} {...onAxisControls} />

						<div
							css={`
								color: ${SCALE_LABEL_FONT_COLOR};
								font-family: ${DEFAULT_ITEM_FONT_FAMILY};
								font-size: ${scaleItemFontSize(1)};
								position: absolute;
								top: 50%;
								transform-origin: 0 0;
								transform: rotate(-90deg) translateX(-50%);
							`}
						>
							{yAxisLabel}
						</div>

						<AxisControlSelection
							items={yMinItems}
							rotateBottom
							{...register('yMin')}
							{...onAxisControls}
						/>
					</YControlsArea>

					<ChartContainer>
						<ChartTitle>
							<ForecastChartOptionsMenu disableLabel {...onControlsForm}>
								<YearsBeforeAxisControlSelection
									{...register('yearsBefore')}
									{...scaleXControls}
									label='Days Before Day 0'
								/>
								<YearsPastAxisControlSelection
									{...register('yearsPast')}
									{...scaleXControls}
									label='Days After Day 0'
								/>
								<YMaxAxisControlSelection {...register('yMax')} />
								<YMinAxisControlSelection {...register('yMin')} />

								<Divider />

								<SwitchItem label='Y-Axis Log Scale' {...register('yLogScale')} />
								{resolution === 'monthly' && (
									<SwitchItem
										label={`Unit Resolution ${showDailyRate ? '(Daily)' : '(Monthly)'}`}
										{...register('showDailyRate')}
									/>
								)}
							</ForecastChartOptionsMenu>
							<AdditionalChartActions>{keyboardTooltipButton}</AdditionalChartActions>
						</ChartTitle>

						<ChartArea id={CHART_ID} />
					</ChartContainer>
				</YControlsContainer>

				<XControlsContainer>
					<AxisControlSelection
						items={yearsBeforeItems}
						{...register('yearsBefore')}
						{...scaleXControls}
						{...onAxisControls}
					/>

					<div
						css={`
							color: ${SCALE_LABEL_FONT_COLOR};
							font-family: ${DEFAULT_ITEM_FONT_FAMILY};
							font-size: ${scaleItemFontSize(1)};
						`}
					>
						Days
					</div>

					<AxisControlSelection
						items={yearsPastItems}
						{...register('yearsPast')}
						{...scaleXControls}
						{...onAxisControls}
					/>
				</XControlsContainer>
			</Container>
		</ManualChartContainer>
	);
};

export default ManualFitChart;
