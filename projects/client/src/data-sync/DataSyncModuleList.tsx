import { Route, Routes } from 'react-router-dom';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { RouteGuard } from '@/helpers/guards';
import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { DataAgentsModule } from './agents/DataAgentModules';
import { Dashboard } from './dashboard/Dashboard';
import { DataFlows } from './data-flows/DataFlowModuleList';
import { DataSourcesModule } from './data-sources/DataSourcesModule';
import { DataSecretsModule } from './secrets/DataSecretsModule';

type Page = { component: React.ReactNode; path: string };

export function DataSyncRoutes() {
	const { canView: canViewAgents } = usePermissions(SUBJECTS.DataSyncAgents);
	const { canView: canViewDataFlows } = usePermissions(SUBJECTS.DataSyncDataFlows);
	const { canView: canViewSources } = usePermissions(SUBJECTS.DataSyncDataSources);
	const { canView: canViewSecrets } = usePermissions(SUBJECTS.DataSyncSecrets);

	const pages = [
		canViewAgents ? { component: <DataAgentsModule />, path: '/agents/*' } : null,
		canViewDataFlows ? { component: <DataFlows />, path: '/data-flows/*' } : null,
		canViewSources ? { component: <DataSourcesModule />, path: '/data-sources/*' } : null,
		canViewSecrets ? { component: <DataSecretsModule />, path: '/secrets/*' } : null,
		{ component: <Dashboard />, path: '/' },
	].filter(Boolean) as Page[];

	return (
		<>
			<Breadcrumb url='/data-sync' label='Data Sync' />
			<Routes>
				{pages.map(({ path, component }) => (
					<Route key={path} element={<RouteGuard>{component}</RouteGuard>} path={path} />
				))}
			</Routes>
		</>
	);
}

export default DataSyncRoutes;
