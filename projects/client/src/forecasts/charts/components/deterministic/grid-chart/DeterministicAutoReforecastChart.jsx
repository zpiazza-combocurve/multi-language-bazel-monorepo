import produce from 'immer';
import { noop } from 'lodash';
import { useContext, useEffect, useMemo, useRef } from 'react';

import { Placeholder } from '@/components/index';
import { useWellHeaderValues } from '@/forecasts/api';
import {
	ChartTitleText,
	DeterministicChartSubheader,
	ProximityChartTitle,
} from '@/forecasts/charts/components/ChartTitle';
import {
	getSelectionMinMax,
	getUnitResolutionConversion,
	useLegendItemClick,
} from '@/forecasts/charts/components/helpers';
import useDeterministicChartScales from '@/forecasts/charts/components/useDeterministicChartScales';
import { unitTemplates } from '@/forecasts/shared';
import { warningAlert } from '@/helpers/alerts';
import { makeLocal } from '@/helpers/date';
import { mean } from '@/helpers/math';
import { capitalize, labelWithUnit } from '@/helpers/text';
import { getConvertFunc } from '@/helpers/units';
import {
	GRAY_1,
	convertDateToIdx,
	convertIdxToMilli,
	isZingchartZoomed,
	lineSeriesConfig,
	scatterConfig,
	scatterSeriesConfig,
	zingClearSelection,
	zingDestroy,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { CardContext } from '@/layouts/CardsLayout';
import { useWellsHeadersMap } from '@/manage-wells/shared/utils';
import { DEFAULT_DAILY_RANGE } from '@/type-curves/TypeCurveIndex/fit/helpers';
import { createMapByWellId } from '@/type-curves/api';
import { generateC4FitSeries, generateC4WellSeries, generateWellCountSeries } from '@/type-curves/charts/C4Chart';
import { CHART_COLORS, getSingleHeaderInfo, tcTooltip } from '@/type-curves/charts/shared';
import {
	applyNormalization,
	get_noalign_daily_resolution,
	get_noalign_monthly_resolution,
} from '@/type-curves/shared/fit-tc/daily-helpers';

import {
	COLLECTION_SHORT_LABELS,
	LEGEND_LABELS,
	VALID_CUMS,
	VALID_PHASES,
	VALID_PLL_SERIES,
	Y_ITEM_COLORS,
	Y_ITEM_SERIES_TYPES,
	getYType,
} from '../../graphProperties';
import {
	AdditionalChartActionRow,
	AdditionalChartActions,
	ChartArea,
	ChartAreaContainer,
	ChartTitle,
	ChartTitleInfo,
	VerticalChartActions,
} from '../../gridChartLayout';
import useDeterministicData from './useDeterministicData';

const convertDailyToMonthly = getConvertFunc('D', 'M');
const convertMonthlyToDaily = getConvertFunc('M', 'D');
const EMPTY_OBJ = {};

// currently only used in this file
export const useProximitySeries = ({
	chartSettings,
	editingChartPhaseType,
	resolution,
	seriesConfig = {},
	seriesItems,
	proximityActive,
	proximityQuery,
	proximityWellSelection,
	proximityBgNormalization,
	proximitySeriesSelections,
	wellHeaderQuery,
}) => {
	const { selection } = proximityWellSelection ?? EMPTY_OBJ;
	const { data: wellHeaders } = wellHeaderQuery;
	const { y: yUnitKey } = seriesItems?.length ? seriesItems[0] : {};

	const firstIdx = useMemo(() => {
		// copied from original useProximityData
		const { first_prod_date_monthly_calc, first_prod_date_daily_calc, first_prod_date } = wellHeaders ?? {};
		const baseMonthly = first_prod_date_monthly_calc ? makeLocal(new Date(first_prod_date_monthly_calc)) : null;
		const monthlyCalc = baseMonthly ? new Date(baseMonthly.getFullYear(), baseMonthly.getMonth(), 15) : null;
		const dailyCalc = first_prod_date_daily_calc ? makeLocal(new Date(first_prod_date_daily_calc)) : null;
		const fpdCalc = first_prod_date ? makeLocal(new Date(first_prod_date)) : null;
		let fpd = monthlyCalc ?? fpdCalc ?? dailyCalc ?? new Date();
		if (resolution === 'daily') {
			fpd = dailyCalc ?? fpdCalc ?? monthlyCalc ?? new Date();
		}
		return convertDateToIdx(fpd);
	}, [resolution, wellHeaders]);

	const [bgWellInformation, normalization] = useMemo(() => {
		if (!proximityActive || !proximityQuery.data) {
			return [[], []];
		}
		const raw_well_information_s =
			(editingChartPhaseType === 'rate'
				? proximityQuery.data?.rawBackgroundData?.well_information_s
				: proximityQuery.data?.rawBackgroundData?.ratio?.well_information_s) ?? [];

		const well_information_s = [];
		const normalization_s = [];

		raw_well_information_s.forEach((value, index) => {
			const includeWell = selection ? selection.filteredArray.includes(value.header.well_id) : true;
			if (includeWell) {
				well_information_s.push(value);
				let proximityNormValue = proximityBgNormalization?.[index];
				if (proximityNormValue?.length === 2) {
					proximityNormValue = proximityNormValue[0];
				} else if (!proximityNormValue) {
					proximityNormValue = 1;
				}
				normalization_s.push(proximityNormValue);
			}
		});

		return [well_information_s, normalization_s];
	}, [proximityActive, proximityQuery.data, editingChartPhaseType, selection, proximityBgNormalization]);

	// get headers for background wells
	const bgWellsIds = bgWellInformation?.map((info) => info.header.well_id);
	const { data: bgWellsHeadersMap } = useWellsHeadersMap(bgWellsIds);
	const bgWellsHeaders = bgWellsIds?.map((bgWellId) => bgWellsHeadersMap?.get(bgWellId));

	// generate the series data for the background wells.
	const {
		data: bgWellsPlotData,
		idx: bgWellsIdx,
		data_part_idx: bgWellsDataPartIdx,
	} = useMemo(() => {
		if (bgWellInformation?.length) {
			if (resolution === 'monthly') {
				return get_noalign_monthly_resolution(bgWellInformation);
			} else {
				return get_noalign_daily_resolution(bgWellInformation, DEFAULT_DAILY_RANGE);
			}
		}
		return {};
	}, [bgWellInformation, resolution]);

	const proximityBackgroundWellSeries = useMemo(() => {
		if (
			!proximityActive ||
			proximityQuery.isLoading ||
			!bgWellInformation?.length ||
			wellHeaderQuery.isLoading ||
			!proximitySeriesSelections.has('backgroundWells')
		) {
			return [];
		}

		// only need to consider time in proximity Mode
		const plotDate = bgWellsIdx.map((currIndex) => convertIdxToMilli(firstIdx + currIndex - bgWellsIdx[0]));

		const pllEnabled = chartSettings?.enablePll && VALID_PLL_SERIES.includes(yUnitKey);
		const parsedY = pllEnabled ? `${yUnitKey}/pll` : yUnitKey;
		const { convert } = getUnitResolutionConversion({
			headerPll: wellHeaders?.perf_lateral_length,
			parsedY,
			pllEnabled,
			unitResolution: chartSettings?.unitResolution ?? 'daily',
		});

		// TODO: unitConversion for y
		return applyNormalization(bgWellsPlotData, normalization).map((datum, i) => {
			// const wellId = wellIds[i];
			const dataSeries = {
				...lineSeriesConfig({
					// color: enableColorSeries ? scaleColor(color)(scaling) : GRAY_1,
					color: seriesConfig.color ?? GRAY_1,
					lineWidth: 1,
					legendMarker: { toggleAction: 'disabled' },
				}),
				id: i,
				// only map if there's prod data
				values: bgWellsDataPartIdx[i][2] ? datum.map((d, j) => [plotDate[j], convert(d)]) : [],
				showInLegend: seriesConfig?.displayInLegend ? i === 0 : false,
				text: seriesConfig?.displayInLegend ? seriesConfig?.text : null,
				legendItem: { toggleAction: 'disabled' },
				...getSingleHeaderInfo(bgWellsHeaders[i]),
				tooltip: tcTooltip(),
				hoverState: {
					lineWidth: 3,
					lineColor: seriesConfig.color ?? GRAY_1,
				},
			};
			// const headers = headersMap.get(wellId);
			// if (includeHeaders) {
			// 	dataSeries.tooltip = tcTooltip();
			// 	merge(dataSeries, getSingleHeaderInfo(headers));
			// }
			// dataSeries.text = headers?.well_name; // need this for download purpose
			return dataSeries;
		});
	}, [
		bgWellInformation?.length,
		bgWellsDataPartIdx,
		bgWellsIdx,
		bgWellsPlotData,
		bgWellsHeaders,
		chartSettings?.enablePll,
		chartSettings?.unitResolution,
		firstIdx,
		normalization,
		proximityActive,
		proximityQuery.isLoading,
		proximitySeriesSelections,
		seriesConfig.color,
		seriesConfig?.displayInLegend,
		seriesConfig?.text,
		wellHeaderQuery.isLoading,
		wellHeaders?.perf_lateral_length,
		yUnitKey,
	]);

	const proximityFitSeries = useMemo(() => {
		if (
			!proximityActive ||
			proximityQuery.isLoading ||
			!bgWellInformation?.length ||
			wellHeaderQuery.isLoading ||
			!yUnitKey
		) {
			return [];
		}
		const activeChartSeries = proximitySeriesSelections;

		const { defaultUnitTemplate, dailyUnitTemplate } = unitTemplates;

		const normalization = proximityBgNormalization?.length
			? proximityBgNormalization.map((multipliers) => (multipliers.length === 2 ? multipliers[0] : multipliers))
			: new Array(bgWellsPlotData.length).fill(1);

		// Never have option to show Rate for a Ratio phase.
		const c4RatioShowRate = false;
		const showDaily = false;
		const includeHeaders = false;
		const phaseRepWells = bgWellInformation
			.map((well) => {
				return well?.header?.well_id;
			})
			.filter((w) => w);
		const noWells = !phaseRepWells.length;
		const phaseType = editingChartPhaseType;
		const phase = yUnitKey && yUnitKey.includes('/') ? yUnitKey.slice(0, yUnitKey.indexOf('/')) : yUnitKey;

		const unitKey = yUnitKey;

		const convert = getConvertFunc(dailyUnitTemplate[unitKey], defaultUnitTemplate[unitKey]);
		const xConvert = (value) => (showDaily ? value : convertDailyToMonthly(value));
		const phaseColors = CHART_COLORS[phase];

		const plotData = applyNormalization(bgWellsPlotData, normalization);
		const useProdData = { data: plotData, idx: bgWellsIdx, data_part_idx: bgWellsDataPartIdx };
		const headersMap = createMapByWellId(
			Object.entries(proximityQuery?.data?.headersMap).map(([key, value]) => {
				value.well_id = key;
				return value;
			})
		);

		const wellIds = phaseRepWells;

		const wellCountSeries = generateWellCountSeries(useProdData, xConvert);

		const wellSeries = generateC4WellSeries({
			activeChartSeries,
			convert,
			headersMap,
			includeHeaders,
			noWells,
			phaseColors,
			useProdData,
			wellCountSeries,
			wellIds,
			xConvert,
		});

		const fitSeries = generateC4FitSeries(
			activeChartSeries,
			c4RatioShowRate,
			convert,
			null, //alignAdjustedFitSeries,
			noop, //getShiftBaseSegments,
			phaseColors,
			phaseType,
			xConvert
		);
		return [...wellSeries, ...fitSeries];
	}, [
		bgWellInformation,
		bgWellsDataPartIdx,
		bgWellsIdx,
		bgWellsPlotData,
		editingChartPhaseType,
		proximityActive,
		proximityBgNormalization,
		proximityQuery?.data?.headersMap,
		proximityQuery.isLoading,
		proximitySeriesSelections,
		wellHeaderQuery.isLoading,
		yUnitKey,
	]);

	const shiftedProximityFitSeries = useMemo(() => {
		if (!proximityActive || proximityQuery.isLoading) {
			return [];
		}

		const retSeries = produce(proximityFitSeries, (draft) => {
			draft.forEach((series) => {
				series.values = series.values.map((item) => {
					return [Math.round(convertIdxToMilli(convertMonthlyToDaily(item[0]) + firstIdx)), item[1]];
				});
			});
		});
		return retSeries;
	}, [firstIdx, proximityActive, proximityFitSeries, proximityQuery.isLoading]);

	const proximityHeaders = useMemo(() => {
		if (proximityActive && proximityQuery.data) {
			const proximityData = proximityQuery.data;
			const headersDict = proximityData?.headersMap ?? EMPTY_OBJ;
			const repInit = proximityData?.repInit ?? [];
			const repInitMap = repInit.reduce((acc, v) => {
				acc[v.well_id] = v;
				return acc;
			}, {});

			const headers = [
				'perf_lateral_length',
				'total_fluid_per_perforated_interval',
				'total_proppant_per_perforated_interval',
			];
			const averages = {};
			const filteredWells = selection
				? selection.filteredArray
				: Object.values(headersDict).map((v) => v.well_id);

			headers.forEach((header) => {
				const values = filteredWells.map((well_id) => headersDict?.[well_id]?.[header]);
				averages[header] = mean(values);
			});

			const eurs = {};
			VALID_PHASES.forEach((phase) => {
				const phaseEurs = filteredWells.map((well_id) => repInitMap?.[well_id]?.eur?.[phase]);
				const phaseEurPlls = filteredWells.map((well_id) => {
					const v = repInitMap?.[well_id];
					const eur = v?.eur?.[phase];
					const pll = v?.header?.perf_lateral_length;
					if (eur === 0) {
						return 0;
					}
					if (eur && pll) {
						return eur / pll;
					}
					return null;
				});

				eurs[`${phase}_eur`] = mean(phaseEurs);
				eurs[`${phase}_eur/pll`] = mean(phaseEurPlls);
			});

			return <ProximityChartTitle headerAverages={averages} headers={headers} eurs={eurs} />;
		}
		return <div />;
	}, [proximityActive, proximityQuery.data, selection]);

	return { proximityHeaders, proximityBackgroundWellSeries, shiftedProximityFitSeries };
};

const REFORECAST_CHART_ID = 'deterministic-auto-reforecat-chart';
const DeterministicAutoReforecastChart = (props) => {
	const {
		autoProps: parentAutoProps = null,
		chartData: parentChartData = null,
		chartSettings,
		enableVerticalControls,
		editingChartPhaseType,
		forecastId,
		limitHeaders,
		loading: parentLoading,
		refresh: parentRefresh,
		resolution,
		setYAxisLabel = noop,
		seriesItems = [],
		singleChartControlActions,
		titleInfo = undefined, // titleInfo to show instead when disableTitleInfo is true
		wellId,
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
	} = props;

	useEffect(() => {
		setYAxisLabel();
	}, [setYAxisLabel]);

	const chartData = useDeterministicData({ forecastId, wellId, dataDep: parentChartData, refreshDep: parentRefresh });
	const { dataLoaded: chartDataLoaded, dataTable, isFetching } = chartData;

	const wellHeaderQuery = useWellHeaderValues(wellId, 'all');
	const { data: wellHeaders } = wellHeaderQuery;

	const shouldDisplayChart = !parentLoading && (chartDataLoaded || !isFetching);
	const autoProps = useRef(null);
	const plotMapRef = useRef(null);
	const xAxisRef = useRef('time');

	xAxisRef.current = chartSettings.xAxis;

	const xAxisUsingNumericUnits =
		VALID_CUMS.includes(chartSettings.xAxis) || ['mbt', 'mbt_filtered'].includes(chartSettings.xAxis);

	const { proximityHeaders, proximityBackgroundWellSeries, shiftedProximityFitSeries } = useProximitySeries({
		chartSettings,
		editingChartPhaseType,
		resolution,
		seriesItems,
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
		wellHeaderQuery,
	});

	const [series, markerSeries, plotMap] = useMemo(() => {
		const validPlotSeriesKeys = [];
		const newPlotMap = new Map();
		const retMarkerSeries = [];
		const retSeries = chartDataLoaded
			? seriesItems
					// eslint-disable-next-line complexity
					.map((item) => {
						const { collection, x, y } = item;
						const xValues = dataTable?.[collection]?.valid.has(x) ? dataTable[collection][x] : null;
						const yValues = dataTable?.[collection]?.valid.has(y) ? dataTable[collection][y] : null;

						const pllEnabled = chartSettings?.enablePll && VALID_PLL_SERIES.includes(y);
						const parsedY = pllEnabled ? `${y}/pll` : y;

						const { convert, displayUnitTemplate } = getUnitResolutionConversion({
							headerPll: wellHeaders?.perf_lateral_length,
							parsedY,
							pllEnabled,
							unitResolution: chartSettings?.unitResolution ?? 'daily',
						});

						const { type: yItemType, props: yItemProps } = Y_ITEM_SERIES_TYPES[collection][getYType(y)];
						const mainSeriesId = `${collection}-${x}-${y}`;
						if (xValues && yValues) {
							if (
								collection === 'forecast' &&
								Object.keys(dataTable.forecast.markerIndexes).includes(y)
							) {
								const markerIndexes = dataTable.forecast.markerIndexes[y];
								retMarkerSeries.push({
									id: `marker-${mainSeriesId}`,
									type: 'scatter',
									marker: {
										backgroundColor: Y_ITEM_COLORS.forecast[y],
										type: 'square',
										size: 5,
									},
									values: markerIndexes.map((index) => [
										dataTable.forecast[x][index],
										convert(dataTable.forecast[y][index]),
									]),
									legendItem: {
										visible: false,
									},
									legendMarker: {
										visible: false,
									},
								});
							}

							if (collection === 'forecast' && Object.keys(dataTable.forecast.swIndexes).includes(y)) {
								const swIndexes = dataTable.forecast.swIndexes[y];
								retMarkerSeries.push({
									id: `sw-${mainSeriesId}`,
									type: 'scatter',
									marker: {
										backgroundColor: Y_ITEM_COLORS.forecast[y],
										type: 'triangle',
										size: 5,
									},
									values: swIndexes.map((index) => [
										dataTable.forecast[x][index],
										convert(dataTable.forecast[y][index]),
									]),
									legendItem: {
										visible: false,
									},
									legendMarker: {
										visible: false,
									},
								});
							}

							validPlotSeriesKeys.push(`${collection}-${y}`);
							const unit = displayUnitTemplate[parsedY]?.toUpperCase();
							return {
								// HACK: should find a more declarative way for next release
								...(!chartSettings?.lineScatter && (collection === 'monthly' || collection === 'daily')
									? scatterSeriesConfig
									: yItemType)({
									...(collection === 'monthly' || collection === 'daily'
										? Y_ITEM_SERIES_TYPES[collection].production.props
										: yItemProps),
									color: Y_ITEM_COLORS[collection][y],
								}),
								id: mainSeriesId,
								values: xValues.map((xValue, idx) => [
									xValue,
									Number.isFinite(yValues[idx]) ? convert(yValues[idx]) : null,
								]),
								text: labelWithUnit(
									`${COLLECTION_SHORT_LABELS[collection]} ${LEGEND_LABELS[y]}${
										pllEnabled ? '/pll' : ''
									}`,
									unit
								),
							};
						}

						return null;
					})
					.filter((value) => value !== null)
			: [];

		validPlotSeriesKeys.forEach((key, idx) => newPlotMap.set(key, idx));
		return [retSeries, retMarkerSeries, newPlotMap];
	}, [
		chartDataLoaded,
		chartSettings?.enablePll,
		chartSettings?.lineScatter,
		chartSettings?.unitResolution,
		dataTable,
		seriesItems,
		wellHeaders?.perf_lateral_length,
	]);

	// load initial config
	useEffect(() => {
		const config = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			selectedState: true,
			showGUIbtn: false,
			tooltip: true,
			xGuide: false,
			yLabel: false,
			plotarea: { marginRight: '40rem' },
		});

		const events = {};

		// dateSelection enables dataSelection

		config.modules = 'selection-tool';
		config.plot.dataAppendSelection = false;

		events.beforezoom = ({ ev }) => !(ev.altKey || ev.shiftKey);
		events['zingchart.plugins.selection-tool.beforeselection'] = ({ ev }) => ev.altKey || ev.shiftKey;

		events['zingchart.plugins.selection-tool.mouseup'] = (p) => {
			// box does not need select on mouse up , it just need to know the edge of selection box
			try {
				// TODO: for some reason, shift + lasso selection will come here, if initial click is on a proximity series
				if (p?.poly?.length > 5 || !p?.poly?.length) {
					return;
				}
				const { setDateSelection, plotSeriesKey } = autoProps.current;
				const [min, max] = getSelectionMinMax(p);
				if (min === null || max === null) {
					throw new Error('Invalid range selected');
				}

				if (xAxisRef.current === 'time') {
					setDateSelection(new Date(min), new Date(max));
				} else {
					const collection = plotSeriesKey.split('-')[0];
					if (!dataTable[collection]) {
						throw new Error('Invalid range selected');
					}

					const compareSeries = dataTable[collection][xAxisRef.current];
					if (compareSeries.length === 0) {
						throw new Error(`No valid ${collection} data between the range`);
					}
					let minIndex = compareSeries?.findIndex((x) => x >= min);
					minIndex = minIndex === -1 ? compareSeries.length - 1 : minIndex;
					let maxIndex = compareSeries?.findIndex((x) => x > max);
					maxIndex = maxIndex === -1 ? compareSeries.length - 1 : maxIndex - 1;

					setDateSelection(
						new Date(dataTable[collection].time[minIndex]),
						new Date(dataTable[collection].time[maxIndex])
					);
				}
			} catch (error) {
				warningAlert(error.message);
			}
		};

		// data points selection
		events['zingchart.plugins.selection-tool.selection'] = (p) => {
			// lasso requires selection of data points, so has to be splitted from mouseup
			const { ev, nodes } = p;
			if (!ev?.shiftKey) {
				return false;
			}

			try {
				const { plotSeriesKey, setValidIdx } = autoProps.current;
				const plotIndex = plotMapRef.current.get(plotSeriesKey);
				const collection = plotSeriesKey.split('-')[0];
				const validNodes = nodes.filter((node) => node.plotindex === plotIndex);
				if (!validNodes?.length) {
					throw new Error(
						`Please select valid nodes from: ${plotSeriesKey
							.split('-')
							.map((value) => capitalize(value))
							.join(' ')}`
					);
				}

				setValidIdx(validNodes.map(({ index: arrIndex }) => dataTable[collection].index[arrIndex]));

				return validNodes;
			} catch (error) {
				warningAlert(error.message);
				return false;
			}
		};

		zingMixed(REFORECAST_CHART_ID, { ...config, series: [] }, events);
		zingDisableContextMenu(REFORECAST_CHART_ID);

		return () => {
			zingDestroy(REFORECAST_CHART_ID);
		};
	}, [dataTable]);

	const [scaleX, scaleY, legend] = useDeterministicChartScales({
		dataTable,
		chartSettings,
		seriesItems,
		xAxisUsingNumericUnits,
	});

	useEffect(() => {
		if (isZingchartZoomed(REFORECAST_CHART_ID)) {
			zingchart.exec(REFORECAST_CHART_ID, 'viewall', { update: false });
		}
	}, [scaleX, scaleY]);

	const legendItemClick = useLegendItemClick(REFORECAST_CHART_ID);

	// refresh on scale changes
	useEffect(() => {
		if (chartDataLoaded) {
			const plotSeries = [
				...series,
				...markerSeries,
				...proximityBackgroundWellSeries,
				...shiftedProximityFitSeries,
			];

			zingModify(REFORECAST_CHART_ID, { legend, scaleX, scaleY, series: plotSeries });
			zingchart.bind(REFORECAST_CHART_ID, 'legend_item_click', legendItemClick);
			return () => {
				zingchart.unbind(REFORECAST_CHART_ID, 'legend_item_click', legendItemClick);
			};
		}
	}, [
		chartDataLoaded,
		legend,
		legendItemClick,
		markerSeries,
		proximityBackgroundWellSeries,
		scaleX,
		scaleY,
		series,
		shiftedProximityFitSeries,
	]);

	useEffect(() => {
		plotMapRef.current = plotMap;
	}, [plotMap]);

	useEffect(() => {
		autoProps.current = parentAutoProps;
		zingClearSelection(REFORECAST_CHART_ID);
	}, [parentAutoProps]);

	const { isMaximized, toggleButton } = useContext(CardContext);
	return (
		<>
			<ChartTitle disablePadding={!isMaximized}>
				{proximityActive && <ChartTitleInfo>{proximityHeaders}</ChartTitleInfo>}
				{isMaximized && !proximityActive && (
					<ChartTitleInfo>
						<ChartTitleText wellId={wellId} />

						<DeterministicChartSubheader
							dailyProduction={chartData.dailyData}
							forecasts={chartData.forecastData}
							limitHeaders={limitHeaders}
							monthlyProduction={chartData.monthlyData}
							wellId={wellId}
						/>
					</ChartTitleInfo>
				)}

				{!enableVerticalControls && (
					<AdditionalChartActions>
						<AdditionalChartActionRow>
							{toggleButton}
							{singleChartControlActions}
						</AdditionalChartActionRow>
					</AdditionalChartActions>
				)}
			</ChartTitle>

			<ChartAreaContainer>
				<ChartArea id={REFORECAST_CHART_ID} hidden={!shouldDisplayChart} />

				{enableVerticalControls && shouldDisplayChart && (
					<VerticalChartActions>
						{toggleButton}
						{singleChartControlActions}
						{titleInfo}
					</VerticalChartActions>
				)}

				<Placeholder empty={!shouldDisplayChart} text='Loading Chart Data...' />
			</ChartAreaContainer>
		</>
	);
};

export default DeterministicAutoReforecastChart;
