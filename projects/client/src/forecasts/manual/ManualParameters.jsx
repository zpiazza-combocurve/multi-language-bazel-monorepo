import produce from 'immer';
import { Component, createRef } from 'react';

import { FormCard, ModeSwitch, getActiveMode } from '@/forecasts/manual/EditingLayout';
import ProbabilisticManualEditingContainer from '@/forecasts/manual/ProbabilisticManualEditingContainer';
import ProbabilisticManualTcContainer from '@/forecasts/manual/ProbabilisticManualTcContainer';

import ReforecastForm from './ReforecastForm';

class ManualParameters extends Component {
	componentDidMount() {
		this._isMounted = true;
		this.resetAutoState();
	}

	componentDidUpdate(prevProps) {
		const { refresh, mode } = this.props;
		if (mode === 'auto' && prevProps.mode !== mode) {
			this.resetAutoState();
			return;
		}
		if (prevProps.refresh?.phase !== refresh?.phase) {
			this.resetAutoState();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	autoRef = createRef();

	_isMounted = false;

	SetState = (obj, cb) => {
		if (this._isMounted) {
			this.setState(obj, cb);
		}
	};

	resetAutoState = () => {
		const { setParentState } = this.props;
		setParentState(
			produce((draft) => {
				draft.auto ??= {};
				draft.auto.data = null;
				draft.auto.forecasted = false;
				draft.auto.segIdx = 0;
				draft.auto.series = 'best';
				draft.auto.selectDate = this.setAutoDateSelection;
				draft.refresh.well = !draft.refresh.well; // HACK this resetAutoState function shouldn't be called that much, the refresh mechanic should be replaced with a more imperative approach like useImperativeHandle and classes methods
			})
		);
	};

	setAutoDateSelection = (startDate, endDate) => {
		if (this.autoRef.current) {
			this.autoRef.current.setDateSelection(startDate, endDate);
		}
	};

	handleAutoSaved = () => {
		const { setParentState, curPhase } = this.props;
		setParentState(
			produce((draft) => {
				draft.curData ??= {};
				draft.curData.data ??= {};
				draft.curData.data[curPhase] ??= {};
				draft.curData.data[curPhase] = draft.auto.data;

				draft.auto ??= {};
				draft.auto.forecasted = false;
				draft.auto.data = null;
				draft.auto.segIdx = 0;
				draft.auto.series = 'best';
				draft.auto.selectDate = null;
			})
		);
	};

	handleAutoForecast = (newForecastData) => {
		const { setParentState } = this.props;

		setParentState(
			produce((draft) => {
				const hasData = !!newForecastData;
				draft.auto ??= {};
				draft.auto.data = newForecastData;
				draft.auto.forecasted = hasData;
				draft.auto.segIdx = 0;
				draft.auto.series = 'best';
				if (hasData) {
					draft.refresh ??= {};
					draft.refresh.edited = !draft.refresh.edited;
				}
			})
		);
	};

	handleAutoChangeSegIdx = (newIdx) => {
		const { setParentState } = this.props;
		setParentState(
			produce((draft) => {
				draft.auto.segIdx = newIdx;
			})
		);
	};

	handleAutoChangeSeries = (series) => {
		const { setParentState } = this.props;
		setParentState(
			produce((draft) => {
				draft.auto.segIdx = 0;
				draft.auto.series = series;
			})
		);
	};

	getAutoSegments = () => {
		const {
			auto: { data, forecasted, series },
			curData,
			curPhase,
		} = this.props;

		const saved = curData.data[curPhase];
		const used = forecasted ? data : saved;

		return used?.P_dict?.[series]?.segments;
	};

	getForecastDataFreq = () => {
		const { auto, mode, resolution } = this.props;

		if (mode === 'auto') {
			return auto?.data?.data_freq ?? resolution;
		}

		return resolution;
	};

	getSegments = () => {
		const { mode } = this.props;

		if (mode === 'auto') {
			return this.getAutoSegments();
		}

		return undefined;
	};

	render() {
		const {
			auto,
			changeMode,
			changePhase,
			curData,
			curPhase,
			curWell,
			forecast,
			manualContainerEl,
			mode,
			refresh,
			remove,
			resolution,
			saveRef,
			setParentState,
			setResolution,
		} = this.props;

		const sharedProps = {
			changePhase,
			curData,
			curPhase,
			curWell,
			forecast,
			manualContainerEl,
			phase: curPhase,
			refresh,
			refreshPhase: refresh.phase,
			refreshWell: refresh.well,
			remove,
			resolution,
			setParamState: this.SetState,
			setParentState,
			setResolution,
		};

		const modes = [
			{
				name: 'auto',
				label: 'Auto',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				body: () => (
					<ReforecastForm
						ref={{ autoRef: this.autoRef, saveRef }} // might need a better solution than this
						{...sharedProps}
						forecasted={auto?.forecasted}
						onForecast={this.handleAutoForecast}
						onSave={this.handleAutoSaved}
						segments={this.getSegments()}
						forecastDataFreq={this.getForecastDataFreq()}
						onChangeSegIdx={this.handleAutoChangeSegIdx}
						onChangeSeries={this.handleAutoChangeSeries}
						auto={auto}
					/>
				),
			},
			{
				name: 'manual',
				label: 'Manual',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				body: () => <ProbabilisticManualEditingContainer {...sharedProps} ref={saveRef} />,
			},
			{
				name: 'typecurve',
				label: 'Type Curve',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				body: () => (
					<ProbabilisticManualTcContainer
						{...sharedProps}
						forecastId={forecast._id}
						forecast={forecast}
						ref={saveRef}
					/>
				),
			},
		];

		const activeMode = getActiveMode(mode, modes);

		return (
			<FormCard
				isProbabilistic
				left={<ModeSwitch activeModeName={mode} modes={modes} onChangeMode={changeMode} />}
			>
				{activeMode?.body?.()}
			</FormCard>
		);
	}
}

export default ManualParameters;
