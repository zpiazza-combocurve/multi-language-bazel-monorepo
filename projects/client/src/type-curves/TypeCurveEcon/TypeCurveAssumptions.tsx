import { faExclamation } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Paper } from '@material-ui/core';
import classNames from 'classnames';
import { get, groupBy, mapValues, without } from 'lodash-es';
import { Component } from 'react';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import ChoosePSeriesDialog from '@/components/ChoosePSeriesDialog';
import { Button, CardActions, CardContent, InfoTooltipWrapper, MenuButton, MenuItem } from '@/components/v2';
import { BE_TOOLTIP } from '@/cost-model/detail-components/pricing/PricingStandardView/Breakeven';
import GridItemDialog, { GridItemDialogData } from '@/cost-model/models/GridItemDialog';
import { confirmationAlert, genericErrorAlert, withAsync, withProgress } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';
import {
	ASSUMPTION_ORDER as ALL_ASSUMPTION_ORDER,
	ASSUMPTION_LABELS as ASSUMPTIONS_LABELS,
	AssumptionKey,
} from '@/inpt-shared/constants';
import UmbrellaSelectMenu from '@/qualifiers/UmbrellaSelectMenu';
import { CARBON_RELATED_ASSUMPTION_KEYS } from '@/scenarios/shared';

import { TypeCurve, TypeCurveHeaders } from '../types';
import EconTCHeadersDialog from './TypeCurveAssumptions/TypeCurveHeadersDialog';

const IGNORE_ASSUMPTIONS = [
	AssumptionKey.depreciation,
	AssumptionKey.escalation,
	AssumptionKey.productionVsFit,
	AssumptionKey.reservesCategory,
	...CARBON_RELATED_ASSUMPTION_KEYS,
];

const ASSUMPTION_ORDER = without(ALL_ASSUMPTION_ORDER, ...IGNORE_ASSUMPTIONS);

const REQUIRED_ASS_KEYS = [AssumptionKey.dates, AssumptionKey.generalOptions, AssumptionKey.ownershipReversion];

const TOOLTIPS = {
	[AssumptionKey.ownershipReversion]: BE_TOOLTIP,
};

type TypeCurveAssumptionsState = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeUmbrellas: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	assumptions: Record<string, any> | null;
	assumptionsDialog: GridItemDialogData | null;
	headers: TypeCurveHeaders | null;
	headersDialogShown: boolean;
	pSeries: string | null;
	pSeriesDialogShown: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	umbrellas: any[];
};

type TypeCurveAssumptionsProps = {
	typeCurve: TypeCurve;
	project: Assign<Inpt.Project, { createdBy: Inpt.User }>;
	canUpdateTypeCurve: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onRunEcon: (assumptions: any, headers: TypeCurveHeaders, pSeries: string | null) => void;
};

const renderSection = ({ onClick, title, umbrellaMenu, value, showWarning = false, disabled }) => {
	return (
		<div className='ass-container'>
			<span className={classNames('ass-title md-text', showWarning && 'warn-icon')}>
				{title}
				{showWarning && (
					<FontAwesomeIcon
						className='right-btn-icon warn-icon'
						icon={faExclamation}
						title='This is a required field'
					/>
				)}
			</span>

			<div>
				{umbrellaMenu}
				<span className='ass-btn'>
					<Button
						css={`
							justify-content: left;
						`}
						className={classNames(
							'text-ellip',
							'unset-text-transform',
							'ass-container__button',
							!value && 'warn-btn-flat'
						)}
						color='primary'
						disabled={disabled}
						fullWidth
						id='default-model-btn'
						onClick={onClick}
					>
						{value || 'Click to setup'}
					</Button>
				</span>
			</div>
		</div>
	);
};

const getInitialState = ({ typeCurve }: TypeCurveAssumptionsProps): TypeCurveAssumptionsState => ({
	activeUmbrellas: typeCurve.activeUmbrellas || {},
	assumptions: null,
	assumptionsDialog: null,
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	headers: Object.keys(typeCurve.headers || {}).length > 0 ? typeCurve.headers! : null,
	headersDialogShown: false,
	pSeries: typeCurve.pSeries?.percentile ?? null,
	pSeriesDialogShown: false,
	umbrellas: [],
});

export default class TypeCurveAssumptions extends Component {
	props: TypeCurveAssumptionsProps;
	state: TypeCurveAssumptionsState;

	constructor(props: TypeCurveAssumptionsProps) {
		super(props);
		this.props = props;
		this.state = getInitialState(props);
	}

