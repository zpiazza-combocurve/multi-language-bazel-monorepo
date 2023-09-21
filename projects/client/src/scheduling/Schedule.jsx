import { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { Placeholder } from '@/components';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { ModuleNavigation } from '@/helpers/Navigation';
import { FeatureIcons } from '@/helpers/features';
import { usePagePath } from '@/helpers/routing';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import WithNotFound from '@/not-found/WithNotFound';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProjectRoutes } from '@/projects/routes';

import { CacheProvider } from './ScheduleCacheContext';
import { GanttChart } from './ScheduleGantt/GanttChart';
import { ResourceHistogram } from './ScheduleGantt/ResourceHistogram';
import { ScheduleLandingPage } from './ScheduleLandingPage';
import { useScheduleConstruction } from './ScheduleLandingPage/hooks/useScheduleConstruction';
import { ScheduleManageWells } from './ScheduleManageWells';
import ScheduleOutputPage from './ScheduleOutputPage';
import { SchedulerChart } from './SchedulerPro/SchedulerChart';
import { ScheduleSettings } from './SchedulingSettings';
import { invalidateSchedule, useScheduleQuery } from './shared';

export function Schedule() {
	const { id: scheduleId } = useParams();
	const scheduleQuery = useScheduleQuery(scheduleId);
	const constructionQuery = useScheduleConstruction(scheduleId);

	const projectRoutes = useCurrentProjectRoutes();
	const baseUrl = projectRoutes.schedule(scheduleQuery.data?._id).root;
	const { pageTabPath } = usePagePath(baseUrl);

	const { isSchedulingResourceViewEnabled } = useLDFeatureFlags();

	const notificationCallback = useCallback(
		async (notification) => {
			// We need to refetch construction if the user is inside any tab
			if (notification.status === TaskStatus.COMPLETED) constructionQuery.refetch();
		},
		[constructionQuery]
	);
	useUserNotificationCallback(NotificationType.SCHEDULE_RUN, notificationCallback);

	if (scheduleQuery.isLoading) {
		return <Placeholder main loading loadingText='Loading Schedule' />;
	}

	return (
		<WithNotFound noData={!scheduleQuery.data}>
			<Breadcrumb url={baseUrl} label={scheduleQuery.data?.name ?? 'Loading'} />

			<CacheProvider>
				<ModuleNavigation
					default={pageTabPath('view')}
					sharedProps={{
						scheduleId,
						requestModuleReload: invalidateSchedule,
						scheduleQuery,
						constructionQuery,
					}}
					pages={[
						{
							label: 'Settings',
							icon: FeatureIcons.settings,
							description: 'Schedule Settings',
							path: pageTabPath('settings'),
							component: ScheduleSettings,
							checks: ['isLoggedIn'],
						},
						{
							label: 'Scheduling Wells',
							icon: FeatureIcons.wells,
							description: 'Scheduling Wells',
							path: pageTabPath('manage-wells'),
							component: ScheduleManageWells,
							checks: ['isLoggedIn'],
						},
						{
							label: 'Scheduling',
							description: 'Scheduling',
							icon: FeatureIcons.schedule,
							path: pageTabPath('view'),
							component: ScheduleLandingPage,
							checks: ['isLoggedIn'],
							exact: true,
						},
						{
							label: 'Output',
							icon: FeatureIcons.scheduleOutput,
							description: 'Schedule Output',
							path: pageTabPath('output'),
							component: ScheduleOutputPage,
							checks: ['isLoggedIn'],
							disabled: !scheduleQuery.data?.constructed,
						},
						{
							label: 'Chart',
							icon: FeatureIcons.scheduleGantt,
							description: 'Gantt Chart',
							path: pageTabPath('gantt'),
							component: GanttChart,
							checks: ['isLoggedIn'],
							disabled: !scheduleQuery.data?.constructed,
						},
						{
							label: 'Resource View',
							icon: FeatureIcons.scheduleGantt,
							description: 'Resource View',
							path: pageTabPath('scheduler'),
							component: SchedulerChart,
							checks: ['isLoggedIn'],
							disabled: !scheduleQuery.data?.constructed,
							hidden: !isSchedulingResourceViewEnabled,
						},
						{
							label: 'Histogram (Beta)',
							icon: FeatureIcons.scheduleGantt,
							description: 'Histogram (Beta)',
							path: pageTabPath('histogram'),
							component: ResourceHistogram,
							checks: ['isLoggedIn'],
							disabled: !scheduleQuery.data?.constructed,
						},
					]}
				/>
			</CacheProvider>
		</WithNotFound>
	);
}
