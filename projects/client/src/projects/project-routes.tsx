import { lazy, useEffect } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

import FeatureFlagGuardOutlet from '@/feature-flags/FeatureFlagGuardOutlet';
import { useAlfa } from '@/helpers/alfa';
import { lookupTableRoutes } from '@/lookup-tables/lookup-table-routes';
import { carbonRoutes } from '@/networks/carbon-routes';
import NotFound from '@/not-found/not-found';

import { useCurrentProject, workProject } from './api';

const AssumptionMod = lazy(() => import('@/cost-model/AssumptionMod'));
const DataImport = lazy(() => import('@/data-import/FileImport'));
const Forecast = lazy(() => import('@/forecasts/Forecast'));
const ForecastMerge = lazy(() => import('@/forecasts/ForecastMerge').then((m) => ({ default: m.ForecastMerge })));
const ForecastModuleList = lazy(() => import('@/forecasts/ForecastMod'));
const SingleWell = lazy(() => import('@/manage-wells/SingleWell').then((m) => ({ default: m.SingleWell })));
const MapSettings = lazy(() => import('@/map/MapSettings'));
const Scenario = lazy(() => import('@/scenarios/Scenario'));
const ScenarioMod = lazy(() => import('@/scenarios/ScenarioModuleList'));
const Schedule = lazy(() => import('@/scheduling/Schedule').then((m) => ({ default: m.Schedule })));
const SchedulingMod = lazy(() =>
	import('@/scheduling/SchedulingModuleList').then((m) => ({ default: m.SchedulingMod }))
);
const TypeCurve = lazy(() => import('@/type-curves/TypeCurve').then((m) => ({ default: m.TypeCurve })));
const TypeCurvesMod = lazy(() => import('@/type-curves/TypeCurvesMod'));
const CurrentProject = lazy(() => import('./current-project/current-project'));

function ProjectRoot() {
	const { project } = useCurrentProject();
	const { set } = useAlfa(['set']);

	useEffect(() => {
		set({ project });
		if (project?._id) {
			workProject(project._id);
		}
	}, [project, set]);

	if (!project) return <NotFound />;

	return <Outlet />;
}

export const projectRoutes = [
	{
		element: <ProjectRoot />,
		children: [
			{ path: 'scenarios/:id/*', element: <Scenario /> },
			{ path: 'scenarios/*', element: <ScenarioMod /> },
			{ path: 'econ-models/*', element: <AssumptionMod /> },
			{ path: 'forecasts/:id/*', element: <Forecast /> },
			{ path: 'forecasts/*', element: <ForecastModuleList /> },
			{ path: 'type-curves/:id/*', element: <TypeCurve /> },
			{ path: 'type-curves/*', element: <TypeCurvesMod /> },
			{ path: 'schedules/:id/*', element: <Schedule /> },
			{ path: 'schedules/*', element: <SchedulingMod /> },
			{ path: 'lookup-tables', children: lookupTableRoutes },
			{ path: 'forecast-merge/*', element: <ForecastMerge /> },
			{ path: 'map-settings/*', element: <MapSettings /> },
			{ path: 'data-import/*', element: <DataImport /> },
			{ path: 'wells/:id/*', element: <SingleWell /> },
			{
				element: <FeatureFlagGuardOutlet flag='isCarbonEnabled' />,
				path: 'network-models/*',
				children: carbonRoutes,
			},
			{ path: '*', element: <CurrentProject /> },
		],
	},
] satisfies RouteObject[];