	componentDidMount() {
		this.mounted = true;
		this.fetch();
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	mounted = false;

	async fetch() {
		const { typeCurve } = this.props;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const [assumptions, umbrellas] = await withProgress<any>(
			Promise.all([
				getApi(`/type-curve/${typeCurve._id}/assumptions`),
				getApi(`/type-curve/${typeCurve._id}/getUmbrellas`),
			])
		);
		this.setStateSafely({ assumptions, umbrellas });
	}

	setStateSafely = (state) =>
		// eslint-disable-next-line no-promise-executor-return -- TODO eslint fix later
		new Promise<void>((resolve) => (this.mounted ? this.setState(state, resolve) : resolve()));

	validHeaders = () => {
		const { headers } = this.state;
		if (headers) {
			return !Object.values(headers).includes(null);
		}

		return false;
	};

	canRun = () => {
		const { assumptions, pSeries } = this.state;
		const validRequiredAssumptions = REQUIRED_ASS_KEYS.reduce((bool, curKey) => {
			if (!assumptions?.[curKey]) {
				return false;
			}

			return bool;
		}, true);

		return !!(this.validHeaders() && validRequiredAssumptions && pSeries);
	};

	handleShowHeadersDialog = () => this.setStateSafely({ headersDialogShown: true });

	handleHideHeadersDialog = () => this.setStateSafely({ headersDialogShown: false });

	handleShowPSeriesDialog = () => this.setStateSafely({ pSeriesDialogShown: true });

	handleHidePSeriesDialog = () => this.setStateSafely({ pSeriesDialogShown: false });

	handleApplyHeaders = (headers: TypeCurveHeaders | null) => {
		const { typeCurve } = this.props;
		this.setStateSafely({ headers, headersDialogShown: false });
		withProgress(postApi(`/type-curve/${typeCurve._id}/updateHeaders`, headers), 'Headers saved successfully');
	};

	handleApplyPSeries = (pSeries: string | null) => {
		const { typeCurve } = this.props;
		this.setStateSafely({ pSeries, pSeriesDialogShown: false });
		withProgress(
			postApi(`/type-curve/${typeCurve._id}/updatePSeries`, { percentile: pSeries }),
			'P-Series saved successfully'
		);
	};

	handleRunEcon = () => {
		const { onRunEcon } = this.props;
		const { assumptions, headers, pSeries } = this.state;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onRunEcon(assumptions, headers ?? ({} as any), pSeries);
	};

	handleCreateQualifier = ({ column, name }: { column: string; name: string }) => {
		const { project, typeCurve } = this.props;
		const { _id: typeCurveId } = typeCurve;
		withProgress(
			postApi(`/type-curve/${typeCurveId}/createUmbrella`, {
				column,
				name,
				projectId: project._id,
			}).then(async (created) => {
				const { activeUmbrellas } = await postApi(`/type-curve/${typeCurveId}/setActiveUmbrella`, {
					column,
					umbrellaId: created._id,
				});
				this.setStateSafely(({ umbrellas }) => ({
					activeUmbrellas,
					umbrellas: [...umbrellas, created],
				}));
			}),
			`Qualifier "${name}" created successfully`
		);
	};

	handleChangeQualifier = (umbrellaId: string | null, defaultColumn: string) => {
		const { typeCurve } = this.props;
		const { _id: typeCurveId } = typeCurve;

		withProgress(
			postApi(`/type-curve/${typeCurveId}/applyUmbrella`, {
				umbrellaId,
				column: defaultColumn,
			}).then((newTypeCurve) => {
				const { activeUmbrellas, assumptions, headers, pSeries } = newTypeCurve;
				this.setStateSafely({
					activeUmbrellas,
					assumptions,
					headers,
					pSeries: pSeries?.percentile,
				});
			}),
			'Qualifier applied successfully'
		);
	};

	handleHideAssumptionsDialog = async () => {
		const { typeCurve } = this.props;
		this.setStateSafely({ assumptionsDialog: null });

		try {
			const assumptions = await getApi(`/type-curve/${typeCurve._id}/assumptions`);
			this.setStateSafely({ assumptions });
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	handleUseModel = async ({ model }) => {
		const { typeCurve } = this.props;
		const { _id: assumptionId, assumptionKey, name } = model;

		try {
			await withAsync(
				postApi(`/type-curve/${typeCurve._id}/saveAssumption`, {
					assumptionKey,
					assumptionId,
				})
			);
			confirmationAlert(`${name} Assigned`, 1000);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	removeAssumption = async (assumptionKey: AssumptionKey) => {
		const { typeCurve } = this.props;
		const { assumptions } = this.state;
		try {
			await withAsync(
				postApi(`/type-curve/${typeCurve._id}/saveAssumption`, {
					assumptionKey,
					assumptionId: null,
				})
			);
			this.setState({
				assumptions: {
					...assumptions,
					[assumptionKey]: null,
				},
			});
			confirmationAlert('Model Removed', 1000);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	handleEditAssumption = (key: AssumptionKey) => {
		const { assumptions } = this.state;

		this.setStateSafely({
			assumptionsDialog: {
				key,
				selectedModels: mapValues(assumptions, '_id'),
				chooseModel: this.handleUseModel,
			},
		});
	};

	render() {
		const { typeCurve, canUpdateTypeCurve } = this.props;
		const {
			activeUmbrellas,
			assumptions,
			assumptionsDialog,
			headers,
			headersDialogShown,
			pSeries,
			pSeriesDialogShown,
			umbrellas,
		} = this.state;
		const umbrellasByColumn = groupBy(umbrellas, 'column');

		return (
			<Paper className='assumptions-card'>
				{headersDialogShown && (
					<EconTCHeadersDialog
						visible
						headers={headers || typeCurve.headers}
						// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
						resolve={this.handleApplyHeaders}
						onHide={this.handleHideHeadersDialog}
					/>
				)}
				{pSeriesDialogShown && (
					<ChoosePSeriesDialog
						// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
						resolve={this.handleApplyPSeries}
						onHide={this.handleHidePSeriesDialog}
						pSeries={pSeries}
						visible
					/>
				)}
				<GridItemDialog
					data={assumptionsDialog || {}}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					hideDialog={this.handleHideAssumptionsDialog}
					visible={!!assumptionsDialog}
				/>

				<CardActions className='assumptions-card__header'>
					<div className='title'>
						<h3 className='md-text'>Assumptions</h3>
					</div>
				</CardActions>

				<div
					css={`
						flex-grow: 1;
						overflow: hidden;
					`}
				>
					<CardContent className='assumptions-card__body'>
						{renderSection({
							title: 'Headers',
							onClick: this.handleShowHeadersDialog,
							value: headers && 'Click to Edit',
							showWarning: !this.validHeaders(),
							disabled: !canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE,
							umbrellaMenu: (
								<UmbrellaSelectMenu
									column='headers'
									containerClassName='umbrella-menu-container'
									onCreate={this.handleCreateQualifier}
									onSelect={this.handleChangeQualifier}
									selectedId={activeUmbrellas.headers}
									umbrellas={umbrellasByColumn.headers || []}
									canUpdate={canUpdateTypeCurve}
								/>
							),
						})}
						{renderSection({
							title: 'P-Series',
							onClick: this.handleShowPSeriesDialog,
							value: pSeries,
							disabled: !canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE,
							umbrellaMenu: (
								<UmbrellaSelectMenu
									column='pSeries'
									containerClassName='umbrella-menu-container'
									onCreate={this.handleCreateQualifier}
									onSelect={this.handleChangeQualifier}
									selectedId={activeUmbrellas.pSeries}
									umbrellas={umbrellasByColumn.pSeries || []}
									canUpdate={canUpdateTypeCurve}
								/>
							),
						})}
						<div>
							<div
								className='assumption-list'
								css={`
									& > :not(:first-child) {
										margin-top: ${({ theme }) => theme.spacing(2)}px;
									}
								`}
							>
								{assumptions &&
									ASSUMPTION_ORDER.map((key) => {
										const ass = assumptions[key];
										const column = `assumptions.${key}`;
										const showWarning = REQUIRED_ASS_KEYS.includes(key) && !ass;
										const tooltip = TOOLTIPS[key];

										return (
											<div className='ass-container' key={key}>
												<InfoTooltipWrapper
													tooltipTitle={tooltip}
													placeIconAfter
													iconFontSize='18px'
												>
													<div
														className={classNames('ass-title', showWarning && 'warn-icon')}
													>
														{ASSUMPTIONS_LABELS[key]}
														{showWarning && (
															<FontAwesomeIcon
																className='right-btn-icon warn-icon'
																icon={faExclamation}
																color='error'
																title='This is a required field'
															/>
														)}
													</div>
												</InfoTooltipWrapper>

												<div>
													<UmbrellaSelectMenu
														column={column}
														containerClassName='umbrella-menu-container'
														onCreate={this.handleCreateQualifier}
														onSelect={this.handleChangeQualifier}
														selectedId={get(activeUmbrellas, column)}
														umbrellas={umbrellasByColumn[column] || []}
														canUpdate={canUpdateTypeCurve}
													/>
													<div className='ass-btn'>
														<MenuButton
															id='default-model-btn'
															className={classNames(
																'text-ellip',
																'unset-text-transform',
																'ass-container__button',
																!assumptions[key] && 'warn-btn-flat'
															)}
															color={assumptions[key] ? 'primary' : undefined}
															css={`
																justify-content: flex-start;
															`}
															label={
																<span className='text-ellip'>
																	{ass ? ass.name : 'None'}
																</span>
															}
															fullWidth
														>
															<MenuItem
																disabled={
																	!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE
																}
																onClick={() => this.handleEditAssumption(key)}
															>
																Choose Model
															</MenuItem>
															{assumptions[key] && (
																<MenuItem
																	disabled={
																		!canUpdateTypeCurve &&
																		PERMISSIONS_TOOLTIP_MESSAGE
																	}
																	onClick={() => this.removeAssumption(key)}
																>
																	Remove Assignment
																</MenuItem>
															)}
														</MenuButton>
													</div>
												</div>
											</div>
										);
									})}
							</div>
						</div>
					</CardContent>
				</div>
				<CardActions className='assumptions-card__footer'>
					<Button
						color='primary'
						disabled={(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || !this.canRun()}
						onClick={this.handleRunEcon}
						tooltipPlacement='top'
					>
						Run Econ
					</Button>
				</CardActions>
			</Paper>
		);
	}
}
