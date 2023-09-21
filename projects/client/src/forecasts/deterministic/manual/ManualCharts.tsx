import produce from 'immer';
import { assign, get, noop, set } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMergedState } from '@/components/hooks';
import { useComparisonWellData, useDeterministicWellData } from '@/forecasts/api';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import ManualForecastTcChart from '@/forecasts/charts/components/ManualForecastTcChart';
import ChartHeaderProvider from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import ForecastComparisonGridChart from '@/forecasts/charts/components/comparison/ForecastComparisonGridChart';
import DeterministicAutoReforecastChart from '@/forecasts/charts/components/deterministic/grid-chart/DeterministicAutoReforecastChart';
import DeterministicGridChart from '@/forecasts/charts/components/deterministic/grid-chart/DeterministicGridChart';
import { DEFAULT_DATA_SETTINGS } from '@/forecasts/charts/components/deterministic/grid-chart/shared';
import DeterministicPhaseChart from '@/forecasts/charts/components/deterministic/phase-chart/DeterministicPhaseChart';
import {
	EXCLUDE_MBT_X_AXIS_ITEMS,
	ListItem,
	RELATIVE_TIME_X_AXIS_ITEM,
	TIME_X_AXIS_ITEM,
	X_AXIS_ITEMS,
	getNumericXAxisItems,
} from '@/forecasts/charts/components/graphProperties';
import { DeterministicPhaseChartContainer } from '@/forecasts/charts/components/gridChartLayout';
import useSeriesItems from '@/forecasts/charts/components/useSeriesItems';
import useChartSettings from '@/forecasts/charts/useChartSettings';
import SelectForecastDialog from '@/forecasts/comparison/SelectForecastDialog';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { Card, CardsLayout } from '@/layouts/CardsLayout';

import ManualChartControls from './ManualChartControls';
import { EditingChartProps, PreviewChartProps } from './ManualChartProps';

const PreviewChart = ({ comparisonActive, forecastId, ...rest }: PreviewChartProps) => {
	const chartRender = (renderProps) =>
		comparisonActive ? (
			<ForecastComparisonGridChart {...renderProps} />
		) : (
			<DeterministicGridChart {...renderProps} />
		);

	return (
		<Card disableHeader noPadding>
			<DeterministicPhaseChartContainer>
				<ForecastChartContainer render={chartRender} {...{ forecastId, refForecastId: forecastId, ...rest }} />
			</DeterministicPhaseChartContainer>
		</Card>
	);
};

const EditingChart = ({ mode = 'auto', ...rest }: EditingChartProps) => {
	const chartRender = (renderProps) => {
		if (mode === 'auto') {
			return <DeterministicAutoReforecastChart {...renderProps} />;
		}
		if (mode === 'manual') {
			return <DeterministicPhaseChart {...renderProps} />;
		}
		if (mode === 'typecurve') {
			return <ManualForecastTcChart {...renderProps} />;
		}
		return <DeterministicGridChart {...renderProps} />;
	};

	return (
		<Card disableHeader noPadding>
			<DeterministicPhaseChartContainer>
				<ForecastChartContainer render={chartRender} {...rest} />
			</DeterministicPhaseChartContainer>
		</Card>
	);
};

