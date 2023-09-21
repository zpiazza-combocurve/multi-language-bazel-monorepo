import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

import FeatureFlagGuardOutlet from '@/feature-flags/FeatureFlagGuardOutlet';
import { RouteHandle, RouteTab } from '@/navigation/types';

import { singleEmbeddedLookupTableRoutes } from './embedded-lookup-tables/EmbeddedLookupTables';
import { singleScenarioLookupTableRoutes } from './scenario-lookup-table/ScenarioLookupTable';
import { singleSchedulingLookupTableRoutes } from './scheduling-lookup-table/SchedulingLookupTable';
import { singleTypeCurveLookupTableRoutes } from './type-curve-lookup-table/TypeCurveLookupTable';

const EmbeddedLookupTablesModuleList = lazy(() => import('./embedded-lookup-tables/EmbeddedLookupTablesModuleList'));

const ScheduleLookupTableModuleList = lazy(() => import('./scheduling-lookup-table/SchedulingLookupTableModuleList'));

const ScenarioLookupTable = lazy(() => import('@/lookup-tables/scenario-lookup-table/LookupTable/LookupTableMod'));

const TypeCurveLookupTable = lazy(
	() => import('@/lookup-tables/type-curve-lookup-table/LookupTable/ForecastLookupTableMod')
);

const embeddedRoutes = [
	{ index: true, element: <EmbeddedLookupTablesModuleList /> },
	{ path: ':embeddedLookupTableId', children: singleEmbeddedLookupTableRoutes },
] satisfies RouteObject[];

const scenarioRoutes = [
	{ index: true, element: <ScenarioLookupTable /> },
	{ path: ':scenarioLookupTableId', children: singleScenarioLookupTableRoutes },
] satisfies RouteObject[];

const typeCurveRoutes = [
	{ index: true, element: <TypeCurveLookupTable /> },
	{ path: ':typeCurveLookupTableId', children: singleTypeCurveLookupTableRoutes },
] satisfies RouteObject[];

const schedulingRoutes = [
	{ index: true, element: <ScheduleLookupTableModuleList /> },
	{ path: ':schedulingLookupTableId', children: singleSchedulingLookupTableRoutes },
] satisfies RouteObject[];

const tabs = [
	{ label: 'Embedded', path: 'embedded', children: embeddedRoutes },
	{ label: 'Scenario', path: 'scenario', children: scenarioRoutes },
	{ label: 'Type Curve', path: 'type-curve', children: typeCurveRoutes },
	{
		label: 'Scheduling',
		path: 'scheduling',
		children: schedulingRoutes,
		element: <FeatureFlagGuardOutlet flag='isSchedulingLookupTableEnabled' />,
		behindFeatureFlag: 'isSchedulingLookupTableEnabled',
	},
] satisfies (RouteTab & RouteObject)[];

export const lookupTableRoutes = [
	{
		handle: { tabs } satisfies RouteHandle,
		children: [{ index: true, element: <Navigate to='embedded' replace /> }, ...tabs],
	},
] satisfies RouteObject[];
