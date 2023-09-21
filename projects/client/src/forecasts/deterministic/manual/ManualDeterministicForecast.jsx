import { MultipleSegments } from '@combocurve/forecast/models';
import { faUserCog } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { assign, cloneDeep, mapValues } from 'lodash-es';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useMutation, useQuery } from 'react-query';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { PERMISSIONS_TOOLTIP_MESSAGE, SHORT_PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useMergedState } from '@/components/hooks';
import { useHotkey } from '@/components/hooks/useHotkey';
import { UnsavedWorkDialog } from '@/components/hooks/useUnsavedWork';
import { Box, Button, Divider, IconButton } from '@/components/v2';
import { invalidateAllForecastQueries } from '@/forecasts/api';
import {
	KEYS as gridChartApiKeys,
	updateSinglePhaseForecast,
	useDeterministicWellData,
	useProximityData,
} from '@/forecasts/charts/components/deterministic/grid-chart/api';
import {
	tabularizeDailyData,
	tabularizeMonthlyData,
} from '@/forecasts/charts/components/deterministic/grid-chart/useDeterministicData';
import {
	getNextPhase,
	getPhaseForecastInfo,
	getPhaseSegments,
} from '@/forecasts/charts/components/deterministic/phase-chart/helpers';
import DeterministicReforecast from '@/forecasts/deterministic/manual/DeterministicReforecast';
import { ForecastTableCard } from '@/forecasts/deterministic/manual/ForecastTableCard';
import ManualCharts from '@/forecasts/deterministic/manual/ManualCharts';
import { InlineLabeled, ManualChartArea, NoWrapText, StyledSelectField } from '@/forecasts/deterministic/manual/layout';
import { getReforecastResolution } from '@/forecasts/manual/AutoReforecast';
import { EditingLayout, ModeSwitch, PhaseSelectField, getActiveMode } from '@/forecasts/manual/EditingLayout';
import ManualApplyTypeCurve from '@/forecasts/manual/ManualApplyTypeCurve';
import ManualEditing from '@/forecasts/manual/ManualEditing';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { ManualEditingTypeCurveContext } from '@/forecasts/manual/ManualEditingTypeCurveContext';
import { KeyboardModeIndicator } from '@/forecasts/manual/shared';
import ResolutionToggle from '@/forecasts/manual/shared/ResolutionToggle';
import ProximityForecastDialogV2, {
	getProximityPhaseRepWells,
} from '@/forecasts/proximity-forecast/ProximityForecastDialogV2';
import { useProximityTargetWellInfo } from '@/forecasts/proximity-forecast/helpers';
import useProximityOptions from '@/forecasts/proximity-forecast/useProximityOptions';
import { ParametersDescriptionWithFloater } from '@/forecasts/shared/ForecastParametersDescription';
import { updateStatusQuery, useForecastStatusActions } from '@/forecasts/shared/PhaseStatusButtons';
import useKeyboardForecast from '@/forecasts/shared/useKeyboardForecast';
import { genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { useDialog, useVisibleDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { postApi, putApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import { phases } from '@/helpers/zing';
import { projectRoutes } from '@/projects/routes';
import { URLS } from '@/urls';
import { useSelectedByWellFilter } from '@/well-filter/hooks';

const FORECAST_TYPE_ITEMS = [
	{ label: 'Rate', value: 'rate' },
	{ label: 'Ratio', value: 'ratio' },
];

// eslint-disable-next-line complexity
const ManualDeterministicForecast = ({ forecastDocumentQuery, toggleManualSelect, bucket }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const match = useMatch(`${projectRoutes.project(':projectId').forecast(':id').root}/*`);
	const isMac = navigator.userAgent.includes('Mac');
	const changeModeKeys = isMac ? 'command+d' : 'ctrl+d';

	const [autoProps_, setAutoProps] = useState({});
	const [editSeries, setEditSeries] = useState([]);
	const [tableCollapsed, setTableCollapsed] = useState(true);
	const [tempAutoChartData, _setTempAutoChartData] = useState(null);
	const [proximityMergedStates, setProximityMergedStates] = useMergedState({
		proximityActive: false,
		proximityForm: null,
	});
	const [proximityBgNormalization, setProximityBgNormalization] = useState();
	const [proximitySeriesSelections, setProximitySeriesSelections] = useState(
		new Set(['backgroundWells', 'p50', 'average'])
	);

	const [state, setState] = useMergedState({
		curWell: null,
		mode: 'auto',
		phase: 'oil',
		removedWells: [],
	});

	const [comparisonProps, setComparisonProps] = useMergedState({ enabled: false });
	const [manualProps, setManualProps] = useMergedState({
		basePhase: 'oil',
		forecastType: 'rate',
		loading: false,
		resolution: local.getItem('manualEditingResolution') ?? 'monthly',
	});

	const { canUndo, manualGridSeries, manualSeries, onForm, segIdx, setMultipleSegments, setOnForm, setSegIdx, undo } =
		useContext(ManualEditingContext);

	const manualEdited = useMemo(() => !_.isEqual(editSeries, manualSeries), [editSeries, manualSeries]);

	const {
		canSave: canSaveTC,
		generateSaveTCInfo,
		phaseType: tcPhaseType,
		setPSeries: setTCPSeries,
		pSeries: tcPSeries,
		tc,
		typeCurveDict,
	} = useContext(ManualEditingTypeCurveContext);

	const { curWell, forecast, mode, phase, wellIds, removedWells } = state;
	const { basePhase: manualBasePhase, forecastType: manualForecastType, resolution } = manualProps;

	const forecastId = match.params.id;

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, forecast?.project?._id);
	const { cycleStatus: cycleSinglePhaseStatus } = useForecastStatusActions({ forecastId, wellId: curWell });
	const { speedState, setSpeedState } = useKeyboardForecast({ saveLocally: true });

	const { query: deterministicDataQuery } = useDeterministicWellData({ forecastId, wellId: curWell });
	const {
		data: deterministicWellData,
		isFetching: isFetchingDeterministicData,
		refetch: deterministicRefetch,
	} = deterministicDataQuery;

	const produceTempAutoChartData = useCallback(
		(forecastedDict) => {
			// When there's not enough data to forecast, the backend passes back null's for certain fields.
			// Filter those out.
			const filteredForecastDict = _.omitBy(forecastedDict, _.isNil);
			return produce(deterministicWellData ?? {}, (draft) => {
				draft.forecast ??= {};
				draft.forecast[phase] = { ...draft.forecast[phase], ...filteredForecastDict };
			});
		},
		[deterministicWellData, phase]
	);

	const setTempAutoChartData = useCallback(
		(forecastedDict) => {
			_setTempAutoChartData(produceTempAutoChartData(forecastedDict));
		},
		[produceTempAutoChartData]
	);

	const getCurrentDataForecastInfo = useCallback(
		(phaseIn) => {
			if (deterministicWellData) {
				const _autoData = tempAutoChartData ?? deterministicWellData;
				return getPhaseForecastInfo({
					dataKey: 'forecast',
					phase: phaseIn,
					wellData: mode === 'auto' ? _autoData : deterministicWellData,
				});
			}

			return null;
		},
		[mode, tempAutoChartData, deterministicWellData]
	);

	const paramsTcDict = useMemo(() => {
		if (mode === 'typecurve' && typeCurveDict) {
			return mapValues(typeCurveDict, (value) => ({ segments: value }));
		}

		return null;
	}, [mode, typeCurveDict]);

	const basePhase = useMemo(() => {
		if (mode === 'auto') {
			const autoBasePhase = getCurrentDataForecastInfo(phase)?.ratio?.basePhase ?? 'oil';
			return autoBasePhase;
		}
		if (mode === 'manual') {
			return manualBasePhase;
		}
		if (mode === 'typecurve') {
			return tc?.basePhase ?? 'oil';
		}
		return null;
	}, [getCurrentDataForecastInfo, manualBasePhase, mode, phase, tc?.basePhase]);

	// this is the forecastType of current saved forecast
	const forecastType = useMemo(() => {
		const autoForecastType = getCurrentDataForecastInfo(phase)?.forecastType ?? 'rate';
		if (mode === 'auto') {
			return autoForecastType;
		}
		if (mode === 'manual') {
			return manualForecastType;
		}
		if (mode === 'typecurve') {
			return canSaveTC ? tcPhaseType : autoForecastType;
		}
		return 'rate';
	}, [canSaveTC, getCurrentDataForecastInfo, manualForecastType, mode, phase, tcPhaseType]);

	const editingChartPhaseType = useMemo(() => {
		if (mode === 'auto') {
			return autoProps_?.axis_combo;
		}
		if (mode === 'manual') {
			return manualForecastType;
		}
		if (mode === 'typecurve') {
			return tcPhaseType;
		}
		return 'rate';
	}, [autoProps_?.axis_combo, manualForecastType, mode, tcPhaseType]);

	const editingChartBasePhase = useMemo(() => {
		if (mode === 'auto') {
			return autoProps_?.basePhase ?? 'oil';
		}
		if (mode === 'manual') {
			return manualBasePhase;
		}
		if (mode === 'typecurve') {
			return tc?.basePhase ?? 'oil';
		}
		return 'oil';
	}, [autoProps_?.basePhase, manualBasePhase, mode, tc?.basePhase]);

	const handleChangeForecast = useCallback(
		(newState) => {
			setState({ forecast: newState });
		},
		[setState]
	);

	const bucketReady = bucket?.size ? bucket?.size > 0 : false;

	const loaded = !!(forecast && wellIds && curWell);

	const getDisplaySegments = useCallback(
		(phaseIn, overwrite = false) => {
			if (deterministicWellData) {
				if (mode === 'manual' && !overwrite) {
					return manualSeries ?? [];
				}

				if (mode === 'typecurve' && typeCurveDict) {
					return typeCurveDict?.[tcPSeries] ?? [];
				}

				const { forecastType: dataForecastType, ratio, segments } = getCurrentDataForecastInfo(phaseIn);
				if (mode === 'auto' && dataForecastType !== forecastType) {
					return [];
				}
				if (dataForecastType === 'rate' || dataForecastType === 'manual') {
					return segments;
				}
				if (dataForecastType === 'ratio') {
					return ratio.segments;
				}
			}
			return [];
		},
		[deterministicWellData, forecastType, getCurrentDataForecastInfo, manualSeries, mode, tcPSeries, typeCurveDict]
	);

	const displaySegments = useMemo(() => getDisplaySegments(phase), [getDisplaySegments, phase]);

	const autoRef = useRef(null);
	const manualRef = useRef(null);

	const { mutateAsync: saveForecastCallback } = useMutation(async (newData) => {
		if (!canUpdateForecast) {
			return warningAlert(PERMISSIONS_TOOLTIP_MESSAGE);
		}

		try {
			const saveData = { ...newData, warning: { status: false, message: '' } };
			const body = {
				data: saveData,
				phase,
			};

			const updatedId = await updateSinglePhaseForecast(forecastId, curWell, body);

			queryClient.setQueryData(
				gridChartApiKeys.detChartData(forecastId, updatedId, { wells: [updatedId] }),
				produce((draft) => {
					assign(draft?.[updatedId]?.forecast[phase], saveData);
				})
			);

			queryClient.setQueryData(
				gridChartApiKeys.comparisonChartData(forecastId, updatedId, {
					wells: [updatedId],
					comparisonIds: comparisonProps.ids,
				}),
				produce((draft) => {
					assign(draft?.[updatedId]?.forecast.reference.data[phase], saveData);
				})
			);

			// update well phase status to In Progress
			updateStatusQuery({ forecastId, wellId: updatedId, phase, value: 'in_progress' });
			_setTempAutoChartData(null);

			// HACK: manual should also depend on the well data
			if (newData.forecastType === 'rate') {
				setEditSeries(newData?.P_dict?.best?.segments ?? []);
			} else if (newData.forecastType === 'ratio') {
				setEditSeries(newData?.ratio?.segments ?? []);
			} else if (newData.forecastType === 'not_forecasted') {
				setEditSeries([]);
			}

			deterministicRefetch();
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const handleManualSave = useCallback(
		async ({ saveCurPhase, saveManualSeries, saveForecastType, saveBasePhase, saveSubType = 'manual' }) => {
			return await saveForecastCallback(
				produce(deterministicWellData.forecast[saveCurPhase], (newData) => {
					if (saveForecastType === 'rate' || saveForecastType === 'not_forecasted') {
						newData.P_dict.best = { segments: [], diagnostics: [] };
						newData.P_dict.best.segments = cloneDeep(saveManualSeries);
						newData.ratio = {
							segments: [],
							basePhase: null,
							x: 'time',
							diagnostics: {},
						};
					} else if (saveForecastType === 'ratio') {
						newData.ratio.segments = cloneDeep(saveManualSeries);
						newData.ratio.basePhase = saveBasePhase;
						newData.ratio.x = 'time';
						newData.P_dict = {};
					}

					const isForecasted = saveManualSeries?.length > 0;
					newData.forecasted = isForecasted;
					newData.forecastSubType = isForecasted ? saveSubType : null;
					newData.forecastType = isForecasted ? saveForecastType : 'not_forecasted';
					newData.data_freq = isForecasted ? resolution : 'monthly';
					if (saveSubType === 'typecurve') {
						const { saveTCId, saveTCSetting } = generateSaveTCInfo();
						newData.typeCurve = saveTCId;
						newData.typeCurveApplySetting = saveTCSetting;
					}
				})
			);
		},
		[saveForecastCallback, deterministicWellData, resolution, generateSaveTCInfo]
	);

	const saveAuto = useCallback(
		() => saveForecastCallback(tempAutoChartData?.forecast?.[phase]),
		[phase, saveForecastCallback, tempAutoChartData?.forecast]
	);

	const saveManual = useCallback(
		() =>
			handleManualSave({
				saveCurPhase: phase,
				saveManualSeries: manualSeries,
				saveForecastType: manualForecastType,
				saveBasePhase: manualBasePhase,
			}),
		[manualBasePhase, manualForecastType, handleManualSave, manualSeries, phase]
	);

	const saveTypeCurve = useCallback(
		() =>
			handleManualSave({
				saveCurPhase: phase,
				saveManualSeries: typeCurveDict?.[tcPSeries],
				saveForecastType: tcPhaseType,
				saveBasePhase: tc?.basePhase,
				saveSubType: 'typecurve',
			}),
		[handleManualSave, tcPSeries, phase, tcPhaseType, tc?.basePhase, typeCurveDict]
	);

	const saveUnsaved = useCallback(async () => {
		if (mode === 'auto') {
			await saveAuto();
		}
		if (mode === 'manual') {
			await saveManual();
		}
		if (mode === 'typecurve') {
			await saveTypeCurve();
		}
	}, [mode, saveAuto, saveManual, saveTypeCurve]);

	const [unsavedDialog, _dispatchUnsavedDialog] = useDialog(UnsavedWorkDialog);

	const { refetch: saveForecast, isFetching: savingForecast } = useQuery(
		['forecast', 'save-editing', forecastId, curWell],
		saveUnsaved,
		{ enabled: false }
	);

	const dispatchUnsavedDialog = useCallback(
		async (...params) => {
			setOnForm(true);
			const result = await _dispatchUnsavedDialog({
				saveUnsaved,
				saveAndContinue: {
					disabled: !canUpdateForecast,
					tooltipLabel: !canUpdateForecast && PERMISSIONS_TOOLTIP_MESSAGE,
				},
				...params,
			});
			setOnForm(false);
			return result;
		},
		[_dispatchUnsavedDialog, setOnForm, canUpdateForecast, saveUnsaved]
	);

	const haveUnsavedWork = useCallback(async () => {
		return (
			((mode === 'auto' && !!tempAutoChartData) || (mode === 'manual' && manualEdited)) &&
			!removedWells.includes(curWell) &&
			!(await dispatchUnsavedDialog())
		);
	}, [curWell, dispatchUnsavedDialog, manualEdited, mode, removedWells, tempAutoChartData]);

	// TODO: understand where is this used
	const baseSegments = useMemo(() => {
		if (!deterministicWellData) {
			return null;
		}

		if (forecastType === 'ratio') {
			return deterministicWellData?.forecast?.[basePhase]?.forecastType === 'rate'
				? getPhaseSegments({ wellData: deterministicWellData, phase: basePhase, dataKey: 'forecast' })
				: [];
		}

		return [];
	}, [basePhase, forecastType, deterministicWellData]);

	const [proximityQuery] = useProximityData({
		basePhase: editingChartBasePhase,
		forecastId,
		phase,
		phaseType: editingChartPhaseType,
		proximityMergedStates,
		resolution: manualProps.resolution,
		wellId: curWell,
	});

	const qFinalDict = useMemo(() => forecast?.qFinalDict ?? {}, [forecast?.qFinalDict]);

	const prodInfo = useMemo(() => {
		if (isFetchingDeterministicData) {
			return { startIdx: null, endIdx: null };
		}

		const index = deterministicWellData?.[manualProps.resolution]?.index;
		return index ? { startIdx: index[0], endIdx: index[index.length - 1] } : { startIdx: null, endIdx: null };
	}, [deterministicWellData, isFetchingDeterministicData, manualProps.resolution]);

	const resetEditSeries = useCallback(() => {
		if (deterministicWellData) {
			const {
				forecastType: dataForecastType,
				ratio,
				segments,
			} = getPhaseForecastInfo({ wellData: deterministicWellData, phase, dataKey: 'forecast' });

			let newEditSeries;
			if (dataForecastType === 'rate' || dataForecastType === 'not_forecasted') {
				newEditSeries = segments ?? [];
			}
			if (dataForecastType === 'ratio') {
				const ratioSegments = ratio?.segments;
				newEditSeries = ratioSegments ?? [];
			}

			const newProps = { forecastType: 'rate' };
			if (dataForecastType === 'ratio') {
				newProps.forecastType = 'ratio';
				newProps.basePhase = ratio.basePhase;
			}

			setSegIdx(0);
			setManualProps(newProps);
			setEditSeries(newEditSeries);
		}
	}, [deterministicWellData, phase, setSegIdx, setManualProps]);

	const changeMode = useCallback(
		async (value) => {
			if (value === mode) {
				return;
			}

			if (await haveUnsavedWork()) {
				return;
			}

			unstable_batchedUpdates(() => {
				_setTempAutoChartData(null);
				setSegIdx(0);
				setState({ mode: value });
				if (value === 'manual') {
					// TODO: remove this code after v30 gets to client
					// setProximitySeriesSelections((selections) => {
					// 	return new Set([...selections].filter((v) => v !== 'backgroundWells'));
					// });
					setProximitySeriesSelections(new Set(['average']));
				}
			});
		},
		[haveUnsavedWork, mode, setSegIdx, setState, setProximitySeriesSelections]
	);

	const updateQFinalDict = useCallback(
		async ({ values: newQFinalDict, phaseKey }) => {
			handleChangeForecast(
				produce(forecast, (draft) => {
					draft.qFinalDict ??= {};
					draft.qFinalDict[phaseKey] = newQFinalDict;
				})
			);
			await putApi(`/forecast/${forecastId}/updateForecastPhaseQFinal`, {
				phase: phaseKey,
				values: newQFinalDict,
			});
		},
		[handleChangeForecast, forecast, forecastId]
	);

	const changePhase = useCallback(
		async (value) => {
			if (await haveUnsavedWork()) {
				return false;
			}

			unstable_batchedUpdates(() => {
				_setTempAutoChartData(null);
				setSegIdx(0);
				setState({ phase: value });
			});

			return value;
		},
		[haveUnsavedWork, setSegIdx, setState]
	);

	const changeActiveWell = useDebounce(async (wellId) => {
		if (await haveUnsavedWork()) {
			return;
		}

		unstable_batchedUpdates(() => {
			_setTempAutoChartData(null);
			setSegIdx(0);
			setState({ curWell: wellId });
		});
	}, 1000);

	const { isLoading: loadingRemoveWell, mutateAsync: removeWell } = useMutation(async () => {
		if (await haveUnsavedWork()) {
			return;
		}

		if (wellIds.length <= removedWells.length + 1) {
			navigate(URLS.project(forecast.project._id).forecast(forecast._id).view);
		} else {
			setState(
				produce((draft) => {
					draft.removedWells.push(curWell);
				})
			);
		}

		await toggleManualSelect({ checked: false, wellId: curWell });
	});

	const phaseChangeHandler = (phaseHotkey) => () => {
		if (phase !== phaseHotkey && !onForm) {
			changePhase(phaseHotkey);
			return false;
		}
		return undefined;
	};

	const cyclePhase = () => {
		if (!onForm) {
			const nextPhase = getNextPhase(phase);
			changePhase(nextPhase);
			return false;
		}
		return undefined;
	};

	const toggleMode = () => {
		if (onForm) {
			return false;
		}

		if (mode === 'auto') {
			changeMode('manual');
		} else {
			changeMode('auto');
		}

		return false;
	};

	const cycleStatus = () => {
		cycleSinglePhaseStatus(phase);
		return false;
	};

	useHotkey('shift+o', phaseChangeHandler('oil'));
	useHotkey('shift+g', phaseChangeHandler('gas'));
	useHotkey('shift+w', phaseChangeHandler('water'));
	useHotkey('shift+s', cyclePhase);
	useHotkey(changeModeKeys, toggleMode);
	useHotkey('shift+a', cycleStatus);
	useHotkey('alt+enter', () => {
		if (mode === 'auto') {
			autoRef.current?.runForecast?.();
		}
	});

	// manual related sets
	const setForecastType = useCallback(
		(value) => {
			const newProps = { forecastType: value };
			if (value === 'ratio') {
				if (phase === 'oil') {
					newProps.basePhase = 'gas';
				} else {
					newProps.basePhase = 'oil';
				}
			}

			setManualProps(newProps);
			setEditSeries([]);
		},
		[phase, setManualProps]
	);

	const handleManualChangeBasePhase = useCallback(
		(value) => {
			setManualProps({ basePhase: value });
		},
		[setManualProps]
	);

	const setResolution = useCallback(
		(value) => {
			local.setItem('manualEditingResolution', value);
			setManualProps({ resolution: value });
		},
		[setManualProps]
	);

	// Proximity
	const setForecastSegmentsCallback = useCallback(
		(forecastedDict) => {
			if (forecastedDict === null) {
				return;
			}

			if (mode === 'auto') {
				setTempAutoChartData(forecastedDict);
				return;
			}

			if (mode === 'manual') {
				if (forecastedDict.forecastType === 'rate') {
					setMultipleSegments(new MultipleSegments(forecastedDict.P_dict.best.segments));
					return;
				}

				if (forecastedDict.forecastType === 'ratio') {
					setMultipleSegments(new MultipleSegments(forecastedDict.ratio.segments));
				}
			}
		},
		[mode, setMultipleSegments, setTempAutoChartData]
	);

	const targetWellHeaderAndEur = useProximityTargetWellInfo({
		wellId: curWell,
		deterministicWellData,
		tempAutoChartData,
		parentResolution: resolution,
		manualGridSeries,
		mode,
		editingChartPhaseType,
		editingChartBasePhase,
	});

	const proximityBgData = useMemo(() => {
		const production = deterministicWellData?.[resolution];
		if (!production) {
			return null;
		}

		return (resolution === 'daily' ? tabularizeDailyData : tabularizeMonthlyData)(production);
	}, [deterministicWellData, resolution]);

	const proximityWellSelection = useSelectedByWellFilter(getProximityPhaseRepWells(proximityQuery.data));

	const saveProximity = useCallback(
		(forecastedDict) => {
			saveForecastCallback(produceTempAutoChartData(forecastedDict)?.forecast?.[phase]);
		},
		[phase, produceTempAutoChartData, saveForecastCallback]
	);

	const [
		proximityForecastDialog,
		confirmProximityForecastDialog,
		{ onHide: hideProximity, visible: proximityVisible },
	] = useVisibleDialog(ProximityForecastDialogV2, {
		currentForecastId: forecastId,
		forecastId,
		setProximityMergedStates,
		wellId: curWell,
		visible: false,
		phase,
		basePhase: editingChartBasePhase,
		phaseType: editingChartPhaseType,
		setForecastSegmentsCallback,
		proximityQuery,
		proximityBgData,
		proximityWellSelection,
		resolution: manualProps.resolution,
		targetWellHeaderAndEur,
		proximityRadius: proximityMergedStates.proximityForm?.neighborDict.searchRadius,
		setProximityBgNormalization,
		saveForecast: saveProximity,
	});

	const { buttons: proximityOptionsRender, dialogs: proximityDialogs } = useProximityOptions({
		mode,
		setProximityMergedStates,
		proximityMergedStates,
		proximityVisible,
		hideProximity,
		confirmProximityForecastDialog,
		proximityData: proximityQuery.data, // TODO remove this and use proximityQuery.data
		forecastId,
		proximityQuery,
		proximitySeriesSelections,
		setProximitySeriesSelections,
		disabled: isFetchingDeterministicData && wellIds,
	});
	// End Proximity

	// separate this out to make space for other possibilities
	const forceDisableKeyboard = proximityVisible;

	const modes = [
		{
			name: 'auto',
			label: 'Auto',
			actions: useCallback(
				() => (
					<>
						<Button
							color='primary'
							disabled={!canUpdateForecast || !tempAutoChartData || savingForecast}
							onClick={saveForecast}
							tooltipPlacement='right'
							tooltipTitle={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							{...getTaggingProp('forecast', 'editingSavingAutoForecast')}
						>
							Save
						</Button>
						<Button
							color='secondary'
							disabled={!canUpdateForecast}
							onClick={() => {
								autoRef.current?.runForecast?.();
							}}
							tooltipPlacement='right'
							tooltipTitle={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							{...getTaggingProp('forecast', 'editingAutoForecast')}
						>
							Forecast
						</Button>
						<Button color='secondary' tooltipPlacement='right' onClick={() => _setTempAutoChartData(null)}>
							Reset
						</Button>
						<Button
							color='warning'
							disabled={loadingRemoveWell}
							onClick={removeWell}
							tooltipTitle='Remove well from editing'
							{...getTaggingProp('forecast', 'editingRemove')}
						>
							Remove
						</Button>
						<IconButton
							color='primary'
							disabled={!canUpdateForecast}
							onClick={() => autoRef.current?.showConfig?.(getReforecastResolution(resolution))}
							size='small'
							tooltipPlacement='left'
							tooltipTitle={!canUpdateForecast ? SHORT_PERMISSIONS_TOOLTIP_MESSAGE : 'Configurations'}
						>
							{faUserCog}
						</IconButton>
					</>
				),
				[
					canUpdateForecast,
					loadingRemoveWell,
					removeWell,
					resolution,
					saveForecast,
					savingForecast,
					tempAutoChartData,
				]
			),
			body: useCallback(
				() => (
					<DeterministicReforecast
						ref={autoRef}
						canSave={!!tempAutoChartData}
						edited={manualEdited}
						forecastId={forecast?._id}
						onDataChange={setTempAutoChartData}
						phase={phase}
						resolution={resolution}
						saveForecast={saveAuto}
						setAutoProps={setAutoProps}
						setResolution={setResolution}
						wellId={curWell}
					/>
				),
				[
					curWell,
					forecast?._id,
					manualEdited,
					phase,
					resolution,
					saveAuto,
					setResolution,
					setTempAutoChartData,
					tempAutoChartData,
				]
			),
		},
		{
			name: 'manual',
			label: 'Manual',
			actions: useCallback(
				() => (
					<>
						<Button
							color='primary'
							disabled={!canUpdateForecast || !manualEdited || savingForecast}
							onClick={saveForecast}
							tooltipPlacement='right'
							tooltipTitle={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							{...getTaggingProp('forecast', 'editingSaveManual')}
						>
							Save
						</Button>
						<Button
							color='secondary'
							onClick={() => {
								resetEditSeries();
								// eslint-disable-next-line no-unused-expressions
								manualRef.current?.reset?.();
							}}
						>
							Reset
						</Button>
						<Button color='secondary' disabled={!canUndo && 'No changes detected'} onClick={undo}>
							Undo
						</Button>
						<Button
							color='warning'
							disabled={loadingRemoveWell}
							onClick={removeWell}
							tooltipTitle='Remove well from editing'
						>
							Remove
						</Button>
					</>
				),
				[
					canUndo,
					canUpdateForecast,
					loadingRemoveWell,
					manualEdited,
					removeWell,
					resetEditSeries,
					saveForecast,
					savingForecast,
					undo,
				]
			),
			body: useCallback(
				() => (
					<>
						<KeyboardModeIndicator editAreaFocused={!onForm && !forceDisableKeyboard} />

						<Divider />

						<ResolutionToggle resolution={resolution} setResolution={setResolution} />

						<Divider />

						<InlineLabeled label='Type'>
							<StyledSelectField
								menuItems={FORECAST_TYPE_ITEMS}
								onChange={setForecastType}
								smaller
								value={forecastType}
							/>
						</InlineLabeled>

						{forecastType === 'ratio' && (
							<InlineLabeled label='Base Phase'>
								<StyledSelectField
									menuItems={phases.filter(({ value }) => value !== phase)}
									onChange={handleManualChangeBasePhase}
									smaller
									value={basePhase}
								/>
							</InlineLabeled>
						)}

						<Divider />

						<ManualEditing
							basePhase={basePhase}
							canUpdate={canUpdateForecast}
							editSaveForecast={handleManualSave}
							editSaveQFinalDict={updateQFinalDict}
							forecastType={forecastType}
							initSeries={editSeries}
							inputQFinalDict={qFinalDict}
							phase={phase}
							prodInfo={prodInfo}
							ref={manualRef}
							speedState={speedState}
							forceDisableKeyboard={forceDisableKeyboard}
						/>
					</>
				),
				[
					basePhase,
					canUpdateForecast,
					editSeries,
					forecastType,
					handleManualChangeBasePhase,
					handleManualSave,
					onForm,
					phase,
					prodInfo,
					forceDisableKeyboard,
					qFinalDict,
					resolution,
					setForecastType,
					setResolution,
					speedState,
					updateQFinalDict,
				]
			),
		},
		{
			name: 'typecurve',
			label: <NoWrapText>Type Curve</NoWrapText>,
			actions: useCallback(
				() => (
					<>
						<Button
							color='primary'
							disabled={!canUpdateForecast || savingForecast || !canSaveTC}
							onClick={saveForecast}
							tooltipTitle={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							{...getTaggingProp('forecast', 'editingSaveTypeCurve')}
						>
							Save
						</Button>
						<Button
							color='warning'
							disabled={loadingRemoveWell}
							onClick={removeWell}
							tooltipTitle='Remove well from editing'
						>
							Remove
						</Button>
					</>
				),
				[canSaveTC, canUpdateForecast, loadingRemoveWell, removeWell, saveForecast, savingForecast]
			),
			body: useCallback(
				() => (
					<>
						<ResolutionToggle resolution={resolution} setResolution={setResolution} />

						<Divider />

						<ManualApplyTypeCurve
							forecastId={forecastId}
							forecastType='deterministic'
							phase={phase}
							wellId={curWell}
						/>
					</>
				),
				[curWell, forecastId, phase, resolution, setResolution]
			),
		},
	];

	const activeMode = getActiveMode(mode, modes);

	const wellTableRef = useRef({});

	// init
	useEffect(() => {
		const init = async () => {
			try {
				const initForecast = forecastDocumentQuery?.data ?? {};
				const manualComparisonProps = initForecast?.comparisonIds?.manual ?? {};
				const { ids: initComparisonIds = null, resolutions: initResolutions = null } = manualComparisonProps;

				const sortedWells = await postApi('/well/sortByHeader', {
					dir: 'asc',
					header: 'well_name',
					wells: [...bucket],
				});
				setComparisonProps({ ids: initComparisonIds, resolutions: initResolutions });

				// get wellId from URL query
				const wellSearch = new URLSearchParams(location?.search).get('well');
				setState({
					curWell: wellSearch && sortedWells.includes(wellSearch) ? wellSearch : sortedWells[0],
					forecast: initForecast,
					wellIds: sortedWells,
				});
			} catch (error) {
				genericErrorAlert(error);
				navigate(error.path);
			}
		};
		if (bucketReady) {
			init();
		}
		// removed history / project / match from the dependencies becaues in reality they shouldn't change. for some reason they were causing multiple re-runs of this effect on load
		return () => {
			invalidateAllForecastQueries();
		};
		// todo: Clean up with react query
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bucketReady]);

	useEffect(() => {
		if (deterministicWellData && mode === 'manual') {
			resetEditSeries();
		}
	}, [deterministicWellData, mode, resetEditSeries, setManualProps]);

	useEffect(() => {
		if (mode === 'typecurve') {
			setSegIdx(0);
		}
	}, [mode, setSegIdx]);

	if (!loaded || !bucketReady) {
		return (
			<Placeholder
				main
				loading={forecastDocumentQuery.isLoading}
				loadingText='Loading'
				empty={!bucketReady}
				emptySize={2}
				text='No Wells In Editing Bucket...'
			/>
		);
	}

	return (
		<EditingLayout
			controls={<ModeSwitch activeModeName={mode} onChangeMode={changeMode} modes={modes} />}
			actions={activeMode?.actions?.()}
			form={
				<>
					<PhaseSelectField onChange={changePhase} value={phase} />

					<Divider />

					{activeMode?.body?.()}

					<Divider />

					<Box paddingX='1rem'>
						<ParametersDescriptionWithFloater
							basePhase={basePhase}
							baseSegments={baseSegments}
							dailyProduction={deterministicWellData?.daily}
							forecastType={forecastType}
							monthlyProduction={deterministicWellData?.monthly}
							parentResolution={resolution}
							pDict={paramsTcDict}
							phase={phase}
							pKey={mode === 'typecurve' ? tcPSeries : 'best'}
							segIdx={segIdx}
							segments={displaySegments}
							setPhase={changePhase}
							setPKey={mode === 'typecurve' ? setTCPSeries : undefined}
							setSegIdx={setSegIdx}
							type={mode === 'typecurve' && typeCurveDict ? 'probabilistic' : 'deterministic'}
						/>

						{unsavedDialog}
					</Box>
				</>
			}
			leftRender={
				<ForecastTableCard
					activeWell={curWell}
					collapsed={tableCollapsed}
					headerStoreKey='MANUAL_FORECAST_DEFAULT_HEADERS'
					onChangeActiveWell={changeActiveWell}
					onFilterActive={setOnForm}
					onToggleCollapsed={() => setTableCollapsed(!tableCollapsed)}
					ref={wellTableRef}
					removedWells={removedWells}
					wellIds={wellIds}
				/>
			}
			rightRender={
				<ManualChartArea hidden={!tableCollapsed}>
					<ManualCharts
						autoProps_={autoProps_}
						autoRef={autoRef}
						basePhase={basePhase}
						baseSegments={baseSegments}
						comparisonProps={comparisonProps}
						curWell={curWell}
						editingChartPhaseType={editingChartPhaseType}
						forecastId={forecastId}
						forecastType={forecastType}
						manualGridSeries={manualGridSeries}
						manualProps={manualProps}
						manualRef={manualRef}
						mode={mode}
						phase={phase}
						proximityActive={proximityMergedStates.proximityActive}
						proximityDialog={proximityForecastDialog}
						proximitySeriesSelections={proximitySeriesSelections}
						proximityOptionsRender={proximityOptionsRender}
						proximityQuery={proximityQuery}
						proximityWellSelection={proximityWellSelection}
						proximityBgNormalization={proximityBgNormalization}
						resolution={resolution}
						setComparisonProps={setComparisonProps}
						setOnForm={setOnForm}
						setSpeedState={setSpeedState}
						speedState={speedState}
						tcPSeries={tcPSeries}
						tempAutoChartData={tempAutoChartData}
					/>
					{proximityDialogs}
				</ManualChartArea>
			}
		/>
	);
};

export default ManualDeterministicForecast;
