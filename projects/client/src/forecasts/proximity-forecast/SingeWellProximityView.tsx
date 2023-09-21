import { faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { useTheme } from '@material-ui/core';
import { noop } from 'lodash';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { WithToolbar } from '@/components';
import { useDerivedState, useMergedState } from '@/components/hooks';
import { Card, CheckboxSelectItems, Divider, IconButton, MenuButton, SwitchItem } from '@/components/v2';
import {
	useProximityForecastRawBGData,
	useProximityForecastWellData,
	useProximityWellList,
	useWellHeaderValues,
} from '@/forecasts/api';
import { useProximitySeries } from '@/forecasts/charts/components/deterministic/grid-chart/DeterministicAutoReforecastChart';
import { VALID_CUMS, Y_ITEM_COLORS } from '@/forecasts/charts/components/graphProperties';
import { ControlButtonContainer, ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import {
	CumMaxAxisControlSelection,
	CumMinAxisControlSelection,
	// XAxisSubMenu,
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
} from '@/forecasts/shared';
import { Col, Row } from '@/forecasts/shared/StreamsMenuBtn';
import { useWellsHeadersMap } from '@/manage-wells/shared/utils';

import ForecastChartContainer from '../charts/components/ForecastChartContainer';
import DeterministicGridChart from '../charts/components/deterministic/grid-chart/DeterministicGridChart';
import useSeriesItems from '../charts/components/useSeriesItems';
import useChartSettings from '../charts/useChartSettings';
import ProximityWellMap from './ProximityWellMap';

// TODO: proximity series are keyed in the opposite order that the FE expects; consider adjusting API to produce this output
const convertNormalization = (proximityDatasNormalization) =>
	proximityDatasNormalization?.normalization_multiplyers?.reduce(
		(acc, mults) => {
			acc.eur.push(mults.eur);
			acc.qPeak.push(mults.qPeak);
			return acc;
		},
		{ eur: [], qPeak: [] }
	);

export const useProximityBGSeries = ({ chartSettings, wellId, forecastId, proximityPhases, proximitySeries }) => {
	const wellHeaderQuery = useWellHeaderValues(wellId, 'all');
	// TODO: reduce # of requests; consider combining all phases into one request
	const {
		query: { data: oilProximityData, isStale: oilDataStale },
	} = useProximityForecastWellData({
		wellId,
		forecastId,
		phase: 'oil',
		enabled: !!forecastId && proximityPhases.includes('oil'),
	});

	const {
		query: { data: gasProximityData, isStale: gasDatatale },
	} = useProximityForecastWellData({
		wellId,
		forecastId,
		phase: 'gas',
		enabled: !!forecastId && proximityPhases.includes('gas'),
	});

	const {
		query: { data: waterProximityData, isStale: waterDataStale },
	} = useProximityForecastWellData({
		wellId,
		forecastId,
		phase: 'water',
		enabled: !!forecastId && proximityPhases.includes('water'),
	});

	const proximityBgPhaseNormalization = useMemo(
		() => ({
			oil: convertNormalization(oilProximityData),
			gas: convertNormalization(gasProximityData),
			water: convertNormalization(waterProximityData),
		}),
		[gasProximityData, oilProximityData, waterProximityData]
	);

	const isDataStale = useMemo(() => {
		const oilStale = proximityPhases.includes('oil') && oilDataStale;
		const gasStale = proximityPhases.includes('gas') && gasDatatale;
		const waterStale = proximityPhases.includes('water') && waterDataStale;
		return oilStale || gasStale || waterStale;
	}, [proximityPhases, oilDataStale, gasDatatale, waterDataStale]);

	const {
		query: { data: backgroundData, isLoading: backgroundDataLoading },
	} = useProximityForecastRawBGData({
		wellId,
		forecastId,
		phases: proximityPhases,
		enabled: !!forecastId && !isDataStale,
	});

	const { proximityBackgroundWellSeries: oilSeries } = useProximitySeries({
		chartSettings,
		editingChartPhaseType: oilProximityData?.phase_type,
		resolution: backgroundData?.oil?.data_freq,
		seriesConfig: { color: Y_ITEM_COLORS.proximityWells.oil, text: 'Oil Background Wells', displayInLegend: true },
		seriesItems: null,
		proximityActive: !backgroundDataLoading && proximityPhases.includes('oil') && proximitySeries.has('oil'),
		proximityQuery: { data: { rawBackgroundData: backgroundData?.oil ?? [], headersMap: {} } },
		proximityWellSelection: null,
		proximityBgNormalization: proximityBgPhaseNormalization.oil,
		proximitySeriesSelections: new Set(['backgroundWells']),
		wellHeaderQuery,
	});

	const { proximityBackgroundWellSeries: gasSeries } = useProximitySeries({
		chartSettings,
		editingChartPhaseType: gasProximityData?.phase_type,
		resolution: backgroundData?.gas?.data_freq,
		seriesConfig: { color: Y_ITEM_COLORS.proximityWells.gas, text: 'Gas Background Wells', displayInLegend: true },
		seriesItems: null,
		proximityActive: !backgroundDataLoading && proximityPhases.includes('gas') && proximitySeries.has('gas'),
		proximityQuery: { data: { rawBackgroundData: backgroundData?.gas ?? [], headersMap: {} } },
		proximityWellSelection: null,
		proximityBgNormalization: proximityBgPhaseNormalization.gas,
		proximitySeriesSelections: new Set(['backgroundWells']),
		wellHeaderQuery,
	});

	const { proximityBackgroundWellSeries: waterSeries } = useProximitySeries({
		chartSettings,
		editingChartPhaseType: waterProximityData?.phase_type,
		resolution: backgroundData?.water?.data_freq,
		seriesConfig: {
			color: Y_ITEM_COLORS.proximityWells.water,
			text: 'Water Background Wells',
			displayInLegend: true,
		},
		seriesItems: null,
		proximityActive: !backgroundDataLoading && proximityPhases.includes('water') && proximitySeries.has('water'),
		proximityQuery: { data: { rawBackgroundData: backgroundData?.water ?? [], headersMap: {} } },
		proximityWellSelection: null,
		proximityBgNormalization: proximityBgPhaseNormalization.water,
		proximitySeriesSelections: new Set(['backgroundWells']),
		wellHeaderQuery,
	});

	if (backgroundDataLoading) return { series: [], data: { oil: undefined, gas: undefined, water: undefined } };

	return {
		data: { oil: oilProximityData, gas: gasProximityData, water: waterProximityData },
		series: [...oilSeries, ...gasSeries, ...waterSeries],
	};
};

const useForecastProximityWells = ({ forecastId, initialWellId }) => {
	const [currentWellId, setCurrentWellId] = useDerivedState(initialWellId);
	const { data: wells = [], isLoading } = useProximityWellList(forecastId);
	const currentWellIndex = wells.indexOf(currentWellId);

	const prev = useMemo(() => {
		const disabled = isLoading || currentWellIndex <= 0;
		return {
			disabled,
			onClick: disabled ? noop : () => setCurrentWellId(wells[currentWellIndex - 1]),
			tooltipTitle: disabled ? undefined : 'Previous Proximity Well',
		};
	}, [currentWellIndex, isLoading, setCurrentWellId, wells]);

	const next = useMemo(() => {
		const disabled = isLoading || currentWellIndex < 0 || currentWellIndex === wells.length - 1;
		return {
			disabled,
			onClick: disabled ? noop : () => setCurrentWellId(wells[currentWellIndex + 1]),
			tooltipTitle: disabled ? undefined : 'Next Proximity Well',
		};
	}, [currentWellIndex, isLoading, setCurrentWellId, wells]);

	return { prev, next, currentWellId };
};

const Container = styled.div`
	height: 100%;
	display: grid;
	grid-template-rows: 3fr 3fr;
	grid-template-areas:
		'chart'
		'map';
	row-gap: 1rem;
`;

const GridArea = styled(Card)<{ $type: string }>`
	grid-area: ${({ $type }) => $type};
`;

const PHASE_ARR = ['oil', 'gas', 'water'];
const DEFAULT_DATA_SETTINGS = {
	background: new Set(PHASE_ARR),
	forecast: new Set(PHASE_ARR),
	monthly: new Set(PHASE_ARR),
	daily: new Set(PHASE_ARR),
};

const arrToSelectItems = (phases: string[], collection: string, arrOptions: string[] | null = null) => {
	return phases.map((phase) => ({
		key: `${collection}-val`,
		value: phase,
		label: '',
		disabled: arrOptions ? !arrOptions.includes(phase) : false,
	}));
};

function SingleWellProximityView({
	chartData,
	forecastId,
	proximityPhases,
	wellId: _wellId,
}: {
	// todo: better defined typing on chartData
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	chartData?: any;
	forecastId?: string;
	proximityPhases: string[];
	wellId: string;
}) {
	const theme = useTheme();
	const { prev, next, currentWellId } = useForecastProximityWells({ forecastId, initialWellId: _wellId });

	const headersQuery = useWellsHeadersMap([currentWellId]);

	const { chartSettings, setChartSettings } = useChartSettings({
		chartSettings: { enableLegend: true, xAxis: 'time' },
	});
	const { xAxis = '' } = chartSettings;
	const register = (key) => ({ value: chartSettings[key], onChange: (value) => setChartSettings({ [key]: value }) });

	const [dataSettings, setDataSettings] = useMergedState({ ...DEFAULT_DATA_SETTINGS });

	useEffect(() => {
		setDataSettings({ background: new Set(proximityPhases) });
	}, [proximityPhases, setDataSettings]);

	const { daily, monthly, forecast, background } = dataSettings;

	const { seriesItems, chartSettings: debouncedChartSettings } = useSeriesItems({
		daily,
		monthly,
		forecast,
		xAxis,
		chartSettings,
		shouldDebounce: false,
	});

	const { series: bgSeries, data } = useProximityBGSeries({
		chartSettings,
		wellId: currentWellId,
		forecastId,
		proximityPhases,
		proximitySeries: background,
	});

	const forecastSelectItems = arrToSelectItems(PHASE_ARR, 'forecast');
	const backgroundSelectItems = arrToSelectItems(PHASE_ARR, 'background', proximityPhases);
	const dailySelectItems = arrToSelectItems(PHASE_ARR, 'daily');
	const monthlySelectItems = arrToSelectItems(PHASE_ARR, 'monthly');

	const wellsWithMapLayers: { [id: string]: { oil: boolean; gas: boolean; water: boolean; target: boolean } } =
		useMemo(() => {
			const oilWells = background.has('oil') && data.oil?.wells ? data.oil.wells.map(({ well }) => well) : [];
			const gasWells = background.has('gas') && data.gas?.wells ? data.gas.wells.map(({ well }) => well) : [];
			const waterWells =
				background.has('water') && data.water?.wells ? data.water.wells.map(({ well }) => well) : [];
			let allUniqueWellIds = [].concat(oilWells).concat(gasWells).concat(waterWells);
			allUniqueWellIds = [...new Set(allUniqueWellIds)];

			const wells: { [id: string]: { oil: boolean; gas: boolean; water: boolean; target: boolean } } = {};
			allUniqueWellIds.forEach((well) => {
				const layers = {
					oil: background.has('oil') && oilWells.includes(well),
					gas: background.has('gas') && gasWells.includes(well),
					water: background.has('water') && waterWells?.includes(well),
					target: false,
				};
				wells[well] = layers;
			});

			wells[currentWellId] = { oil: false, gas: false, water: false, target: true };

			return wells;
		}, [background, currentWellId, data.gas?.wells, data.oil?.wells, data.water?.wells]);

	const headerData = headersQuery?.data?.get(currentWellId);

	return (
		<Container>
			<GridArea $type='chart'>
				<WithToolbar
					fullWidth
					fullHeight
					toolbarCss={`border-bottom: 1px solid ${theme.palette.divider}`}
					left={
						<ForecastToolbarTheme>
							<div css='margin-right: 1rem; '>
								<IconButton {...prev}>{faChevronLeft}</IconButton>
								<IconButton {...next}>{faChevronRight}</IconButton>
							</div>
							<div>
								{headerData?.well_name} | {headerData?.well_number}
							</div>
						</ForecastToolbarTheme>
					}
					right={
						<ForecastToolbarTheme>
							<ControlButtonContainer>
								<MenuButton
									label='Chart Options'
									endIcon={faChevronDown}
									className='forecast-toolbar-menu-button'
								>
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

									<SwitchItem label='Y-Axis Log Scale' {...register('yLogScale')} />

									{/* <SwitchItem label='Legend' {...register('enableLegend')} /> */}
								</MenuButton>
							</ControlButtonContainer>

							<MenuButton label='Streams' endIcon={faChevronDown} css='margin-left: 1rem'>
								<div
									css={`
										padding: 15px;
										padding-top: 0;
										font-size: 0.75rem;
									`}
								>
									<Row>
										<Col>Stream</Col>
										<Col withCheckboxes>Forecast</Col>
										<Col css='width: 120px' withCheckboxes>
											Background Wells
										</Col>
										<Col withCheckboxes>Daily</Col>
										<Col withCheckboxes>Monthly</Col>
									</Row>
									<Row>
										<Col>
											<div>Oil</div>
											<div>Gas</div>
											<div>Water</div>
										</Col>
										<Col withCheckboxes>
											<CheckboxSelectItems
												value={dataSettings.forecast}
												onChange={(newSet) => setDataSettings({ forecast: newSet })}
												items={forecastSelectItems}
											/>
										</Col>
										<Col css='width: 120px' withCheckboxes>
											<CheckboxSelectItems
												value={dataSettings.background}
												onChange={(newSet) => setDataSettings({ background: newSet })}
												items={backgroundSelectItems}
											/>
										</Col>
										<Col withCheckboxes>
											<CheckboxSelectItems
												value={dataSettings.daily}
												onChange={(newSet) => setDataSettings({ daily: newSet })}
												items={dailySelectItems}
											/>
										</Col>
										<Col withCheckboxes>
											<CheckboxSelectItems
												value={dataSettings.monthly}
												onChange={(newSet) => setDataSettings({ monthly: newSet })}
												items={monthlySelectItems}
											/>
										</Col>
									</Row>
								</div>
							</MenuButton>
						</ForecastToolbarTheme>
					}
				>
					<div
						css={`
							display: flex;
							flex-direction: column;
							flex-grow: 1;
							height: 100%;
							width: 100%;
						`}
					>
						<ForecastChartContainer
							{...{
								chartData: currentWellId === _wellId ? chartData : null,
								chartId: 'proximity-single-well-view',
								chartSettings: debouncedChartSettings,
								disableStatusButtons: true,
								disableSubheader: true,
								disableTitleInfo: true,
								enableMaximize: false,
								enableProximity: false,
								enableVerticalControls: true,
								enableXMinMax: true,
								enableYMinMax: true,
								forecastId,
								proximitySeries: bgSeries,
								render: DeterministicGridChart,
								resolution: 'monthly',
								seriesItems,
								setChartSettings,
								wellId: currentWellId,
							}}
						/>
					</div>
				</WithToolbar>
			</GridArea>
			<GridArea $type='map'>
				<div
					css={`
						display: flex;
						flex-direction: column;
						flex-grow: 1;
						height: 100%;
						width: 100%;
					`}
				>
					<ProximityWellMap wells={wellsWithMapLayers} />
				</div>
			</GridArea>
		</Container>
	);
}

export default SingleWellProximityView;
