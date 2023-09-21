/* eslint react/jsx-key: warn */
import { faChevronLeft, faChevronRight, faCompass } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useMatch, useNavigate } from 'react-router-dom';

import { Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { PageField, Placeholder } from '@/components';
import { useCallbackRef, useMergedState } from '@/components/hooks';
import { Divider, IconButton } from '@/components/v2';
import { invalidateForecastChartQueries, useForecast } from '@/forecasts/api';
import ChartHeaderProvider from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { ControlsContainer, ForecastToolbarTheme, GridControlLayout } from '@/forecasts/deterministic/layout';
import { ForecastForm } from '@/forecasts/forecast-form/ForecastForm';
import { DEFAULT_FORECAST_MENU_VALUES } from '@/forecasts/shared';
import { genericErrorAlert, withAsync, withDoggo } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { intersect } from '@/helpers/math';
import { getApi, postApi } from '@/helpers/routing';
import { ACTIONS } from '@/inpt-shared/access-policies/shared';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { UserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import CachedPagination from '@/pagination/CachedPagination';
import { projectRoutes } from '@/projects/routes';
import { showWellFilter } from '@/well-filter/well-filter';

import useViewDialogs from '../deterministic/useViewDialogs';
import { Phase } from '../forecast-form/automatic-form/types';
import ImportForecastDialog from './ImportForecastDialog';
import ViewForecastActions from './ViewForecastActions';
import ViewForecastChartGrid from './ViewForecastChartGrid';

import './viewForecast.scss';

const MAX_CHARTS = 4;
const filterKeys = ['edit', 'search', 'wellFilter'];
const ViewForecast = ({ setIsComparisonActive, bucket, toggleAll, toggleManualSelect, disableForecastTasks }) => {
	const navigate = useNavigate();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRoutes.project(':projectId').forecast(':id').root}/*`);
	const id = match?.params.id;

	const forecastDocumentQuery = useForecast(id);
	const forecast = forecastDocumentQuery.data;

	const [changes, setChanges] = useState(false);
	const [curTask, setCurTask] = useState(null);
	const [data, setData] = useState([]);
	const [loaded, setLoaded] = useState(false);
	const [phase, setPhase] = useState<Phase | 'all'>('oil');
	const [resolution, setResolution] = useState('monthly');
	const [showLoadStatus, setShowLoadStatus] = useState(false);
	const [sorting, setSorting] = useState([{ field: 'well_name', direction: 1 }]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [viewContainerEl, setViewContainerEl] = useState<any>(null);
	const [wells, setWells] = useState([]); // current well data set;

	const [graphSettings, setGraphSettings] = useMergedState({
		allPName: 'best',
		display: MAX_CHARTS,
		enableLegend: true,
		lineScatter: true,
		loadingPage: false,
		logScale: true,
		refresh: false,
		sNames: ['best', 'P10', 'P50', 'P90'] as Array<string>,
		sString: 'all',
		xLogScale: false,
		...DEFAULT_FORECAST_MENU_VALUES,
	});

	const [forecastForm, setForecastForm] = useState<{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		reject: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		resolve: any;
		visible: boolean;
	}>({
		reject: null,
		resolve: null,
		visible: false,
	});

	const [forecastFilter, setForecastFilter] = useState({
		forecastType: [],
		wellName: '',
		status: [],
	});

	const [filter, setFilter] = useState<{
		edit?: Array<string> | null;
		search?: string | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		wellFilter?: Record<string, any> | null;
	}>({
		edit: null,
		search: null,
		wellFilter: null,
	});

	const { mutateAsync: getWellData } = useMutation(async (ids) => {
		return getApi(`/forecast/${forecast?._id}/data`, {
			wells: ids,
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
			resolution,
		});
	});

	const pageObj = useRef(new CachedPagination({ data: wells, limit: MAX_CHARTS, fetch: getWellData }));

	const { mutateAsync: adjustData } = useMutation(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const data: any = await withAsync(pageObj.current.getData());
		setChanges((u) => !u);
		setData(data);
		setLoaded(true);
		setShowLoadStatus(false);
	});

	const {
		addLastSegmentDialog,
		applyTcDialog,
		exportToAries,
		exportToAriesDialog,
		exportToCSV,
		exportToCSVDialog,
		forecastParametersDialog,
		openAddLastSegmentDialog,
		openApplyTcDialog,
		openForecastParametersDialog,
		openPhdParametersDialog,
		openReplaceFitParametersDialog,
		openResetWellForecastDialog,
		phdParametersDialog,
		replaceFitParametersDialog,
		resetWellForecastDialog,
	} = useViewDialogs({ forecast, wells });

	const [importForecastDialog, openImportForecastDialog] = useDialog(ImportForecastDialog, {
		adjustData,
		clearStore: pageObj.current.clearStore,
		forecast,
	});

	const onTaskCompletion = useCallbackRef(() => {
		pageObj.current.clearStore();

		setCurTask(null);
		setShowLoadStatus(true);
	});

	const forecastNotificationCallback = useCallback((notification) => {
		if (notification?.status === TaskStatus.COMPLETED && notification?.extra?.body?.forecastId === id) {
			onTaskCompletion();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { mutateAsync: getSortedIds } = useMutation(async (cleared: boolean) => {
		const { wells: forecastWells } = forecast;

		const wellsToSort = (() => {
			if (cleared || !Object.values(filter).find((value) => value !== null)) {
				return forecastWells;
			}
			const toIntersect = filterKeys.map((key) => filter[key]).filter((val) => !!val);
			return intersect(toIntersect);
		})();

		const wells = await postApi('/filters/sort-well-ids', {
			wellIds: wellsToSort || [],
			sorting,
		});
		return wells.map((well) => well._id);
	});

	const { mutateAsync: applyFilter } = useMutation(
		async ({ cleared = false, showLoading = true }: { cleared?: boolean; showLoading?: boolean }) => {
			let requestWrapper = (promise) => promise;

			if (showLoading) {
				requestWrapper = withDoggo;
			}

			const sortedWells = await requestWrapper(getSortedIds(cleared));
			pageObj.current.setData(sortedWells);
			setWells(sortedWells);

			setShowLoadStatus(true);
		}
	);

	const triggerInitialize = useCallbackRef(async () => {
		try {
			const { wells } = forecast;
			const wellIds = await withAsync(
				postApi(`/forecast/${id}/well-ids`, {
					...forecastFilter,
					// phases: [phase],
					wells,
				})
			);

			applyFilter({ cleared: false, showLoading: false });
			setChanges(!changes);
			setCurTask(null);
			setWells(wellIds);
		} catch (err) {
			genericErrorAlert(err);
			navigate(err.path);
		}
	});

	useEffect(() => {
		// Call just once upon page initialization
		triggerInitialize();
	}, [triggerInitialize]);

	const setViewContainerRef = (el) => {
		setViewContainerEl(el);
	};

	useEffect(() => {
		if (showLoadStatus) {
			adjustData();
		}
	}, [showLoadStatus, adjustData]);

	const setPage = (val) => {
		if (!pageObj.current.canMove(val)) {
			return;
		}

		pageObj.current.movePage(val);
		setShowLoadStatus(true);
	};

	const handleChangePage = (number) => {
		const pageIndex = number - 1;
		if (pageIndex !== pageObj.current.curPage) {
			setPage(pageIndex);
			setShowLoadStatus(true);
		}
		viewContainerEl?.focus?.();
	};

	const adjustDisplay = useCallbackRef((val) => {
		setGraphSettings({ display: val });

		pageObj.current.setLimit(val);
		setShowLoadStatus(true);
	});

	const defaultCloseForm = useCallbackRef((refresh = false) => {
		if (refresh) {
			pageObj.current.clearStore();
			setShowLoadStatus(true);
		}
	});

	const updateStatusOnComplete = useCallbackRef(() => {
		pageObj.current.clearStore();
		invalidateForecastChartQueries(forecast?._id);
		setShowLoadStatus(true);
	});

	const toggleResolution = useCallbackRef(() => {
		setResolution((curResolution) => {
			if (curResolution === 'monthly') {
				return 'daily';
			}
			return 'monthly';
		});

		pageObj.current.clearStore();
		setShowLoadStatus(true);
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { mutateAsync: changeFilter } = useMutation(async ({ key, val }: { key: string; val: any }) => {
		forecastFilter[key] = val === 'all' ? [] : [val];

		// quick fix for now, this page is being deprecated soon
		if (key === 'wellName' || key === 'warning') {
			forecastFilter[key] = val;
		}

		const wellIds = await postApi(`/forecast/${forecast?._id}/well-ids`, {
			...forecastFilter,
			phases: phase === 'all' ? VALID_PHASES : [phase],
			wells: forecast.wells,
		});

		setFilter({ ...filter, search: wellIds });
		setForecastFilter(forecastFilter);
	});

	const filterByEdit = useCallbackRef(() => {
		setFilter(
			produce((draft) => {
				draft.edit = Array.from(bucket);
			})
		);
	});

	// well filter actions
	const { mutateAsync: handleShowWellFilter } = useMutation(async () => {
		const filteredWells = await showWellFilter({ isFiltered: false, type: 'filter', wells });
		if (filteredWells) {
			setFilter(
				produce((draft) => {
					draft.wellFilter = filteredWells;
				})
			);
		}
	});

	const handleQuickWellFilter = useCallbackRef((wellIds) => {
		setFilter(
			produce((draft) => {
				draft.wellFilter = wellIds;
			})
		);
	});

	useEffect(() => {
		applyFilter({ cleared: false, showLoading: true });
		// Avoid unnecessary filter calls
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filter]);

	const clearFilter = useCallbackRef(() => {
		// check if changing a global var can cause problems in rendering
		filterKeys.forEach((key) => {
			filter[key] = null;
		});

		const forecastFilter = {
			forecastType: [],
			wellName: '',
			status: [],
		};

		setForecastFilter(forecastFilter);
	});

	useEffect(() => {
		if (!forecastFilter.wellName) {
			applyFilter({ cleared: true, showLoading: true });
			return;
		}
		applyFilter({ cleared: false, showLoading: true });

		// Avoid unnecessary filter calls
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [forecastFilter]);

	const disableClearFilter = useCallbackRef(() => {
		let bool = true;
		filterKeys.forEach((key) => {
			if (filter[key]) {
				bool = false;
			}
		});
		return bool;
	});

	const showForecastForm = useCallbackRef(() => {
		new Promise((resolve, reject) => {
			const forecastForm = { resolve, reject, visible: true };
			setForecastForm(forecastForm);
		})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			.then((resolvedTaskObj: any) => {
				if (resolvedTaskObj?.createdTask) {
					setCurTask(resolvedTaskObj.taskId);
				} else if (resolvedTaskObj?.ranForecast) {
					defaultCloseForm(true);
				} else {
					defaultCloseForm();
				}
			})
			.catch((err) => {
				if (!err.expected) {
					genericErrorAlert(err);
				}
			})
			.finally(() => {
				const forecastForm = { resolve: null, reject: null, visible: false };
				setForecastForm(forecastForm);
			});
	});

	const onSort = (sorting) => {
		setSorting(sorting);
	};

	useEffect(() => {
		applyFilter({ cleared: false, showLoading: true });
		// Avoid unnecessary filter calls
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sorting]);

	if (!loaded) {
		return <Placeholder main loading loadingText='Fetching Forecasts...' />;
	}

	if (!forecast?.wells?.length) {
		return <Placeholder main empty={!forecast?.wells?.length} emptySize={2} text='No Wells To Display...' />;
	}

	return (
		<section id='view-forecast-container' ref={setViewContainerRef} tabIndex={-1}>
			<UserNotificationCallback type={NotificationType.FORECAST} callback={forecastNotificationCallback} />
			<ChartHeaderProvider>
				<GridControlLayout>
					<Can
						do={ACTIONS.Update}
						on={subject(SUBJECTS.Forecasts, { project: forecast.project._id })}
						passThrough
					>
						{(allowed) => (
							<ViewForecastActions
								{...forecastFilter}
								adjustDisplay={adjustDisplay}
								bucket={bucket}
								changeFilter={changeFilter}
								clearFilter={clearFilter}
								curTask={curTask}
								disableClearFilter={disableClearFilter()}
								filterByEdit={filterByEdit}
								forecast={forecast}
								forecastDocType={forecast?.type ?? 'probabilistic'}
								forecastId={forecast?._id}
								graphSettings={graphSettings}
								onQuickWellFilter={handleQuickWellFilter}
								onSort={onSort}
								phase={phase}
								resolution={resolution}
								runForecast={() => showForecastForm()}
								runForecastDisabled={(!allowed && PERMISSIONS_TOOLTIP_MESSAGE) || disableForecastTasks}
								setCurTask={setCurTask}
								setGraphSettings={setGraphSettings}
								setPhase={setPhase}
								showWellFilter={handleShowWellFilter}
								sorting={sorting}
								toggleAll={toggleAll}
								toggleResolution={toggleResolution}
								updateStatusOnComplete={updateStatusOnComplete}
								wells={wells}
								runForecastMenuActions={[
									{
										additionalInfo: 'Add last segment to every forecast',
										primaryText: 'Mass Add Last Segment',
										onClick: async () => {
											defaultCloseForm(Boolean(await openAddLastSegmentDialog()));
										},
										disabled: !allowed || disableForecastTasks,
									},
									{
										additionalInfo:
											'Replace current forecast parameters with parameters from another user chosen forecast',
										primaryText: 'Replace Forecast Parameters',
										onClick: async () => {
											defaultCloseForm(Boolean(await openReplaceFitParametersDialog()));
										},
										disabled: !allowed || disableForecastTasks,
									},
									{
										additionalInfo: 'Clear forecast parameters for every forecast',
										primaryText: 'Clear Well Forecasts',
										onClick: async () => {
											defaultCloseForm(Boolean(await openResetWellForecastDialog()));
										},
										disabled: !allowed || disableForecastTasks,
									},
									// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
									<Divider />,
									{
										additionalInfo: 'Apply type curve to currently filtered wells',
										primaryText: 'Apply Type Curve',
										onClick: async () => {
											defaultCloseForm(Boolean(await openApplyTcDialog()));
										},
										disabled: !allowed || disableForecastTasks,
									},
									// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
									<Divider />,
									{
										primaryText: 'Import Forecast Parameters (CSV)',
										onClick: () => openImportForecastDialog({ source: 'cc' }),
										disabled: !allowed || disableForecastTasks,
									},
									{
										primaryText: 'Import Forecast From PHDwin (CSV or XLSX)',
										onClick: () => openImportForecastDialog({ source: 'phdWin' }),
										disabled: !allowed || disableForecastTasks,
									},
									// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
									<Divider />,
									{
										primaryText: 'Export Forecast Parameters (CSV)',
										onClick: () => openForecastParametersDialog(),
										disabled: disableForecastTasks,
									},
									{
										primaryText: 'Export Forecast Volumes (CSV)',
										onClick: () => exportToCSV(),
										disabled: disableForecastTasks,
									},
									{
										primaryText: 'Export Forecast To ARIES (CSV and TXT)',
										onClick: () => exportToAries(),
										disabled: disableForecastTasks,
									},
									{
										primaryText: 'Export Forecast To PHDwin (XLSX)',
										onClick: () => openPhdParametersDialog(),
										disabled: disableForecastTasks,
									},
								]}
							/>
						)}
					</Can>

					<ForecastToolbarTheme>
						<ControlsContainer>
							<IconButton
								color='primary'
								onClick={() => setIsComparisonActive(true)}
								size='small'
								tooltipTitle='Switch to Comparison View'
							>
								{faCompass}
							</IconButton>

							<div className='md-text pagination-text'>
								{pageObj.current.getLowerIndex()} &mdash; {pageObj.current.getUpperIndex()} of{' '}
								{pageObj.current.getLength()}
							</div>

							<IconButton
								color='primary'
								disabled={!pageObj.current.canMove(-1)}
								onClick={() => setPage(-1)}
								size='small'
							>
								{faChevronLeft}
							</IconButton>

							<PageField
								onChange={handleChangePage}
								page={pageObj.current.curPage + 1}
								maxPage={pageObj.current.getTotalPages()}
							/>

							<IconButton
								color='primary'
								disabled={!pageObj.current.canMove(1)}
								onClick={() => setPage(1)}
								size='small'
							>
								{faChevronRight}
							</IconButton>
						</ControlsContainer>
					</ForecastToolbarTheme>
				</GridControlLayout>

				{data.length ? (
					<ViewForecastChartGrid
						bucket={bucket}
						data={data}
						graphSettings={graphSettings}
						phase={phase}
						resolution={resolution}
						showLoadStatus={showLoadStatus}
						toggleManualSelect={toggleManualSelect}
					/>
				) : (
					<div className='no-forecasts md-text'>No Forecasts To Display...</div>
				)}
			</ChartHeaderProvider>

			{addLastSegmentDialog}
			{applyTcDialog}
			{exportToAriesDialog}
			{exportToCSVDialog}
			{forecastParametersDialog}
			{importForecastDialog}
			{phdParametersDialog}
			{replaceFitParametersDialog}
			{resetWellForecastDialog}

			<ForecastForm
				{...forecastForm}
				forecastId={forecast?._id}
				rateOnly
				parentResolution={resolution}
				wells={wells}
			/>
		</section>
	);
};

export default ViewForecast;
