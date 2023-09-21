import { lazy, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { RouteObject, useParams } from 'react-router-dom';

import FeatureFlagGuard from '@/feature-flags/FeatureFlagGuard';
import { localize } from '@/helpers/i18n';
import { assert } from '@/helpers/utilities';
import { BreadcrumbLink } from '@/navigation/Breadcrumbs';
import { RouteHandle, RouteTab, UseMatchesMatch } from '@/navigation/types';

import { facilityQuery, networkQuery } from './carbon/api';

const NetworkModelView = lazy(() => import('./carbon/Network/View'));
const NetworkModelFacilityView = lazy(() => import('./carbon/Facility/View'));
const FacilitiesModuleList = lazy(() =>
	import('./carbon/ModuleList/CarbonModuleList').then((m) => ({ default: m.FacilitiesModuleList }))
);
const NetworkModelsModuleList = lazy(() =>
	import('./carbon/ModuleList/CarbonModuleList').then((m) => ({ default: m.NetworkModelsModuleList }))
);
const NodeModelsModuleList = lazy(() => import('./carbon/ModuleList/NodeModelsModuleList'));

function NetworkBreadcrumb({ match }: { match: UseMatchesMatch }) {
	const { networkId } = useParams();
	assert(networkId, 'networkId is not defined');

	const { data: networkModel } = useQuery({ ...networkQuery(networkId), suspense: true });

	return <BreadcrumbLink label={networkModel?.name ?? ''} path={match.pathname} />;
}

function FacilityBreadcrumb({ match }: { match: UseMatchesMatch }) {
	const { facilityId } = useParams();
	assert(facilityId, 'facilityId is not defined');

	const { data: facility } = useQuery({ ...facilityQuery(facilityId), suspense: true });

	return <BreadcrumbLink label={facility?.name ?? ''} path={match.pathname} />;
}

const networkTabs = [{ label: 'View', path: '', element: <NetworkModelView /> }] satisfies (RouteTab & RouteObject)[];

const FacilityModelView = () => {
	const { facilityId } = useParams();
	const queryClient = useQueryClient();

	assert(facilityId, 'facilityId is not defined');

	const { data: facility } = useQuery({ ...facilityQuery(facilityId), suspense: true });
	assert(facility, 'facility is not defined');

	const invalidateFacility = useCallback(
		() => queryClient.invalidateQueries(networkQuery(facilityId).queryKey),
		[facilityId, queryClient]
	);

	return <NetworkModelFacilityView networkModel={facility} invalidateNetworkModel={invalidateFacility} />;
};

const facilityTabs = [{ label: 'View', path: '', element: <FacilityModelView /> }] satisfies (RouteTab & RouteObject)[];

const tabs = [
	{
		label: localize.network.label(),
		path: '',
		children: [
			{ index: true, element: <NetworkModelsModuleList /> },
			{
				path: ':networkId',
				handle: {
					tabs: networkTabs,
					breadcrumb: (match) => <NetworkBreadcrumb match={match} />,
				} satisfies RouteHandle,
				children: networkTabs,
			},
		],
	},
	{
		label: 'Facilities',
		path: 'facilities',
		children: [
			{ index: true, element: <FacilitiesModuleList /> },
			{
				path: ':facilityId',
				handle: {
					tabs: facilityTabs,
					breadcrumb: (match) => <FacilityBreadcrumb match={match} />,
				} satisfies RouteHandle,
				children: facilityTabs,
			},
		],
	},
	{
		label: localize.nodeModel.label(),
		path: 'node-models',
		element: (
			<FeatureFlagGuard flag='isNodeModelsEnabled'>
				<NodeModelsModuleList />
			</FeatureFlagGuard>
		),
		behindFeatureFlag: 'isNodeModelsEnabled',
	},
] satisfies (RouteTab & RouteObject)[];

export const carbonRoutes = [
	{
		handle: { tabs } satisfies RouteHandle,
		children: tabs,
	},
] satisfies RouteObject[];
