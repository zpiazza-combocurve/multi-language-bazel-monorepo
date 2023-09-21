import produce from 'immer';
import _, { get, intersection, round } from 'lodash-es';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useMatch, useNavigate } from 'react-router-dom';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { Placeholder } from '@/components';
import { useCallbackRef } from '@/components/hooks';
import { invalidateAllForecastQueries, useForecast } from '@/forecasts/api';
import { COMPARISON_FIELDS, diagLabels, diagUnits } from '@/forecasts/diagnostics/shared';
import { genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { usePrevious } from '@/helpers/hooks';
import { getApi, postApi } from '@/helpers/routing';
import { parseNum } from '@/helpers/sheetItems';
import { convertDateToIdx, phases as forecastPhases } from '@/helpers/zing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { UserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { projectRoutes } from '@/projects/routes';

import { DiagnosticDialog } from '../view/diagnostic-dialog';
import CumDistChart from './CumDistChart';
import DiagTable, { DIAG_SPECIFIC_HEADERS } from './DiagTable';
import Histogram from './Histogram';

import './ForeDiag.scss';

const fetchDiagnosticsData = (forecastId, body) => postApi(`/forecast/${forecastId}/diagnostics`, body);

const sortDiagnostics = ({ key, dir = true, data }) =>
	produce(data, (draft) => {
		draft.sort((a, b) => {
			const val1 = get(a, key);
			const val2 = get(b, key);

			if (val1 === val2) {
				return 0;
			}
			if (val1 < val2) {
				return dir ? 1 : -1;
			}
			return dir ? -1 : 1;
		});
	});

const DIAG_ROUND_DECIMAL = {
	'eur-cum': 2,
	'eur/LL': 2,
	'eur/Prop': 2,
	'qi/LL': 6,
	'qi/Prop': 6,
	b: 2,
	cum_diff: 2,
	D_eff: 5,
	eur: 2,
	eur1: 2,
	eur3: 2,
	eur5: 2,
	mae: 2,
	median_abs_ra: 2,
	median_ra: 2,
	qi: 6,
	r2: 2,
	realized_D_eff_sw: 4,
	rmse: 2,
};

const EMPTY_THRESHOLD_OBJ = {
	'eur-cum': { values: ['', ''], between: false },
	'eur/LL': { values: ['', ''], between: false },
	'eur/Prop': { values: ['', ''], between: false },
	'qi/LL': { values: ['', ''], between: false },
	'qi/Prop': { values: ['', ''], between: false },
	b: { values: ['', ''], between: false },
	cum_diff: { values: ['', ''], between: false },
	D_eff: { values: ['', ''], between: false },
	eur: { values: ['', ''], between: false },
	mae: { values: ['', ''], between: false },
	median_abs_ra: { values: ['', ''], between: false },
	median_ra: { values: ['', ''], between: false },
	qi: { values: ['', ''], between: false },
	// r2: { values: ['', ''], between: false },  disabled for now
	rmse: { values: ['', ''], between: false },
};

const inBetween = (val1, val2, wellVal) => {
	let bool;
	if (val1.length && val2.length) {
		bool = wellVal >= Number(val1) && wellVal <= Number(val2);
	}
	if (val1.length && !val2.length) {
		bool = wellVal >= Number(val1);
	}
	if (val2.length && !val1.length) {
		bool = wellVal <= Number(val2);
	}
	return bool;
};

const outBetween = (val1, val2, wellVal) => {
	let bool;
	if (val1.length && val2.length) {
		bool = wellVal <= Number(val1) || wellVal >= Number(val2);
	}
	if (val1.length && !val2.length) {
		bool = wellVal <= Number(val1);
	}
	if (val2.length && !val1.length) {
		bool = wellVal >= Number(val2);
	}
	return bool;
};

//TODO: Needs finishing, props passed into DiagTable need to be updated with local setStates
const ForeDiagContainer = ({ disableForecastTasks, bucket, toggleAll, toggleManualSelect }) => {
	const track = useTrackAnalytics();

	const match = useMatch(`${projectRoutes.project(':projectId').forecast(':id').root}/*`);
	const id = match.params.id;
	const forecastDocumentQuery = useForecast(id);
	const forecast = forecastDocumentQuery.data;

	const diagnosticProps = forecast?.comparisonIds?.diagnostics;
	const initComparisonIds = useMemo(() => diagnosticProps?.ids ?? [], [diagnosticProps?.ids]);
	const initResolutions = useMemo(() => diagnosticProps?.resolutions ?? {}, [diagnosticProps?.resolutions]);

	const prevForecastDocumentQuery = usePrevious(forecastDocumentQuery);
	const prevDisableForecastTasks = usePrevious(disableForecastTasks);
	const navigate = useNavigate();

	const [allDataLoaded, setAllDataLoaded] = useState(false);
	const [allDiagData, setAllDiagData] = useState([]);
	const [chartDataLoaded, setChartDataLoaded] = useState(false);
	const [clear, setClear] = useState(false);
	const [comparisonNames, setComparisonNames] = useState({});
	const [comparisonProps, setComparisonProps] = useState({ ids: initComparisonIds, resolutions: initResolutions });
	const [diagnosticDialogShown, setDiagnosticDialogShown] = useState(false);
	const [filter, setFilter] = useState({});
	const [filteredThreshold, setFilteredThreshold] = useState([]);
	const [filteredWells, setFilteredWells] = useState(forecast.wells);
	const [forecastProps, setForecastProps] = useState({ status: 'all', forecastType: 'all' });
	const [initiallyLoaded, setInitiallyLoaded] = useState(false);
	const [isInitialized, setInitialized] = useState(false);
	const [phase, _setPhase] = useState('oil');
	const [resetKeyProps, setResetKeyProps] = useState(false);
	const [series, setSeries] = useState('best');
	const [sortDir, setSortDir] = useState(true);
	const [sortKey, setSortKey] = useState(null);
	const [threshold, setThreshold] = useState(_.cloneDeep(EMPTY_THRESHOLD_OBJ));

	// value is not used anywhere
	const [, setCharts] = useState([]);
	// value is not used anywhere
	const [, setSelectedWells] = useState([]);

	const setDefaultFilterState = () => {
		setFilter({});
		setFilteredWells(forecast.wells);
		setForecastProps({ status: 'all', forecastType: 'all' });
		setThreshold(_.cloneDeep(EMPTY_THRESHOLD_OBJ));
	};

	const { mutateAsync: getFullDiagnosticsData, isLoading: isLoadingFullDiagnosticsData } = useMutation(
		async ({ forecast, phase, series }) => {
			const allDiagData = await withDoggo(
				fetchDiagnosticsData(forecast._id, {
					phase,
					series,
					wellCols: DIAG_SPECIFIC_HEADERS,
					wellIds: null,
				})
			);

			setAllDataLoaded(true);
			// @todo: check if allDiagData is needed on key `charts`
			setAllDiagData(allDiagData);
			setChartDataLoaded(true);
			setCharts(allDiagData);
			setInitiallyLoaded(true);
		}
	);

	const onTaskCompletion = () => {
		invalidateAllForecastQueries(true);
	};

	const diagnosticsNotificationCallback = useCallbackRef((notification) => {
		if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === id) {
			onTaskCompletion();
			getFullDiagnosticsData({ forecast, phase, series });
		}
	});

	const setPhase = useCallbackRef((inputPhase) => {
		_setPhase(inputPhase);
		getFullDiagnosticsData({ forecast, phase: inputPhase, series });
	});

	const { mutateAsync: getAllWellsDiagnostics } = useMutation(async () => {
		if (!forecast.diagDate) {
			setInitiallyLoaded(true);
			return;
		}
		await getFullDiagnosticsData({ forecast, phase, series });
	});

	const init = useCallback(() => {
		try {
			setComparisonProps({ ids: initComparisonIds, resolutions: initResolutions });
			setFilteredWells(forecast.wells);
			setInitialized(true);
		} catch (err) {
			genericErrorAlert(err);
			navigate('/forecasts');
		}
	}, [navigate, forecast, initComparisonIds, initResolutions]);

	useEffect(() => {
		init();
		return () => invalidateAllForecastQueries();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isInitialized) {
			getAllWellsDiagnostics();
		}
	}, [isInitialized, getAllWellsDiagnostics]);

	useEffect(() => {
		if (
			!_.isEqual(forecastDocumentQuery?.data, prevForecastDocumentQuery?.data) ||
			!(disableForecastTasks === prevDisableForecastTasks || disableForecastTasks)
		) {
			init();
		}
	}, [
		disableForecastTasks,
		init,
		prevDisableForecastTasks,
		prevForecastDocumentQuery?.data,
		forecastDocumentQuery?.data,
	]);

	const { mutateAsync: clearStateAndReload } = useMutation(async ({ runAllWells = false, clearFilter = false }) => {
		if (clearFilter) {
			setDefaultFilterState();
		}
		if (runAllWells) {
			await getFullDiagnosticsData({ forecast, phase, series });
		}
	});

	const { mutateAsync: resetManualBucket } = useMutation(async () =>
		setSelectedWells(new Set(await getApi(`/forecast/${forecast._id}/manual-bucket`)))
	);

	const setSort = useCallback(({ sortKey: inputKey, sortDir: inputDir }) => {
		if (inputDir !== undefined) {
			setSortDir(inputDir);
		}
		if (inputKey !== undefined) {
			setSortKey(inputKey);
		}
	}, []);

	const isFilterActive = useMemo(() => !!Object.keys(filter).length, [filter]);

	const viewData = useMemo(() => {
		const data = produce(allDiagData, (draft) => {
			_.forEach(draft, (phaseDiag) => {
				_.forEach(DIAG_ROUND_DECIMAL, (decimal, key) => {
					if (Number.isFinite(phaseDiag?.diagnostics?.[key])) {
						phaseDiag.diagnostics[key] = round(phaseDiag.diagnostics[key], decimal);
					}
				});
			});
		});
		return sortDiagnostics({ key: sortKey, dir: sortDir, data });
	}, [allDiagData, sortDir, sortKey]);

	const filteredData = useMemo(() => {
		const data = allDiagData.filter((item) => filteredWells.includes(item.well));
		return sortDiagnostics({ key: sortKey, dir: sortDir, data });
	}, [allDiagData, filteredWells, sortDir, sortKey]);

	const diagData = isFilterActive ? filteredData : viewData;

	const filterWells = useCallbackRef((key, wellIds, filterTo = true) => {
		const {
			clear: producedClear,
			filter: producedFilter,
			filteredWells: producedFilteredWells,
		} = produce({ filter, filteredWells, clear }, (draft) => {
			if (wellIds) {
				if (filterTo) {
					draft.filter[key] = wellIds;
				} else {
					const filteredSet = new Set(draft.filter?.[key] ?? allDiagData.map((item) => item.well));
					for (let i = 0; i < wellIds.length; i++) {
						filteredSet.delete(wellIds[i]);
					}

					draft.filter[key] = [...filteredSet];
				}
			} else if (draft.filter?.[key]) {
				delete draft.filter[key];
			}

			draft.filteredWells = intersection(...Object.values(draft.filter));
			draft.clear = !draft.clear;
		});

		const [filterValues] = Object.values(producedFilter);
		if (filterValues?.length) {
			setFilter(producedFilter);
			setFilteredWells(producedFilteredWells);
			return;
		}

		setClear(producedClear);
		setFilter({});
		setFilteredWells(forecast.wells);
	});

	const thresholdFilter = useCallback(
		(threshold) => {
			const filtered = allDiagData
				.filter((well) => {
					let bool = true;
					Object.keys(threshold).forEach((key) => {
						const { between } = threshold[key];
						const wellVal = well.diagnostics[key];
						const [val1, val2] = threshold[key].values;

						if (!val1.length && !val2.length) {
							return;
						}
						if (!wellVal && wellVal !== 0) {
							bool = false;
							return;
						}
						if (between) {
							bool = bool && inBetween(val1, val2, wellVal);
						} else {
							bool = bool && outBetween(val1, val2, wellVal);
						}
					});

					return bool;
				})
				.map((val) => val.well);

			setThreshold(threshold);
			setFilteredThreshold(filtered);
		},
		[allDiagData]
	);

	useEffect(() => {
		filterWells('threshold', filteredThreshold);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filteredThreshold]);

	const getComparisonItems = () => {
		return (comparisonProps?.ids ?? [])
			.map((id) =>
				COMPARISON_FIELDS.map((field) => {
					const primaryText = `${comparisonNames?.[id]?.slice(0, 12)} ${diagLabels[field]}`;
					const units = diagUnits[field]?.[phase];
					const key = `${id}.${field}`;
					return { key, header: primaryText, units };
				})
			)
			.flat();
	};

	const getRunDiagWells = () => {
		const forecastWells = forecast?.wells ?? [];
		return isFilterActive ? filteredData.map((d) => d.well) : forecastWells;
	};

	const filterForecastProp = (key, value) => {
		const newFilter = _.cloneDeep(filter);

		if (value === 'all' && newFilter[key]) {
			delete newFilter[key];
		} else {
			const wellIds = allDiagData.filter((well) => well?.[key] === value).map((well) => well.well);
			newFilter[key] = wellIds;
		}

		const newForecastProps = _.cloneDeep(forecastProps);
		newForecastProps[key] = value;

		const newFilteredWells = intersection(...Object.values(newFilter));

		setClear((u) => !u);
		setFilter(newFilter);
		setFilteredWells(newFilteredWells);
		setForecastProps(newForecastProps);
	};

	const clearFilter = () => {
		setClear((u) => !u);
		setFilter({});
	};

	const formatInputForAnalytics = (input) => {
		const resources = ['oil', 'gas', 'water'];
		const analyticsData = {};
		resources.forEach((r) => {
			analyticsData[r] = {
				durationStart: input[r].timePeriod.num_range[0],
				durationEnd: input[r].timePeriod.num_range[1],
				unit: input[r].timePeriod.unit,
				mode: input[r].timePeriod.mode,
				absolute_range: input[r].timePeriod.absolute_range,
			};
		});
		return analyticsData;
	};

	const runDiagnostic = (input) => {
		const adjustedInput = _.cloneDeep(input);
		const runDiagWells = getRunDiagWells();

		forecastPhases.forEach(({ value: key }) => {
			const { timePeriod } = adjustedInput[key];
			if (timePeriod.mode === 'absolute_range') {
				timePeriod.absolute_range = timePeriod.absolute_range.map((date) => convertDateToIdx(new Date(date)));
			} else {
				timePeriod.absolute_range = null;
			}
			if (timePeriod.mode === 'last') {
				timePeriod.num_range = timePeriod.num_range.map((value) => parseNum(value));
			}
		});

		postApi(`/forecast/${forecast._id}/full-forecast-diagnostic`, {
			...adjustedInput,
			wellIds: runDiagWells,
		}).catch((error) => {
			genericErrorAlert(error, 'Failed to run Diagnostics');
		});

		const analyticsData = formatInputForAnalytics(adjustedInput);
		track(EVENTS.forecast.diagnostic, analyticsData);
	};

	const handleShowDiagForm = () => setDiagnosticDialogShown(true);

	const handleHideDiagForm = () => setDiagnosticDialogShown(false);

	const runDiagWells = getRunDiagWells();

	const sharedProps = useMemo(
		() => ({
			clearStateAndReload,
			diagData,
			filteredWells,
			isLoading: isLoadingFullDiagnosticsData,
			phase,
			resetKeyProps,
			selectedWells: bucket,
			series,
			setComparisonNames,
			setResetKeyProps,
			setSort,
			sortDir,
			sortKey,
		}),
		[
			bucket,
			clearStateAndReload,
			diagData,
			filteredWells,
			isLoadingFullDiagnosticsData,
			phase,
			resetKeyProps,
			series,
			setSort,
			sortDir,
			sortKey,
		]
	);

	if (!forecast?.wells?.length || !initiallyLoaded) {
		return (
			<Placeholder
				main
				loading={!initiallyLoaded}
				loadingText='Loading'
				empty={!forecast?.wells?.length}
				emptySize={2}
				text='No Wells To Display...'
			/>
		);
	}
	return (
		<section id='forecast-diagnostic-container'>
			<UserNotificationCallback type={NotificationType.DIAGNOSTICS} callback={diagnosticsNotificationCallback} />
			{initiallyLoaded && (
				<>
					<DiagTable
						{...sharedProps}
						allDataLoaded={allDataLoaded}
						comparisonNames={comparisonNames}
						comparisonProps={comparisonProps}
						disableForecastTasks={disableForecastTasks}
						filter={filterWells}
						filterActive={isFilterActive}
						filteredWells={filteredWells}
						filterForecastProp={filterForecastProp}
						forceReload={onTaskCompletion}
						forecast={forecast}
						forecastProps={forecastProps}
						handleShowDiagForm={handleShowDiagForm}
						history={history}
						onClearFilter={clearFilter}
						resetManualBucket={resetManualBucket}
						tableLoaded={chartDataLoaded}
						threshold={threshold}
						thresholdFilter={thresholdFilter}
						toggleManualSelect={toggleManualSelect}
						toggleAll={toggleAll}
						setPhase={setPhase}
						setComparisonProps={setComparisonProps}
						setSeries={setSeries}
					/>

					{!!forecast.diagDate && diagData && (
						<section id='diag-chart-container'>
							<Histogram
								{...sharedProps}
								clearSelection={clear}
								getComparisonItems={getComparisonItems}
								onFilter={filterWells}
								isLoaded={chartDataLoaded}
							/>

							<CumDistChart
								{...sharedProps}
								clearSelection={clear}
								getComparisonItems={getComparisonItems}
								onFilter={filterWells}
								isLoaded={chartDataLoaded}
							/>
						</section>
					)}

					{diagnosticDialogShown && (
						<DiagnosticDialog
							visible={diagnosticDialogShown}
							onClose={handleHideDiagForm}
							onRun={runDiagnostic}
							wellCount={runDiagWells.length}
						/>
					)}
				</>
			)}
		</section>
	);
};

export default memo(ForeDiagContainer);
