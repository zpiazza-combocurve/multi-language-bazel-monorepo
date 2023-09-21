/* eslint-disable complexity */
import { noop } from 'lodash';
import { useContext, useEffect, useLayoutEffect, useMemo } from 'react';

import { Placeholder } from '@/components';
import { ChartTitleText, DeterministicChartSubheader } from '@/forecasts/charts/components/ChartTitle';
import {
	tabularizeDailyData,
	tabularizeMonthlyData,
} from '@/forecasts/charts/components/deterministic/grid-chart/useDeterministicData';
import {
	LEGEND_LABELS,
	VALID_CUMS,
	Y_ITEM_COLORS,
	Y_ITEM_SERIES_TYPES,
	getYType,
} from '@/forecasts/charts/components/graphProperties';
import { getAxisBoundary, getProbXBoundaries, useLegendItemClick } from '@/forecasts/charts/components/helpers';
import { getSwPlaceIndex, visualTimeArr } from '@/forecasts/charts/forecastChartHelper';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { useForecastConvertFunc } from '@/forecasts/manual/shared/conversionHelper';
import { useUnitTemplates } from '@/forecasts/shared';
import { getCumArr } from '@/helpers/math';
import { capitalize } from '@/helpers/text';
import {
	PURPLE_1,
	convertIdxToMilli,
	convertMilliToIdx,
	forecastEditingColor,
	genScaleX,
	genScaleY,
	isZingchartZoomed,
	lineSeriesConfig,
	markerScatterSeriesConfig,
	phaseColorsEditing,
	scatterConfig,
	scatterSeriesConfig,
	zingDestroy,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import segModels from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { CardContext } from '@/layouts/CardsLayout';

import { ChartArea, ChartAreaContainer, ChartTitle, ChartTitleInfo, VerticalChartActions } from '../../gridChartLayout';
import { useProximitySeries } from '../grid-chart/DeterministicAutoReforecastChart';
import { useWellHeaderValues } from '../grid-chart/api';
import { getProductionInfo } from './helpers';

const segModelTemplate = segModels.fields;

const DeterministicPhaseChart = (props) => {
	const {
		basePhase,
		baseSeries,
		chartId = 'deterministic-chart-area',
		chartSettings,
		forecastId,
		forecastType,
		loading: parentLoading,
		phase = 'oil',
		resolution,
		setChartSettings,
		setYAxisLabel = noop,
		wellData,
		wellId,
		editingChartPhaseType, // equal to forecastType
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
	} = props;

	useEffect(() => {
		setYAxisLabel();
	}, [setYAxisLabel]);

	const wellHeaderQuery = useWellHeaderValues(wellId, 'all');
	const seriesItems = useMemo(
		() => [
			{
				x: 'time',
				y: editingChartPhaseType === 'ratio' ? `${phase}/${basePhase}` : phase,
				collection: 'forecast',
			},
		],
		[basePhase, editingChartPhaseType, phase]
	);
	const { proximityHeaders, proximityBackgroundWellSeries, shiftedProximityFitSeries } = useProximitySeries({
		chartSettings,
		editingChartPhaseType,
		resolution,
		seriesItems, // different from auto reforecast chart
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
		wellHeaderQuery,
	});

	const { manualSeries, multipleSegments, refreshChartDep, segIdx } = useContext(ManualEditingContext);
	const { isMaximized, toggleButton } = useContext(CardContext);

	const { cumMax, cumMin, lineScatter, xAxis, xLogScale, yearsBefore, yearsPast, yLogScale, yMax, yMin } =
		chartSettings;

	const { defaultUnitTemplate, loaded: templatesLoaded } = useUnitTemplates();

	const loaded = wellData && forecastId && templatesLoaded && !parentLoading;

	const forecastConvertFunc = useForecastConvertFunc({
		phase,
		basePhase: forecastType === 'ratio' && basePhase !== phase ? basePhase : null,
	});

	const { q: qConversion = {}, loaded: forecastConversionLoaded } = forecastConvertFunc;
	const xAxisUsingNumericUnits =
		VALID_CUMS.includes(chartSettings.xAxis) || ['mbt', 'mbt_filtered'].includes(chartSettings.xAxis);

	const tabularProduction = useMemo(() => {
		const isMonthly = resolution === 'monthly';
		const data = wellData?.[resolution];
		if (data) {
			return (isMonthly ? tabularizeMonthlyData : tabularizeDailyData)(data);
		}
		return null;
	}, [resolution, wellData]);

	// create phaseSeries object so any number of phase production can be plotted at any time
	const phaseSeries = useMemo(() => {
		if (loaded && forecastConversionLoaded && tabularProduction) {
			const y = forecastType === 'ratio' && basePhase !== phase ? `${phase}/${basePhase}` : phase;

			const parsedXAxis = xAxis === 'relativeTime' ? 'time' : xAxis;
			const xValues = tabularProduction.valid.has(parsedXAxis) ? tabularProduction[parsedXAxis] : null;
			const yValues = tabularProduction.valid.has(y) ? tabularProduction[y] : null;
			const isMBT = xAxis.includes('mbt');
			const { type: yItemType, props: yItemProps } = Y_ITEM_SERIES_TYPES[resolution][isMBT ? 'mbt' : getYType(y)];

			if (xValues && yValues) {
				return {
					...(lineScatter ? yItemType : scatterSeriesConfig)({
						...yItemProps,
						color: Y_ITEM_COLORS[resolution][y],
					}),
					values: xValues.map((xValue, idx) => [
						xAxis === 'relativeTime' ? convertMilliToIdx(xValue) : xValue,
						Number.isFinite(yValues[idx]) ? qConversion.toView(yValues[idx]) : null,
					]),
					text: `${capitalize(resolution)} ${LEGEND_LABELS[y]} (${defaultUnitTemplate[y].toUpperCase()})`,
				};
			}
		}

		return null;
	}, [
		basePhase,
		defaultUnitTemplate,
		forecastConversionLoaded,
		forecastType,
		lineScatter,
		loaded,
		phase,
		qConversion,
		resolution,
		tabularProduction,
		xAxis,
	]);

	const series = useMemo(() => {
		let ret = [];
		const activeSegmentColor = proximityActive ? PURPLE_1 : forecastEditingColor;
		if (loaded && forecastConversionLoaded) {
			if (phaseSeries) {
				ret = [phaseSeries];
			}

			if (multipleSegments?.segmentObjects?.length) {
				if (xAxisUsingNumericUnits) {
					const timeArr = multipleSegments.segmentObjects.map((curSegmentObject) => {
						const curSegment = curSegmentObject.segment;
						return visualTimeArr(curSegment, 30, curSegment.end_idx);
					});

					const flatTimeArr = timeArr.flat();
					const segmentIndices = getCumArr(timeArr.map((arr) => arr.length));

					const sharedProps = {
						idxArr: flatTimeArr,
						production: tabularProduction,
						phase,
						dataFreq: resolution,
					};

					let cumArr = [];
					if (xAxis.includes(phase)) {
						// e.g. cumsum_${PHASE}
						cumArr =
							forecastType === 'rate'
								? multipleSegments.cumFromT({
										...sharedProps,
										series: manualSeries,
								  })
								: multipleSegments.cumFromTRatio({
										...sharedProps,
										ratioSeries: manualSeries,
										baseSeries,
								  });
					} else if (xAxis.includes(basePhase)) {
						// e.g. cumsum_${BASE_PHASE}
						cumArr = multipleSegments.cumFromT({ ...sharedProps, phase: basePhase, series: baseSeries });
					}

					const plot = multipleSegments.predictSelf(flatTimeArr);
					return segmentIndices
						.reduce((output, curSliceRightIdx, segmentIdx) => {
							const leftIdx = segmentIdx === 0 ? 0 : segmentIndices[segmentIdx - 1];
							const thisCumArr = cumArr.slice(leftIdx, curSliceRightIdx);
							const thisPlot = plot.slice(leftIdx, curSliceRightIdx);
							const mainSeriesId = `main-${segmentIdx}`;
							const color = segIdx === segmentIdx ? activeSegmentColor : phaseColorsEditing[phase];
							const config = {
								...lineSeriesConfig({
									color,
									lineWidth: '3px',
								}),
								id: mainSeriesId,
								text: `${segmentIdx + 1}.${
									segModelTemplate[multipleSegments.segmentObjects[segmentIdx].type].label
								}`,
								values: thisPlot.map((value, valueIdx) => [
									thisCumArr[valueIdx],
									qConversion.toView(value),
								]),
							};
							output.push(config);
							const swIndex = getSwPlaceIndex(
								flatTimeArr.slice(leftIdx, curSliceRightIdx),
								multipleSegments.segmentObjects[segmentIdx].segment
							);

							if (swIndex !== null) {
								const switchScatter = {
									...markerScatterSeriesConfig({
										plotId: `sw-${mainSeriesId}`,
										markerColor: color,
										markerShape: 'triangle',
									}),
									values: [[thisCumArr[swIndex], qConversion.toView(thisPlot[swIndex])]],
								};
								output.push(switchScatter);
							}

							if (segmentIdx) {
								const startIndex = 0;
								const markerScatter = {
									...markerScatterSeriesConfig({
										plotId: `marker-${mainSeriesId}`,
										markerColor: color,
										markerShape: 'square',
									}),
									values: [[thisCumArr[startIndex], qConversion.toView(thisPlot[startIndex])]],
								};
								output.push(markerScatter);
							}
							return output;
						}, ret)
						.filter((value) => value !== null);
				}

				const relativeIdx = Math.min(
					phaseSeries?.values?.[0]?.[0] ?? Infinity,
					multipleSegments.segmentObjects[0].segment.start_idx
				);

				const timeSegments = multipleSegments.segmentObjects
					.reduce((output, curSegmentObject, curIdx) => {
						const curSegment = curSegmentObject.segment;
						if (!curSegment) {
							return output;
						}

						const timeArr = visualTimeArr(curSegment, 30, curSegment.end_idx);
						const values = curSegmentObject.predict(timeArr);

						const mainSeriesId = `main-${curIdx}`;
						const color = segIdx === curIdx ? activeSegmentColor : phaseColorsEditing[phase];

						const config = {
							...lineSeriesConfig({
								color,
								lineWidth: '3px',
							}),
							id: mainSeriesId,
							text: `${curIdx + 1}.${segModelTemplate[curSegmentObject.type].label}`,
							values: values.map((value, valueIdx) => [
								xAxis === 'relativeTime'
									? timeArr[valueIdx] - relativeIdx
									: convertIdxToMilli(timeArr[valueIdx]),
								qConversion.toView(value),
							]),
						};
						output.push(config);
						const swIndex = getSwPlaceIndex(timeArr, curSegment);
						if (swIndex !== null) {
							const switchScatter = {
								...markerScatterSeriesConfig({
									plotId: `sw-${mainSeriesId}`,
									markerColor: color,
									markerShape: 'triangle',
								}),
								values: [
									[
										xAxis === 'relativeTime'
											? timeArr[swIndex] - relativeIdx
											: convertIdxToMilli(timeArr[swIndex]),
										qConversion.toView(values[swIndex]),
									],
								],
							};
							output.push(switchScatter);
						}

						if (curIdx) {
							const startIndex = 0;
							const markerScatter = {
								...markerScatterSeriesConfig({
									plotId: `marker-${mainSeriesId}`,
									markerColor: color,
									markerShape: 'square',
								}),
								values: [
									[
										xAxis === 'relativeTime'
											? timeArr[startIndex] - relativeIdx
											: convertIdxToMilli(timeArr[startIndex]),
										qConversion.toView(values[startIndex]),
									],
								],
							};
							output.push(markerScatter);
						}
						return output;
					}, [])
					.filter((value) => value !== null);

				if (phaseSeries) {
					const calculatedPhaseSeries =
						xAxis === 'relativeTime'
							? {
									...phaseSeries,
									values: phaseSeries.values.map((value) => [value[0] - relativeIdx, value[1]]),
							  }
							: phaseSeries;
					return [calculatedPhaseSeries, ...timeSegments];
				}

				return timeSegments;
			}
		}

		return ret;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		basePhase,
		baseSeries,
		forecastConversionLoaded,
		forecastType,
		loaded,
		manualSeries,
		multipleSegments,
		phase,
		phaseSeries,
		qConversion,
		refreshChartDep,
		resolution,
		segIdx,
		segModelTemplate,
		proximityActive,
		tabularProduction,
		xAxis,
	]);

	useEffect(() => {
		const config = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			showGUIbtn: false,
			xGuide: false,
			yLabel: false,
			plotarea: { marginRight: '35rem' },
		});

		zingMixed(chartId, { ...config, series: [] });
		zingDisableContextMenu(chartId);

		return () => {
			zingDestroy(chartId);
		};
	}, [chartId]);

	useEffect(() => {
		setChartSettings({ xAxis: 'time' });
	}, [phase, setChartSettings]);

	useEffect(() => {
		if (isZingchartZoomed(chartId)) {
			zingchart.exec(chartId, 'viewall', { update: false });
		}
	}, [chartId, yearsBefore, yearsPast, yMin, yMax]);

	const legendItemClick = useLegendItemClick(chartId);

	// componentUpdate for redrawing the chart
	useLayoutEffect(() => {
		if (loaded) {
			const { production } = getProductionInfo(wellData, resolution);

			const [xMin, xMax] = getProbXBoundaries({
				absoluteMax: xAxisUsingNumericUnits ? cumMax : null,
				absoluteMin: xAxisUsingNumericUnits ? cumMin : null,
				maxProdTime: series?.[0]?.values?.[0]?.[0],
				production,
				xType: xAxis,
				yearsBefore,
				yearsPast,
			});

			const scaleX = genScaleX({
				maxValue: !Number.isFinite(xMin) || xMax > xMin ? xMax : undefined,
				minValue: xMin,
				time: xAxis === 'time',
				xGuide: true,
				xLabel: false,
				xLogScale: xLogScale && xAxis !== 'time',
			});

			const parsedYMax = getAxisBoundary({
				axis: 'y',
				boundary: 'max',
				axisProps: { value: yMax },
			});

			const scaleY = genScaleY({
				maxValue: !Number.isFinite(yMin) || parsedYMax > yMin ? parsedYMax : undefined,
				minValue: yMin,
				log: yLogScale,
			});

			const newConfig = {
				scaleX,
				scaleY,
				series: [...series, ...proximityBackgroundWellSeries, ...shiftedProximityFitSeries],
			};
			zingModify(chartId, newConfig);
			zingchart.bind(chartId, 'legend_item_click', legendItemClick);
			return () => {
				zingchart.unbind(chartId, 'legend_item_click', legendItemClick);
			};
		}
	}, [
		chartId,
		cumMax,
		cumMin,
		legendItemClick,
		loaded,
		proximityBackgroundWellSeries,
		resolution,
		series,
		shiftedProximityFitSeries,
		wellData,
		xAxis,
		xAxisUsingNumericUnits,
		xLogScale,
		yLogScale,
		yMax,
		yMin,
		yearsBefore,
		yearsPast,
	]);

	return (
		<>
			<ChartTitle disablePadding={!isMaximized}>
				{proximityActive && <ChartTitleInfo>{proximityHeaders}</ChartTitleInfo>}
				{isMaximized && !proximityActive && (
					<ChartTitleInfo>
						{wellData && (
							<>
								<ChartTitleText wellId={wellId} />

								<DeterministicChartSubheader
									dailyProduction={wellData.daily}
									forecasts={wellData.forecast}
									manualPhase={phase}
									manualSeries={manualSeries}
									monthlyProduction={wellData.monthly}
									resolution={resolution}
								/>
							</>
						)}
					</ChartTitleInfo>
				)}
			</ChartTitle>

			<ChartAreaContainer>
				<ChartArea id={chartId} hidden={!loaded} />

				<VerticalChartActions>{toggleButton}</VerticalChartActions>

				<Placeholder empty={!loaded} text='Loading Chart Data...' />
			</ChartAreaContainer>
		</>
	);
};

export default DeterministicPhaseChart;
