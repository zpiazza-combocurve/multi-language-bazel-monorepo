import produce from 'immer';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Divider, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { KEYS, invalidateAllForecastQueries } from '@/forecasts/api';
import ChartHeaderProvider from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import SelectForecastDialog from '@/forecasts/comparison/SelectForecastDialog';
import { EnforcedForecastSettingsContext } from '@/forecasts/forecast-form/EnforcedForecastSettings';
import { ForecastFormFloater, useForecastScopeAndType } from '@/forecasts/forecast-form/ForecastFormV2';
import QuickEditForm from '@/forecasts/forecast-form/QuickEditForm';
import useAutomaticForecast, {
	DEFAULT_FORM_RESOLUTION,
} from '@/forecasts/forecast-form/automatic-form/useAutomaticForecast';
import useProximityForecast from '@/forecasts/forecast-form/proximity-form/useProximityForecast';
import useForecastFormConfiguration from '@/forecasts/forecast-form/useForecastFormConfiguration';
import useGridFilter from '@/forecasts/shared/useGridFilter';
import {
	confirmationAlert,
	failureAlert,
	genericErrorAlert,
	warningAlert,
	withDoggo,
	withLoadingBar,
} from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { putApi } from '@/helpers/routing';
import { ADJUSTMENT_TYPE_MAP } from '@/inpt-shared/constants';

import { ForecastContext } from '../forecastCtx';
import Grid from './Grid';
import { ViewContainer } from './layout';
import useViewDialogs from './useViewDialogs';

const EMPTY_OBJECT = {};
const EMPTY_ARR = [];

const prepConfigForCustomStreams = (config) => {
	return produce(config, (draft) => {
		draft.dataSettings.daily = draft.dataSettings.daily.map((stream) => {
			return stream.includes('custom') ? stream.replace('Daily', '') : stream;
		});
		draft.dataSettings.monthly = draft.dataSettings.monthly.map((stream) => {
			return stream.includes('custom') ? stream.replace('Monthly', '') : stream;
		});
	});
};

