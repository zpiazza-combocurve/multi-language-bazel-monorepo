import { lazy } from 'react';
import { Navigate, RouteObject, useParams } from 'react-router-dom';

import { withHook } from '@/components/shared';
import { useLoadingBar } from '@/helpers/alerts';
import { useLookupTable } from '@/lookup-tables/scenario-lookup-table/helpers';
import { RouteHandle, RouteTab } from '@/navigation/types';
import { createReactRouterBreadcrumb } from '@/navigation/utils';

import { getLookupTableQuery } from './api';

function useViewLookupTable() {
	const { scenarioLookupTableId: lookupTableId } = useParams();

	const lookupTable = useLookupTable(lookupTableId);

	useLoadingBar(lookupTable.saving);

	return lookupTable;
}

const Settings = withHook(
	lazy(() => import('./LookupTable/Settings')),
	useViewLookupTable
);

const ScenarioLookupTableEditView = withHook(
	lazy(() => import('./LookupTable/EditLookupTable')),
	useViewLookupTable
);

const tabs = [
	{ path: 'settings', label: 'Settings', element: <Settings /> },
	{ path: 'edit', label: 'Edit', element: <ScenarioLookupTableEditView /> },
] satisfies (RouteTab & RouteObject)[];

export const singleScenarioLookupTableRoutes = [
	{
		handle: {
			tabs,
			breadcrumb: createReactRouterBreadcrumb('scenarioLookupTableId', getLookupTableQuery),
		} satisfies RouteHandle,
		children: [{ index: true, element: <Navigate to='edit' replace /> }, ...tabs],
	},
] satisfies RouteObject[];
