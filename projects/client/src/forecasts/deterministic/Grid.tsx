import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useState } from 'react';

import { useGetter, useLocalStorageState, useMergedState } from '@/components/hooks';
import {
	DEFAULT_DATA_SETTINGS,
	generateConfigBody,
} from '@/forecasts/charts/components/deterministic/grid-chart/shared';
import { VALID_CUMS, VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { getSelectionMinMax, useToggleManualSelection } from '@/forecasts/charts/components/helpers';
import useChartSettings from '@/forecasts/charts/useChartSettings';
import ConfigurationDialog from '@/forecasts/configurations/ConfigurationDialog';
import { useActiveConfiguration } from '@/forecasts/configurations/configurations';
import useGridChartData from '@/forecasts/deterministic/useGridChartData';
import { genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useVisibleDialog } from '@/helpers/dialog';
import { assert } from '@/helpers/utilities';
import usePagination from '@/pagination/usePagination';
import { showWellFilter } from '@/well-filter/well-filter';

import useSeriesItems from '../charts/components/useSeriesItems';
import VerticalDateBarDialog, {
	useVerticalDateBarLocalState,
} from '../charts/components/vertical-date-bar/VerticalDateBarDialog';
import { VerticalDateItem } from '../charts/components/vertical-date-bar/helpers';
import GridAreaRender from './GridAreaRender';
import GridControls from './GridControls';
import { GridChartArea, GridContainer } from './layout';

// remove if added to configurations
const LOCAL_ENABLE_DATE_BAR_KEY = 'enable-date-bar';
const LOCAL_DATE_BAR_VERSION = 'v1';

const Grid = (
	{
		canUpdateForecast,
		comparisonIds,
		comparisonResolutions,
		curTask,
		disableForecastTasks,
		enableQuickEdit,
		filter: filterProps,
		forecast: forecastDoc,
		forecastFormResolution,
		forecastOptions,
		handleQuickEditForecast,
		isComparisonActive,
		isProbabilistic,
		openResetWellForecastDialog,
		reapplyTypeCurve,
		removeSingleWell,
		runForecastStatus,
		runningTask,
		setEnableQuickEdit,
		setIsComparisonActive,
		setIsComparisonDialogVisible,
		setIsForecastFormVisible,
		setSingleWellForecastId,
		setTask,
		singleWellApplyTc,
		singleWellForecastId,
		wellIds,
	},
	ref
) => {
	const [enableDateBarItems, setEnableDateBarItems] = useLocalStorageState<boolean>(
		LOCAL_ENABLE_DATE_BAR_KEY,
		false,
		{ version: LOCAL_DATE_BAR_VERSION }
	);
	const [dateBarItems, setDateBarItems] = useState<Array<VerticalDateItem>>(
		(useVerticalDateBarLocalState()?.items ?? []).filter((item) => item.visible)
	);
	const [forecastSubTypes, setForecastSubTypes] = useState(new Set());
	const [forecastTypes, setForecastTypes] = useState(new Set());
	const [isConfigDialogVisible, setIsConfigDialogVisible] = useState(false);
	const [selectedPhases, setSelectedPhases] = useState(new Set());
	const [statuses, setStatuses] = useState(new Set());
	const [warningStatus, setWarningStatus] = useState(false);

	const configKey = isComparisonActive ? 'comparisonGridChart' : 'deterministicGridChart';
	const { activeConfig, typeConfiguration, setActiveConfig } = useActiveConfiguration(configKey);

	const { chartSettings: graphSettings, setChartSettings: setGraphSettings } = useChartSettings({
		chartSettings: activeConfig?.configuration?.graphSettings,
	});

	const [dataSettings, setDataSettings] = useMergedState({
		...DEFAULT_DATA_SETTINGS,
		...activeConfig?.configuration?.dataSettings,
	});

	const { bucket: editBucket, toggleAll } = useToggleManualSelection({ forecastId: forecastDoc._id });

	const [verticalDateBarDialog, openVerticalDateBarDialog] = useVisibleDialog(VerticalDateBarDialog, {
		apply: (values) => {
			setDateBarItems(values);
		},
	});

	const {
		cumMax,
		cumMin,
		enableDailyOperations,
		enableLegend,
		enableMonthlyOperations,
		enablePll,
		lineScatter,
		numOfCharts,
		unitResolution,
		xAxis,
		xLogScale,
		yearsBefore,
		yearsPast,
		yLogScale,
		yMax,
		yMaxPadding,
		yMin,
	} = graphSettings;

	const { daily, monthly, forecast } = dataSettings;

	const {
		applyWellNameFilter,
		clearFilters: clearGridFilter,
		filterActive,
		loadingWells,
		setPhaseFilterByKey,
		setSorting,
		setWellFilterByKey,
		sorting,
	} = filterProps;

	const chartSettings = useMemo(
		() => ({
			cumMax,
			cumMin,
			enableDailyOperations,
			enableLegend,
			enableMonthlyOperations,
			enablePll,
			lineScatter,
			unitResolution,
			xAxis,
			xLogScale,
			yearsBefore,
			yearsPast,
			yLogScale,
			yMax,
			yMaxPadding,
			yMin,
		}),
		[
			cumMax,
			cumMin,
			enableDailyOperations,
			enableLegend,
			enableMonthlyOperations,
			enablePll,
			lineScatter,
			unitResolution,
			xAxis,
			xLogScale,
			yearsBefore,
			yearsPast,
			yLogScale,
			yMax,
			yMaxPadding,
			yMin,
		]
	);

	const {
		canMove: canMovePage,
		curPage,
		curPageData: curWellIds,
		getPageDataFromCurrent,
		length: dataLength,
		lowerIndex,
		movePage: _movePage,
		pageTotal,
		setPage: _setPage,
		upperIndex,
	} = usePagination(wellIds, numOfCharts);

	const movePage = useCallback(
		(value) => {
			setSingleWellForecastId(null);
			_movePage(value);
		},
		[_movePage, setSingleWellForecastId]
	);

	const setPage = useCallback(
		(value) => {
			setSingleWellForecastId(null);
			_setPage(value);
		},
		[_setPage, setSingleWellForecastId]
	);

	const forecastId = forecastDoc?._id;

	const {
		gridChartData,
		invalidateAll: refreshAll,
		invalidateByWellId: refreshChart,
	} = useGridChartData({
		comparisonIds,
		curWellIds,
		forecastId,
		getPageIds: getPageDataFromCurrent,
		isComparisonActive,
	});

	const getCurWellIds = useGetter(curWellIds);
	const getEnableQuickEdit = useGetter(enableQuickEdit);
	const getForecastResolution = useGetter(forecastFormResolution);

	// the map is only dependent on the number of charts (to identify which chart has made a selection)
	const handleSelectionForecastMap = useMemo(
		() =>
			Array(numOfCharts)
				.fill(0)
				.map((_el, idx) => (chartData) => async (event) => {
					if (chartData && getEnableQuickEdit()) {
						try {
							const wellId = getCurWellIds()[idx];
							const [min, max] = getSelectionMinMax(event);
							const refreshCb = () => refreshChart(wellId);
							if (min === null || max === null) {
								throw new Error('Invalid range selected');
							}

							if (chartSettings.xAxis === 'time') {
								await handleQuickEditForecast?.({
									callback: refreshCb,
									inputDates: [new Date(min), new Date(max)],
									wellId,
								});
							} else {
								const collection = getForecastResolution().includes('daily') ? 'daily' : 'monthly';

								// Throw error here because regular mbt has a
								// tendency to have out of order (not
								// montonically increasing) index.
								if (chartSettings.xAxis === 'mbt') {
									throw new Error('can only run quick forecast when mbt is set to "filtered"');
								}

								// HACK: if using mbt we're going to quick forcast
								// all the base phases mbt's. <03-03-22, Max Schulte> //
								const xAxes =
									'mbt_filtered' === chartSettings.xAxis
										? VALID_PHASES.map((phase) => `mbt_${phase}_filtered`)
										: [chartSettings.xAxis];

								// Find the min and max index of selection of xAxes.
								const [minIndex, maxIndex] = xAxes.reduceRight(
									(acc, xAxis) => {
										assert(xAxis);

										// Find the min and max index of selection on xAxis.
										const compareSeries = chartData.dataTable[collection][xAxis];
										if (compareSeries.length === 0) {
											throw new Error(`No valid ${collection} data between the range`);
										}

										let minIndex = compareSeries?.findIndex((x) => x >= min);
										minIndex = minIndex === -1 ? compareSeries.length - 1 : minIndex;
										let maxIndex = compareSeries?.findIndex((x) => x > max);
										maxIndex = maxIndex === -1 ? compareSeries.length - 1 : maxIndex - 1;

										const [minIndexAcc, maxIndexAcc] = acc;
										return [Math.min(minIndex, minIndexAcc), Math.min(maxIndex, maxIndexAcc)];
									},
									[-1, -1]
								);

								// Quick forecast.
								await handleQuickEditForecast?.({
									wellId,
									callback: refreshCb,
									inputDates: [
										new Date(chartData.dataTable[collection].time[minIndex]),
										new Date(chartData.dataTable[collection].time[maxIndex]),
									],
								});
							}
						} catch (error) {
							warningAlert(error.message);
						}
					}
				}),
		[
			chartSettings.xAxis,
			getCurWellIds,
			getEnableQuickEdit,
			getForecastResolution,
			handleQuickEditForecast,
			numOfCharts,
			refreshChart,
		]
	);

	const { seriesItems, chartSettings: debouncedChartSettings } = useSeriesItems({
		daily,
		monthly,
		forecast,
		xAxis,
		chartSettings,
	});

	const getAdditionalChartActions = useCallback(
		(wellId) =>
			[
				!isProbabilistic && {
					label: 'Single Well Forecast',
					onClick: () => {
						setIsForecastFormVisible(true);
						setSingleWellForecastId(wellId);
					},
					disabled: !canUpdateForecast || disableForecastTasks,
				},
				!isProbabilistic && {
					label: 'Apply Type Curve',
					onClick: async () => {
						const hasRun = await singleWellApplyTc(wellId);
						if (hasRun) {
							refreshChart(wellId);
						}
					},
					disabled: !canUpdateForecast || disableForecastTasks,
				},
				!isProbabilistic && {
					label: 'Re-Apply Type Curve',
					onClick: async () => {
						const shouldRefresh = await reapplyTypeCurve(wellId);
						if (shouldRefresh) {
							refreshChart(wellId);
						}
					},
					disabled: !canUpdateForecast || disableForecastTasks,
				},
				!isProbabilistic && {
					label: 'Clear Well Forecast',
					onClick: async () => {
						setSingleWellForecastId(wellId);
						if (await openResetWellForecastDialog()) {
							refreshChart(wellId);
						}
						setSingleWellForecastId(null);
					},
					disabled: !canUpdateForecast || disableForecastTasks,
				},
				{
					label: 'Remove Well',
					onClick: async () => {
						await removeSingleWell(wellId);
					},
					disabled: !canUpdateForecast || disableForecastTasks,
				},
			].filter(Boolean),
		[
			canUpdateForecast,
			disableForecastTasks,
			isProbabilistic,
			openResetWellForecastDialog,
			reapplyTypeCurve,
			refreshChart,
			removeSingleWell,
			setIsForecastFormVisible,
			setSingleWellForecastId,
			singleWellApplyTc,
		]
	);

	const getHighlight = useCallback((wellId) => singleWellForecastId === wellId, [singleWellForecastId]);

	const generateConfig = useCallback(
		() => generateConfigBody(dataSettings, graphSettings),
		[dataSettings, graphSettings]
	);

	useImperativeHandle(ref, () => ({ generateConfig, refreshCharts: refreshAll }));

	const handleQuickWellFilter = useCallback(
		async (filteredWellIds) => {
			setWellFilterByKey('wellFilter', filteredWellIds);
		},
		[setWellFilterByKey]
	);

	const handleWellFilter = useCallback(async () => {
		const wells = await showWellFilter({
			isFiltered: false,
			type: 'filter',
			wells: wellIds,
		});

		if (wells) {
			setWellFilterByKey('wellFilter', wells);
		}
	}, [setWellFilterByKey, wellIds]);

	const applyPhases = useCallback(
		(newPhases) => {
			setPhaseFilterByKey('phase', [...newPhases]);
			setSelectedPhases(newPhases);
			setSingleWellForecastId(null);
		},
		[setPhaseFilterByKey, setSingleWellForecastId]
	);

	const applyStatuses = useCallback(
		(newStatuses) => {
			setPhaseFilterByKey('status', [...newStatuses]);
			setStatuses(newStatuses);
			setSingleWellForecastId(null);
		},
		[setPhaseFilterByKey, setSingleWellForecastId]
	);

	const applyForecastType = useCallback(
		(newTypeSet) => {
			setPhaseFilterByKey('forecastType', [...newTypeSet]);
			setForecastTypes(newTypeSet);
			setSingleWellForecastId(null);
		},
		[setPhaseFilterByKey, setSingleWellForecastId]
	);

	const applyForecastSubType = useCallback(
		(newTypeSet) => {
			setPhaseFilterByKey('forecastSubType', [...newTypeSet]);
			setForecastSubTypes(newTypeSet);
			setSingleWellForecastId(null);
		},
		[setPhaseFilterByKey, setSingleWellForecastId]
	);

	const applyWarningFilter = useCallback(() => {
		setPhaseFilterByKey('warning', true);
		setWarningStatus(true);
		setSingleWellForecastId(null);
	}, [setPhaseFilterByKey, setSingleWellForecastId]);

	const disableWarningFilter = useCallback(() => {
		setPhaseFilterByKey('warning', false);
		setWarningStatus(false);
		setSingleWellForecastId(null);
	}, [setPhaseFilterByKey, setSingleWellForecastId]);

	const applyEditBucketFilter = useCallback(() => {
		assert(editBucket);
		const editIds = [...editBucket];
		setWellFilterByKey('editBucket', editIds);
		setSingleWellForecastId(null);
	}, [editBucket, setSingleWellForecastId, setWellFilterByKey]);

	// todo: revisit
	const clearFilters = useCallback(() => {
		clearGridFilter();
		setForecastSubTypes(new Set());
		setForecastTypes(new Set());
		setSelectedPhases(new Set());
		setStatuses(new Set());
		setWarningStatus(false);
		setSingleWellForecastId(null);
	}, [clearGridFilter, setSingleWellForecastId]);

	const toggleAllEditBucket = useCallback(
		async (checked) => {
			try {
				await toggleAll({ checked, wellIds });
			} catch (error) {
				genericErrorAlert(error);
			}
		},
		[toggleAll, wellIds]
	);

	// refresh charts from parent
	useLayoutEffect(() => {
		if (runningTask === null) {
			refreshAll();
		}
	}, [refreshAll, runningTask]);

	useEffect(() => {
		assert(xAxis);
		if (VALID_CUMS.includes(xAxis)) {
			setGraphSettings({ cumMax: 'all' });
		}
	}, [setGraphSettings, xAxis]);

	useEffect(() => {
		if (activeConfig?.configuration?.dataSettings) {
			setDataSettings(activeConfig.configuration.dataSettings);
		}
		if (activeConfig?.configuration?.graphSettings) {
			setGraphSettings(activeConfig?.configuration?.graphSettings);
		}
	}, [activeConfig, setDataSettings, setGraphSettings]);

	return (
		<GridContainer>
			<GridControls
				applyEditBucketFilter={applyEditBucketFilter}
				applyForecastSubType={applyForecastSubType}
				applyForecastType={applyForecastType}
				applyPhases={applyPhases}
				applyStatuses={applyStatuses}
				applyWarningFilter={applyWarningFilter}
				applyWellNameFilter={applyWellNameFilter}
				canMovePage={canMovePage}
				clearFilters={clearFilters}
				comparisonIds={comparisonIds}
				curPage={curPage}
				curTask={curTask}
				dataLength={dataLength}
				disableForecastTasks={disableForecastTasks}
				disableWarningFilter={disableWarningFilter}
				editBucket={editBucket}
				enableDateBarItems={enableDateBarItems}
				enableQuickEdit={enableQuickEdit}
				filterActive={filterActive}
				forecastDoc={forecastDoc}
				forecastOptions={forecastOptions}
				forecastSubTypes={forecastSubTypes}
				forecastTypes={forecastTypes}
				graphSettings={graphSettings}
				isComparisonActive={isComparisonActive}
				loadingWells={loadingWells}
				lowerIndex={lowerIndex}
				movePage={movePage}
				onQuickWellFilter={handleQuickWellFilter}
				openVerticalDateBarDialog={openVerticalDateBarDialog}
				pageTotal={pageTotal}
				refreshCharts={refreshAll}
				runForecastStatus={runForecastStatus}
				selectedPhases={selectedPhases}
				setDataSettings={setDataSettings}
				setEnableDateBarItems={setEnableDateBarItems}
				setEnableQuickEdit={setEnableQuickEdit}
				setGraphSettings={setGraphSettings}
				setIsComparisonActive={setIsComparisonActive}
				setIsComparisonDialogVisible={setIsComparisonDialogVisible}
				setIsConfigDialogVisible={setIsConfigDialogVisible}
				setIsForecastFormVisible={setIsForecastFormVisible}
				setPage={setPage}
				setSingleWellForecastId={setSingleWellForecastId}
				setSorting={setSorting}
				setTask={setTask}
				showWellFilter={handleWellFilter}
				sorting={sorting}
				statuses={statuses}
				streamDataSettings={dataSettings}
				toggleAllEditBucket={toggleAllEditBucket}
				unitResolution={unitResolution}
				upperIndex={upperIndex}
				warningStatus={warningStatus}
				wellIds={wellIds}
			/>

			<GridChartArea>
				<GridAreaRender
					chartSettings={debouncedChartSettings}
					comparisonIds={comparisonIds}
					comparisonResolutions={comparisonResolutions}
					curWellIds={curWellIds}
					dataSettings={dataSettings}
					dateBarItems={dateBarItems}
					enableDateBarItems={enableDateBarItems}
					forecastId={forecastId}
					getAdditionalChartActions={getAdditionalChartActions}
					getHighlight={getHighlight}
					gridChartData={gridChartData}
					handleSelectionForecastMap={handleSelectionForecastMap}
					isComparisonActive={isComparisonActive}
					loading={loadingWells}
					refreshChart={refreshChart}
					seriesItems={seriesItems}
				/>
			</GridChartArea>

			<ConfigurationDialog
				activeConfig={activeConfig}
				close={() => setIsConfigDialogVisible(false)}
				configKey={configKey}
				configs={typeConfiguration}
				newConfig={generateConfigBody(dataSettings, graphSettings)}
				selectConfig={setActiveConfig}
				title={`${isComparisonActive ? 'Comparison' : 'Deterministic'} Chart Configurations`}
				visible={isConfigDialogVisible}
				enableSharedConfigs
			/>

			{verticalDateBarDialog}
		</GridContainer>
	);
};

export default forwardRef(Grid);
