import { faEllipsisH, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { noop } from 'lodash-es';
import { useContext, useEffect, useMemo, useRef } from 'react';

import { useCallbackRef, useGetter } from '@/components/hooks';
import { Placeholder } from '@/components/index';
import { Box, ButtonItem, Checkbox, Divider, IconButton, MenuIconButton } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { ChartTitleText, DeterministicChartSubheader } from '@/forecasts/charts/components/ChartTitle';
import useDeterministicParameters from '@/forecasts/charts/components/deterministic/grid-chart/useDeterministicParameters';
import {
	getUnitResolutionConversion,
	useLegendItemClick,
	useToggleManualSelection,
} from '@/forecasts/charts/components/helpers';
import useDeterministicChartScales from '@/forecasts/charts/components/useDeterministicChartScales';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { useDeterministicDownload, useProximityDownload } from '@/forecasts/download-forecast/DeterministicDownload';
import SingleWellProximityDialog from '@/forecasts/proximity-forecast/SingleWellProximityDialog';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { adjustedCustomFieldsKeyToData } from '@/forecasts/shared/StreamsMenuBtn';
import { useDebouncedEffect } from '@/helpers/debounce';
import { useMultipleCustomFields } from '@/helpers/headers';
import { queryClient } from '@/helpers/query-cache';
import { labelWithUnit } from '@/helpers/text';
import {
	ZOOM_EVENTS,
	isZingchartZoomed,
	markerScatterSeriesConfig,
	scatterConfig,
	scatterSeriesConfig,
	zingDestroy,
	zingDisableContextMenu,
	zingMixed,
	zingModify,
	zingchart,
} from '@/helpers/zing';
import { CardContext } from '@/layouts/CardsLayout';
import { TABS } from '@/manage-wells/shared/SingleWellViewDialog';
import { ModularEconomics } from '@/modular-economics/ModularEconomics';
import useSingleWellViewDialog from '@/well-comments/useSingleWellViewDialog';
import { useSingleWellFilterSelection } from '@/well-filter/hooks';

import { WellsCollectionChip } from '../../WellsCollectionChip';
import {
	COLLECTION_SHORT_LABELS,
	LEGEND_LABELS,
	VALID_CUMS,
	VALID_PLL_SERIES,
	Y_ITEM_COLORS,
	Y_ITEM_SERIES_TYPES,
	getYType,
} from '../../graphProperties';
import { ChartArea, ChartAreaContainer, ChartTitle, ChartTitleInfo, VerticalChartActions } from '../../gridChartLayout';
import { VerticalDateItem, generateChartDateBar } from '../../vertical-date-bar/helpers';
import useDeterministicData from './useDeterministicData';

const getXLegend = (xAxisIsMBT, isMBT) => {
	if (xAxisIsMBT) {
		return isMBT ? ' MBT ' : ' Time ';
	}
	return '';
};

const useEnableProximity = (
	proximityEnabled,
	forecastData
): { enableProximity: boolean; proximityPhases: Array<string> } => {
	if (!proximityEnabled) return { enableProximity: false, proximityPhases: [] as Array<string> };
	const proximityPhases: Array<string> = _.reduce(
		forecastData,
		(acc, data, phase) => {
			if (data.forecastSubType === 'proximity') {
				acc.push(phase as string);
			}
			return acc;
		},
		[] as Array<string>
	);

	const forecastsIncludeProximity = proximityPhases.length > 0;
	return { enableProximity: proximityEnabled && forecastsIncludeProximity, proximityPhases };
};

// TODO: define later
interface DeterministicGridChartProps {
	additionalActions?;
	allowDataSelection?: boolean;
	chartData?;
	chartId?: string;
	chartSettings: ChartSettings;
	dataSettings?;
	dateBarItems?: Array<VerticalDateItem>;
	disableDataQuery?: boolean;
	disableStatusButtons?: boolean;
	disableSubheader?: boolean;
	disableTitleInfo?: boolean;
	enableDownload?: boolean;
	enableFilterSelection?: boolean;
	enableMaximize?: boolean;
	enableParameterDescription?: boolean;
	enableProximity?: boolean;
	forecastId: Inpt.ObjectId<'forecast'>;
	loading?: boolean;
	manualSetOnForm?;
	onHandleSelection?;
	proximitySeries?;
	refreshGridChart?;
	selectable?: boolean;
	seriesItems?;
	singleChartControlActions?;
	wellId: Inpt.ObjectId<'well'>;
}

const DeterministicGridChart = ({
	additionalActions,
	allowDataSelection,
	chartData: parentChartData = null,
	chartId = 'deterministic-grid-chart',
	chartSettings,
	dataSettings,
	dateBarItems,
	disableDataQuery,
	disableStatusButtons,
	disableSubheader,
	disableTitleInfo,
	enableDownload,
	enableFilterSelection,
	enableMaximize = true,
	enableParameterDescription,
	enableProximity: parentEnableProximity = false,
	forecastId,
	loading: parentLoading,
	manualSetOnForm = noop,
	onHandleSelection,
	proximitySeries = [],
	refreshGridChart,
	selectable,
	seriesItems = [],
	singleChartControlActions,
	wellId,
}: DeterministicGridChartProps) => {
	const { isProximityForecastEnabled } = useLDFeatureFlags();

	const chartData = useDeterministicData({
		dataDep: parentChartData,
		disableDataQuery,
		forecastId,
		wellId,
	});

	const {
		dataLoaded: chartDataLoaded,
		dataTable,
		hasWarning,
		headers: wellHeaders,
		isLoading,
		queryKey,
		rawData,
		showWarning,
	} = chartData;

	const { enableProximity, proximityPhases } = useEnableProximity(parentEnableProximity, chartData.forecastData);

	const getChartData = useGetter(chartData);

	const { FiltersButton } = useSingleWellFilterSelection(wellId);

	const { dialog: wellCommentDialog, handleOpen: openWellCommentDialog } = useSingleWellViewDialog({
		wellId,
		forecastId,
		onOpen: () => manualSetOnForm(true),
		onClose: () => manualSetOnForm(false),
		onHeaderSubmitCallback: () => {
			if (refreshGridChart) {
				refreshGridChart();
			} else {
				queryClient.invalidateQueries(queryKey);
			}
		},
	});

	const { downloading: isDownloadingForecast, download: downloadForecast } = useDeterministicDownload({
		forecastId,
		wellId,
	});

	const { downloading: isDownloadingProximityForecast, download: downloadProximityForecast } = useProximityDownload({
		forecastId,
		wellId,
	});

	const { render: parameterTooltipRender } = useDeterministicParameters(rawData, wellHeaders?.well_name);

	const chartIdRef = useRef(chartId);
	chartIdRef.current = chartId;

	const xAxisIsCum = VALID_CUMS.includes(chartSettings.xAxis);
	const xAxisIsMBT = ['mbt', 'mbt_filtered'].includes(chartSettings.xAxis);
	const xAxisUsingNumericUnits = xAxisIsCum || xAxisIsMBT;

	const shouldDisplayChart = !parentLoading && chartDataLoaded;

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
		const retMarkerSeries: Array<ReturnType<typeof markerScatterSeriesConfig> & { values: Array<any> }> = [];
		const retSeries = dataTable
			? seriesItems
					.map((item) => {
						const { collection, x, y } = item;
						const xValues = dataTable?.[collection]?.valid.has(x) ? dataTable[collection][x] : null;
						let yValues = dataTable?.[collection]?.valid.has(y) ? dataTable[collection][y] : null;

						let useConvertedYValues = true;
						if (collection === 'monthly' && chartSettings?.unitResolution === 'monthly') {
							useConvertedYValues = false;
							const daysInMonth = dataTable?.['monthly']?.daysInMonthArray;
							if (yValues) {
								yValues = yValues.map((value, index) => value * daysInMonth[index]);
							}
						}

						const pllEnabled = chartSettings?.enablePll && VALID_PLL_SERIES.includes(y);
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
						const mainSeriesId = `${collection}-${x}-${y}`;
						if (xValues && yValues) {
							if (
								collection === 'forecast' &&
								Object.keys(dataTable.forecast.markerIndexes).includes(y)
							) {
								const markerIndexes = dataTable.forecast.markerIndexes[y];
								retMarkerSeries.push({
									...markerScatterSeriesConfig({
										plotId: `marker-${mainSeriesId}`,
										markerColor: Y_ITEM_COLORS.forecast[y],
										markerShape: 'square',
									}),
									values: markerIndexes
										.map((index) => [
											dataTable.forecast[x][index],
											convert(dataTable.forecast[y][index]),
										])
										.filter((el) => el[0] !== null),
									// XXX: sometimes x values in series can
									// have nulls, currently the only way this
									// can happen is when using filtered MBT.
									// <03-02-22, Max Schulte> //
								});
							}

							if (collection === 'forecast' && Object.keys(dataTable.forecast.swIndexes).includes(y)) {
								const swIndexes = dataTable.forecast.swIndexes[y];
								retMarkerSeries.push({
									...markerScatterSeriesConfig({
										plotId: `sw-${mainSeriesId}`,
										markerColor: Y_ITEM_COLORS.forecast[y],
										markerShape: 'triangle',
									}),
									values: swIndexes
										.map((index) => [
											dataTable.forecast[x][index],
											convert(dataTable.forecast[y][index]),
										])
										.filter((el) => el[0] !== null),
									// XXX: sometimes x values in series can
									// have nulls, currently the only way this
									// can happen is when using filtered MBT.
									// <03-02-22, Max Schulte> //
								});
							}

							const legendLabel = LEGEND_LABELS[y] || customFields[collection]?.[y] || y;

							const unit = displayUnitTemplate[parsedY]?.toUpperCase();

							let yValuesWithConversion = [];
							if (useConvertedYValues) {
								yValuesWithConversion = xValues
									.map((xValue, idx) => [
										xValue,
										Number.isFinite(yValues[idx]) ? convert(yValues[idx]) : null,
									])
									.filter((el) => el[0] !== null);
							} else {
								yValuesWithConversion = xValues
									.map((xValue, idx) => [xValue, Number.isFinite(yValues[idx]) ? yValues[idx] : null])
									.filter((el) => el[0] !== null);
							}
							return {
								// HACK: should find a more declarative way for next release
								...(!chartSettings?.lineScatter && (collection === 'monthly' || collection === 'daily')
									? scatterSeriesConfig
									: yItemType)({
									...(allowDataSelection && (collection === 'monthly' || collection === 'daily')
										? Y_ITEM_SERIES_TYPES[collection].production.props
										: yItemProps),
									color: Y_ITEM_COLORS[collection][y],
								}),
								id: mainSeriesId,
								values: yValuesWithConversion,
								// XXX: sometimes x values in series can
								// have nulls, currently the only way this
								// can happen is when using filtered MBT.
								// <03-02-22, Max Schulte> //
								text: labelWithUnit(
									`${COLLECTION_SHORT_LABELS[collection]} ${legendLabel}${
										pllEnabled ? '/PLL' : ''
									}${getXLegend(xAxisIsMBT, isMBT)}`,
									unit
								),
							};
						}

						return null;
					})
					.filter((value) => value !== null)
			: [];

		return [...proximitySeries, ...retSeries, ...retMarkerSeries];
	}, [
		allowDataSelection,
		chartSettings?.enablePll,
		chartSettings?.lineScatter,
		chartSettings?.unitResolution,
		customFields,
		dataTable,
		proximitySeries,
		seriesItems,
		wellHeaders?.perf_lateral_length,
		xAxisIsMBT,
	]);

	const {
		inEdit,
		toggleManualSelect,
		isLoading: isSelecting,
	} = useToggleManualSelection({
		forecastId,
		wellId,
	});

	const { toggleButton } = useContext(CardContext);

	// load initial config
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const config: any = scatterConfig({
			crosshairX: true,
			crosshairY: true,
			log: true,
			plotarea: { marginRight: '35rem' },
			showGUIbtn: false,
			tooltip: true,
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

		zingMixed(chartIdRef.current, config, events);
		zingDisableContextMenu(chartIdRef.current);

		return () => {
			zingDestroy(chartIdRef.current);
		};
	}, [getChartData, onHandleSelection]);

	const [scaleX, scaleY, legend] = useDeterministicChartScales({
		chartSettings,
		dataTable,
		seriesItems,
		verticalDateBars,
		xAxisUsingNumericUnits,
	});

	useEffect(() => {
		if (isZingchartZoomed(chartIdRef.current)) {
			zingchart.exec(chartIdRef.current, 'viewall', { update: false });
		}
	}, [scaleX, scaleY]);

	// refresh on scale changes
	useDebouncedEffect(
		() => zingModify(chartIdRef.current, { legend, scaleX, scaleY, series }),
		[legend, scaleX, scaleY, series],
		50
	);

	const toggleAllSeriesOn = useCallbackRef(() => {
		const allIndeces = Array.from(Array(series.length).keys());
		zingchart.exec(chartIdRef.current, 'showplot', {
			plotindex: allIndeces,
		});
	});

	useEffect(() => {
		toggleAllSeriesOn();
	}, [dataSettings, toggleAllSeriesOn]);

	const legendItemClick = useLegendItemClick(chartId);
	useEffect(() => {
		zingchart.bind(chartIdRef.current, 'legend_item_click', legendItemClick);
		return () => {
			zingchart.unbind(chartIdRef.current, 'legend_item_click', legendItemClick);
		};
	}, [legendItemClick]);

	const hasWellCollection = !!wellHeaders?.wells_collection_items;
	const wellCollectionNumber = wellHeaders?.wells_collection_items?.length;

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

					{!disableTitleInfo && shouldDisplayChart && (
						<ChartTitleInfo>
							<ChartTitleText wellId={wellId} wellHeadersDep={wellHeaders} />

							{!disableSubheader && (
								<DeterministicChartSubheader
									dailyProduction={chartData.dailyData}
									forecasts={chartData.forecastData}
									monthlyProduction={chartData.monthlyData}
									wellHeadersDep={wellHeaders}
									wellId={wellId}
								/>
							)}
						</ChartTitleInfo>
					)}
				</ChartTitle>

				<Box display='flex' alignItems='center'>
					{hasWellCollection && <WellsCollectionChip wellCollectionNumber={wellCollectionNumber} />}

					<MenuIconButton size='small' icon={faEllipsisH} popperPlacement='bottom-end'>
						<ForecastToolbarTheme>
							{Boolean(additionalActions?.length) && (
								<>
									{additionalActions.map(({ label, onClick, disabled }) => (
										<ButtonItem key={label} onClick={onClick} label={label} disabled={disabled} />
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

							{isProximityForecastEnabled && enableDownload && (
								<ButtonItem
									onClick={downloadProximityForecast}
									disabled={
										isDownloadingProximityForecast ||
										(!enableProximity && 'Run proximity forecast to enable download')
									}
									label='Download Proximity Forecast'
								/>
							)}

							{wellId && (
								<>
									<ButtonItem onClick={openWellCommentDialog} label='Comments' />

									<ButtonItem
										onClick={() => openWellCommentDialog({ initialTab: TABS.info })}
										label='Well Info'
									/>
								</>
							)}
						</ForecastToolbarTheme>
					</MenuIconButton>

					{enableMaximize && <Box marginLeft='0.5rem'>{toggleButton}</Box>}
				</Box>
			</Box>

			<Box display='flex' flexGrow={1}>
				<ChartAreaContainer>
					<ChartArea id={chartId} hidden={!shouldDisplayChart} />

					<Placeholder
						empty={!shouldDisplayChart}
						text={parentLoading || isLoading ? 'Loading Chart Data...' : 'No Data'}
					/>
				</ChartAreaContainer>

				<VerticalChartActions>
					{shouldDisplayChart && (
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

							{enableParameterDescription && parameterTooltipRender}
						</>
					)}
					{!disableStatusButtons && (
						<>
							<PhaseStatusButtons forecastId={forecastId} wellId={wellId} small />
							<ModularEconomics forecastId={forecastId} wellId={wellId} />
						</>
					)}
					{enableProximity && (
						<SingleWellProximityDialog
							chartData={rawData}
							forecastId={forecastId}
							proximityPhases={proximityPhases}
							wellId={wellId}
						/>
					)}
				</VerticalChartActions>
			</Box>

			{wellCommentDialog}
		</>
	);
};

export default DeterministicGridChart;
