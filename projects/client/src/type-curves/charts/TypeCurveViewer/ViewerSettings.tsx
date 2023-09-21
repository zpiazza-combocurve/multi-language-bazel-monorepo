import { faCog } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { useCallbackRef, useDerivedState, useGetter } from '@/components/hooks';
import { AutocompleteItem, Divider, MenuIconButton, SubMenuItem, SwitchItem } from '@/components/v2';
import useChartSettings from '@/forecasts/charts/useChartSettings';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { warningAlert } from '@/helpers/alerts';
import { useDebounce, useDebouncedEffect } from '@/helpers/debounce';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';
import { getAbbreviatedHeaderLabel } from '@/type-curves/shared/useHeaders';

import { useC4ChartState } from '../C4Chart';
import { useCrossPlotChartState } from '../CrossPlotChart';
import { useFitCumChartState } from '../FitCumChart-v2';
import { CATEGORICAL_HEADERS, DATE_HEADERS, HEADERS } from '../HeaderChart';
import { useProbitChartState } from '../ProbitChart';
import { useRateVsCumChartState } from '../RateVsCumChart';
import {
	COLOR_BY_CHART_TYPES,
	ChartViewerType,
	EXCLUDE_SETTINGS_CHART_TYPES,
	NormalizationViewerOptions,
	ViewerOptions,
	ViewerType,
	chartViewerTypes,
	normalizationChartViewerTypes,
} from '../graphProperties';

const MAX_HEADER_SERIES = 250;

