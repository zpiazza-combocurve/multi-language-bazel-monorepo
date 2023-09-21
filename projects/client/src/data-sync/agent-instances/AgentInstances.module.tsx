import { Route, Routes } from 'react-router-dom';

import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { AgentInstancesDetailContainer } from './AgentDetailInstances';
import { AgentInstancesList } from './AgentInstancesList';

export const AgentInstancesModule = () => {
	return (
		<>
			<Breadcrumb url='/data-sync/agents/instances' label='Instances' />
			<Routes>
				<Route path='*' element={<AgentInstancesList />} />
				<Route path='/:id' element={<AgentInstancesDetailContainer />} />
			</Routes>
		</>
	);
};
