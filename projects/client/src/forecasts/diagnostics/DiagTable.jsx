/* eslint react/jsx-key: warn */
import { LARGE_NUMBER, convertIdxToDate } from '@combocurve/forecast/helpers';
import { faBinoculars, faDownload, faPercentage, faSortNumericUp, faTint } from '@fortawesome/pro-light-svg-icons';
import { faArrowDown, faArrowUp, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TablePagination from '@material-ui/core/TablePagination';
import classNames from 'classnames';
import _ from 'lodash';
import { round } from 'lodash-es';
import { Component } from 'react';
import styled from 'styled-components';

import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { Button as ButtonReactMD, DataTable, TableBody, TableColumn, TableHeader, TableRow } from '@/components';
import { usePaginatedArray } from '@/components/hooks';
import { withHook } from '@/components/shared';
import { Button, ButtonItem, IconButton, MenuButton, Paper, Stack, Typography } from '@/components/v2';
import { InfoTooltipWrapper } from '@/components/v2/misc';
import SelectForecastDialog from '@/forecasts/comparison/SelectForecastDialog';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { genForecastFileName } from '@/forecasts/download-forecast/shared';
import {
	MenuSelect,
	SearchTextField,
	StatusFilterMenuButton,
	TypeFilterMenuButton,
	UpdateStatusMenuBtn,
	getMenuItems,
} from '@/forecasts/shared';
import { genericErrorAlert } from '@/helpers/alerts';
import { makeLocal } from '@/helpers/date';
import { getApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { compareArrs, genDate, numberWithCommas } from '@/helpers/utilities';
import { exportXLSX } from '@/helpers/xlsx';
import { fields as forecastStatuses } from '@/inpt-shared/display-templates/forecast-data/forecast-status.json';
import { fields as forecastTypes } from '@/inpt-shared/display-templates/forecast-data/forecast-types.json';
import { fields as wellTypes } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { WELLS_COLLECTION_FIELD_KEY } from '@/manage-wells/WellsPage/TableView/CollectionTable/shared';
import { getHeaders } from '@/type-curves/shared/useHeaders';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { useSaveWellIdsAsFilter } from '@/well-filter/utils';
import { showWellFilter } from '@/well-filter/well-filter';

import PreviewForecast from '../preview-forecast/PreviewForecast';
import DiagThresholdDialog from './DiagThresholdDialog';
import { COMPARISON_FIELDS, COMPARISON_FIELDS_TOOLTIPS, diagLabels, diagProps, diagUnits } from './shared';

/**
 * Proxy to the `usePaginatedArray` hook
 *
 * @example
 * 	<Paginated data={[1, 2, 3, 4, 5]}>{([slice, pagination]) => slice.map()}</Paginated>;
 */
function Paginated({ data, refresh, children }) {
	const [slice, pagination] = usePaginatedArray(data, {}, refresh);
	return children([slice, pagination]);
}

const dirArrows = [
	// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
	<FontAwesomeIcon className='left-btn-icon primary-icon' icon={faArrowDown} />,
	// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
	<FontAwesomeIcon className='left-btn-icon primary-icon' icon={faArrowUp} />,
];

const additionalHeaders = [
	'perf_lateral_length',
	'total_proppant_per_perforated_interval',
	'total_fluid_per_perforated_interval',
	'total_proppant_per_fluid',
];

const WellNameLabel = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const diagnosticTooltips = {
	diagDate: 'Last time run diagnostic on this well',
	data_freq: 'Data resolution used to generate forecast on this well, default to monthly when no forecast has run',
	forecastStatus: 'Approval status of a phase forecast',
	forecast_start_date: 'The day where phase forecast starts',
	forecast_end_date: 'The day where phase forecast ends',
	qi: 'Start rate of forecast',
	q_end: 'End rate of forecast',
	eur1: 'Cumulative production within 1 year since FPD. If historical data is shorter than 1 year, the forecast will be used instead to fill the rest',
	eur3: 'Cumulative production within 3 years since FPD. If historical data is shorter than 3 years, the forecast will be used instead to fill the rest',
	eur5: 'Cumulative production within 5 years since FPD. If historical data is shorter than 5 years, the forecast will be used instead to fill the rest',
	// r2: 'R2 coefficient, adjusted < 0 values to be 0',
	mae: 'Mean absolute error, mean of |qi - qi_pred|',
	rmse: 'Root mean square error, square root of mean of (qi - qi_pred)^2',
	cum_diff:
		'Difference in cumulative production and cum forecast after forecast starts and before production ends, sum of (qi - qi_pred)',
	avg_diff: 'Average rate of production per day - average rate of forecast per day',
	cum_diff_percentage: 'Cum Difference divided by actual Cum Production.',
	median_ra: 'Median of (qi - qi_pred) / ((qi + qi_pred) / 2)',
	median_abs_ra: 'Median of |qi - qi_pred| / ((qi + qi_pred) / 2)',
	production_data_count: 'Number of production data for the phase',
	forecast_data_count: 'Number of production data after forecast start date',
	eur: 'Estimated ultimate recovery: an approximation of the quantity that is potentially recoverable or has already been recovered from a reserve or well',
	'qi/LL': 'qi divided by Perf Lateral Length',
	'qi/Prop': 'qi divided by Total Proppant',
	'eur-cum': 'EUR minus cumulative production',
	'eur/LL': 'EUR divided by Perf Lateral Length',
	'eur/Prop': 'EUR divided by Total Proppant',
	well_life: 'Duration from first production date to the forecast end date',
	last_1_month_prod_avg: 'Average production rate for the last one month.',
	last_3_month_prod_avg: 'Average production rate for the last three months.',
	qi_peak_monthly: 'Maximum monthly production rate.',
	qi_peak_daily: 'Maximum daily production rate.',
	time_to_qi_peak_monthly: 'Number of days from first production date to maximum monthly production rate.',
	time_to_qi_peak_daily: 'Number of days from first production date to maximum daily production rate.',
};

const generateCellTextForDiagProps = (value) => {
	if (value !== null) {
		return value === LARGE_NUMBER ? 'Large Number' : numberWithCommas(round(value, 2));
	}
	return 'N/A';
};

export const DIAG_SPECIFIC_HEADERS = [
	// for table and download
	'well_name',
	'wells_collection_items',
	'well_number',
	'perf_lateral_length',
	'total_proppant_per_perforated_interval',
	'total_fluid_per_perforated_interval',
	'total_proppant_per_fluid',
	// for download
	'api10',
	'api12',
	'api14',
	'aries_id',
	'basin',
	'chosenID',
	'county',
	'elevation_type',
	'first_fluid_per_perforated_interval',
	'first_prod_date_daily_calc',
	'first_prod_date_monthly_calc',
	'first_prod_date',
	'first_proppant_per_perforated_interval',
	'has_daily',
	'has_monthly',
	'inptID',
	'landing_zone',
	'last_prod_date_daily',
	'last_prod_date_monthly',
	'lateral_length',
	'lease_name',
	'pad_name',
	'primary_product',
	'surfaceLatitude',
	'surfaceLongitude',
	'total_fluid_volume',
	'total_prop_weight',
	'total_stage_count',
	'true_vertical_depth',
	'type_curve_area',
];
class DiagTable extends Component {
	_isMounted = false;

	constructor(props) {
		super(props);
		this.state = {
			comparisonDialogVisible: false,
			loaded: false,
			previewForecast: {
				initWell: null,
				visible: false,
			},
			search: '',
			thresholdDialog: { reject: null, resolve: null, visible: false },
		};
	}

	async componentDidMount() {
		this._isMounted = true;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ loaded: true }, this.getComparisonNames);
	}

	componentDidUpdate(prevProps) {
		const { comparisonProps, resetKeyProps, setSort } = this.props;
		const comparisonsUpdated = !compareArrs(comparisonProps?.ids, prevProps?.comparisonProps?.ids ?? []);
		const resetKeyPropsChanged = resetKeyProps !== prevProps.resetKeyProps;

		if (comparisonsUpdated) {
			this.getComparisonNames(comparisonProps);
		}
		if (resetKeyPropsChanged) {
			setSort({ sortKey: null, sortDir: true });
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

	getComparisonNames = async (propsIn = null) => {
		const { comparisonProps, setComparisonNames } = this.props;
		const ids = propsIn?.ids ?? comparisonProps?.ids;

		try {
			if (ids?.length) {
				const names = await getApi('/forecast/names', { ids });
				setComparisonNames(names);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	setSortKey = (key) => {
		const { setSort, sortKey, sortDir } = this.props;
		const dir = key === sortKey ? !sortDir : true;
		setSort({ sortKey: key, sortDir: dir });
	};

	searchWells = () => {
		const { search } = this.state;
		const { diagData, filter } = this.props;

		if (search?.length) {
			const regexp = new RegExp(_.escapeRegExp(search), 'i');
			const wellIds = diagData.filter((datum) => regexp.test(datum.headers.well_name)).map((datum) => datum.well);

			filter('search', wellIds);
		} else {
			filter('search', null);
		}
	};

	showThresholdDialog = () => {
		new Promise((resolve, reject) => {
			const thresholdDialog = { resolve, reject, visible: true };
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ thresholdDialog });
		})
			.then((threshold) => {
				const { setSort, thresholdFilter } = this.props;
				const thresholdDialog = { resolve: null, reject: null, visible: false };
				thresholdFilter(threshold);
				setSort({ sortKey: null });
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.SetState({ thresholdDialog });
			})
			.catch(() => {
				const thresholdDialog = { resolve: null, reject: null, visible: false };
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.SetState({ thresholdDialog });
			});
	};

	handleQuickFilterWells = (wellIds) => {
		const { filter } = this.props;
		filter('well_filter', wellIds);
	};

	showWellFilter = async () => {
		const { filter, diagData, forecast } = this.props;

		const wells = await showWellFilter({
			isFiltered: false,
			totalWells: `${forecast.wells.length} wells in Forecast`,
			type: 'filter',
			wells: diagData.map((d) => d.well),
		});

		if (wells) {
			try {
				filter('well_filter', wells);
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	};

	openForecastPreview = (wellId) => {
		const previewForecast = {
			initWell: wellId,
			visible: true,
		};

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ previewForecast });
	};

	downloadTable = () => {
		const { diagData, comparisonProps, comparisonNames, forecast, phase } = this.props;
		if (!diagData.length) {
			return;
		}

		const { headers: rawWellHeaders } = getHeaders({ diagnostics: true });
		const wellHeaders = _.reduce(
			rawWellHeaders,
			(result, value, key) => {
				if (DIAG_SPECIFIC_HEADERS.includes(key)) {
					result[key] = value;
				}
				return result;
			},
			{}
		);

		const genHeader = (header, units) => `${header}${units?.[phase] ? ` (${units[phase]})` : ''}`;

		const wellHeadersHeaders = ['Well Name', ...Object.values(wellHeaders).filter((val) => val !== 'Well Name')];
		const diagPropsHeaders = diagProps.map(({ header, units }) => genHeader(header, units));
		const comparisonHeaders = comparisonProps?.ids
			.map((id) =>
				COMPARISON_FIELDS.map((field) =>
					genHeader(`${comparisonNames?.[id]} ${diagLabels[field]}`, diagUnits[field][phase])
				)
			)
			.flat();

		const sheet = {
			data: [],
			headers: [...wellHeadersHeaders, 'Resolution', ...diagPropsHeaders, ...comparisonHeaders],
			name: 'Diagnostics',
		};

		sheet.data = diagData.map((data) => {
			const datum = {
				'Well Name': data.headers.well_name,
			};

			Object.entries(wellHeaders).forEach(([key, value]) => {
				if (data?.headers?.[key]) {
					if (wellTypes[key]?.type === 'date') {
						datum[value] = genDate(makeLocal(new Date(data.headers[key])));
					} else {
						datum[value] = data.headers[key];
					}
				} else {
					datum[value] = '';
				}
			});

			// hard-code resolution for now. Needs to be placed here for ordering
			datum.Resolution = data?.data_freq ? capitalize(data.data_freq) : 'N/A';

			diagProps.forEach(({ header, key, units }) => {
				datum[genHeader(header, units)] = data.diagnostics[key];
			});

			comparisonProps?.ids.forEach((id) =>
				COMPARISON_FIELDS.forEach((field) => {
					datum[genHeader(`${comparisonNames?.[id]} ${diagLabels[field]}`, diagUnits[field][phase])] =
						Number.isFinite(data.diagnostics?.[id]?.[field]) ? data.diagnostics[id][field] : '';
				})
			);

			return datum;
		});

		exportXLSX({
			fileName: genForecastFileName(forecast.name, 'diagnostics'),
			sheets: [sheet],
		});
	};

	onConfirmComparison = (ids, resolutions) => {
		const { setResetKeyProps, resetKeyProps, setComparisonProps } = this.props;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ comparisonDialogVisible: false }, () => {
			setComparisonProps({ ids, resolutions });
			setResetKeyProps(!resetKeyProps);
		});
	};

	getLoadingMessage = () => {
		const { forecast, isLoading, tableLoaded } = this.props;
		if (forecast?.diagDate) {
			if (!tableLoaded || isLoading) {
				return 'Table data is loading...';
			}
			return 'No wells to display...';
		}
		return 'Diagnostics has not been run yet. Click  Diagnostics Form above to get started.';
	};

	paginatedRender = (data) => {
		const { sortKey, sortDir } = this.props;
		const {
			comparisonProps,
			comparisonNames,
			diagData,
			forecast,
			phase,
			selectedWells,
			threshold,
			toggleManualSelect,
			toggleAll,
		} = this.props;

		const { headers: wellHeaders } = getHeaders();
		const hasWellCollections = diagData.some((datum) => !!datum.headers?.[WELLS_COLLECTION_FIELD_KEY]);

		const renderColumn = ({
			key,
			htmlKey,
			label,
			tooltipTitle = diagnosticTooltips[key],
			large = false,
			subheader,
			prefix = '',
			title,
		}) => {
			return (
				<TableColumn
					key={htmlKey || `${prefix}${key}`}
					className={classNames('header-content text-ellip', large && 'large-col-size')}
					title={title}
				>
					<div
						className={classNames('header-container', large && 'left-padding')}
						onClick={() => this.setSortKey(`${prefix}${key}`, true)}
						role='button'
						tabIndex='-1'
					>
						<InfoTooltipWrapper tooltipTitle={tooltipTitle}>
							<span className='header-prop'>
								{sortKey === `${prefix}${key}` && dirArrows[Number(sortDir)]}
								{label}
							</span>
						</InfoTooltipWrapper>

						{subheader && <span className='subheader'>{subheader}</span>}
					</div>
				</TableColumn>
			);
		};

		return (
			<DataTable
				css={`
					width: 100%;
					height: 100%;
				`}
				overflow
				id='diag-table'
				baseId='diag-table'
				onRowToggle={(idx, checked) =>
					idx === 0
						? toggleAll({
								checked,
								wellIds: diagData.map((val) => val.well),
								suppressConfirmation: true,
						  })
						: toggleManualSelect({ checked, wellId: data[idx - 1]?.well })
				}
			>
				<TableHeader>
					<TableRow selected={diagData.every((val) => selectedWells.has(val.well))}>
						{renderColumn({
							key: 'well_name',
							label: 'Well Name',
							large: true,
							prefix: 'headers.',
						})}
						{renderColumn({ key: 'well_number', label: 'Well Number', prefix: 'headers.' })}
						{hasWellCollections &&
							renderColumn({
								key: WELLS_COLLECTION_FIELD_KEY,
								label: 'Is Well Collection?',
								prefix: 'headers.',
							})}
						{renderColumn({
							key: 'diagDate',
							label: 'Last Diagnosed',
						})}
						{renderColumn({
							key: 'data_freq',
							label: 'Forecast Generated On',
						})}
						{forecast.type !== 'deterministic' &&
							renderColumn({
								key: 'forecastType',
								label: 'Forecast Type',
							})}

						{renderColumn({
							key: 'forecastStatus',
							label: 'Forecast Status',
						})}

						{additionalHeaders.map((header) =>
							renderColumn({ key: header, label: wellHeaders[header], prefix: 'headers.' })
						)}

						{renderColumn({
							key: 'forecast_start_date',
							label: 'Forecast Start Date',
							prefix: 'diagnostics.',
						})}

						{renderColumn({
							key: 'forecast_end_date',
							label: 'Forecast End Date',
							prefix: 'diagnostics.',
						})}

						{diagProps.map((prop) =>
							renderColumn({
								key: prop.key,
								prefix: 'diagnostics.',
								label: prop.text,
								tooltipTitle: diagnosticTooltips[prop.key],
								subheader: (
									<>
										{Boolean(prop.units[phase].length) && (
											<span css='margin-left: 0.25rem'>{`(${prop.units[phase]})`}</span>
										)}
										{threshold?.[prop.key]?.values?.[0].length ||
										threshold?.[prop.key]?.values?.[1].length ? (
											<span className='thresh-box'>
												<span className='lower'>
													{!!threshold?.[prop.key]?.values?.[0].length && (
														<>
															{threshold?.[prop.key]?.between ? '>' : '<'}
															&nbsp;
															{threshold?.[prop.key]?.values?.[0]}
														</>
													)}
												</span>

												{!!threshold?.[prop.key]?.values?.[0].length &&
													!!threshold?.[prop.key]?.values?.[1].length && <span> | </span>}

												<span className='upper'>
													{!!threshold?.[prop.key]?.values?.[1].length && (
														<>
															{threshold?.[prop.key]?.between ? '<' : '>'}
															&nbsp;
															{threshold?.[prop.key]?.values?.[1]}
														</>
													)}
												</span>
											</span>
										) : (
											<span />
										)}
									</>
								),
							})
						)}

						{comparisonProps?.ids.flatMap((id) =>
							COMPARISON_FIELDS.map((field) => {
								const label = `${comparisonNames?.[id]} - ${diagLabels[field]}`;
								return renderColumn({
									key: field,
									title: label,
									prefix: `diagnostics.${id}.`,
									tooltipTitle: COMPARISON_FIELDS_TOOLTIPS[field],
									label,
									subheader: `(${diagUnits[field][phase]})`,
								});
							})
						)}
					</TableRow>
				</TableHeader>

				<TableBody>
					{data.map((d) => (
						<TableRow
							className='finger diagnostics-table-row'
							key={d.well}
							selected={selectedWells.has(d.well)}
						>
							<TableColumn key={`${d.well}-well_name`} className='body-content text-ellip large-col-size'>
								<ButtonReactMD
									className='open-preview-btn unset-text-transform text-ellip'
									flat
									onClick={() => this.openForecastPreview(d.well)}
									title={`Open Forecast Preview For ${d.headers.well_name}`}
								>
									<WellNameLabel>{d.headers.well_name}</WellNameLabel>
								</ButtonReactMD>
							</TableColumn>

							<TableColumn key={`${d.well}-well_number`} className='body-content text-ellip'>
								{d?.headers?.well_number || 'N/A'}
							</TableColumn>

							{hasWellCollections && (
								<TableColumn key={`${d.well}-is_well_collection`} className='body-content text-ellip'>
									{d?.headers?.[WELLS_COLLECTION_FIELD_KEY] ? 'Yes' : 'No'}
								</TableColumn>
							)}

							<TableColumn key={`${d.well}-diag_date`} className='body-content text-ellip'>
								{d?.diagDate ? genDate(d.diagDate) : 'N/A'}
							</TableColumn>

							<TableColumn key={`${d.well}-data_freq`} className='body-content text-ellip'>
								{d?.data_freq ? capitalize(d.data_freq) : 'N/A'}
							</TableColumn>

							{forecast.type !== 'deterministic' && (
								<TableColumn key={`${d.well}-forecastType`} className='body-content text-ellip'>
									{d?.forecastType ? forecastTypes[d.forecastType].label : 'N/A'}
								</TableColumn>
							)}

							<TableColumn key={`${d.well}-status`} className='body-content text-ellip'>
								{d?.status ? forecastStatuses[d.status].label : 'N/A'}
							</TableColumn>

							{additionalHeaders.map((header) => {
								let value;
								if (typeof d?.headers?.[header] === 'string') {
									value = d.headers.header;
								} else if (Number.isFinite(d?.headers?.[header])) {
									value = numberWithCommas(round(d?.headers?.[header], 2));
								} else {
									value = null;
								}

								return (
									<TableColumn key={`${d.well}-${header}`} className='body-content text-ellip'>
										{value || 'N/A'}
									</TableColumn>
								);
							})}

							<TableColumn key={`${d.well}-forecast_start_date`} className='body-content text-ellip'>
								{Number.isFinite(d?.diagnostics?.forecast_start_date)
									? genDate(convertIdxToDate(d?.diagnostics?.forecast_start_date))
									: 'N/A'}
							</TableColumn>

							<TableColumn key={`${d.well}-forecast_end_date`} className='body-content text-ellip'>
								{Number.isFinite(d?.diagnostics?.forecast_end_date)
									? genDate(convertIdxToDate(d?.diagnostics?.forecast_end_date))
									: 'N/A'}
							</TableColumn>

							{diagProps.map((prop) => (
								<TableColumn key={`${d.well}-self-${prop.key}`} className='body-content text-ellip'>
									{generateCellTextForDiagProps(d.diagnostics[prop.key])}
								</TableColumn>
							))}

							{comparisonProps?.ids
								.map((id) =>
									COMPARISON_FIELDS.map((field) => (
										<TableColumn
											key={`${d.well}-${id}-${field}`}
											className='body-content text-ellip'
										>
											{Number.isFinite(d.diagnostics?.[id]?.[field])
												? generateCellTextForDiagProps(d.diagnostics[id][field])
												: 'N/A'}
										</TableColumn>
									))
								)
								.flat()}
						</TableRow>
					))}
				</TableBody>
			</DataTable>
		);
	};

	renderTitle = () => {
		const { search } = this.state;
		const {
			allDataLoaded,
			disableForecastTasks,
			diagData,
			filter,
			filterActive,
			filterForecastProp,
			forecast,
			forecastProps,
			handleShowDiagForm,
			onClearFilter,
			phase,
			saveWellIdsAsFilter,
			selectedWells,
			series,
			clearStateAndReload,
			toggleAll,
			setPhase,
			setSeries,
		} = this.props;

		const handleClearFilter = () => {
			onClearFilter();
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ search: '' });
		};

		const wellIds = diagData.map((d) => d.well);

		return (
			<Stack direction='row' alignItems='center' spacing={1}>
				<SearchTextField
					value={search}
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					onChange={(val) => this.SetState({ search: val })}
					onApply={() => this.searchWells()}
					placeholder='Search By Well Name'
				/>
				<WellFilterButton
					secondary
					wellIds={wellIds}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onFilterWells={this.showWellFilter}
					onQuickFilter={this.handleQuickFilterWells}
					disabled={!forecast?.diagDate || !allDataLoaded}
				/>

				<Can
					do={ACTIONS.Update}
					on={subject(SUBJECTS.Forecasts, { project: forecast?.project._id })}
					passThrough
				>
					{(allowed) => (
						<Button
							color='secondary'
							onClick={handleShowDiagForm}
							disabled={(!allowed && PERMISSIONS_TOOLTIP_MESSAGE) || disableForecastTasks}
						>
							Diagnostic Form
						</Button>
					)}
				</Can>
				<IconButton
					color='secondary'
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onClick={this.downloadTable}
					tooltipTitle='Download Diagnostics'
					disabled={!forecast?.diagDate || !allDataLoaded}
					size='medium'
					{...getTaggingProp('forecast', 'downloadDiagnostics')}
				>
					{faDownload}
				</IconButton>

				<IconButton
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					onClick={() => this.SetState({ comparisonDialogVisible: true })}
					color='secondary'
					tooltipTitle='Select Forecasts For Comparison'
					disabled={!forecast?.diagDate || !allDataLoaded}
					size='medium'
				>
					{faBinoculars}
				</IconButton>

				{filterActive > 0 && (
					<IconButton size='medium' onClick={handleClearFilter} color='error' tooltipTitle='Clear Filter'>
						{faTimes}
					</IconButton>
				)}

				<MenuButton
					tooltipTitle='Editing Options'
					disabled={!forecast?.diagDate || !allDataLoaded}
					color='secondary'
					label={`Edit (${selectedWells?.size})`}
				>
					<ButtonItem onClick={() => filter('edit', [...selectedWells])} label='Filter On Selected Wells' />
					<ButtonItem onClick={() => toggleAll({ checked: false })} label='Remove All Wells From Editing' />
					<ButtonItem
						onClick={() => saveWellIdsAsFilter([...selectedWells])}
						label='Save Editing Bucket As Well Filter'
					/>
				</MenuButton>

				<UpdateStatusMenuBtn
					disabled={!forecast?.diagDate || !allDataLoaded}
					forecastId={forecast._id}
					onComplete={() => clearStateAndReload({ runAllWells: true })}
					phase={phase}
					project={forecast?.project}
					wells={wellIds}
				/>

				<MenuSelect
					value={phase}
					onChange={(val) => {
						const { setSort } = this.props;
						setSort({ sortKey: null });
						setPhase(val);
					}}
					items={getMenuItems(['gas', 'oil', 'water'])}
					disabled={!forecast?.diagDate || !allDataLoaded}
					color='purple'
					startIcon={faTint}
				/>

				{forecast.type !== 'deterministic' && (
					<>
						<MenuSelect
							onChange={(val) =>
								// eslint-disable-next-line new-cap -- TODO eslint fix later
								this.SetState({ sortKey: null }, () => {
									setSeries(val);
									clearStateAndReload({ runAllWells: true });
								})
							}
							value={series}
							disabled={!forecast?.diagDate || !allDataLoaded}
							startIcon={faPercentage}
							items={getMenuItems(['P50', 'best'])}
							color='purple'
						/>

						<TypeFilterMenuButton
							value={forecastProps.forecastType}
							onChange={(val) => filterForecastProp('forecastType', val)}
							disabled={!allDataLoaded}
							exclusive
						/>
					</>
				)}

				<StatusFilterMenuButton
					disabled={!forecast?.diagDate || !allDataLoaded}
					value={forecastProps.status}
					onChange={(val) => filterForecastProp('status', val)}
					exclusive
				/>

				<Button
					disabled={!forecast?.diagDate || !allDataLoaded}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onClick={this.showThresholdDialog}
					color='primary'
					startIcon={faSortNumericUp}
				>
					Thresholds
				</Button>
			</Stack>
		);
	};

	render() {
		const { comparisonDialogVisible, loaded, previewForecast, thresholdDialog } = this.state;
		const { comparisonProps, diagData, forceReload, forecast, refresh, resetManualBucket, threshold } = this.props;

		const wellIds = diagData.map((d) => d.well);

		if (!loaded) {
			return <div className='loading-container'>Loading...</div>;
		}

		return (
			<section id='diag-table-container'>
				<Paginated data={diagData} refresh={refresh}>
					{([slice, pagination]) => (
						<Paper
							css={`
								height: 100%;
								display: flex;
								overflow: hidden;
								flex-direction: column;
							`}
						>
							<div
								css={`
									display: flex;
									align-items: center;
								`}
							>
								<ForecastToolbarTheme>{this.renderTitle()}</ForecastToolbarTheme>

								<div css={{ flex: 1 }} />

								<TablePagination
									component='div'
									count={pagination.total}
									page={pagination.page}
									rowsPerPage={pagination.itemsPerPage}
									onPageChange={(ev, newPage) => pagination.onChangePage(newPage)}
									onRowsPerPageChange={(ev) => pagination.onChangeItemsPerPage(ev.target.value)}
									rowsPerPageOptions={[5, 10, 25, 50]}
								/>
							</div>

							<Typography
								css={`
									align-items: center;
									display: flex;
									flex: 1;
									height: 100%;
									justify-content: center;
									overflow: hidden;
									width: 100%;
								`}
								variant='h4'
							>
								{slice.length ? this.paginatedRender(slice) : this.getLoadingMessage()}
							</Typography>
						</Paper>
					)}
				</Paginated>

				<DiagThresholdDialog {...thresholdDialog} threshold={threshold} diagLabels={diagLabels} />

				<PreviewForecast
					{...previewForecast}
					close={(reload = false) => {
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						this.SetState({ previewForecast: { initWell: null, visible: false } }, () => {
							resetManualBucket();
							if (reload) {
								forceReload();
							}
						});
					}}
					comparisonKey='diagnostics'
					comparisonProps={comparisonProps}
					fId={forecast._id}
					source='forecast'
					wells={wellIds}
				/>

				<SelectForecastDialog
					comparisonIds={comparisonProps.ids}
					comparisonKey='diagnostics'
					comparisonResolutions={comparisonProps.resolutions}
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					onClose={() => this.SetState({ comparisonDialogVisible: false })}
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onConfirm={this.onConfirmComparison}
					projectId={forecast?.project?._id}
					refForecastId={forecast?._id}
					visible={comparisonDialogVisible}
				/>
			</section>
		);
	}
}

DiagTable.defaultProps = {
	diagData: [],
	selectedWells: new Set(),
	wells: [],
};

export default withHook(DiagTable, useSaveWellIdsAsFilter, (saveWellIdsAsFilter) => ({ saveWellIdsAsFilter }));