const ManualCharts = (props) => {
	const {
		autoProps_,
		autoRef,
		basePhase,
		baseSegments,
		comparisonProps,
		curWell,
		editingChartPhaseType,
		forecastId,
		forecastType,
		manualGridSeries,
		manualProps,
		manualRef,
		mode,
		phase,
		resolution,
		setComparisonProps,
		setOnForm,
		setSpeedState,
		speedState,
		tcPSeries,
		tempAutoChartData,
		proximityOptionsRender,
		proximityDialog,
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
	} = props;

	const comparisonActive = comparisonProps?.enabled;

	const onControlsFocus = useCallback(() => {
		setOnForm(true);
	}, [setOnForm]);

	const onControlsBlur = useCallback(() => {
		setOnForm(false);
	}, [setOnForm]);

	const {
		activeConfig,
		dialog: configurationDialog,
		showConfigDialog,
	} = useConfigurationDialog({
		key: comparisonActive ? 'comparisonGridChart' : 'deterministicGridChart',
		title: 'Preview Chart (Top) Configurations',
		handleOpen: onControlsFocus,
		handleClose: onControlsBlur,
		enableSharedConfigs: true,
	});

	const [isComparisonDialogVisible, setIsComparisonDialogVisible] = useState(false);

	const { chartSettings: previewChartSettings, setChartSettings: setPreviewChartSettings } = useChartSettings();
	const { chartSettings: editingChartSettings, setChartSettings: setEditingChartSettings } = useChartSettings();
	const { xAxis: previewXAxis } = previewChartSettings;

	const previewChartXAxisItems: Array<ListItem> = useMemo(
		() => (comparisonActive ? [TIME_X_AXIS_ITEM, RELATIVE_TIME_X_AXIS_ITEM] : X_AXIS_ITEMS),
		[comparisonActive]
	);
	// const previewChartXAxisItems: Array<ListItem> = (comparisonActive ? [TIME_X_AXIS_ITEM, RELATIVE_TIME_X_AXIS_ITEM] : X_AXIS_ITEMS);

	const editingChartXAxisItems: Array<ListItem> = useMemo(() => {
		if (mode === 'typecurve') {
			return [TIME_X_AXIS_ITEM];
		}

		if (mode === 'manual') {
			return [
				TIME_X_AXIS_ITEM,
				RELATIVE_TIME_X_AXIS_ITEM,
				...getNumericXAxisItems(editingChartPhaseType === 'ratio' ? [phase, basePhase] : [phase]),
			];
		}

		return EXCLUDE_MBT_X_AXIS_ITEMS;
	}, [mode, editingChartPhaseType, basePhase, phase]);

	const [dataSettings, setDataSettings] = useMergedState({ ...DEFAULT_DATA_SETTINGS });

	const { daily, monthly, forecast } = dataSettings;

	const { seriesItems: previewSeriesItems } = useSeriesItems({
		daily,
		monthly,
		forecast,
		xAxis: previewXAxis,
	});

	const selectConfig = useCallback(
		(inputConfig) => {
			if (inputConfig?.graphSettings) {
				setPreviewChartSettings(inputConfig.graphSettings);
			}
			if (inputConfig?.dataSettings) {
				const initDataSettings = { ...inputConfig.dataSettings };
				initDataSettings.monthly = new Set(initDataSettings.monthly);
				initDataSettings.daily = new Set(initDataSettings.daily);
				initDataSettings.forecast = new Set(initDataSettings.forecast);
				setDataSettings(initDataSettings);
			}
		},
		[setPreviewChartSettings, setDataSettings]
	);

	const { query: deterministicDataQuery } = useDeterministicWellData({ forecastId, wellId: curWell });
	const { data: deterministicWellData, isFetching: isFetchingDeterministicData } = deterministicDataQuery;

	const { query: comparisonDataQuery } = useComparisonWellData({
		comparisonIds: comparisonProps.ids,
		forecastId,
		wellId: curWell,
		options: {
			enabled: !!comparisonProps?.ids?.length,
		},
	});

	const { data: comparisonWellData, isFetching: isFetchingComparisonData } = comparisonDataQuery;
	const manualDeterministicData = useMemo(() => {
		if (mode === 'manual') {
			const setTempData = (basePath, data) => {
				// set forecastType
				set(data, `${basePath}.forecastType`, forecastType);

				// set series
				const seriesKey = forecastType === 'rate' ? `${basePath}.P_dict` : `${basePath}.ratio.segments`;

				const thisSeries =
					forecastType === 'rate' ? { best: { segments: manualGridSeries } } : manualGridSeries;

				set(data, seriesKey, thisSeries);

				// set resolution
				set(data, `${basePath}.data_freq`, resolution);

				if (forecastType === 'ratio') {
					// set base phase
					set(data, `${basePath}.ratio.basePhase`, basePhase);
					set(data, `${basePath}.ratio.x`, 'time');
				}
			};

			if (comparisonActive && !isFetchingComparisonData && comparisonWellData) {
				return produce(comparisonWellData, (data) => {
					const basePath = `forecast.reference.data.${phase}`;
					setTempData(basePath, data);
				});
			}

			if (!isFetchingDeterministicData && deterministicWellData) {
				return produce(deterministicWellData, (data) => {
					const basePath = `forecast.${phase}`;
					setTempData(basePath, data);
				});
			}
		}

		return null;
	}, [
		basePhase,
		comparisonActive,
		comparisonWellData,
		deterministicWellData,
		forecastType,
		isFetchingComparisonData,
		isFetchingDeterministicData,
		manualGridSeries,
		mode,
		phase,
		resolution,
	]);

	const autoChartDeterministicData = useMemo(() => {
		if (mode === 'auto' && tempAutoChartData) {
			if (comparisonActive && !isFetchingComparisonData && comparisonWellData) {
				return produce(comparisonWellData, (data) => {
					const compData = get(data, `forecast.reference.data.${phase}`);
					assign(compData, tempAutoChartData?.forecast?.[phase]);
				});
			}

			return tempAutoChartData;
		}

		return null;
	}, [comparisonActive, comparisonWellData, isFetchingComparisonData, mode, phase, tempAutoChartData]);

	const autoProps = useMemo(
		() => ({
			...autoProps_,
			setDateSelection: (...args) => autoRef.current?.setDateSelection?.(...args),
			setValidIdx: (...args) => autoRef.current?.setValidIdx?.(...args),
		}),
		[autoProps_, autoRef]
	);

	const sharedProps = useMemo(
		() => ({
			enableVerticalControls: true,
			enableXMinMax: true,
			enableYMinMax: true,
			forecastId,
			forecastType,
			resolution,
			maxControlsHeight: '12.5rem',
			phase,
			selectable: false,
			wellId: curWell,
		}),
		[curWell, forecastId, forecastType, phase, resolution]
	);

	const previewChartProps = useMemo(() => {
		return {
			chartId: 'manual-preview-chart',
			chartSettings: previewChartSettings,
			comparisonActive,
			comparisonIds: comparisonProps.ids,
			comparisonResolutions: comparisonProps.resolutions,
			enableCard: true,
			enableComparison: true,
			enableDownload: true,
			seriesItems: previewSeriesItems,
			setComparisonProps,
		};
	}, [
		comparisonActive,
		comparisonProps.ids,
		comparisonProps.resolutions,
		previewChartSettings,
		previewSeriesItems,
		setComparisonProps,
	]);

	const editingChartProps = useMemo(() => {
		return {
			chartSettings: editingChartSettings,
			mode,
			setChartSettings: setEditingChartSettings,
			editingChartPhaseType,
			proximityActive,
			proximityQuery,
			proximityWellSelection,
			proximityBgNormalization,
			proximitySeriesSelections,
		};
	}, [
		editingChartSettings,
		mode,
		setEditingChartSettings,
		editingChartPhaseType,
		proximityActive,
		proximityQuery,
		proximityWellSelection,
		proximityBgNormalization,
		proximitySeriesSelections,
	]);

	const previewChartRender = useMemo(() => {
		if (mode === 'auto') {
			return (
				<PreviewChart
					{...sharedProps}
					{...previewChartProps}
					autoProps={autoProps}
					chartData={autoChartDeterministicData}
				/>
			);
		}

		if (mode === 'manual') {
			return (
				<PreviewChart
					{...sharedProps}
					{...previewChartProps}
					chartData={manualDeterministicData}
					loading={manualProps.loading}
					manualSetOnForm={manualRef?.current?.manualSetOnForm ?? noop}
					onControlsBlur={onControlsBlur}
					onControlsFocus={onControlsFocus}
				/>
			);
		}

		if (mode === 'typecurve') {
			return <PreviewChart {...sharedProps} {...previewChartProps} />;
		}

		return null;
	}, [
		autoChartDeterministicData,
		autoProps,
		manualDeterministicData,
		manualProps.loading,
		manualRef,
		mode,
		onControlsBlur,
		onControlsFocus,
		previewChartProps,
		sharedProps,
	]);

	const editingChartRender = useMemo(() => {
		if (mode === 'auto') {
			return (
				<EditingChart
					{...sharedProps}
					{...editingChartProps}
					allowDataSelection
					allowDateSelection
					autoProps={autoProps}
					chartData={tempAutoChartData}
					enableReforecast
					seriesItems={(autoProps.seriesItems ?? []).map((series) => ({
						...series,
						x: editingChartSettings.xAxis,
					}))}
				/>
			);
		}

		if (mode === 'manual') {
			return (
				<EditingChart
					{...sharedProps}
					{...editingChartProps}
					basePhase={basePhase}
					baseSeries={baseSegments}
					forecastType={forecastType}
					loading={manualProps.loading}
					onControlsBlur={onControlsBlur}
					onControlsFocus={onControlsFocus}
					wellData={deterministicWellData}
				/>
			);
		}

		if (mode === 'typecurve') {
			return (
				<EditingChart
					{...sharedProps}
					{...editingChartProps}
					production={deterministicWellData?.[resolution]}
					pSeries={tcPSeries}
					type='deterministic'
					typeProps={{ wellData: deterministicWellData }}
				/>
			);
		}

		return null;
	}, [
		autoProps,
		basePhase,
		baseSegments,
		deterministicWellData,
		editingChartProps,
		editingChartSettings.xAxis,
		forecastType,
		manualProps.loading,
		mode,
		onControlsBlur,
		onControlsFocus,
		resolution,
		sharedProps,
		tcPSeries,
		tempAutoChartData,
	]);

	const toggleComparison = useCallback(
		(comparisonEnabled: boolean) => {
			const curIds = comparisonProps.ids ?? [];
			if (!curIds.length && comparisonEnabled) {
				setIsComparisonDialogVisible(true);
			} else {
				setComparisonProps({ ...comparisonProps, enabled: comparisonEnabled });
			}
		},
		[comparisonProps, setComparisonProps]
	);

	const confirmForecastSelection = useCallback(
		(ids, resolutions) => {
			setComparisonProps({ enabled: true, ids, resolutions });
			setIsComparisonDialogVisible(false);
		},
		[setComparisonProps]
	);

	useEffect(() => {
		if (activeConfig) {
			selectConfig(activeConfig);
		}
	}, [activeConfig, selectConfig]);

	// update xAxis based on options
	useEffect(() => {
		if (
			previewChartSettings?.xAxis &&
			!previewChartXAxisItems.map((v) => v.value).includes(previewChartSettings.xAxis)
		) {
			setPreviewChartSettings({ xAxis: previewChartXAxisItems[0].value });
		}
		if (
			editingChartSettings?.xAxis &&
			!editingChartXAxisItems.map((v) => v.value).includes(editingChartSettings.xAxis)
		) {
			setEditingChartSettings({ xAxis: editingChartXAxisItems[0].value });
		}
	}, [
		comparisonActive,
		editingChartSettings.xAxis,
		editingChartXAxisItems,
		previewChartSettings.xAxis,
		previewChartXAxisItems,
		setEditingChartSettings,
		setPreviewChartSettings,
	]);

	return (
		<ChartHeaderProvider>
			<ManualChartControls
				comparisonProps={comparisonProps}
				dataSettings={dataSettings}
				editingChartSettings={editingChartSettings}
				editingChartXAxisItems={editingChartXAxisItems}
				mode={mode}
				onMenuClose={onControlsBlur}
				onMenuOpen={onControlsFocus}
				previewChartSettings={previewChartSettings}
				previewChartXAxisItems={previewChartXAxisItems}
				proximityOptionsRender={proximityOptionsRender}
				setDataSettings={setDataSettings}
				setEditingChartSettings={setEditingChartSettings}
				setIsComparisonDialogVisible={setIsComparisonDialogVisible}
				setPreviewChartSettings={setPreviewChartSettings}
				setSpeedState={setSpeedState}
				showConfigDialog={showConfigDialog}
				speedState={speedState}
				toggleComparison={toggleComparison}
			/>

			<CardsLayout count={2} inverted>
				{previewChartRender}
				{editingChartRender}
			</CardsLayout>

			{configurationDialog}
			{proximityDialog}

			<SelectForecastDialog
				comparisonIds={comparisonProps.ids}
				comparisonKey='manual'
				comparisonResolutions={comparisonProps.resolutions}
				onClose={() => setIsComparisonDialogVisible(false)}
				onConfirm={confirmForecastSelection}
				refForecastId={forecastId}
				visible={isComparisonDialogVisible}
			/>
		</ChartHeaderProvider>
	);
};

export default ManualCharts;
