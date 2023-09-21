import { faChevronDown, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { noop } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { XLogScaleSwitch } from '@/components';
import { useDerivedState, useMergedState } from '@/components/hooks/index';
import {
	Button,
	ButtonItem,
	Divider,
	IconButton,
	MenuButton,
	RadioSelectSubMenuItem,
	SwitchItem,
} from '@/components/v2';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import ChartHeaderProvider from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import SelectChartHeadersDialog from '@/forecasts/charts/components/chart-header-selection/SelectChartHeadersDialog';
import ForecastComparisonGridChart from '@/forecasts/charts/components/comparison/ForecastComparisonGridChart';
import DeterministicGridChart from '@/forecasts/charts/components/deterministic/grid-chart/DeterministicGridChart';
import { VALID_CUMS } from '@/forecasts/charts/components/graphProperties';
import useChartSettings from '@/forecasts/charts/useChartSettings';
import SelectForecastDialog from '@/forecasts/comparison/SelectForecastDialog';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import {
	ControlButtonContainer,
	ControlsContainer,
	ForecastToolbarTheme,
	ForecastViewButton,
	GridControlLayout,
} from '@/forecasts/deterministic/layout';
import {
	CumMaxAxisControlSelection,
	CumMinAxisControlSelection,
	StreamsMenuBtn,
	XAxisSubMenu,
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
} from '@/forecasts/shared';

import { SingleChartArea, SingleChartContainer } from '../../gridChartLayout';
import useSeriesItems from '../../useSeriesItems';
import { useForecast } from './api';
import { DEFAULT_DATA_SETTINGS, generateConfigBody } from './shared';

const SingleChartComponent = ({ comparisonEnabled, ...rest }) =>
	comparisonEnabled ? <ForecastComparisonGridChart {...rest} /> : <DeterministicGridChart {...rest} />;

const SingleChartControls = (props) => {
	const {
		chartData: parentChartData = null,
		chartId,
		chartSettings: parentChartSettings = {},
		comparisonActive: parentComparisonActive = false,
		comparisonIds: parentComparisonIds,
		comparisonKey = 'manual',
		comparisonResolutions: parentComparisonResolutions,
		disableControls,
		disableStatusButtons,
		enableComparison = false,
		enableComparisonSelection = true,
		enableDownload = false,
		enableMaximize = true,
		enableParameterDescription,
		enableVerticalControls = false,
		enableXMinMax = true,
		enableYMinMax = true,
		forecastId,
		loading: parentLoading,
		onControlsBlur,
		onControlsFocus,
		onForecastConfirm = noop,
		refresh: parentRefresh,
		selectable = true,
		seriesItems: parentSeriesItems,
		setChartSettings: setParentChartSettings,
		setComparisonProps: setParentComparisonProps,
		wellId,
		isModularEconomics = false,
		xAxis: parentXAxis,
	} = props;

	const [chartDialogVisible, setChartDialogVisible] = useState(false);
	const [hasInit, setHasInit] = useState(false);
	const [isComparisonDialogVisible, setIsComparisonDialogVisible] = useState(false);

	const [comparisonProps, setComparisonProps] = useDerivedState(
		{
			enabled: parentComparisonActive,
			ids: parentComparisonIds,
			resolutions: parentComparisonResolutions,
		},
		[parentComparisonActive, parentComparisonIds, parentComparisonResolutions]
	);

	const comparisonActive = comparisonProps?.enabled;

	const {
		activeConfig,
		dialog: configurationDialog,
		showConfigDialog,
	} = useConfigurationDialog({
		key: comparisonActive ? 'comparisonGridChart' : 'deterministicGridChart',
	});

	const { chartSettings, setChartSettings } = useChartSettings({
		chartSettings: parentChartSettings,
		setChartSettings: setParentChartSettings,
	});

	const { xAxis } = chartSettings;
	const register = (key) => ({ value: chartSettings[key], onChange: (value) => setChartSettings({ [key]: value }) });

	const [dataSettings, setDataSettings] = useMergedState({ ...DEFAULT_DATA_SETTINGS });
	const { daily, monthly, forecast } = dataSettings;

	const { seriesItems, chartSettings: debouncedChartSettings } = useSeriesItems({
		daily,
		monthly,
		forecast,
		xAxis,
		chartSettings,
		shouldDebounce: !isModularEconomics,
	});

	const selectConfig = useCallback(
		(inputConfig) => {
			if (inputConfig?.graphSettings) {
				setChartSettings(inputConfig.graphSettings);
			}
			if (inputConfig?.dataSettings) {
				const initDataSettings = { ...inputConfig.dataSettings };
				initDataSettings.monthly = new Set(initDataSettings.monthly);
				initDataSettings.daily = new Set(initDataSettings.daily);
				initDataSettings.forecast = new Set(initDataSettings.forecast);
				setDataSettings(initDataSettings);
			}
			setHasInit(true);
		},
		[setChartSettings, setDataSettings]
	);

	const generateConfig = useCallback(
		() => generateConfigBody(dataSettings, debouncedChartSettings),
		[dataSettings, debouncedChartSettings]
	);

	const confirmForecastSelection = useCallback(
		(ids, resolutions) => {
			onForecastConfirm();
			(setParentComparisonProps ?? setComparisonProps)({ enabled: true, ids, resolutions });
			setIsComparisonDialogVisible(false);
		},
		[onForecastConfirm, setComparisonProps, setParentComparisonProps]
	);

	const toggleComparison = useCallback(
		(comparisonEnabled) => {
			const curIds = comparisonProps.ids ?? [];
			if (!curIds.length && comparisonEnabled) {
				setIsComparisonDialogVisible(true);
			} else {
				(setParentComparisonProps ?? setComparisonProps)({ ...comparisonProps, enabled: comparisonEnabled });
			}
		},
		[comparisonProps, setComparisonProps, setParentComparisonProps]
	);

	const hasParentSeries = !!parentSeriesItems?.length;

	const comparisonRender = useMemo(() => {
		if (enableComparisonSelection && enableComparison) {
			return comparisonActive ? (
				<>
					<ForecastViewButton onClick={() => toggleComparison(!comparisonActive)}>
						Forecast View
					</ForecastViewButton>
					<Button onClick={() => setIsComparisonDialogVisible(true)}>Select Forecast</Button>
				</>
			) : (
				<Button onClick={() => toggleComparison(!comparisonActive)}>Compare Forecast</Button>
			);
		}

		return null;
	}, [comparisonActive, enableComparison, enableComparisonSelection, toggleComparison]);

	const forecastDocumentQuery = useForecast(forecastId);
	// comparison init
	useEffect(() => {
		const initComparisons = async () => {
			const initForecast = forecastDocumentQuery.data;
			const manualComparisonProps = initForecast?.comparisonIds?.[comparisonKey] ?? {};
			const { ids: initComparisonIds = null, resolutions: initResolutions = null } = manualComparisonProps;
			setComparisonProps({ ids: initComparisonIds, resolutions: initResolutions });
		};

		if (enableComparison && !parentComparisonIds && forecastDocumentQuery.isSuccess) {
			initComparisons();
		}
	}, [
		comparisonKey,
		enableComparison,
		forecastDocumentQuery.data,
		forecastDocumentQuery.isSuccess,
		forecastId,
		parentComparisonIds,
		setComparisonProps,
	]);

	useEffect(() => {
		if (activeConfig) {
			selectConfig(activeConfig);
		}
	}, [activeConfig, selectConfig]);

	return (
		<>
			<ChartHeaderProvider>
				<SingleChartContainer>
					{!hasParentSeries && !disableControls && (
						<GridControlLayout>
							<ForecastToolbarTheme>
								<ControlsContainer>
									<StreamsMenuBtn
										daily={daily}
										endIcon={faChevronDown}
										forecast={forecast}
										monthly={monthly}
										onChangeDaily={(newSet) => setDataSettings({ daily: newSet })}
										onChangeForecast={(newSet) => setDataSettings({ forecast: newSet })}
										onChangeMonthly={(newSet) => setDataSettings({ monthly: newSet })}
									/>

									<ControlButtonContainer>
										<MenuButton
											label='Chart Options'
											endIcon={faChevronDown}
											className='forecast-toolbar-menu-button'
										>
											<ButtonItem
												label='Select Chart Headers'
												onClick={() => setChartDialogVisible(true)}
											/>

											<Divider />

											{[...VALID_CUMS, 'mbt', 'mbt_filtered'].includes(xAxis) ? (
												<>
													<CumMinAxisControlSelection {...register('cumMin')} />
													<CumMaxAxisControlSelection {...register('cumMax')} />
												</>
											) : (
												<>
													<YearsBeforeAxisControlSelection {...register('yearsBefore')} />
													<YearsPastAxisControlSelection {...register('yearsPast')} />
												</>
											)}

											<YMaxAxisControlSelection {...register('yMax')} />
											<YMinAxisControlSelection {...register('yMin')} />

											<Divider />

											<XAxisSubMenu {...register('xAxis')} />

											<RadioSelectSubMenuItem
												label='Normalize'
												items={[
													{ label: 'None', value: false },
													{ label: 'Perf Lateral Length', value: true },
												]}
												{...register('enablePll')}
											/>

											<Divider />

											<SwitchItem label='Production Line Scatter' {...register('lineScatter')} />

											<SwitchItem label='Y-Axis Log Scale' {...register('yLogScale')} />

											<XLogScaleSwitch xAxis={xAxis} {...register('xLogScale')} />

											<SwitchItem
												label='Enable Monthly Operations'
												{...register('enableMonthlyOperations')}
											/>

											<SwitchItem
												label='Enable Daily Operations'
												{...register('enableDailyOperations')}
											/>

											<SwitchItem label='Legend' {...register('enableLegend')} />

											{comparisonActive && (
												<SwitchItem
													label='Align Fcst Start Dates'
													{...register('enableAlign')}
												/>
											)}
										</MenuButton>
									</ControlButtonContainer>

									{comparisonRender}
								</ControlsContainer>

								{!hasParentSeries && (
									<IconButton
										onClick={() => showConfigDialog(generateConfig())}
										size='small'
										tooltipTitle='Chart Configurations'
									>
										{faUserCog}
									</IconButton>
								)}
							</ForecastToolbarTheme>
						</GridControlLayout>
					)}

					<SingleChartArea>
						<ForecastChartContainer
							chartData={parentChartData}
							chartId={chartId}
							chartSettings={{ ...debouncedChartSettings, xAxis: parentXAxis ?? xAxis }}
							comparisonEnabled={comparisonActive}
							disableStatusButtons={disableStatusButtons}
							disableTitleInfo={hasParentSeries || disableControls}
							enableDownload={enableDownload}
							enableMaximize={enableMaximize}
							enableParameterDescription={enableParameterDescription}
							enableVerticalControls={enableVerticalControls}
							enableXMinMax={enableXMinMax}
							enableYMinMax={enableYMinMax}
							forecastId={forecastId}
							loading={parentLoading || !(hasInit || disableControls)}
							onControlsBlur={onControlsBlur}
							onControlsFocus={onControlsFocus}
							refresh={parentRefresh}
							render={SingleChartComponent}
							selectable={selectable}
							seriesItems={parentSeriesItems ?? seriesItems}
							wellId={wellId}
							{...(comparisonActive && {
								comparisonIds: comparisonProps.ids,
								comparisonResolutions: comparisonProps.resolutions,
								refForecastId: forecastId,
							})}
						/>
					</SingleChartArea>

					<SelectChartHeadersDialog
						onHide={() => setChartDialogVisible(false)}
						visible={chartDialogVisible}
					/>

					{configurationDialog}
				</SingleChartContainer>
			</ChartHeaderProvider>

			{enableComparison && (
				<SelectForecastDialog
					comparisonIds={comparisonProps.ids}
					comparisonKey={comparisonKey}
					comparisonResolutions={comparisonProps.resolutions}
					onClose={() => setIsComparisonDialogVisible(false)}
					onConfirm={confirmForecastSelection}
					refForecastId={forecastId}
					visible={isComparisonDialogVisible}
				/>
			)}
		</>
	);
};

export default SingleChartControls;
