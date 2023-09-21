import { faRabbitFast } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useMatch } from 'react-router-dom';

import { Placeholder } from '@/components';
import { useURLSearchParams } from '@/components/hooks/useQuery';
import { useToggleManualSelection } from '@/forecasts/charts/components/helpers';
import EnforcedForecastSettings from '@/forecasts/forecast-form/EnforcedForecastSettings';
import ManualEditingProvider from '@/forecasts/manual/ManualEditingContext';
import ManualEditingTypeCurveProvider from '@/forecasts/manual/ManualEditingTypeCurveContext';
import ProbabilisticViewContainer from '@/forecasts/view/ProbabilisticViewContainer';
import { ModuleNavigation } from '@/helpers/Navigation';
import { FeatureIcons } from '@/helpers/features';
import { queryClient } from '@/helpers/query-cache';
import { usePagePath } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import WithNotFound from '@/not-found/WithNotFound';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { projectRoutes as projectRouteObj, useCurrentProjectRoutes } from '@/projects/routes';

import { ForecastManageWells } from './ForecastManageWells';
import ForecastSettings from './ForecastSettings';
import { KEYS, useAllProjectForecasts, useForecast, useForecastNotifications } from './api';
import DeterministicView from './deterministic/View';
import ManualDeterministicForecast from './deterministic/manual/ManualDeterministicForecast';
import ForeDiagContainer from './diagnostics/ForeDiagContainer';
import { ForecastContext } from './forecastCtx';
import ManualForecast from './manual/ManualForecast';

const ProbabilisticManualComponent = (props) => (
	<ManualEditingProvider>
		<ManualEditingTypeCurveProvider>
			<ManualForecast {...props} />
		</ManualEditingTypeCurveProvider>
	</ManualEditingProvider>
);

const DeterministicManualComponent = (props) => (
	<ManualEditingProvider>
		<ManualEditingTypeCurveProvider>
			<ManualDeterministicForecast {...props} />
		</ManualEditingTypeCurveProvider>
	</ManualEditingProvider>
);

const DeterministicViewComponent = (props) => (
	<EnforcedForecastSettings>
		<DeterministicView {...props} />
	</EnforcedForecastSettings>
);

const useDisabledForecastTasks = (forecastId) => {
	const notificationsQuery = useForecastNotifications(forecastId);
	const [disableForecastTasks, setDisableForecastTasks] = useState(true);
	const { setLoadingRun } = useContext(ForecastContext);
	useEffect(() => {
		if (!notificationsQuery.isLoading) {
			const initialDisableFromNotifications = notificationsQuery.data.some(
				(notification) =>
					notification.status === TaskStatus.RUNNING || notification.status === TaskStatus.QUEUED
			);
			setLoadingRun?.(initialDisableFromNotifications);
			setDisableForecastTasks(initialDisableFromNotifications);
		}
	}, [notificationsQuery.data, notificationsQuery.isLoading, setLoadingRun]);

	const forecastNotificationCallback = useCallback(
		async (notification) => {
			if (notification.extra?.body?.forecastId === forecastId) {
				if (notification.status === TaskStatus.COMPLETED || notification.status === TaskStatus.FAILED) {
					setDisableForecastTasks(false);
					setLoadingRun?.(false);
					if (
						notification.status === TaskStatus.COMPLETED &&
						notification.type === NotificationType.DIAGNOSTICS
					) {
						queryClient.setQueryData(
							KEYS.forecastDocument(forecastId),
							produce<{ diagDate: Date }>((draft) => {
								draft.diagDate = new Date();
							})
						);
					}
				} else {
					setDisableForecastTasks(true);
				}
			}
		},
		[forecastId, setLoadingRun]
	);

	useUserNotificationCallback(NotificationType.FORECAST, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.MASS_SHIFT_SEGMENTS, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.EXPORT_FORECAST_CHARTS, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.CC_TO_ARIES, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.FORECAST_IMPORT, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.EXPORT_FORECAST_DATA, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.ROLL_UP, forecastNotificationCallback);
	useUserNotificationCallback(NotificationType.DIAGNOSTICS, forecastNotificationCallback);
	return disableForecastTasks;
};

const FORECAST_NO_WELL_TAB_TOOLTIP = 'Forecast does not have any wells';
const EDITING_NO_WELL_TAB_TOOLTIP = 'No well has been added to editing bucket';

const useWellIds = (): [Array<string>, string | undefined] => {
	const [urlSearchParams] = useURLSearchParams();
	const queryStringWellIds = useMemo(() => urlSearchParams.get('wellId')?.split(','), [urlSearchParams]);
	const queryStringWellChosenIds = useMemo(() => urlSearchParams.get('chosenID')?.split(','), [urlSearchParams]);
	if (queryStringWellIds?.length) return [queryStringWellIds, '_id'];
	if (queryStringWellChosenIds?.length) return [queryStringWellChosenIds, 'chosenID'];
	return [[], undefined];
};

