import { convertIdxToDate } from '@combocurve/forecast/helpers';
import classNames from 'classnames';
import produce from 'immer';
import { Component, useCallback, useContext, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Hotkey, Placeholder } from '@/components';
import { UnsavedWorkDialog } from '@/components/hooks/useUnsavedWork';
import { Divider, SwitchItem } from '@/components/v2';
import ForecastChartContainer from '@/forecasts/charts/components/ForecastChartContainer';
import ProbabilisticManualChart from '@/forecasts/charts/components/ProbabilisticManualChart';
import { getNextPhase } from '@/forecasts/charts/components/deterministic/phase-chart/helpers';
import { EditingLayoutContainer } from '@/forecasts/manual/EditingLayout';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { useKeyboardTooltipFloater } from '@/forecasts/manual/shared';
import {
	ChartResolutionSubMenu,
	DEFAULT_FORECAST_MENU_VALUES,
	ForecastChartOptionsMenu,
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
} from '@/forecasts/shared';
import { genericErrorAlert, withAsync } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { getApi, parseQuery, postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import { fields as statuses } from '@/inpt-shared/display-templates/forecast-data/forecast-status.json';
import { fields as types } from '@/inpt-shared/display-templates/forecast-data/forecast-types.json';
import { fields as fRes } from '@/inpt-shared/display-templates/segment-templates/seg_res.json';
import { fields as units } from '@/inpt-shared/display-templates/wells/well_days_units';
import { URLS } from '@/urls';

import AutoReforecastChart from '../charts/components/AutoReforecastChart';
import ManualForecastTcChart from '../charts/components/ManualForecastTcChart';
import { ForecastTableCard } from '../deterministic/manual/ForecastTableCard';
import ManualParameters from './ManualParameters';

import './ManualForecast.scss';

const getDefaultAutoProps = () => ({
	data: null,
	forecasted: false,
	segIdx: 0,
	series: 'best',
	selectDate: null,
});

class ManualForecastRender extends Component {
	constructor(props) {
		super(props);
		this.state = {
			chartCollapsed: false,
			curPhase: 'oil',
			forecast: null,
			lineScatter: true,
			logScale: true,
			resolution: local.getItem('manualEditingResolution') ?? 'monthly',
			xLogScale: false,
			removedWells: [],
			...DEFAULT_FORECAST_MENU_VALUES,
			auto: {
				data: null,
				forecasted: false,
				segIdx: 0,
				series: 'best',
				selectDate: null,
			},
			tcProps: {
				prodDate: null,
				typecurve: undefined,
				fit: null,
				forecasted: false,
			},
			refresh: {
				chartType: false,
				edited: false,
				fit: false,
				phase: false,
				series: false,
				table: false,
				well: false,
			},
		};
	}

	async componentDidMount() {
		this._isMounted = true;
		const { navigate, location, forecastDocumentQuery, bucket } = this.props;

		try {
			const forecast = forecastDocumentQuery.data;

			const wells = [...bucket];

			const sortedWells = await withAsync(
				postApi('/well/sortByHeader', { dir: 'asc', header: 'well_name', wells })
			);

			const state = {
				forecast,
				fRes,
				statuses,
				types,
				units,
				wells: sortedWells,
			};

			let curWell = sortedWells[0];
			const { well } = parseQuery(location.search);
			if (well && sortedWells.includes(well)) {
				curWell = well;
			}

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState(state, () => {
				this.getWellForecast(curWell);
			});
		} catch (err) {
			genericErrorAlert(err);
			navigate(err.path);
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	_isMounted = false;

	_keyMap = {};

	SetState = (obj, cb) => {
		if (this._isMounted) {
			this.setState(obj, cb);
		}
	};

	haveUnsavedWork = async () => {
		const { tcProps, auto } = this.state;
		const { mode: currentMode, edited, dispatchUnsavedDialog } = this.props;

		return (
			{ manual: edited, auto: auto.forecasted, typecurve: tcProps.forecasted }[currentMode] &&
			!(await dispatchUnsavedDialog())
		);
	};

	changeMode = async (mode) => {
		const { mode: currentMode, setMode } = this.props;

		if (mode === currentMode) {
			return;
		}

		if (await this.haveUnsavedWork()) {
			return;
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState(
			{
				auto: getDefaultAutoProps(),
				tcProps: {
					prodDate: null,
					typecurve: undefined,
					fit: null,
					forecasted: false,
				},
			},
			() => setMode(mode)
		);
	};

	changePhase = async (value) => {
		if (await this.haveUnsavedWork()) {
			return false;
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return this.SetState(
			produce((draft) => {
				draft.refresh.well = !draft.refresh.well;
				draft.refresh.phase = !draft.refresh.phase;
				draft.curPhase = value;

				draft.auto = getDefaultAutoProps();
			})
		);
	};

	removeWell = async () => {
		const { navigate, toggleManualSelect, project } = this.props;
		const { curWell, forecast, removedWells, wells } = this.state;
		if (wells.length > removedWells.length + 1) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState(
				produce((draft) => {
					draft.removedWells.push(curWell);
				})
			);
		} else {
			navigate(`/${URLS.project(project._id).forecast(forecast._id).view}`);
		}

		await toggleManualSelect({ checked: false, wellId: curWell });
	};

	setResolution = async (value) => {
		const { curWell } = this.state;

		if (await this.haveUnsavedWork()) {
			return false;
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		return this.SetState({ resolution: value }, () => this.getWellForecast(curWell, false));
	};

	getWellForecast = async (id, checkSavedWork = true) => {
		if (checkSavedWork && (await this.haveUnsavedWork())) {
			return;
		}

		const { auto, forecast, overview, refresh, resolution } = this.state;
		try {
			const data = await withAsync(
				getApi(`/forecast/${forecast._id}/data`, {
					resolution,
					wells: [id],
					wellCols: [
						'well_name',
						'inptID',
						'api14',
						'well_number',
						'current_operator_alias',
						'county',
						'perf_lateral_length',
						'total_proppant_per_perforated_interval',
						'total_fluid_per_perforated_interval',
						'first_prod_date_daily_calc',
						'first_prod_date_monthly_calc',
					],
				})
			);

			const resetAuto = { ...auto, data: null, segIdx: 0, series: 'best', forecasted: false };
			const resetOverview = { ...overview, segIdx: 0, series: 'best' };
			const { production } = data[0];
			const tcProps = {
				prodDate: production ? convertIdxToDate(production.index[0]) : new Date(),
				typecurve: undefined,
				fit: null,
			};

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({
				auto: resetAuto,
				curData: data[0],
				curWell: id,
				loaded: true,
				overview: resetOverview,
				refresh: produce(refresh, (draft) => {
					draft.table = !refresh.table;
					draft.well = !refresh.well;
				}),
				tcProps,
			});
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	refreshChartAction = (obj) => {
		const { refresh } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ ...obj, refresh: { ...refresh, chartType: !refresh.chartType } });
	};

	selectYearsBefore = (value) => this.refreshChartAction({ yearsBefore: value });

	selectYearsPast = (value) => this.refreshChartAction({ yearsPast: value });

	selectYMax = (value) => this.refreshChartAction({ yMax: value });

	selectYMin = (value) => this.refreshChartAction({ yMin: value });

	getChartActions = () => {
		const { chartResolution, lineScatter, logScale, xLogScale, yearsBefore, yearsPast, yMax, yMin } = this.state;
		return (
			<ForecastChartOptionsMenu disableLabel>
				<ChartResolutionSubMenu
					value={chartResolution}
					onSelect={(value) => this.refreshChartAction({ chartResolution: value })}
				/>

				<Divider />

				{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
				<YearsBeforeAxisControlSelection value={yearsBefore} onChange={this.selectYearsBefore} />
				{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
				<YearsPastAxisControlSelection value={yearsPast} onChange={this.selectYearsPast} />
				{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
				<YMaxAxisControlSelection value={yMax} onChange={this.selectYMax} />
				{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
				<YMinAxisControlSelection value={yMin} onChange={this.selectYMin} />

				<Divider />

				<SwitchItem
					label='Toggle Production Line Plot'
					onChange={(checked) => this.refreshChartAction({ lineScatter: checked })}
					value={lineScatter}
				/>

				<SwitchItem
					label='Y-Axis Log Scale'
					onChange={(checked) => this.refreshChartAction({ logScale: checked })}
					value={logScale}
				/>

				<SwitchItem
					label='X-Axis Log Scale'
					onChange={(checked) => this.refreshChartAction({ xLogScale: checked })}
					value={xLogScale}
				/>
			</ForecastChartOptionsMenu>
		);
	};

	renderChartArea = (sharedProps) => {
		const { mode, setOnForm, keyboardTooltipButton } = this.props;
		const {
			auto,
			chartResolution,
			curData,
			curWell,
			lineScatter,
			logScale,
			xLogScale,
			yearsBefore,
			yearsPast,
			yMax,
			yMin,
		} = this.state;

		const chartActionsRender = this.getChartActions();

		const autoChartProps = {
			auto,
			chartActionsRender,
			chartResolution,
			lineScatter,
			xLogScale,
		};

		const forecastChartContainerProps = {
			id: 'manual-phase-chart-container',
			className: 'paper-1-to-paper-4',
			enableXMinMax: true,
			enableYMinMax: true,
			selectYearsBefore: this.selectYearsBefore,
			selectYearsPast: this.selectYearsPast,
			selectYMax: this.selectYMax,
			selectYMin: this.selectYMin,
		};

		let chartRender = null;
		let renderProps = {};
		const forecastId = sharedProps?.forecast?._id;

		switch (mode) {
			case 'auto':
				chartRender = AutoReforecastChart;
				renderProps = { ...sharedProps, ...autoChartProps, forecastId, wellId: curWell, keyboardTooltipButton };
				break;
			case 'manual':
				chartRender = ProbabilisticManualChart;
				renderProps = {
					...sharedProps,
					chartActionsRender,
					forecastId,
					wellId: curWell,
					keyboardTooltipButton,
					onControlsBlur: () => setOnForm(false),
					onControlsFocus: () => setOnForm(true),
				};
				break;
			case 'typecurve':
				chartRender = ManualForecastTcChart;
				renderProps = {
					forecastId,
					phase: sharedProps.curPhase,
					production: sharedProps?.curData?.production,
					resolution: sharedProps.resolution,
					typeProps: { curData, chartActionsRender },
					wellId: curWell,
				};
				break;
			default:
				return null;
		}

		return (
			<ForecastChartContainer
				{...forecastChartContainerProps}
				{...renderProps}
				chartSettings={{
					lineScatter,
					xLogScale,
					yearsBefore,
					yearsPast,
					yLogScale: logScale,
					yMax,
					yMin,
				}}
				key={mode}
				render={chartRender}
			/>
		);
	};

	render() {
		const {
			auto,
			chartCollapsed,
			curData,
			curPhase,
			curWell,
			forecast,
			loaded,
			refresh,
			removedWells,
			resolution,
			tcProps,
			units,
			wells,
			logScale,
		} = this.state;

		const { mode, onForm, setOnForm, saveRef } = this.props;

		const sharedProps = {
			changeMode: this.changeMode,
			curData,
			curPhase,
			forecast,
			mode,
			resolution,
			setParentState: this.SetState,
			tcProps,
			units,
		};

		if (!loaded) {
			return (
				<EditingLayoutContainer>
					<Placeholder loading main loadingText='Loading Forecast' />
				</EditingLayoutContainer>
			);
		}

		const changePhaseHandler = (phase) => () => {
			if (phase !== curPhase) {
				this.changePhase(phase);
				return false;
			}
			return undefined;
		};

		const cyclePhase = () => {
			const nextPhase = getNextPhase(curPhase);
			this.changePhase(nextPhase);
			return false;
		};

		const toggleMode = () => {
			if (mode === 'auto') {
				this.changeMode('manual');
			} else {
				this.changeMode('auto');
			}
			return false;
		};

		const isMac = navigator.userAgent.includes('Mac');
		const changeModeKeys = isMac ? 'command+d' : 'ctrl+d';

		return (
			<EditingLayoutContainer>
				<Hotkey keyname='shift+o' handler={changePhaseHandler('oil')} disabled={onForm} />
				<Hotkey keyname='shift+g' handler={changePhaseHandler('gas')} disabled={onForm} />
				<Hotkey keyname='shift+w' handler={changePhaseHandler('water')} disabled={onForm} />
				<Hotkey keyname='shift+s' handler={cyclePhase} disabled={onForm} />
				<Hotkey keyname={changeModeKeys} handler={toggleMode} disabled={onForm} />

				<Hotkey
					keyname='l'
					handler={() => this.refreshChartAction({ logScale: !logScale })}
					disabled={onForm}
				/>
				<ForecastTableCard
					activeWell={curWell}
					collapsed={!chartCollapsed}
					headerStoreKey='MANUAL_FORECAST_DEFAULT_HEADERS'
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onChangeActiveWell={this.getWellForecast}
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					onToggleCollapsed={() => this.SetState({ chartCollapsed: !chartCollapsed })}
					wellIds={wells}
					onFilterActive={setOnForm}
					removedWells={removedWells}
				/>
				<ManualParameters
					{...sharedProps}
					auto={auto}
					changePhase={this.changePhase}
					curWell={curWell}
					getWellForecast={this.getWellForecast}
					refresh={refresh}
					remove={this.removeWell}
					saveRef={saveRef}
					setResolution={this.setResolution}
				/>
				<div id='manual-chart-area' className={classNames(chartCollapsed && 'collapsed')}>
					{this.renderChartArea(sharedProps)}
				</div>
			</EditingLayoutContainer>
		);
	}
}

const ManualForecast = ({ forecastId, ...rest }) => {
	const { project } = useAlfa();
	const navigate = useNavigate();
	const location = useLocation();

	const saveRef = useRef();

	const [mode, setMode] = useState('auto');

	const [unsavedDialog, _dispatchUnsavedDialog] = useDialog(UnsavedWorkDialog);

	const { edited, onForm, setOnForm } = useContext(ManualEditingContext);
	const { keyboardTooltipButton, keyboardTooltipFloater } = useKeyboardTooltipFloater({ mode });

	const dispatchUnsavedDialog = useCallback(
		async (...params) => {
			setOnForm(true);
			const result = await _dispatchUnsavedDialog({
				saveUnsaved: saveRef.current?.saveForecast,
				options: { includeSaveAndContinue: false },
				...params,
			});
			setOnForm(false);
			return result;
		},
		[_dispatchUnsavedDialog, setOnForm]
	);

	const renderProps = {
		dispatchUnsavedDialog,
		edited,
		forecastId,
		navigate,
		keyboardTooltipButton,
		location,
		mode,
		onForm,
		project,
		saveRef,
		setMode,
		setOnForm,
		...rest,
	};

	if (!rest.bucket?.size) {
		return <Placeholder main empty={!rest.bucket?.size} emptySize={2} text='No Wells In Editing Bucket...' />;
	}
	return (
		<>
			<ManualForecastRender {...renderProps} />
			{unsavedDialog}
			{keyboardTooltipFloater}
		</>
	);
};

export default ManualForecast;
