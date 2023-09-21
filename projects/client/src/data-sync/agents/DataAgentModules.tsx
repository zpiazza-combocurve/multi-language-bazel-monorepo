import { useMemo } from 'react';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { ModuleNavigation, Page } from '@/helpers/Navigation';
import { URLS } from '@/urls';

import { AgentInstancesModule } from '../agent-instances/AgentInstances.module';
import { Agents } from './Agents.module';

export const DataAgentsModule = () => {
	const { canView: canViewAgents } = usePermissions(SUBJECTS.DataSyncAgents);
	const { canView: canViewInstances } = usePermissions(SUBJECTS.DataSyncAgentInstances);
	const pages = useMemo(
		() =>
			[
				canViewInstances
					? {
							component: AgentInstancesModule,
							path: URLS.agentInstances,
							label: 'Instances',
					  }
					: null,

				canViewAgents ? { component: Agents, path: URLS.agents, label: 'Agents' } : null,
			].filter((el) => !!el) as Page[],
		[canViewAgents, canViewInstances]
	);

	return <ModuleNavigation default={URLS.agentInstances} pages={pages} />;
};
