import 'animate.css/animate.css';
import 'shepherd.js/dist/css/shepherd.css';
import './global-styles/index.scss';

import DateFnsUtils from '@date-io/date-fns';
import { faFolderOpen } from '@fortawesome/pro-regular-svg-icons';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Suspense, lazy } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from 'react-query';
import { Navigate, Outlet, RouteObject } from 'react-router-dom';

import { ClientRefresher } from './ClientRefresher';
import { AbilityProvider } from './access-policies/AbilityProvider';
import GoogleAnalytics from './analytics/GoogleAnalytics';
import Segment from './analytics/Segment';
import { AnalyticsProvider } from './analytics/SegmentProvider';
import CommandLauncher from './components/CommandLauncher';
import ErrorBoundary from './components/ErrorBoundary';
import Overlay from './components/Overlay';
import { Placeholder } from './components/Placeholder';
import TrailingSlashFix from './components/TrailingSlashFix';
import SnackbarHandler from './components/v2/alerts/SnackbarHandler';
import FeatureFlagGuardOutlet from './feature-flags/FeatureFlagGuardOutlet';
import { LaunchDarklyContext } from './feature-flags/LaunchDarklyContext';
import { withFeatureFlagEnabled } from './feature-flags/hocs';
import { WithLaunchDarklyClient } from './feature-flags/initialize-launch-darkly-client';
import MuiV5ThemeProvider from './helpers/MuiV5ThemeProvider';
import { LoadingBar } from './helpers/alerts';
import { useAlfa } from './helpers/alfa';
import { isDevelopmentRoute } from './helpers/env';
import { GlobalComponentsHandler } from './helpers/global-components';
import { RouteGuard } from './helpers/guards';
import { SyncWellHeaders } from './helpers/headers';
import { NavigationHandler } from './helpers/history';
import { WithProgress } from './helpers/progress';
import { UseQueryLoadingBar } from './helpers/query';
import { HiddenReactQueryDevTools, queryClient } from './helpers/query-cache';
import { ThemeHandler } from './helpers/theme';
import { UnsavedWorkHandler } from './helpers/unsaved-work';
import WithAuthentication, { WithUserCheck } from './login/Auth';
import Bootstrap from './login/Bootstrap';
import InitialLoading from './login/InitialLoading';
import LoginError from './login/LoginError';
import Callback from './login/callback';
import { lookupTableRoutes } from './lookup-tables/lookup-table-routes';
import { BreadcrumbLink } from './navigation/Breadcrumbs';
import { ClearNav } from './navigation/ContextTopNav';
import NavDrawer from './navigation/NavDrawer';
import { TopNavbar } from './navigation/NewTopNav';
import { RouteHandle } from './navigation/types';
import { carbonRoutes } from './networks/carbon-routes';
import { projectRoutes } from './projects/project-routes';
import { URLS } from './urls';

const PasswordlessLogin = lazy(() => import('./login/passwordless/PasswordlessLogin'));

const AssumptionMod = lazy(() => import('@/cost-model/AssumptionMod'));
const Company = lazy(() => import('./company/Company').then((m) => ({ default: m.Company })));
const DataImport = lazy(() => import('./data-import/FileImport'));
const DataSyncRoutes = lazy(() => import('./data-sync/DataSyncModuleList'));
const ForecastModuleList = lazy(() => import('@/forecasts/ForecastMod'));
const KBArticle = lazy(() => import('@/knowledge-base/KBArticle'));
const MapSettings = lazy(() => import('./map/MapSettings'));
const MergeProjects = lazy(() => import('./projects/MergeProjects'));
const MergeScenarios = lazy(() => import('@/scenarios/MergeScenarios'));
const ProjectModuleList = lazy(() => import('./projects/ProjectModuleList'));
const ScenarioMod = lazy(() => import('@/scenarios/ScenarioModuleList'));
const SchedulingMod = lazy(() => import('@/scheduling/SchedulingModuleList'));
const SingleWell = lazy(() => import('@/manage-wells/SingleWell'));
const TypeCurvesMod = lazy(() => import('@/type-curves/TypeCurvesMod'));

function HomeRedirect() {
	const { project } = useAlfa(['project']);
	const projectId = project?._id;
	if (!projectId) {
		return <Navigate to={URLS.projects} replace />;
	}
	return <Navigate to={URLS.project(projectId).root} replace />;
}

function ProjectBreadcrumb() {
	const { project } = useAlfa(['project']);
	return (
		<BreadcrumbLink
			path={project ? URLS.project(project._id).root : URLS.projects}
			label={project ? project?.name ?? 'Loading' : 'Select Project'}
			icon={faFolderOpen}
		/>
	);
}

