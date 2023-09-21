/** AKA ForecastLookupTable */

import { lazy } from 'react';
import { Navigate, RouteObject, useParams } from 'react-router-dom';

import { withHook } from '@/components/shared';
import { useLookupTable } from '@/lookup-tables/type-curve-lookup-table/helpers';
import { RouteHandle, RouteTab } from '@/navigation/types';
import { createReactRouterBreadcrumb } from '@/navigation/utils';

import { getLookupTableQuery } from './api';

function useViewLookupTable() {
	const { typeCurveLookupTableId: lookupTableId } = useParams();

	const lookupTable = useLookupTable(lookupTableId);

	return lookupTable;
}

const Settings = withHook(
	lazy(() => import('./LookupTable/Settings')),
	useViewLookupTable
);

const TypeCurveLookupTableEditView = withHook(
	lazy(() => import('./LookupTable/EditForecastLookupTable')),
	useViewLookupTable
);

const tabs = [
	{ path: 'settings', label: 'Settings', element: <Settings /> },
	{ path: 'edit', label: 'Edit', element: <TypeCurveLookupTableEditView /> },
] satisfies (RouteTab & RouteObject)[];

export const singleTypeCurveLookupTableRoutes = [
	{
		handle: {
			tabs,
			breadcrumb: createReactRouterBreadcrumb('typeCurveLookupTableId', getLookupTableQuery),
		} satisfies RouteHandle,
		children: [{ index: true, element: <Navigate to='edit' replace /> }, ...tabs],
	},
] satisfies RouteObject[];