function Forecast() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRouteObj.project(':projectId').forecast(':id').root}/*`);
	assert(match);

	const forecastId = match.params.id;
	const forecastDocumentQuery = useForecast(forecastId);
	useAllProjectForecasts(forecastDocumentQuery.data?.project._id);

	const { bucket, toggleAll, toggleManualSelect, setManualSelect, isLoading, isSettingBucket } =
		useToggleManualSelection({
			forecastId,
		});

	const disableForecastTasks = useDisabledForecastTasks(forecastId);

	const [queryStringWellIds, idType] = useWellIds();
	const wellIdsRef = useRef<Array<string>>([]);
	const { loadingRun } = useContext(ForecastContext);

	const shouldUpdateBucket =
		queryStringWellIds?.length && !_.isEqual(wellIdsRef.current?.sort(), queryStringWellIds?.sort());

	useEffect(() => {
		if (!forecastDocumentQuery.isLoading && shouldUpdateBucket) {
			setManualSelect({ wellIds: queryStringWellIds, idType });
			wellIdsRef.current = queryStringWellIds;
		}
	}, [queryStringWellIds, setManualSelect, isLoading, idType, shouldUpdateBucket, forecastDocumentQuery.isLoading]);

	const projectRoutes = useCurrentProjectRoutes();
	const { pageTabPath } = usePagePath(projectRoutes.forecast(forecastDocumentQuery.data?._id).root);

	const renderMemo = useMemo(() => {
		if (forecastDocumentQuery.isLoading || isSettingBucket || shouldUpdateBucket) {
			return <Placeholder loading main />;
		}
		const forecast = forecastDocumentQuery.data;
		const noForecastWells = !forecast?.wells?.length;
		const noEditingWells = !bucket?.size;

		const type = forecastDocumentQuery.data?.type;
		const forecastNoWellTabTooltip = noForecastWells ? FORECAST_NO_WELL_TAB_TOOLTIP : undefined;

		return (
			<WithNotFound noData={!type}>
				<Breadcrumb
					url={projectRoutes.forecast(forecastDocumentQuery.data?._id).view}
					label={forecastDocumentQuery.data?.name ?? 'Loading'}
				/>
				<ModuleNavigation
					sharedProps={{
						forecastDocumentQuery,
						forecastId,
						bucket,
						toggleAll,
						toggleManualSelect,
						disableForecastTasks,
					}}
					default={pageTabPath('settings')}
					pages={[
						{
							icon: FeatureIcons.settings,
							path: pageTabPath('settings'),
							label: 'Settings',
							component: ForecastSettings,
							checks: ['projectAccess'],
						},
						{
							icon: FeatureIcons.wells,
							path: pageTabPath('wells'),
							label: 'Forecast Wells',
							component: ForecastManageWells,
							checks: ['projectAccess'],
						},
						{
							icon: faRabbitFast,
							path: pageTabPath('view'),
							label: 'Forecast',
							component:
								type === 'probabilistic' ? ProbabilisticViewContainer : DeterministicViewComponent,
							checks: ['projectAccess'],
							disabled: noForecastWells,
							tooltipTitle: forecastNoWellTabTooltip,
						},
						{
							icon: FeatureIcons.forecastDiag,
							path: pageTabPath('diagnostics'),
							label: 'Diagnostics',
							component: ForeDiagContainer,
							checks: ['projectAccess'],
							disabled: noForecastWells,
							tooltipTitle: forecastNoWellTabTooltip,
						},
						{
							icon: FeatureIcons.forecasts,
							path: pageTabPath('manual'),
							label: 'Editing',
							component:
								type === 'probabilistic' ? ProbabilisticManualComponent : DeterministicManualComponent,
							checks: ['projectAccess'],
							disabled: loadingRun || noEditingWells,
							tooltipTitle: noEditingWells ? EDITING_NO_WELL_TAB_TOOLTIP : undefined,
						},
					]}
				/>
			</WithNotFound>
		);
	}, [
		bucket,
		disableForecastTasks,
		forecastDocumentQuery,
		forecastId,
		projectRoutes,
		toggleAll,
		toggleManualSelect,
		isSettingBucket,
		shouldUpdateBucket,
		pageTabPath,
		loadingRun,
	]);

	return renderMemo;
}

export default () => {
	const [loadingRun, setLoadingRun] = useState(false);
	return (
		// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
		<ForecastContext.Provider value={{ loadingRun, setLoadingRun }}>
			<Forecast />
		</ForecastContext.Provider>
	);
};
