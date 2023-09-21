import { MultipleSegments } from '@combocurve/forecast/models';
import { faArrowLeft } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Component } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, alerts } from '@/components/v2';
import SingleChartControls from '@/forecasts/charts/components/deterministic/grid-chart/SingleChartControls';
import {
	fetchLookups,
	fetchSchedules,
	fetchTcFit,
	fetchTcList,
} from '@/forecasts/manual/ManualEditingTypeCurveContext';
import { genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { subscribe } from '@/helpers/alfa';
import { makeLocalWithHours, makeUtc } from '@/helpers/date';
import { putApi } from '@/helpers/routing';

import ApplyTCSideOptions from './ApplyTCSideOptions';
import PreviewTCChart from './PreviewTCChart';

import './applyTCForm.scss';

const DEFAULT_PHASE = 'all';
const multiSeg = new MultipleSegments();

export const NoFitArea = ({ emptyLabel }) => (
	<section className='preview-chart-container'>
		<span className='preview-chart-no-fit'>
			<span className='no-fit-message'>
				<FontAwesomeIcon className='themeMe' icon={faArrowLeft} />
				<span>{emptyLabel}</span>
			</span>
		</span>
	</section>
);

class ApplyTCForm extends Component {
	_isMounted = false;

	constructor(props) {
		super(props);
		this.state = {
			fit: null,
			hasRun: false,
			loaded: false,
			lookup: null,
			phase: DEFAULT_PHASE,
			phaseType: 'rate',
			refreshFit: false,
			schedList: [],
			tcList: [],
			typecurve: null,
			useLookup: false,
			openTypeCurveDialog: false,
		};
	}

	async componentDidMount() {
		this._isMounted = true;

		const { forecastType, project } = this.props;
		const tcList = await fetchTcList(DEFAULT_PHASE, 'rate', forecastType, project._id);
		const schedList = await fetchSchedules({ projectId: project._id });
		const lookupList = await fetchLookups({ projectId: project._id });

		const settings = {
			date: makeLocalWithHours(makeUtc(new Date())),
			fpd: 'fixed',
			normalize: false,
			resolution: 'monthly',
			schedule: null,
			series: 'best',
			phaseRiskFactors: { oil: 1, gas: 1, water: 1 },
		};

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ loaded: true, schedList, settings, tcList, lookupList });
	}

	componentDidUpdate(prevProps) {
		const { parentResolution, visible } = this.props;
		const updateResolution = parentResolution !== prevProps.parentResolution;
		const updateVisible = visible !== prevProps.visible;

		if (updateResolution) {
			const { settings } = this.state;
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ settings: { ...settings, resolution: parentResolution } });
		}
		if (visible && updateVisible) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ hasRun: false });
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	SetState = (obj, cb) => {
		if (this._isMounted) {
			this.setState(obj, cb);
		}
	};

	handleCancel = () => {
		const { hasRun } = this.state;
		const { resolve, close } = this.props;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ fit: null, typecurve: null }, () => {
			// adds compatibilty with useVisibleDialog
			resolve?.(hasRun);

			close?.(hasRun);
		});
	};

	// eslint-disable-next-line new-cap -- TODO eslint fix later
	setLookup = (lookup) => this.SetState({ fit: null, lookup, typecurve: null });

	setPhase = async (phase) => {
		const { phaseType } = this.state;
		const { forecastType, project } = this.props;
		const tcList = await fetchTcList(phase, phaseType, forecastType, project._id);
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ fit: null, phase, tcList, typecurve: null });
	};

	setPhaseType = async (phaseType) => {
		const { phase, settings } = this.state;
		const { forecastType, project } = this.props;
		const tcList = await fetchTcList(phase, phaseType, forecastType, project._id);
		const newState = { fit: null, phaseType, tcList, typecurve: null };
		if (phaseType !== 'rate') {
			newState.settings = { ...settings, normalize: false };
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState(newState);
	};

	setTypeCurve = async (tc) => {
		const { phase, refreshFit, settings } = this.state;

		let fit;
		if (phase !== 'all') {
			fit = await fetchTcFit(tc._id, phase);
		} else {
			fit = Object.values(tc.fits);
		}
		if (Array.isArray(fit)) {
			fit = fit.filter((f) => {
				const pDict = f.fitType === 'rate' ? f.P_dict : f.ratio_P_dict;
				return pDict?.[settings.series]?.segments?.length;
			});
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ fit, refreshFit: !refreshFit, typecurve: tc, lookup: null });
	};

	handleSubmitTypeCurveDialog = async () => {
		const { lookup, phase, settings, typecurve } = this.state;
		const { forecastId, wells, project } = this.props;

		const body = {
			lookupId: lookup?._id ?? null,
			phase,
			tcId: typecurve?._id ?? null,
			wells,
			...settings,
			projectId: project?._id,
		};

		// if a task is created/dialog should close so user can see notification alerts
		let taskCreated = false;
		try {
			const {
				message,
				warning,
				taskCreated: resTaskCreated,
			} = await withDoggo(putApi(`/forecast/${forecastId}/setMultiWellTC`, body), 'Applying Type Curve...');
			taskCreated = resTaskCreated;

			// TODO double check if this is what we want
			if (!taskCreated) {
				alerts.confirm({
					title: message,
					children: warning,
					confirmText: 'Continue',
					hideCancelButton: true,
				});
			}

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ hasRun: true });
		} catch (err) {
			genericErrorAlert(err);
		} finally {
			this.handleCloseTypeCurveDialog();
			if (taskCreated) this.handleCancel();
		}
	};

	handleCloseTypeCurveDialog = () => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ openTypeCurveDialog: false });
	};

	handleApplyTypeCurve = () => {
		if (this.state.useLookup) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ openTypeCurveDialog: true });
		} else {
			this.handleSubmitTypeCurveDialog();
		}
	};

	getSeriesItems = () => {
		const { typecurve, fit } = this.state;
		const { basePhase, phaseType } = typecurve;
		if (fit) {
			return fit.map((curFit) => {
				const { phase: fitPhase } = curFit;
				return {
					collection: 'forecast',
					x: 'relativeTime',
					y: phaseType?.[fitPhase] === 'rate' ? fitPhase : `${fitPhase}/${basePhase}`,
				};
			});
		}
		return [];
	};

	getSingleChartData = () => {
		const {
			fit,
			typecurve,
			settings: { series },
		} = this.state;
		const { basePhase, phaseType } = typecurve;
		let data = null;
		if (fit) {
			data = fit.reduce(
				(obj, curFit) => {
					const { phase: fitPhase, P_dict, ratio_P_dict } = curFit;
					const rateSegments = P_dict?.[series]?.segments ?? [];
					const rateStartIdx = rateSegments?.[0]?.start_idx;
					const phaseP_dict = {
						best: {
							segments: multiSeg.shiftSegmentsIdx({
								inputSegments: rateSegments,
								deltaT: Number.isFinite(rateStartIdx) ? -rateStartIdx : 0,
							}),
						},
					};

					const ratioSegments = ratio_P_dict?.[series]?.segments ?? [];
					const ratioStartIdx = ratioSegments?.[0]?.start_idx;
					const phaseRatio = {
						basePhase,
						segments: multiSeg.shiftSegmentsIdx({
							inputSegments: ratioSegments,
							deltaT: Number.isFinite(ratioStartIdx) ? -ratioStartIdx : 0,
						}),
					};
					const phaseData = {
						data_freq: 'monthly',
						forecastType: phaseType?.[fitPhase] ?? 'rate',
						P_dict: phaseP_dict,
						phase: fitPhase,
						ratio: phaseRatio,
					};
					return {
						...obj,
						[fitPhase]: phaseData,
					};
				},
				{
					oil: { phase: 'oil', forecastType: 'rate', ratio: { basePhase: 'gas', segments: [] } },
					gas: { phase: 'gas', forecastType: 'rate', ratio: { basePhase: 'oil', segments: [] } },
					water: { phase: 'water', forecastType: 'rate', ratio: { basePhase: 'oil', segments: [] } },
				}
			);
		}

		return {
			daily: null,
			forecast: data,
			inEdit: false,
			monthly: null,
		};
	};

	getChartRender = (sharedProps) => {
		const { fit, phase, settings, useLookup } = this.state;
		const emptyLabel = useLookup ? 'Select A Lookup' : 'Select A Fit';
		if (!fit) {
			return <NoFitArea emptyLabel={emptyLabel} />;
		}

		return phase === 'all' ? (
			<SingleChartControls
				chartData={this.getSingleChartData()}
				disableControls
				disableStatusButtons
				enableXMinMax={false}
				enableYMinMax={false}
				selectable={false}
				seriesItems={this.getSeriesItems()}
				xAxis='relativeTime'
			/>
		) : (
			<PreviewTCChart {...sharedProps} applySeries={settings.series} />
		);
	};

	checkValidInputAndGiveTooltip = () => {
		const { fit, lookup, settings, useLookup } = this.state;
		const { wells } = this.props;
		const { fpd, schedule, phaseRiskFactors } = settings;
		if (Object.entries(phaseRiskFactors).some(([, v]) => v <= 0)) {
			return 'Risk Factor can not be negative';
		}
		if (!fit && !useLookup) {
			return 'Choose a fit or a lookup table';
		}
		if (fpd === 'schedule' && !schedule) {
			return 'Choose a schedule when FPD type is scheduling';
		}
		if (useLookup && !lookup) {
			return 'Choose a lookup table';
		}

		if (!wells?.length) {
			return 'Please make sure at least 1 well in the current view list';
		}

		const fitList = Array.isArray(fit) ? fit : [fit];

		const allFitsValid = fitList
			.map((f) => {
				const pDict = f?.fitType === 'rate' ? f?.P_dict : f?.ratio_P_dict;
				return pDict?.[settings.series]?.segments?.length;
			})
			.every((el) => !!el);

		if (!useLookup && !allFitsValid) {
			return 'Pick a series with at least 1 segment for the selected phase(s)';
		}

		return false;
	};

	render() {
		const {
			fit,
			loaded,
			lookup,
			lookupList,
			phase,
			phaseType,
			refreshFit,
			schedList,
			settings,
			tcList,
			typecurve,
			useLookup,
		} = this.state;

		const { forecastType, runText, visible, wells } = this.props;
		const sharedProps = { fit, forecastType, phase, phaseType, refreshFit, tcList, typecurve, useLookup };

		const actions = [];
		if (loaded) {
			const applyTooltip = this.checkValidInputAndGiveTooltip();
			actions.push(
				<Button disabled={applyTooltip} key='action-apply' onClick={this.handleApplyTypeCurve} color='primary'>
					{runText ?? `Apply (${wells?.length ?? 0})`}
				</Button>
			);
			actions.push(
				<Button color='error' key='action-cancel' onClick={this.handleCancel}>
					Close
				</Button>
			);
		}

		return (
			<Dialog id='apply-type-curve-form-dialog' fullWidth open={visible} maxWidth='xl'>
				<DialogContent className='apply-type-curve-form-dialog-content'>
					{loaded && (
						<>
							<ApplyTCSideOptions
								{...sharedProps}
								actions={actions}
								lookup={lookup}
								lookupList={lookupList}
								schedList={schedList}
								setLookup={this.setLookup}
								setParentState={this.SetState}
								setPhase={this.setPhase}
								setPhaseType={this.setPhaseType}
								settings={settings}
								setTypeCurve={this.setTypeCurve}
							/>

							<Dialog open={this.state.openTypeCurveDialog} onClose={this.handleCloseTypeCurveDialog}>
								<DialogTitle>Are you sure you want to continue?</DialogTitle>
								<DialogContent>
									Form value will only be used when it&apos;s not provided by the lookup table
								</DialogContent>
								<DialogActions>
									<Button onClick={this.handleCloseTypeCurveDialog} color='secondary'>
										Cancel
									</Button>
									<Button onClick={this.handleSubmitTypeCurveDialog} color='primary' autoFocus>
										Continue
									</Button>
								</DialogActions>
							</Dialog>

							{this.getChartRender(sharedProps)}
						</>
					)}
				</DialogContent>
			</Dialog>
		);
	}
}

export default subscribe(ApplyTCForm, ['project']);