function AppRoot() {
	return (
		<DndProvider backend={HTML5Backend}>
			<QueryClientProvider client={queryClient}>
				<Bootstrap>
					<WithUserCheck>
						<UnsavedWorkHandler />
						<AnalyticsProvider>
							<SyncWellHeaders />
							<AbilityProvider>
								<GlobalComponentsHandler />
								<SnackbarHandler />
								<NavDrawer />
								<Overlay />
								<LoadingBar />
								<NavigationHandler />
								<ClearNav />
								{!isDevelopmentRoute() && <GoogleAnalytics />}
								<WithProgress>
									<ErrorBoundary>
										<LaunchDarklyContext />
										<Segment />
										<ClientRefresher />
										<UseQueryLoadingBar />
										<CommandLauncher />
										<TopNavbar>
											<TrailingSlashFix>
												<Outlet />
											</TrailingSlashFix>
										</TopNavbar>
									</ErrorBoundary>
								</WithProgress>
							</AbilityProvider>
						</AnalyticsProvider>
					</WithUserCheck>
					<HiddenReactQueryDevTools />
				</Bootstrap>
			</QueryClientProvider>
		</DndProvider>
	);
}

const routes: RouteObject[] = [
	{
		path: '/',
		element: (
			<Suspense fallback={<InitialLoading />}>
				<MuiV5ThemeProvider>
					<ThemeHandler>
						<MuiPickersUtilsProvider utils={DateFnsUtils}>
							<WithLaunchDarklyClient>
								<WithAuthentication>
									<Outlet />
								</WithAuthentication>
							</WithLaunchDarklyClient>
						</MuiPickersUtilsProvider>
					</ThemeHandler>
				</MuiV5ThemeProvider>
			</Suspense>
		),
		children: [
			{
				element: (
					<RouteGuard checks={[]}>
						<Outlet />
					</RouteGuard>
				),
				children: [
					{ path: '/callback', Component: Callback },
					{ path: '/login-error', Component: LoginError },
					{ path: '/passwordless-login', Component: PasswordlessLogin },
				],
			},
			{
				path: '/',
				element: <AppRoot />,
				children: [
					{
						path: `${URLS.kb(':articleId').root}/*`,
						Component: KBArticle,
					},
					{
						element: (
							<Suspense fallback={<Placeholder />}>
								<RouteGuard>
									<Outlet />
								</RouteGuard>
							</Suspense>
						),
						children: [
							{
								Component: Company,
								path: `${URLS.company}/*`,
							},
							{
								Component: withFeatureFlagEnabled(DataSyncRoutes, 'isDataSyncEnabled'),
								path: URLS.dataSyncs,
							},
						],
					},
					{
						element: (
							<Suspense fallback={<Placeholder loading />}>
								<Outlet />
							</Suspense>
						),
						handle: {
							breadcrumb: () => <ProjectBreadcrumb />,
						} satisfies RouteHandle,
						children: [
							{
								path: URLS.home,
								Component: HomeRedirect,
							},
							{
								path: `${URLS.mergeScenarios(':firstScenarioId', ':secondScenarioId')}/*`,
								Component: MergeScenarios,
							},
							{
								path: `${URLS.mergeProjects(':firstProjectId', ':secondProjectId')}/*`,
								Component: MergeProjects,
							},
							{
								path: URLS.projects,
								Component: ProjectModuleList,
							},
							{
								path: `${URLS.project(':projectId').root}/*`,
								children: projectRoutes,
							},
							{
								path: `${URLS.map}/*`,
								Component: MapSettings,
							},
							{
								path: `${URLS.dataImports}/*`,
								Component: DataImport,
							},
							{
								path: `${URLS.well(':id')}/*`,
								Component: SingleWell,
							},
							{
								path: `${URLS.scenarios}/*`,
								Component: ScenarioMod,
							},
							{
								path: `${URLS.assumptions}/*`,
								Component: AssumptionMod,
							},
							{
								path: URLS.forecasts,
								Component: ForecastModuleList,
							},
							{
								path: URLS.typeCurves,
								Component: TypeCurvesMod,
							},
							{
								path: URLS.schedules,
								Component: SchedulingMod,
							},
							{
								path: 'lookup-tables/*',
								children: lookupTableRoutes,
							},
							{
								element: <FeatureFlagGuardOutlet flag='isCarbonEnabled' />,
								path: 'network-models/*',
								children: carbonRoutes,
							},
						],
					},
				],
			},
		],
	},
];

export default routes;