const View = ({
	disableForecastTasks,
	forecastDocumentQuery,
	isProbabilistic = false,
	setIsComparisonActive: parentSetComparisonActive = null,
	toggleManualSelect,
}) => {
	const forecast = forecastDocumentQuery.data;
	const { setLoadingRun } = useContext(ForecastContext);

	const { isProximityForecastEnabled, isMosaicForecastExportEnabled } = useLDFeatureFlags();

	const { enforcedData, enforcedPaths } = useContext(EnforcedForecastSettingsContext);

	const comparisonIds = forecast?.comparisonIds?.view?.ids ?? EMPTY_ARR;
	const comparisonResolutions = forecast?.comparisonIds?.view?.resolutions ?? EMPTY_OBJECT;

	const [enableQuickEdit, _setEnableQuickEdit] = useState(false);
	const [isComparisonActive, setIsComparisonActive] = useState(false);
	const [isComparisonDialogVisible, setIsComparisonDialogVisible] = useState(false);
	const [isForecastFormVisible, _setIsForecastFormVisible] = useState(false);
	const [singleWellForecastId, setSingleWellForecastId] = useState(null);
	const [task, setTask] = useState(null);

	const forecastWells = forecast.wells;
	const forecastId = forecast._id;

	const gridRef = useRef<{ generateConfig?: () => void; refreshCharts?: () => void }>({});
	const refreshCharts = useCallbackRef(() => gridRef?.current?.refreshCharts?.());

	const quickEditRef = useRef<{ handleQuickEditForecast?: () => void }>({});

	const { wellIds, ...filterProps } = useGridFilter({
		forecastId,
		wellIds: forecastWells,
	});

	// for all dialogs that require either forecast or well state
	const {
		addLastSegmentDialog,
		applyTcDialog,
		exportCharts,
		exportChartsDialog,
		exportToAries,
		exportToAriesDialog,
		exportToCSV,
		exportToCSVDialog,
		forecastParametersDialog,
		importForecastDialog,
		massAdjustTerminalDecline,
		massAdjustTerminalDeclineDialog,
		massBackcastSegmentsDialog,
		massModifyWellLife,
		massModifyWellLifeDialog,
		massShiftSegmentsDialog,
		mosaicParametersDialog,
		openAddLastSegmentDialog,
		openApplyTcDialog,
		openForecastParametersDialog,
		openImportForecastDialog,
		openMassBackcastSegmentsDialog,
		openMassShiftSegmentsDialog,
		openMosaicParametersDialog,
		openPhdParametersDialog,
		openReplaceFitParametersDialog,
		openResetWellForecastDialog,
		phdParametersDialog,
		replaceFitParametersDialog,
		resetWellForecastDialog,
	} = useViewDialogs({ forecast, singleWellForecastId, wells: wellIds });

	const configurationProps = useForecastFormConfiguration({ forecastType: 'deterministic' });

	const [forecastFormResolution, setForecastFormResolution] = useDerivedState(
		configurationProps.activeResolution ?? DEFAULT_FORM_RESOLUTION
	);

	const automaticForecastProps = useAutomaticForecast({
		activeConfig: configurationProps.automaticConfig,
		enforcedData,
		enforcedPaths,
		forecastId,
	});

	const { forecastScope, forecastFormType, setForecastScope, setForecastFormType } = useForecastScopeAndType({
		configurationProps,
	});

	const proximityForecastProps = useProximityForecast({ activeConfig: configurationProps.proximityConfig, forecast });

	const setEnableQuickEdit = useCallbackRef((value) => {
		if (isProximityForecastEnabled && !forecastScope?.auto) {
			warningAlert('Forecast form must have automatic forecast enabled');
			return;
		}

		if (value && isForecastFormVisible) {
			_setIsForecastFormVisible(false);
			setSingleWellForecastId(null);
		}
		_setEnableQuickEdit(value);
	});

	const setIsForecastFormVisible = useCallbackRef((value) => {
		if (value && enableQuickEdit) {
			_setEnableQuickEdit(false);
		}
		if (!value) {
			setSingleWellForecastId(null);
		}
		_setIsForecastFormVisible(value);
	});

	const { mutateAsync: removeSingleWell } = useMutation(async (wellId: string) => {
		const confirmed = await alerts.confirm({
			title: `Are you sure you want to remove this well from the forecast?`,
			confirmText: 'Remove',
			confirmColor: 'error',
		});

		if (confirmed) {
			await withLoadingBar(
				putApi(`/forecast/${forecastId}/removeForecastWells`, {
					wells: [wellId],
				}),
				'Successfully removed well'
			);
			toggleManualSelect({ checked: false, wellId });
			queryClient.setQueryData(
				KEYS.forecastDocument(forecastId),
				produce<{ wells: string[] }>((draft) => {
					draft.wells = draft.wells.filter((id) => id !== wellId);
				})
			);
		}
	});

	const { mutateAsync: reapplyTypeCurve } = useMutation(async (wellId: string | null = null) => {
		let text = `Re-Apply TC for ${wellIds.length} wells`;
		if (wellId) {
			text = 'Re-Apply TC for 1 well';
		}

		const confirmed = await alerts.confirm({
			children: text,
			confirmText: 'Re-Apply',
			title: 'Re-Apply Type Curve',
		});

		// if a task is created/dialog should close so user can see notification alerts
		if (confirmed) {
			try {
				const body = {
					forecastId,
					tcId: null,
					updateTypeCurveOnly: true,
					wellIds: wellId ? [wellId] : wellIds,
				};

				const { message, warning, taskCreated } = await withDoggo(
					putApi(`/forecast/${forecastId}/reapplyTC`, body),
					'Applying Type Curve...'
				);

				if (!taskCreated) {
					alerts.confirm({
						children: warning,
						confirmText: 'Continue',
						hideCancelButton: true,
						title: message,
					});
				}
			} catch (err) {
				genericErrorAlert(err);
			} finally {
				if (!wellId) {
					refreshCharts?.();
				}
			}
		}

		return confirmed;
	});

	const toggleComparison = useCallbackRef((value) => {
		if (value) {
			if (!comparisonIds?.length) {
				setIsComparisonDialogVisible(true);
			} else {
				setIsComparisonActive(true);
			}
		} else {
			(parentSetComparisonActive ?? setIsComparisonActive)(false);
		}
	});

	const confirmForecastSelection = useCallbackRef(() => {
		setIsComparisonActive(true);
		setIsComparisonDialogVisible(false);
	});

	const { mutateAsync: handleMassShiftSegments } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ body, adjustmentType }: { body: any; adjustmentType: 'shift' | 'backcast' }) => {
			if (body) {
				try {
					const { message, taskCreated } = await withLoadingBar(
						putApi(`/forecast/${forecastId}/mass-shift-segments`, {
							...body,
							adjustmentType,
							forecastId,
							wells: wellIds,
						})
					);

					if (!taskCreated) {
						confirmationAlert(message);
						refreshCharts();
					}
				} catch (err) {
					const title = ADJUSTMENT_TYPE_MAP[adjustmentType];
					failureAlert(`Failed to run ${title}`);
				}
			}
		}
	);

	const { mutateAsync: acknowledgeAllWarnings } = useMutation(async (forecastId) => {
		const confirmed = await alerts.confirm({
			title: 'Are you sure you want to acknowledge all warnings for the forecast?',
			confirmText: 'Acknowledge',
		});

		if (confirmed) {
			try {
				const { message: resultMessage } = await withLoadingBar(
					putApi(`/forecast/${forecastId}/acknowledgeWarnings`)
				);

				confirmationAlert(resultMessage);
			} catch (error) {
				genericErrorAlert(error);
			}
		}

		return confirmed;
	});

	const singleWellApplyTc = useCallback(
		async (wellId) => {
			const runText = 'for 1 well';
			return openApplyTcDialog({ runText: runText && `Apply ${runText}`, wells: [wellId] });
		},
		[openApplyTcDialog]
	);

	const forecastingCallback = useCallback(
		(resolvedTaskObj) => {
			try {
				setLoadingRun?.(true);
				if (resolvedTaskObj?.createdTask) {
					setTask(resolvedTaskObj.taskId);
				}

				// refresh grid when small forecast is ran
				if (resolvedTaskObj?.ranForecast) {
					setLoadingRun?.(false);
					refreshCharts();
				}
			} catch (err) {
				if (!err.expected) {
					setLoadingRun?.(false);
					genericErrorAlert(err);
				}
			}
		},
		[setLoadingRun, refreshCharts]
	);

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, forecast?.project?._id);

	const forecastOptions = [
		{
			additionalInfo: 'Add last segment to every forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await openAddLastSegmentDialog()) {
					refreshCharts();
				}
			},
			primaryText: 'Mass Add Last Segment',
		},
		{
			additionalInfo: 'Edit well life for every forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await massModifyWellLife()) {
					refreshCharts();
				}
			},
			primaryText: 'Mass Modify Well Life',
		},
		{
			additionalInfo: 'Shift segments for every forecast based on user defined date',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				const body = await openMassShiftSegmentsDialog();
				handleMassShiftSegments({ body, adjustmentType: 'shift' });
			},
			primaryText: ADJUSTMENT_TYPE_MAP.shift,
		},
		{
			additionalInfo:
				'Using the current Forecast parameters, re-solve for q Start at a different ' +
				'Start Date before the first segment begins or in the middle of an existing segment.',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				const body = await openMassBackcastSegmentsDialog();
				handleMassShiftSegments({ body, adjustmentType: 'backcast' });
			},
			primaryText: ADJUSTMENT_TYPE_MAP.backcast,
		},
		{
			additionalInfo: 'Adjust terminal decline for every forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await massAdjustTerminalDecline()) {
					refreshCharts();
				}
			},
			primaryText: 'Mass Adjust Terminal Decline',
		},
		{
			additionalInfo: 'Replace current forecast parameters with parameters from another user chosen forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await openReplaceFitParametersDialog()) {
					refreshCharts();
				}
			},
			primaryText: 'Replace Forecast Parameters',
		},
		{
			additionalInfo: 'Clear forecast parameters for every forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await openResetWellForecastDialog()) {
					refreshCharts();
				}
				setSingleWellForecastId(null);
			},
			primaryText: 'Clear Well Forecasts',
		},
		{
			additionalInfo: 'Acknowledge all warnings for the forecast',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				if (await acknowledgeAllWarnings(forecastId)) {
					refreshCharts();
				}
			},
			primaryText: 'Acknowledge All Warnings',
		},
		<Divider key='div-1' />,
		{
			additionalInfo: 'Apply type curve to currently filtered wells',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: async () => {
				const hasRun = await openApplyTcDialog();
				if (hasRun) {
					refreshCharts();
				}
			},
			primaryText: 'Apply Type Curve',
		},
		{
			additionalInfo:
				'Take the applied type curve and update the scaling/normalization based on updated well header information',
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: () => reapplyTypeCurve(null),
			primaryText: 'Re-Apply Type Curve',
		},
		<Divider key='div-2' />,
		{
			disabled: !canUpdateForecast || disableForecastTasks,
			onClick: () => openImportForecastDialog(),
			primaryText: 'Import Forecast',
		},
		<Divider key='div-3' />,
		{
			disabled: disableForecastTasks,
			onClick: () => openForecastParametersDialog(),
			primaryText: 'Export Forecast Parameters (CSV)',
		},
		{
			disabled: disableForecastTasks,
			onClick: () => exportToCSV({ wells: wellIds }),
			primaryText: 'Export Forecast Volumes (CSV)',
		},
		{
			disabled: disableForecastTasks,
			onClick: () => {
				const chartsConfig = gridRef.current?.generateConfig?.();
				const formattedChartsConfig = prepConfigForCustomStreams(chartsConfig);
				return exportCharts({ wells: wellIds, chartsConfig: formattedChartsConfig });
			},
			primaryText: 'Export Forecast Charts (PDF or PPTX)',
		},
		{
			disabled: disableForecastTasks,
			onClick: () => exportToAries(),
			primaryText: 'Export Forecast To ARIES (CSV and TXT)',
		},
		{
			disabled: disableForecastTasks,
			onClick: () => openPhdParametersDialog(),
			primaryText: 'Export Forecast To PHDwin (XLSX)',
		},
		...(isMosaicForecastExportEnabled
			? [
					{
						disabled: disableForecastTasks,
						onClick: () => openMosaicParametersDialog(),
						primaryText: 'Export Forecast To Mosaic (XLSX)',
						taggingProp: getTaggingProp('forecast', 'exportMosaic'),
					},
			  ]
			: []),
	];

	// clear all forecast queries on exit
	useEffect(() => {
		return () => {
			invalidateAllForecastQueries();
		};
	}, []);

	useEffect(() => {
		if (forecast && isProbabilistic) {
			toggleComparison(true);
		}
	}, [forecast, isProbabilistic, toggleComparison]);

	// clear chart data when enabling/disabling comparison mode. this ensures that certain data props such as inEdit are in sync
	useEffect(() => {
		if (isComparisonActive) {
			queryClient.removeQueries(['forecast', 'detChartData']);
		} else {
			queryClient.removeQueries(['forecast', 'comparisonChartData']);
		}
	}, [isComparisonActive]);

	useEffect(() => {
		if (!disableForecastTasks) {
			refreshCharts();
		}
	}, [disableForecastTasks, refreshCharts]);

	return (
		<ViewContainer>
			<ChartHeaderProvider>
				<Grid
					canUpdateForecast={canUpdateForecast}
					comparisonIds={comparisonIds}
					comparisonResolutions={comparisonResolutions}
					curTask={task}
					disableForecastTasks={disableForecastTasks}
					enableQuickEdit={enableQuickEdit}
					filter={filterProps}
					forecast={forecast}
					forecastFormResolution={forecastFormResolution}
					forecastOptions={forecastOptions}
					handleQuickEditForecast={quickEditRef.current?.handleQuickEditForecast}
					isComparisonActive={isComparisonActive}
					isProbabilistic={isProbabilistic}
					openResetWellForecastDialog={openResetWellForecastDialog}
					reapplyTypeCurve={reapplyTypeCurve}
					ref={gridRef}
					removeSingleWell={removeSingleWell}
					runForecastStatus={canUpdateForecast}
					runningTask={task}
					setEnableQuickEdit={setEnableQuickEdit}
					setIsComparisonActive={toggleComparison}
					setIsComparisonDialogVisible={setIsComparisonDialogVisible}
					setIsForecastFormVisible={setIsForecastFormVisible}
					setSingleWellForecastId={setSingleWellForecastId}
					setTask={setTask}
					singleWellApplyTc={singleWellApplyTc}
					singleWellForecastId={singleWellForecastId}
					wellIds={wellIds}
				/>

				{addLastSegmentDialog}
				{applyTcDialog}
				{exportChartsDialog}
				{exportToAriesDialog}
				{exportToCSVDialog}
				{forecastParametersDialog}
				{massAdjustTerminalDeclineDialog}
				{massBackcastSegmentsDialog}
				{massModifyWellLifeDialog}
				{massShiftSegmentsDialog}
				{phdParametersDialog}
				{mosaicParametersDialog}
				{importForecastDialog}
				{replaceFitParametersDialog}
				{resetWellForecastDialog}

				<QuickEditForm
					automaticForecastProps={automaticForecastProps}
					configurationProps={configurationProps}
					forecastId={forecastId}
					ref={quickEditRef}
					resolution={forecastFormResolution}
					showForecastForm={() => setIsForecastFormVisible(true)}
					visible={enableQuickEdit}
				/>
			</ChartHeaderProvider>

			<SelectForecastDialog
				comparisonIds={comparisonIds}
				comparisonResolutions={comparisonResolutions}
				onClose={() => (parentSetComparisonActive ?? setIsComparisonDialogVisible)(false)}
				onConfirm={confirmForecastSelection}
				refForecastId={forecastId}
				visible={isComparisonDialogVisible}
			/>

			<ForecastFormFloater
				automaticForecastProps={automaticForecastProps}
				configurationProps={configurationProps}
				forecastId={forecastId}
				forecastingCallback={forecastingCallback}
				forecastScope={forecastScope}
				forecastFormType={forecastFormType}
				handleToggle={() => setIsForecastFormVisible(false)}
				proximityForecastProps={proximityForecastProps}
				resolution={forecastFormResolution}
				setForecastScope={setForecastScope}
				setForecastFormType={setForecastFormType}
				setResolution={setForecastFormResolution}
				visible={isForecastFormVisible}
				wellIds={singleWellForecastId ? [singleWellForecastId] : wellIds}
			/>
		</ViewContainer>
	);
};

export default View;