const useViewerSettings = ({
	activeConfig,
	alignAdjustedFitSeries,
	manualHasSaved,
	phase,
	resolution,
	setConfig,
	setPhase,
	uniqueHeaderValueCounts,
	viewerOption: parentViewerOption = 'c4',
	viewerType,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfig?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	alignAdjustedFitSeries?: any;
	manualHasSaved: boolean;
	phase: Phase;
	resolution: FitResolution;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setConfig?: (value: any) => void;
	setPhase: Dispatch<SetStateAction<Phase>>;
	uniqueHeaderValueCounts: Record<string, Record<string, number>>;
	viewerOption: ViewerOptions | NormalizationViewerOptions;
	viewerType: ViewerType;
}) => {
	const chartViewerType = viewerType === 'default' ? chartViewerTypes : normalizationChartViewerTypes;

	const [activeChartSeries, setActiveChartSeries] = useState<Set<string>>(new Set());
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [colorBy, _setColorBy] = useState<any>(null);

	const getCurColorBy = useGetter(colorBy);

	const setColorBy = useCallbackRef((value) => {
		const phaseHeaderCounts = uniqueHeaderValueCounts[phase];
		if (phaseHeaderCounts?.[value] && phaseHeaderCounts[value] > MAX_HEADER_SERIES) {
			warningAlert(`Selected header has over ${MAX_HEADER_SERIES} unique values`);
			return;
		}

		_setColorBy(value);
	});

	const [viewerOption, _setViewerOption] = useDerivedState<ViewerOptions | NormalizationViewerOptions>(
		parentViewerOption
	);

	const { chartSettings, setChartSettings } = useChartSettings({
		chartSettings: chartViewerType[parentViewerOption]?.defaultChartSettings ?? undefined,
	});

	const { c4State, setC4State } = useC4ChartState({
		alignAdjustedFitSeries: alignAdjustedFitSeries?.[phase],
		phase,
		resolution,
		showBackground: !manualHasSaved,
	});
	const { crossPlotState, setCrossPlotState } = useCrossPlotChartState({ phase });
	const { fitCumState, setFitCumState } = useFitCumChartState();
	const { probitState, setProbitState } = useProbitChartState();
	const { rateVsCumState, setRateVsCumState } = useRateVsCumChartState();

	// loads each state when activeConfig changes
	const loadActiveConfig = useCallbackRef(() => {
		const {
			activeChartSeries: configActiveChartSeries,
			c4State: configC4State,
			chartSettings: configChartSettings,
			colorBy: configColorBy,
			crossPlotState: configCrossPlotState,
			fitCumState: configFitCumState,
			phase: configPhase,
			probitState: configProbitState,
			rateVsCumState: configRateVsCumState,
			viewerOption: configViewerOption,
		} = activeConfig ?? {};

		// TODO maybe add a more comprenshive check here
		if (!configViewerOption) {
			return false;
		}

		setPhase(configPhase);
		_setViewerOption(configViewerOption);

		// shared settings
		if (configActiveChartSeries) {
			setActiveChartSeries(new Set(configActiveChartSeries));
		}
		if (configChartSettings) {
			setChartSettings(configChartSettings);
		}
		if (configColorBy) {
			setColorBy(configColorBy);
		}

		// chart-specific settings
		if (configViewerOption === 'c4' && configC4State) {
			setC4State(configC4State);
		}
		if (configViewerOption === 'crossplot' && configCrossPlotState) {
			setCrossPlotState(configCrossPlotState);
		}
		if (configViewerOption === 'fitCum' && configFitCumState) {
			setFitCumState(configFitCumState);
		}
		if (configViewerOption === 'probitState' && configProbitState) {
			setProbitState(configProbitState);
		}
		if (configViewerOption === 'rateVsCum' && configRateVsCumState) {
			setRateVsCumState(configRateVsCumState);
		}

		return true;
	});

	const setViewerOption = useCallback(
		(value: ViewerOptions | NormalizationViewerOptions) => {
			const { viewerOption } = activeConfig ?? {};
			if (viewerOption !== value || !loadActiveConfig()) {
				const { defaultActiveSeries, defaultChartSettings } = chartViewerType[value];
				setActiveChartSeries(new Set(defaultActiveSeries ?? []));
				setChartSettings(defaultChartSettings ?? {});
				_setViewerOption(value);
			}
		},
		[_setViewerOption, activeConfig, chartViewerType, loadActiveConfig, setChartSettings]
	);

	const checkConfigAndDefaults = useDebounce(() => {
		let loadedActiveConfig = false;
		if (viewerType === 'default') {
			loadedActiveConfig = loadActiveConfig();
		}
		if (!loadedActiveConfig) {
			setActiveChartSeries(
				chartViewerType[parentViewerOption].defaultActiveSeries
					? new Set(chartViewerType[parentViewerOption].defaultActiveSeries)
					: new Set()
			);
			setChartSettings(chartViewerType[parentViewerOption]?.defaultChartSettings ?? {});
		}
	}, 250);

	useEffect(() => {
		const phaseHeaderCounts = uniqueHeaderValueCounts[phase];
		if (phaseHeaderCounts?.[getCurColorBy()] && phaseHeaderCounts[getCurColorBy()] > MAX_HEADER_SERIES) {
			warningAlert(`Selected header has over ${MAX_HEADER_SERIES} unique values`);
			_setColorBy(null);
		}
	}, [getCurColorBy, phase, uniqueHeaderValueCounts]);

	useEffect(() => {
		checkConfigAndDefaults();
		return () => {
			checkConfigAndDefaults.cancel();
		};
	}, [activeConfig, checkConfigAndDefaults, viewerType]);

	useEffect(() => {
		if (viewerType === 'default') {
			setConfig?.({
				activeChartSeries: [...activeChartSeries],
				c4State,
				chartSettings,
				colorBy,
				crossPlotState,
				fitCumState,
				phase,
				probitState,
				rateVsCumState,
				viewerOption,
			});
		}
	}, [
		activeChartSeries,
		c4State,
		chartSettings,
		colorBy,
		crossPlotState,
		fitCumState,
		phase,
		probitState,
		rateVsCumState,
		setConfig,
		viewerOption,
		viewerType,
	]);

	return {
		activeChartSeries,
		c4State,
		chartSettings,
		colorBy,
		crossPlotState,
		fitCumState,
		probitState,
		rateVsCumState,
		setActiveChartSeries,
		setC4State,
		setChartSettings,
		setColorBy,
		setCrossPlotState,
		setFitCumState,
		setProbitState,
		setRateVsCumState,
		setViewerOption,
		viewerOption,
	};
};

