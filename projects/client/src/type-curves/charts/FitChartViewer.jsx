import { faCog, faDownload } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Placeholder } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { Box, Divider, IconButton } from '@/components/v2';
import {
	AutocompleteItem,
	MenuIconButton,
	RadioSelectSubMenuItem,
	SubMenuItem,
	SwitchItem,
} from '@/components/v2/menu';
import Autocomplete from '@/components/v2/misc/Autocomplete';
import { ChartContainer } from '@/forecasts/charts/components/gridChartLayout';
import { ConfigurationContext } from '@/forecasts/configurations/ConfigurationContext';
import { fontSizeSelectItems } from '@/forecasts/shared';
import { intersection } from '@/helpers/sets';
import { CardContext } from '@/layouts/CardsLayout';
import { chooseHeadersIcon } from '@/manage-wells/shared/ChooseHeadersDialog';
import FitParametersTable from '@/type-curves/TypeCurveFit/FitParametersTable';
import { TCSelectField } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/ControlComponents';
import { ToggleMaximizeChart } from '@/type-curves/TypeCurveFit/TypeCurveFitLayout';
import TypeCurveWellTable from '@/type-curves/TypeCurveView/TypeCurveWellTable';
import C4Chart from '@/type-curves/charts/C4Chart';
import CrossPlotChart from '@/type-curves/charts/CrossPlotChart';
import CumChart from '@/type-curves/charts/CumChart';
import EurChart from '@/type-curves/charts/EurChart';
import FitCumChart from '@/type-curves/charts/FitCumChart-v2';
import InitialPeakChart from '@/type-curves/charts/InitialPeakChart';
import SumChart from '@/type-curves/charts/SumChart';
import { FitViewerChartTitle } from '@/type-curves/charts/layout';
import FitTitleActionsContainer from '@/type-curves/shared/FitTitleActions';
import TypeCurveWellsMap from '@/type-curves/shared/TypeCurveWellsMap';
import { getAbbreviatedHeaderLabel } from '@/type-curves/shared/useHeaders';

import { CATEGORICAL_HEADERS, HEADERS } from './HeaderChart';
import ProbitChart from './ProbitChart';
import RateVsCumChart from './RateVsCumChart';
import {
	DEFAULT_AGGREGATION_HONOR,
	DEFAULT_BG_WELLS_HONOR,
	DEFAULT_C4_RATIO_SHOW_RATE,
	DEFAULT_DAILY,
	SHOW_DAILY_KEYS,
	chartViewerTypeMenuItems,
	chartViewerTypes,
	getDefaultCrossPlot,
	proximityChartViewerTypes,
	proximityViewerMenuOptions,
} from './graphProperties';

