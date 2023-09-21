import { MultipleSegments } from '@combocurve/forecast/models';
import { useContext, useEffect, useMemo } from 'react';

import { ChartTitleText, ProbabilisticChartSubheader } from '@/forecasts/charts/components/ChartTitle';
import { genRateProduction } from '@/forecasts/charts/components/deterministic/phase-chart/helpers';
import { AdditionalChartActionRow, AdditionalChartActions } from '@/forecasts/charts/components/gridChartLayout';
import { getProbXBoundaries, useLegendItemClick } from '@/forecasts/charts/components/helpers';
import { getSwPlaceIndex, visualTimeArr } from '@/forecasts/charts/forecastChartHelper';
import { ProbabilisticDownloadButton } from '@/forecasts/download-forecast/ProbabilisticDownload';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { capitalize } from '@/helpers/text';
import {
	GRAY_1,
	GRAY_2,
	convertIdxToMilli,
	forecastEditingColor,
	genScaleX,
	genScaleY,
	isZingchartZoomed,
	lineSeriesConfig,
	markerScatterSeriesConfig,
	phaseColorsEditing,
	scatterConfig,
	zingDestroy,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { fields as segModelTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';

const ProbabilisticManualChart = (props) => {
	const {
		chartActionsRender,
		chartId = 'probabilistic-manual-chart-area',
		chartSettings,
		curData,
		curPhase = 'oil',
		forecastId,
		keyboardTooltipButton,
		resolution,
		wellId,
	} = props;

	const { multipleSegments, manualSeries, pKey, refreshChartDep, segIdx } = useContext(ManualEditingContext);

	const { lineScatter, xLogScale, yearsBefore, yearsPast, yLogScale, yMax, yMin } = chartSettings || {};

	const loaded = multipleSegments && curData;

	const productionSeries = useMemo(() => {
		if (loaded) {
			const { production } = curData;
			if (!production) {
				return [];
			}

			return [
				genRateProduction({ production, phase: curPhase, resolution, useDateTime: !xLogScale, lineScatter }),
			];
		}
		return [];
	}, [curData, curPhase, lineScatter, loaded, resolution, xLogScale]);

	const forecastedSeries = useMemo(() => {
		if (loaded && multipleSegments.segmentObjects?.length) {
			const output = [];
			const endIdx = manualSeries[manualSeries.length - 1].end_idx;
			if (pKey === 'P10' || pKey === 'P90') {
				const GRAYS = [GRAY_1, GRAY_2];
				const keySet = new Set(['P10', 'P50', 'P90']);
				keySet.delete(pKey);

				const sKeys = [...keySet];
				GRAYS.forEach((gray, i) => {
					const color = gray;
					const config = lineSeriesConfig({ color, lineWidth: '3px' });
					const { segments } = curData?.data?.[curPhase]?.P_dict?.[sKeys[i]] ?? {};

					if (!segments?.length) {
						return;
					}
					const mainSeriesId = capitalize(sKeys[i]);
					const multiSegments = new MultipleSegments(segments ?? []);
					const segmentTimeArrs = segments.map((segment) => visualTimeArr(segment, 1, endIdx));
					const timeArr = segmentTimeArrs.flat();

					const values = multiSegments.predictSelf(timeArr);
					output.push({
						...config,
						values: values.map((value, valueIdx) => [
							xLogScale ? timeArr[valueIdx] : convertIdxToMilli(timeArr[valueIdx]),
							value === null ? null : value,
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
							values: startIndexes.map((index) => [
								xLogScale ? timeArr[index] : convertIdxToMilli(timeArr[index]),
								values[index],
							]),
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
							values: swIndexes.map((index) => [
								xLogScale ? timeArr[index] : convertIdxToMilli(timeArr[index]),
								values[index],
							]),
						};
						output.push(switchScatter);
					}
				});
			}

			multipleSegments.segmentObjects.forEach((curSegmentObject, i) => {
				const curSegment = curSegmentObject.segment;
				const timeArr = visualTimeArr(curSegment, 1, endIdx);
				const values = curSegmentObject.predict(timeArr);
				const color = segIdx === i ? forecastEditingColor : phaseColorsEditing[curPhase];
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
						xLogScale ? timeArr[valueIdx] : convertIdxToMilli(timeArr[valueIdx]),
						value === null ? null : value,
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
						values: [[xLogScale ? timeArr[swIndex] : convertIdxToMilli(timeArr[swIndex]), values[swIndex]]],
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
						values: [
							[
								xLogScale ? timeArr[startIndex] : convertIdxToMilli(timeArr[startIndex]),
								values[startIndex],
							],
						],
					};
					output.push(markerScatter);
				}
			});

			return output;
		}

		return [];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		curData?.data,
		curPhase,
		loaded,
		manualSeries,
		multipleSegments.segmentObjects,
		pKey,
		refreshChartDep,
		segIdx,
		segModelTemplate,
		xLogScale,
	]);

	// onMount
	useEffect(() => {
		const config = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			showGUIbtn: false,
			zoomOutConfig: {
				labelConfig: {
					offsetX: -250,
				},
			},
			plotarea: { marginRight: '35rem' },
		});

		config.scaleY.minValue = undefined;
		config.series = [];

		zingMixed(chartId, config);
		zingDisableContextMenu(chartId);

		return () => {
			zingDestroy(chartId);
		};
	}, [chartId]);

	useEffect(() => {
		if (isZingchartZoomed(chartId)) {
			zingchart.exec(chartId, 'viewall', { update: false });
		}
	}, [chartId, yearsBefore, yearsPast, yMin, yMax]);

	// onGraphSettingsUpdate
	useEffect(() => {
		const [xMin, xMax] = getProbXBoundaries({
			production: curData?.production,
			yearsBefore,
			yearsPast,
			xLogScale,
		});

		zingModify(chartId, {
			scaleY: {
				...genScaleY({
					maxValue: yMax > yMin ? yMax : undefined,
					minValue: yMin ?? undefined,
					log: yLogScale,
					yGuide: true,
					yLabel: false,
				}),
			},
			scaleX: genScaleX({
				maxValue: xMax,
				minValue: xMin,
				time: !xLogScale,
				xGuide: true,
				xLabel: false,
				xLogScale,
			}),
		});
	}, [chartId, curData, xLogScale, yLogScale, yMax, yMin, yearsBefore, yearsPast]);

	const legendItemClick = useLegendItemClick(chartId);

	// onSeriesUpdate
	useEffect(() => {
		zingModify(chartId, { series: [...productionSeries, ...forecastedSeries] });
		zingchart.bind(chartId, 'legend_item_click', legendItemClick);
		return () => {
			zingchart.unbind(chartId, 'legend_item_click', legendItemClick);
		};
	}, [chartId, forecastedSeries, legendItemClick, productionSeries]);

	return (
		<>
			{loaded && (
				<section className='chart-title-container'>
					{chartActionsRender}

					<span className='title-left'>
						<span className='title-label'>
							<ChartTitleText wellId={curData?._id} />

							<ProbabilisticChartSubheader
								forecasts={curData?.data}
								manualPhase={curPhase}
								manualSeries={manualSeries}
								phase={curPhase}
								production={curData?.production}
								resolution={resolution}
								wellId={curData?._id}
							/>
						</span>
					</span>

					<AdditionalChartActions>
						<AdditionalChartActionRow>
							<ProbabilisticDownloadButton forecastId={forecastId} wellId={wellId} />
							{keyboardTooltipButton}
						</AdditionalChartActionRow>
						<AdditionalChartActionRow>
							<PhaseStatusButtons forecastId={forecastId} wellId={wellId} />
						</AdditionalChartActionRow>
					</AdditionalChartActions>
				</section>
			)}

			<section className='chart-content-container'>
				<div id={chartId} className='phase-chart' />
			</section>
		</>
	);
};

export default ProbabilisticManualChart;