function ViewerSettings({
	activeChartSeries: parentActiveChartSeries,
	c4State,
	chartSettings,
	colorBy,
	crossPlotState,
	fitCumState,
	probitState,
	rateVsCumState,
	resolution,
	setActiveChartSeries: parentSetActiveChartSeries,
	setC4State,
	setChartSettings,
	setColorBy,
	setCrossPlotState,
	setFitCumState,
	setProbitState,
	setRateVsCumState,
	viewerOption,
	viewerType,
}: ReturnType<typeof useViewerSettings> & {
	resolution: FitResolution;
	viewerOption: ViewerOptions | NormalizationViewerOptions;
	viewerType: ViewerType;
}) {
	const chartViewerType = viewerType === 'default' ? chartViewerTypes : normalizationChartViewerTypes;
	const chartType = chartViewerType[viewerOption] as ChartViewerType;
	const { series } = chartType;

	const [activeChartSeries, setActiveChartSeries] = useDerivedState<Set<string>>(parentActiveChartSeries);

	const toggleAllSeries = useCallback(
		(checked) => {
			setActiveChartSeries(() => {
				const retSeries = new Set(_.keys(series));
				if (!checked) {
					retSeries.clear();
				}

				return retSeries;
			});
		},
		[series, setActiveChartSeries]
	);

	const toggleSeries = useCallback(
		(key, checked) => {
			setActiveChartSeries((curSeries) => {
				const retSeries = new Set(curSeries);
				if (checked) {
					retSeries.add(key);
				} else {
					retSeries.delete(key);
				}
				return retSeries;
			});
		},
		[setActiveChartSeries]
	);

	const getChartTypeStateProps = ({ state, stateKey, setState }) => ({
		onChange: (checked) => setState({ [stateKey]: checked }),
		value: state[stateKey],
	});

	useDebouncedEffect(() => {
		parentSetActiveChartSeries(activeChartSeries);
	}, [activeChartSeries]);

	if (EXCLUDE_SETTINGS_CHART_TYPES.includes(viewerOption)) {
		return null;
	}

	return (
		<MenuIconButton icon={faCog} color='secondary' size='small' list tooltipTitle='Settings'>
			{viewerType === 'default' && !['crossplot', 'probit'].includes(viewerOption) && (
				<SubMenuItem label='Adjust Series' list popperPlacement='right'>
					<SwitchItem
						label='All'
						onChange={toggleAllSeries}
						value={_.keys(series).length === activeChartSeries.size}
					/>

					<Divider />

					{_.map(series, (label, key) => (
						<SwitchItem
							key={key}
							label={label}
							onChange={(checked) => toggleSeries(key, checked)}
							value={activeChartSeries.has(key)}
						/>
					))}
				</SubMenuItem>
			)}

			{viewerOption !== 'probit' && (
				<SwitchItem
					label='Y Axis Log Scale'
					onChange={(checked) => setChartSettings({ yLogScale: checked })}
					value={chartSettings?.yLogScale ?? false}
				/>
			)}

			<SwitchItem
				label='Enable Legend'
				onChange={(checked) => setChartSettings({ enableLegend: checked })}
				value={chartSettings?.enableLegend ?? false}
			/>

			{/* CHART SPECIFIC STATES - consider separating this out as a switch case? */}

			{viewerOption === 'c4' && (
				<>
					<Divider />
					<SwitchItem
						additionalInfo='Enable to only show the background wells in their respective phase color'
						label='Show Background Only'
						{...getChartTypeStateProps({
							state: c4State,
							stateKey: 'showBackgroundOnly',
							setState: setC4State,
						})}
					/>
					<SwitchItem
						label='Show Excluded Wells'
						{...getChartTypeStateProps({
							state: c4State,
							stateKey: 'showExcludedWells',
							setState: setC4State,
						})}
					/>
					<SwitchItem
						label='Show Daily'
						{...getChartTypeStateProps({ state: c4State, stateKey: 'showDaily', setState: setC4State })}
					/>
					<SwitchItem
						label='Show Ratio As Rate'
						{...getChartTypeStateProps({
							state: c4State,
							stateKey: 'c4RatioShowRate',
							setState: setC4State,
						})}
					/>
					{resolution === 'monthly' && (
						<SwitchItem
							label={` Unit Resolution ${c4State.showDailyRate ? '(Daily)' : '(Monthly)'}`}
							{...getChartTypeStateProps({
								state: c4State,
								stateKey: 'showDailyRate',
								setState: setC4State,
							})}
						/>
					)}
				</>
			)}

			{viewerOption === 'crossplot' && (
				<>
					<Divider />
					<AutocompleteItem
						disableClearable
						fullWidth
						getOptionLabel={getAbbreviatedHeaderLabel}
						label='Cross Plot X'
						onChange={(_ev, newValue) =>
							setCrossPlotState((p) => ({ crossplot: { ...p.crossplot, x: newValue } }))
						}
						options={[...HEADERS, ...DATE_HEADERS]}
						value={crossPlotState.crossplot.x}
					/>
					<AutocompleteItem
						disableClearable
						fullWidth
						getOptionLabel={getAbbreviatedHeaderLabel}
						label='Cross Plot Y'
						onChange={(_ev, newValue) =>
							setCrossPlotState((p) => ({ crossplot: { ...p.crossplot, y: newValue } }))
						}
						options={HEADERS}
						value={crossPlotState.crossplot.y}
					/>
					<SwitchItem
						label='Show Excluded Wells'
						{...getChartTypeStateProps({
							state: crossPlotState,
							stateKey: 'showExcludedWells',
							setState: setCrossPlotState,
						})}
					/>
					<SwitchItem
						label="Treat missing value as 0's"
						{...getChartTypeStateProps({
							state: crossPlotState,
							stateKey: 'displayUndefinedAsZero',
							setState: setCrossPlotState,
						})}
					/>
				</>
			)}

			{viewerOption === 'fitCum' && (
				<>
					<Divider />
					<SwitchItem
						additionalInfo='Enable to only show the background wells in their respective phase color'
						label='Show Background Only'
						{...getChartTypeStateProps({
							state: fitCumState,
							stateKey: 'showBackgroundOnly',
							setState: setFitCumState,
						})}
					/>
					<SwitchItem
						label='Show Excluded Wells'
						{...getChartTypeStateProps({
							state: fitCumState,
							stateKey: 'showExcludedWells',
							setState: setFitCumState,
						})}
					/>
					<SwitchItem
						label='Show Daily'
						{...getChartTypeStateProps({
							state: fitCumState,
							stateKey: 'showDaily',
							setState: setFitCumState,
						})}
					/>
					<SwitchItem
						additionalInfo='If enabled, the cumulative volume from the "Wells Average" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Wells Average" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
						label='Align Wells Average with Type Curve Fit Start'
						{...getChartTypeStateProps({
							state: fitCumState,
							stateKey: 'aggregationHonorFit',
							setState: setFitCumState,
						})}
					/>
					<SwitchItem
						additionalInfo='If enabled, the cumulative production of the "Background Wells" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Background Wells" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
						label='Align Background Wells with Type Curve Fit Start '
						{...getChartTypeStateProps({
							state: fitCumState,
							stateKey: 'bgWellsHonorFit',
							setState: setFitCumState,
						})}
					/>
				</>
			)}

			{viewerOption === 'rateVsCum' && (
				<>
					<Divider />
					<SwitchItem
						additionalInfo='Enable to only show the background wells in their respective phase color'
						label='Show Background Only'
						{...getChartTypeStateProps({
							state: rateVsCumState,
							stateKey: 'showBackgroundOnly',
							setState: setRateVsCumState,
						})}
					/>
					<SwitchItem
						label='Show Excluded Wells'
						{...getChartTypeStateProps({
							state: rateVsCumState,
							stateKey: 'showExcludedWells',
							setState: setRateVsCumState,
						})}
					/>
					<SwitchItem
						label='Show Daily'
						{...getChartTypeStateProps({
							state: rateVsCumState,
							stateKey: 'showDaily',
							setState: setRateVsCumState,
						})}
					/>
					<SwitchItem
						additionalInfo='If enabled, the cumulative volume from the "Wells Average" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Wells Average" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
						label='Align Wells Average with Type Curve Fit Start'
						{...getChartTypeStateProps({
							state: rateVsCumState,
							stateKey: 'aggregationHonorFit',
							setState: setRateVsCumState,
						})}
					/>
					<SwitchItem
						additionalInfo='If enabled, the cumulative production of the "Background Wells" will align with the beginning of the cumulative type curve fit. Otherwise, the cumulative production from the "Background Wells" will align with the Rate/Ratio vs Time "Type Curve Fit" Chart.'
						label='Align Background Wells with Type Curve Fit Start '
						{...getChartTypeStateProps({
							state: rateVsCumState,
							stateKey: 'bgWellsHonorFit',
							setState: setRateVsCumState,
						})}
					/>
				</>
			)}

			{viewerOption === 'probit' && (
				<>
					<Divider />
					<SwitchItem
						additionalInfo='When toggled on, the x-th percentile represents data value that you have a x percent chance of not exceeding. In other words, 10 percent of your data is less than or equal to the P10.'
						label='Enable Statistics Convention for Cumulative Probability'
						{...getChartTypeStateProps({
							state: probitState,
							stateKey: 'useStatConvention',
							setState: setProbitState,
						})}
					/>
					<SwitchItem
						label='Enable Probit Fit Statistics Legend'
						{...getChartTypeStateProps({
							state: probitState,
							stateKey: 'displayProbitStats',
							setState: setProbitState,
						})}
					/>
				</>
			)}

			{/* END CHART SPECIFIC STATES */}

			{COLOR_BY_CHART_TYPES.includes(viewerOption) && (
				<>
					<Divider />
					<AutocompleteItem
						getOptionLabel={getAbbreviatedHeaderLabel}
						label='Color By'
						onChange={(_ev, newValue) => setColorBy(newValue)}
						options={CATEGORICAL_HEADERS}
						value={colorBy}
					/>
				</>
			)}
		</MenuIconButton>
	);
}

export default ViewerSettings;
export { useViewerSettings };