const FitChartViewer = ({
	chartKey,
	disableConfigurations,
	loading,
	setShowDaily: setParentShowDaily,
	showDaily: parentShowDaily,

	// props that are passed down to the charts
	chartBehaviors,
	chartProps,
	chartSettings,
	eurMap,
	excludedChartKeys,
	extendedCharts,
	fitAlign,
	fitLoaded,
	fitProps,
	fitSeries,
	headersMap,
	paramsTablePhaseFits,
	phase = 'oil',
	selection,
	setChartKey,
	setChartSettings,
	setXAxisLabel,
	setYAxisLabel,
	typeCurveId,
	viewerName,
	wellCount,
	wellIds,
	xAxisLabel,
}) => {
	const [activeChartSeries, setActiveChartSeries] = useState(new Set());
	const [aggregationHonorFit, setAggregationHonorFit] = useState(DEFAULT_AGGREGATION_HONOR);
	const [bgWellsHonorFit, setBgWellsHonorFit] = useState(DEFAULT_BG_WELLS_HONOR);
	const [c4RatioShowRate, setC4RatioShowRate] = useState(DEFAULT_C4_RATIO_SHOW_RATE);
	const [chartSeries, setChartSeries] = useState({});
	const [crossplot, setCrossplot] = useState(getDefaultCrossPlot(phase));
	const [displayUndefinedAsZero, setDisplayUndefinedAsZero] = useState(false);

	const [useStatConvention, setUseStateConvention] = useState(false);
	const [colorBy, setColorBy] = useState(null);

	const [showDaily, _setShowDaily] = useDerivedState(parentShowDaily ?? DEFAULT_DAILY);

	const setShowDaily = setParentShowDaily ?? _setShowDaily;

	const chartSeriesKeys = useMemo(() => Object.keys(chartSeries || {}), [chartSeries]);

	const { activeConfig: allChartConfig, setToSaveConfiguration } = useContext(ConfigurationContext);
	// this is only used in manual proximity charts
	const location = 'proximity';
	const { basePhase, isProximity = true, proximityProps, phaseType } = fitProps;
	const [displayProbitStats, setDisplayProbitStats] = useState(!isProximity);

	const isDailyChartKey = SHOW_DAILY_KEYS.includes(chartKey);
	const loaded = !!chartSeriesKeys.length;

	const showingAllSeries = useMemo(
		() => activeChartSeries.size === chartSeriesKeys.length,
		[activeChartSeries.size, chartSeriesKeys.length]
	);

	const activeConfig = useMemo(
		() => (disableConfigurations ? null : allChartConfig?.[chartKey]),
		[allChartConfig, chartKey, disableConfigurations]
	);

	const loadActiveConfig = useCallback(() => {
		const { defaultActiveSeries, defaultChartSettings } =
			location === 'proximity' ? proximityChartViewerTypes[chartKey] : chartViewerTypes[chartKey];

		setActiveChartSeries(new Set(activeConfig?.activeChartSeries ?? defaultActiveSeries ?? []));
		setChartSettings(activeConfig?.chartSettings ?? defaultChartSettings ?? {});

		if (chartKey === 'crossplot') {
			setCrossplot(activeConfig?.crossplot ?? getDefaultCrossPlot(phase));
		}

		if (chartKey === 'c4') {
			setC4RatioShowRate(activeConfig?.c4RatioShowRate ?? DEFAULT_C4_RATIO_SHOW_RATE);
		}

		// consider adding these keys to the generalChartProps
		if (['fitCum', 'rateVsCum'].includes(chartKey)) {
			setAggregationHonorFit(activeConfig?.aggregationHonorFit ?? DEFAULT_AGGREGATION_HONOR);
			setBgWellsHonorFit(activeConfig?.bgWellsHonorFit ?? DEFAULT_BG_WELLS_HONOR);
		}

		if (isDailyChartKey) {
			setShowDaily(activeConfig?.showDaily ?? DEFAULT_DAILY);
		}
	}, [
		location,
		chartKey,
		activeConfig?.activeChartSeries,
		activeConfig?.chartSettings,
		activeConfig?.crossplot,
		activeConfig?.c4RatioShowRate,
		activeConfig?.aggregationHonorFit,
		activeConfig?.bgWellsHonorFit,
		activeConfig?.showDaily,
		setChartSettings,
		isDailyChartKey,
		phase,
		setShowDaily,
	]);

	const setConfig = useCallback(() => {
		const newConfig = {
			[chartKey]: {
				activeChartSeries: [...activeChartSeries],
				chartSettings,
			},
		};

		if (chartKey === 'crossplot') {
			newConfig[chartKey].crossplot = crossplot;
		}
		if (chartKey === 'c4') {
			newConfig[chartKey].c4RatioShowRate = c4RatioShowRate;
		}
		if (['fitCum', 'rateVsCum'].includes(chartKey)) {
			newConfig[chartKey].aggregationHonorFit = aggregationHonorFit;
			newConfig[chartKey].bgWellsHonorFit = bgWellsHonorFit;
		}
		if (isDailyChartKey) {
			newConfig[chartKey].showDaily = showDaily;
		}

		setToSaveConfiguration(newConfig);
	}, [
		activeChartSeries,
		aggregationHonorFit,
		bgWellsHonorFit,
		c4RatioShowRate,
		chartKey,
		chartSettings,
		crossplot,
		isDailyChartKey,
		setToSaveConfiguration,
		showDaily,
	]);

	const tableRef = useRef();

	const renderChart = useMemo(() => {
		const sharedProps = {
			...chartProps,
			activeChartSeries,
			aggregationHonorFit,
			bgWellsHonorFit,
			c4RatioShowRate,
			chartId: viewerName,
			chartBehaviors,
			chartSettings,
			colorBy,
			eurMap,
			fitAlign,
			fitLoaded,
			fitSeries,
			headersMap,
			selection,
			setXAxisLabel,
			setYAxisLabel,
			showDaily,
			wellIds,
		};

		const chartKeyMap = {
			cum: <CumChart {...sharedProps} />,
			sum: <SumChart {...sharedProps} />,
			fitCum: <FitCumChart {...sharedProps} />,
			rateVsCum: <RateVsCumChart {...sharedProps} />,
			ip: <InitialPeakChart {...sharedProps} />,
			eur: <EurChart {...sharedProps} proximityProps={proximityProps} />,
			crossplot: (
				<CrossPlotChart
					{...sharedProps}
					typeCurveId={typeCurveId}
					crossplot={crossplot}
					displayUndefinedAsZero={displayUndefinedAsZero}
				/>
			),
			table: (
				<TypeCurveWellTable
					ref={tableRef}
					phase={chartProps.curPhase}
					selection={selection}
					typeCurveId={typeCurveId}
					wellIds={wellIds}
					isProximity={isProximity}
					proximityProps={proximityProps}
					basePhase={basePhase}
					phaseType={phaseType}
				/>
			),
			paramsTable: <FitParametersTable ref={tableRef} phaseFits={paramsTablePhaseFits} />,
			map: (
				<TypeCurveWellsMap
					typeCurveId={typeCurveId}
					phase={chartProps.curPhase}
					wellIds={wellIds}
					selection={selection}
					proximityWell={chartProps?.proximityWell}
					proximityRadius={chartProps?.proximityRadius}
				/>
			),
			c4: <C4Chart {...sharedProps} proximityProps={proximityProps} showDailyRate />,
			probit: (
				<ProbitChart
					{...sharedProps}
					proximityProps={proximityProps}
					useStatConvention={useStatConvention}
					displayProbitStats={displayProbitStats}
					xAxisLabel={xAxisLabel}
				/>
			),
		};

		extendedCharts?.forEach(({ key, component: Component }) => {
			chartKeyMap[key] = <Component {...sharedProps} isProximity={isProximity} proximityProps={proximityProps} />;
		});

		return chartKeyMap[chartKey] ?? null;
	}, [
		chartBehaviors,
		chartProps,
		activeChartSeries,
		aggregationHonorFit,
		bgWellsHonorFit,
		c4RatioShowRate,
		colorBy,
		displayProbitStats,
		eurMap,
		viewerName,
		chartSettings,
		fitAlign,
		fitLoaded,
		fitSeries,
		headersMap,
		selection,
		setXAxisLabel,
		setYAxisLabel,
		showDaily,
		wellIds,
		proximityProps,
		crossplot,
		displayUndefinedAsZero,
		typeCurveId,
		isProximity,
		basePhase,
		phaseType,
		paramsTablePhaseFits,
		useStatConvention,
		extendedCharts,
		chartKey,
		xAxisLabel,
	]);

	const toggleAllSeries = useCallback(
		(checked) => {
			setActiveChartSeries(checked ? new Set(chartSeriesKeys) : new Set());
		},
		[chartSeriesKeys]
	);

	const toggleSeries = useCallback(
		(checked, seriesKey) => {
			setActiveChartSeries((prevSet) => {
				let newSet = new Set(prevSet);
				if (checked) {
					newSet.add(seriesKey);
					newSet = intersection(new Set(chartSeriesKeys), newSet);
				} else {
					newSet.delete(seriesKey);
				}

				return newSet;
			});
		},
		[chartSeriesKeys]
	);

	const toggleUndefinedAsZero = (checked) => {
		// trigger chart refresh
		setChartSettings({ enableLegend: chartSettings.enableLegend });
		setDisplayUndefinedAsZero(checked);
	};

	// sets the available series for the submenu; loads the active config
	useEffect(() => {
		const { series } =
			location === 'proximity'
				? proximityChartViewerTypes?.[chartKey] ?? { series: {} }
				: chartViewerTypes[chartKey];
		setChartSeries(series ?? {});
	}, [chartKey, location]);

	// loads active config when the active configuration changes
	useEffect(() => {
		loadActiveConfig();
	}, [activeConfig, loadActiveConfig]);

	// save the new config when certain props change
	useEffect(() => {
		if (!disableConfigurations) {
			setConfig();
		}
	}, [disableConfigurations, setConfig]);

	// scaleY/scaleX log values prevent large empty areas in chart when using TVD
	useEffect(() => {
		if (chartKey === 'crossplot') {
			const { x, y } = crossplot;
			setChartSeries({
				xLogScale: x === 'true_vertical_depth',
				yLogScale: y === 'true_vertical_depth',
			});
		}
	}, [chartKey, crossplot]);

	const { isMaximized, toggleButton } = useContext(CardContext);

	const chartSelectOptions = useMemo(() => {
		// even for extendedCharts, select options must come from proximityViewerMenuOptions
		let options = _.cloneDeep(location === 'proximity' ? proximityViewerMenuOptions : chartViewerTypeMenuItems);
		if (excludedChartKeys) {
			options = options.filter(({ value }) => !excludedChartKeys.includes(value));
		}

		return options;
	}, [excludedChartKeys, location]);

	// 'linearFit' is hardcoded for proximity to use normalization charts
	if (['table', 'map', 'paramsTable', 'linearFit'].includes(chartKey)) {
		let leftOptions = <div />;
		if (['table', 'paramsTable'].includes(chartKey)) {
			leftOptions = (
				<IconButton
					tooltipTitle='Select Headers'
					onClick={() => tableRef.current && tableRef.current?.selectHeaders()}
					size='small'
				>
					{chooseHeadersIcon}
				</IconButton>
			);
		}
		if (['linearFit'].includes(chartKey)) {
			leftOptions = (
				<MenuIconButton icon={faCog} color='secondary' size='small' list tooltipTitle='Settings'>
					<Autocomplete
						css={`
							width: calc(100% - 1rem);
							margin: 0 0.5rem;
						`}
						value={colorBy}
						label='Color By'
						options={CATEGORICAL_HEADERS}
						onChange={(ev, newValue) => setColorBy(newValue)}
						getOptionLabel={getAbbreviatedHeaderLabel}
					/>
				</MenuIconButton>
			);
		}

		return (
			<>
				<FitViewerChartTitle>
					{leftOptions}
					<TCSelectField
						css={{ flexBasis: '60%' }}
						fullWidth
						menuItems={chartSelectOptions}
						onChange={(ev) => setChartKey(ev.target.value)}
						value={chartKey}
					/>
					<FitTitleActionsContainer>
						{chartKey === 'table' && (
							<IconButton
								tooltipTitle='Download Table'
								onClick={() => tableRef.current && tableRef.current?.downloadTable()}
							>
								{faDownload}
							</IconButton>
						)}

						<span className='well-count'>{`Count: ${wellCount}`}</span>

						<ToggleMaximizeChart isMaximized={isMaximized} toggleButton={toggleButton} />
					</FitTitleActionsContainer>
				</FitViewerChartTitle>

				<ChartContainer css='height: 100%; width:100%; paddingTop:0.5rem'>{renderChart}</ChartContainer>
			</>
		);
	}

	return (
		<>
			<FitViewerChartTitle>
				<MenuIconButton icon={faCog} color='secondary' size='small' list tooltipTitle='Settings'>
					{!['crossplot', 'probit'].includes(chartKey) && (
						<SubMenuItem label='Adjust Series' list popperPlacement='right'>
							<SwitchItem label='All' onChange={toggleAllSeries} value={showingAllSeries} />

							<Divider />

							{loaded &&
								chartSeriesKeys.map((sKey) => (
									<SwitchItem
										key={`${viewerName}-${sKey}-series-switch`}
										label={chartSeries[sKey]}
										onChange={(checked) => toggleSeries(checked, sKey)}
										value={activeChartSeries.has(sKey)}
									/>
								))}
						</SubMenuItem>
					)}
					{/* hard code x vs y for cross plot */}
					{chartKey === 'crossplot' && (
						<>
							<AutocompleteItem
								options={HEADERS}
								getOptionLabel={getAbbreviatedHeaderLabel}
								label='Cross Plot X'
								disableClearable
								fullWidth
								onChange={(_ev, newValue) => setCrossplot((p) => ({ ...p, x: newValue }))}
								value={crossplot.x}
							/>
							<AutocompleteItem
								options={HEADERS}
								getOptionLabel={getAbbreviatedHeaderLabel}
								label='Cross Plot Y'
								disableClearable
								fullWidth
								onChange={(_ev, newValue) => setCrossplot((p) => ({ ...p, y: newValue }))}
								value={crossplot.y}
							/>
						</>
					)}
					<RadioSelectSubMenuItem
						label='Font Size Scale'
						items={fontSizeSelectItems}
						value={chartSettings.fontSizeScale}
						onChange={(value) => setChartSettings({ fontSizeScale: value })}
						popperPlacement='right'
					/>
					<Divider />
					{/* hard-code show daily option for fitCum */}
					{isDailyChartKey && (
						<SwitchItem
							label='Show Daily'
							onChange={(checked) => setShowDaily(checked)}
							value={showDaily}
						/>
					)}
					{chartKey !== 'probit' && (
						<SwitchItem
							label='Y Axis Log Scale'
							onChange={(checked) => setChartSettings({ yLogScale: checked })}
							value={chartSettings.yLogScale}
						/>
					)}
					<SwitchItem
						label='Enable Legend'
						onChange={(checked) => setChartSettings({ enableLegend: checked })}
						value={chartSettings.enableLegend}
					/>
					{/* hard code honor fit or not for cumfit */}
					{['fitCum', 'rateVsCum'].includes(chartKey) && (
						<>
							<SwitchItem
								additionalInfo='If enabled, the cumulative volume from the "Wells Average" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Wells Average" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
								label='Align Wells Average with Type Curve Fit Start'
								onChange={(checked) => setAggregationHonorFit(checked)}
								value={aggregationHonorFit}
							/>

							<SwitchItem
								additionalInfo='If enabled, the cumulative production of the "Background Wells" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Background Wells" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
								label='Align Background Wells with Type Curve Fit Start '
								onChange={(checked) => setBgWellsHonorFit(checked)}
								value={bgWellsHonorFit}
							/>
						</>
					)}
					{chartKey === 'c4' && chartProps?.phaseType === 'ratio' && (
						<SwitchItem
							label='Show Rate'
							onChange={(checked) => setC4RatioShowRate(checked)}
							value={c4RatioShowRate}
						/>
					)}
					{chartKey === 'crossplot' && (
						<SwitchItem
							label={`Treat missing value as 0's`}
							onChange={toggleUndefinedAsZero}
							value={displayUndefinedAsZero}
						/>
					)}
					{['probit'].includes(chartKey) && (
						<>
							<SwitchItem
								label='Enable Statistics Convention for Cumulative Probability'
								onChange={setUseStateConvention}
								additionalInfo='When toggled on, the x-th percentile represents data value that you have a x percent chance of not exceeding. In other words, 10 percent of your data is less than or equal to the P10.'
								value={useStatConvention}
							/>
							<SwitchItem
								label='Enable Probit Fit Statistics Legend'
								onChange={setDisplayProbitStats}
								value={displayProbitStats}
							/>
						</>
					)}
					{['fitCum', 'rateVsCum', 'c4', 'eur', 'ip', 'crossplot', 'probit'].includes(chartKey) && (
						<Autocomplete
							css={`
								width: calc(100% - 1rem);
								margin: 0 0.5rem;
							`}
							value={colorBy}
							label='Color By'
							options={CATEGORICAL_HEADERS}
							onChange={(ev, newValue) => setColorBy(newValue)}
							getOptionLabel={getAbbreviatedHeaderLabel}
						/>
					)}
				</MenuIconButton>

				<Box flexBasis='60%'>
					<TCSelectField
						fullWidth
						menuItems={chartSelectOptions}
						onChange={(ev) => setChartKey(ev.target.value)}
						value={chartKey}
					/>
				</Box>

				<FitTitleActionsContainer>
					<span className='well-count'>{`Count: ${wellCount}`}</span>

					<ToggleMaximizeChart isMaximized={isMaximized} toggleButton={toggleButton} />
				</FitTitleActionsContainer>
			</FitViewerChartTitle>

			<Placeholder loading={loading} loadingText='Loading...'>
				<ChartContainer>{renderChart}</ChartContainer>
			</Placeholder>
		</>
	);
};

export default FitChartViewer;
