import { faEllipsisH, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { round, truncate } from 'lodash-es';
import { useContext, useEffect, useMemo } from 'react';

import { Placeholder } from '@/components';
import { useGetter } from '@/components/hooks';
import { Box, ButtonItem, Checkbox, Divider, IconButton, MenuIconButton } from '@/components/v2';
import { ChartTitleText, DeterministicChartSubheader } from '@/forecasts/charts/components/ChartTitle';
import useComparisonData from '@/forecasts/charts/components/comparison/useComparisonData';
import {
	COLLECTION_SHORT_LABELS,
	COLUMN_LABELS,
	LEGEND_LABELS,
	VALID_PLL_SERIES,
	Y_ITEM_COLORS,
	Y_ITEM_SERIES_TYPES,
	getYType,
} from '@/forecasts/charts/components/graphProperties';
import {
	getUnitResolutionConversion,
	useLegendItemClick,
	useToggleManualSelection,
} from '@/forecasts/charts/components/helpers';
import useDeterministicChartScales from '@/forecasts/charts/components/useDeterministicChartScales';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { useDeterministicDownload } from '@/forecasts/download-forecast/DeterministicDownload';
import ComparisonForecastParameters from '@/forecasts/shared/ComparisonForecastParameters/ComparisonForecastParameters';
import { ForecastFloaterButton } from '@/forecasts/shared/ForecastFloater';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { adjustedCustomFieldsKeyToData } from '@/forecasts/shared/StreamsMenuBtn';
import { useDebouncedEffect } from '@/helpers/debounce';
import { useMultipleCustomFields } from '@/helpers/headers';
import { queryClient } from '@/helpers/query-cache';
import { capitalize, labelWithUnit } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import {
	ZOOM_EVENTS,
	isZingchartZoomed,
	markerScatterSeriesConfig,
	scaleColor,
	scatterConfig,
	scatterSeriesConfig,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { CardContext } from '@/layouts/CardsLayout';
import { TABS } from '@/manage-wells/shared/SingleWellViewDialog';
import { useCurrentProjectId } from '@/projects/routes';
import useSingleWellViewDialog from '@/well-comments/useSingleWellViewDialog';
import { useSingleWellFilterSelection } from '@/well-filter/hooks';

import { ChartSettings } from '../../useChartSettings';
import { useAllProjectForecasts } from '../deterministic/grid-chart/api';
import { ChartArea, ChartAreaContainer, ChartTitle, ChartTitleInfo, VerticalChartActions } from '../gridChartLayout';
import { VerticalDateItem, generateChartDateBar } from '../vertical-date-bar/helpers';

const parseEurValue = (value) => {
	if (Number.isFinite(value)) {
		return numberWithCommas(round(value / 1000, 1));
	}
	return null;
};

// TODO: define later
interface ForecastComparisonGridChartProps {
	additionalActions?;
	chartData?;
	chartId?: string;
	chartSettings: ChartSettings;
	comparisonIds?: Array<Inpt.ObjectId<'well'>>;
	comparisonResolutions?;
	dateBarItems?: Array<VerticalDateItem>;
	disableDataQuery?: boolean;
	disableStatusButtons?: boolean;
	enableAlign?: boolean;
	enableDownload?: boolean;
	enableFilterSelection?: boolean;
	onHandleSelection?;
	refForecastId: Inpt.ObjectId<'forecast'>;
	refreshGridChart?;
	selectable?: boolean;
	seriesItems?;
	singleChartControlActions?;
	toggleMinMaxButton?;
	wellId: Inpt.ObjectId<'well'>;
}

const ForecastComparisonGridChart = ({
	additionalActions,
	chartData: parentChartData = null,
	chartId = 'forecast-comparison-grid-chart',
	chartSettings,
	comparisonIds = [],
	comparisonResolutions = {},
	dateBarItems,
	disableDataQuery,
	disableStatusButtons,
	enableAlign,
	enableDownload,
	enableFilterSelection,
	onHandleSelection,
	refForecastId,
	refreshGridChart,
	selectable = false,
	seriesItems = [],
	singleChartControlActions,
	toggleMinMaxButton: parentToggleMinMaxButton,
	wellId,
}: ForecastComparisonGridChartProps) => {
	const chartData = useComparisonData({
		comparisonIds,
		comparisonResolutions,
		dataDep: parentChartData,
		disableDataQuery,
		enableAlign,
		refForecastId,
		wellId,
	});

	const getChartData = useGetter(chartData);

	const {
		dataLoaded: chartDataLoaded,
		dataTable,
		forecastCalcs,
		hasWarning,
		headers: wellHeaders,
		isLoading,
		queryKey,
		showWarning,
	} = chartData;

	const { FiltersButton } = useSingleWellFilterSelection(wellId);
	const { dialog: wellCommentDialog, handleOpen: openWellCommentDialog } = useSingleWellViewDialog({
		wellId,
		forecastId: refForecastId,
		onHeaderSubmitCallback: () => {
			if (refreshGridChart) {
				refreshGridChart();
			} else {
				queryClient.invalidateQueries(queryKey);
			}
		},
	});
	const { downloading: isDownloadingForecast, download: downloadForecast } = useDeterministicDownload({
		forecastId: refForecastId,
		wellId,
	});

	const { toggleButton: toggleMinMaxButton } = useContext(CardContext);
	const showChart = !isLoading && chartDataLoaded;

	const projectId = useCurrentProjectId();
	const allProjectForecastQuery = useAllProjectForecasts(projectId);

	const forecastNames = useMemo(() => {
		if (allProjectForecastQuery.isSuccess) {
			return allProjectForecastQuery.data.reduce((acc, forecastDoc) => {
				acc[forecastDoc._id] = forecastDoc.name;
				return acc;
			}, {});
		}
		return {};
	}, [allProjectForecastQuery]);

	const multipleCustomFieldsQuery = useMultipleCustomFields();
	const monthlyCustomFields = multipleCustomFieldsQuery?.data?.['monthly-productions'];
	const dailyCustomFields = multipleCustomFieldsQuery?.data?.['daily-productions'];

	const customFields = useMemo(() => {
		return {
			monthly: adjustedCustomFieldsKeyToData({ ...monthlyCustomFields }, 'monthly'),
			daily: adjustedCustomFieldsKeyToData({ ...dailyCustomFields }, 'daily'),
		};
	}, [dailyCustomFields, monthlyCustomFields]);

	const verticalDateBars = useMemo(
		() =>
			dateBarItems?.length && ['time', 'relativeTime'].includes(chartSettings.xAxis)
				? _.map(dateBarItems, (dateItem) =>
						generateChartDateBar({
							dateItem,
							startIdx: chartData?.dataTable?.relativeIdx ?? 0,
							wellHeaders,
							xAxisType: chartSettings.xAxis,
						})
				  ).filter(Boolean)
				: [],
		[chartData.dataTable.relativeIdx, chartSettings.xAxis, dateBarItems, wellHeaders]
	);

	const series = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const retSeries: Array<Record<string, any>> = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const retMarkerSeries: Array<ReturnType<typeof markerScatterSeriesConfig> & { values: Array<any> }> = [];

		if (chartDataLoaded) {
			seriesItems.forEach((item) => {
				const { collection, x, y } = item;

				const pllEnabled = VALID_PLL_SERIES.includes(y) && chartSettings?.enablePll;
				const parsedY = pllEnabled ? `${y}/pll` : y;

				const { convert, displayUnitTemplate } = getUnitResolutionConversion({
					headerPll: wellHeaders?.perf_lateral_length,
					parsedY,
					pllEnabled,
					unitResolution: chartSettings?.unitResolution ?? 'daily',
				});

				const isMBT = x.includes('mbt');
				const { type: yItemType, props: yItemProps } =
					Y_ITEM_SERIES_TYPES[collection][isMBT ? 'mbt' : getYType(y)];

				if (collection === 'forecast') {
					const forecastIds = [refForecastId, ...comparisonIds];
					forecastIds.forEach((id, forecastIdx) => {
						const xValues = dataTable?.[collection]?.[id]?.valid.has(x)
							? dataTable[collection][id][x]
							: null;
						const yValues = dataTable?.[collection]?.[id]?.valid.has(y)
							? dataTable[collection][id][y]
							: null;

						// even indexed forecasts are solid lineStyle, odd are dashed
						// const lineStyle = ['solid', 'dashed'][forecastIdx % 2];
						const lineStyle = forecastIdx % 2 ? 'dashed' : 'solid';

						// first 2 forecasts are darker, next 2 are lighter (same color in pairs)
						// const scaling = [0.5, 1][Math.floor(forecastIdx / 2)];
						const scaling = forecastIdx < 2 ? 1 : 0.5;
						const color = scaleColor(Y_ITEM_COLORS[collection][y])(scaling);

						const { eur, eurDif, forecastType } = forecastCalcs?.[id]?.[y] ?? {};
						if (xValues && yValues) {
							const mainSeriesId = `${id}-{collection}-${x}-${y}`;
							if (Object.keys(dataTable?.[collection]?.[id]?.markerIndexes).includes(y)) {
								const markerIndexes = dataTable?.[collection]?.[id]?.markerIndexes[y];
								retMarkerSeries.push({
									...markerScatterSeriesConfig({
										plotId: `marker-${mainSeriesId}`,
										markerColor: color,
										markerShape: 'square',
									}),
									values: markerIndexes.map((index) => [xValues[index], convert(yValues[index])]),
								});
							}
							if (Object.keys(dataTable?.[collection]?.[id]?.swIndexes).includes(y)) {
								const swIndexes = dataTable?.[collection]?.[id]?.swIndexes[y];
								retMarkerSeries.push({
									...markerScatterSeriesConfig({
										plotId: `sw-${mainSeriesId}`,
										markerColor: color,
										markerShape: 'triangle',
									}),
									values: swIndexes.map((index) => [xValues[index], convert(yValues[index])]),
								});
							}
							retSeries.push({
								id: mainSeriesId,
								...yItemType({
									...yItemProps,
									color,
									lineStyle,
								}),
								values: xValues.map((xValue, idx) => [
									xValue,
									Number.isFinite(yValues[idx]) ? convert(yValues[idx]) : null,
								]),
								text: `${
									forecastNames?.[id]
										? truncate(forecastNames[id], { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS })
										: 'N/A'
								} ${COLUMN_LABELS[y]} ${
									eur && forecastType
										? `(${capitalize(forecastType)}: ${parseEurValue(eur) ?? ''}${
												Number.isFinite(eurDif) ? `, ${round(eurDif * 100, 1)}%` : ''
										  })`
										: ''
								}`,
							});
						}
					});
				} else {
					const xValues = dataTable?.[collection]?.valid.has(x) ? dataTable[collection][x] : null;
					const yValues = dataTable?.[collection]?.valid.has(y) ? dataTable[collection][y] : null;
					const unit = (
						isMBT ? (chartSettings?.unitResolution ?? 'daily')[0] : displayUnitTemplate[parsedY]
					)?.toUpperCase();
					if (xValues && yValues) {
						const legendLabels = LEGEND_LABELS[y] || customFields[collection]?.[y] || y;

						retSeries.push({
							// HACK: adjust for next release
							...(!chartSettings?.lineScatter ? scatterSeriesConfig : yItemType)({
								...yItemProps,
								color: Y_ITEM_COLORS[collection][y],
							}),
							values: xValues.map((xValue, idx) => [
								xValue,
								Number.isFinite(yValues[idx]) ? convert(yValues[idx]) : null,
							]),
							text: labelWithUnit(
								`${COLLECTION_SHORT_LABELS[collection]} ${legendLabels}${pllEnabled ? '/PLL' : ''}`,
								unit
							),
						});
					}
				}
			});
		}
		return [...retSeries, ...retMarkerSeries];
	}, [
		chartDataLoaded,
		chartSettings?.enablePll,
		chartSettings?.lineScatter,
		chartSettings?.unitResolution,
		comparisonIds,
		customFields,
		dataTable,
		// TODO: this might have performance issue, need to investigate here
		forecastCalcs,
		forecastNames,
		refForecastId,
		seriesItems,
		wellHeaders?.perf_lateral_length,
	]);

	const {
		inEdit,
		toggleManualSelect,
		isSettingBucket: isSelecting,
	} = useToggleManualSelection({
		forecastId: refForecastId,
		wellId,
	});

	const controlsRender = useMemo(
		() => (
			<>
				{singleChartControlActions}

				{hasWarning && (
					<IconButton
						color='warning'
						onClick={async () => {
							await showWarning();
							refreshGridChart?.();
						}}
						size='small'
						tooltipPlacement='left'
						tooltipTitle='View Warning'
					>
						{faExclamationTriangle}
					</IconButton>
				)}

				<ForecastFloaterButton
					tooltipPlacement='left'
					useHandle
					width={`${25 + (comparisonIds?.length ?? 0) * 12.5}rem`}
				>
					<ComparisonForecastParameters
						comparisonForecastDatas={chartData?.rawData}
						wellName={wellHeaders?.well_name}
					/>
				</ForecastFloaterButton>

				{!disableStatusButtons && <PhaseStatusButtons forecastId={refForecastId} wellId={wellId} small />}
			</>
		),
		[
			chartData?.rawData,
			comparisonIds?.length,
			disableStatusButtons,
			hasWarning,
			refForecastId,
			refreshGridChart,
			showWarning,
			singleChartControlActions,
			wellHeaders?.well_name,
			wellId,
		]
	);

	// load initial config
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const config: any = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			plotarea: { marginRight: '40rem' },
			showGUIbtn: false,
			xGuide: false,
		});

		config.series = [];
		const events = {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			...ZOOM_EVENTS(),
		};

		if (onHandleSelection) {
			config.modules = 'selection-tool';
			events['zingchart.plugins.selection-tool.beforeselection'] = (p) => p.ev.altKey;
			events['zingchart.plugins.selection-tool.mouseup'] = (event) => onHandleSelection?.(getChartData())(event);
			events['zingchart.plugins.selection-tool.selection'] = () => false;
		}

		zingMixed(chartId, config, events);
		zingDisableContextMenu(chartId);
	}, [chartId, getChartData, onHandleSelection]);

	const [scaleX, scaleY, legend] = useDeterministicChartScales({
		chartSettings,
		dataTable: produce(dataTable, (draft) => {
			draft.forecast = draft?.forecast?.[refForecastId] ?? {};
		}),
		seriesItems,
		verticalDateBars,
		xAxisUsingNumericUnits: false, // currently doesn't use cumsum
	});

	useEffect(() => {
		if (isZingchartZoomed(chartId)) {
			zingchart.exec(chartId, 'viewall', { update: false });
		}
	}, [chartId, scaleX, scaleY]);

	const legendItemClick = useLegendItemClick(chartId);

	// refresh on scale changes
	useDebouncedEffect(
		() => zingModify(chartId, { legend, scaleX, scaleY, series }),
		[chartId, legend, scaleX, scaleY, series],
		50
	);

	useEffect(() => {
		zingchart.bind(chartId, 'legend_item_click', legendItemClick);
		return () => {
			zingchart.unbind(chartId, 'legend_item_click', legendItemClick);
		};
	}, [chartId, legendItemClick]);

	// TODO: deterministic and comparison chart actions are more similar now. consider unifying.
	return (
		<>
			<Box display='flex' justifyContent='space-between' width='100%'>
				<ChartTitle>
					<Box display='flex' alignItems='center'>
						{selectable && (
							<Checkbox
								id={`${chartId}-manual-selection-checkbox`}
								checked={inEdit}
								color='secondary'
								disabled={isSelecting}
								onChange={(_ev, newValue) => toggleManualSelect({ checked: newValue })}
								size='small'
								value={inEdit}
							/>
						)}

						{enableFilterSelection && FiltersButton}
					</Box>

					{showChart && (
						<ChartTitleInfo>
							<ChartTitleText wellId={wellId} wellHeadersDep={wellHeaders} />

							<DeterministicChartSubheader
								dailyProduction={chartData.dailyData}
								forecasts={chartData.forecastData}
								monthlyProduction={chartData.monthlyData}
								wellHeadersDep={wellHeaders}
								wellId={wellId}
							/>
						</ChartTitleInfo>
					)}
				</ChartTitle>

				<Box display='flex' alignItems='center'>
					<MenuIconButton size='small' icon={faEllipsisH} popperPlacement='bottom-end'>
						<ForecastToolbarTheme>
							{Boolean(additionalActions?.length) && (
								<>
									{additionalActions.map(({ label, onClick }) => (
										<ButtonItem key={label} onClick={onClick} label={label} />
									))}

									<Divider />
								</>
							)}

							{enableDownload && (
								<ButtonItem
									onClick={downloadForecast}
									disabled={isDownloadingForecast}
									label='Download Forecast'
								/>
							)}

							<ButtonItem onClick={openWellCommentDialog} label='Comments' />
							<ButtonItem
								onClick={() => openWellCommentDialog({ initialTab: TABS.info })}
								label='Well Info'
							/>
						</ForecastToolbarTheme>
					</MenuIconButton>

					<Box marginLeft='0.5rem'>{parentToggleMinMaxButton ?? toggleMinMaxButton}</Box>
				</Box>
			</Box>

			<Box display='flex' flexGrow={1}>
				<ChartAreaContainer>
					<ChartArea id={chartId} hidden={!showChart} />

					<Placeholder loading={!showChart} text={isLoading ? 'Loading Chart Data...' : 'No Data'} />
				</ChartAreaContainer>

				{showChart && <VerticalChartActions>{controlsRender}</VerticalChartActions>}
			</Box>

			{wellCommentDialog}
		</>
	);
};

export default ForecastComparisonGridChart;
