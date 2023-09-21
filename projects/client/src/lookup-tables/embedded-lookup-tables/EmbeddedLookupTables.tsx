import { lazy } from 'react';
import { useQuery } from 'react-query';
import { Navigate, RouteObject, useParams } from 'react-router-dom';

import { withHook } from '@/components/shared';
import { confirmationAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { RouteHandle, RouteTab } from '@/navigation/types';
import { createReactRouterBreadcrumb } from '@/navigation/utils';

import { useUpdateEmbeddedLookupTableMutation } from './mutations';
import { getEmbeddedLookupTableQuery } from './queries';

const useEmbeddedLookupTableModule = () => {
	const { embeddedLookupTableId } = useParams();

	const eltQuery = useQuery({
		...getEmbeddedLookupTableQuery(embeddedLookupTableId as string),
		suspense: true,
		useErrorBoundary: true,
	});

	const updateEmbeddedLookupTableMutation = useUpdateEmbeddedLookupTableMutation({
		onSuccess: (data) => {
			queryClient.setQueryData(getEmbeddedLookupTableQuery(embeddedLookupTableId as string).queryKey, data);
			confirmationAlert('Embedded Lookup Table Updated!');
		},
	});

	return { lookupTableData: eltQuery.data, updateEmbeddedLookupTableMutation };
};

const EmbeddedLookupTableEditView = withHook(
	lazy(() => import('./EmbeddedLookupTableEditView')),
	useEmbeddedLookupTableModule
);

const Settings = withHook(
	lazy(() => import('./Settings')),
	useEmbeddedLookupTableModule
);

const tabs = [
	{ path: 'settings', label: 'Settings', element: <Settings /> },
	{ path: 'edit', label: 'Edit', element: <EmbeddedLookupTableEditView /> },
] satisfies (RouteTab & RouteObject)[];

export const singleEmbeddedLookupTableRoutes = [
	{
		handle: {
			tabs,
			breadcrumb: createReactRouterBreadcrumb('embeddedLookupTableId', getEmbeddedLookupTableQuery),
		} satisfies RouteHandle,
		children: [{ index: true, element: <Navigate to='edit' replace /> }, ...tabs],
	},
] satisfies RouteObject[];
