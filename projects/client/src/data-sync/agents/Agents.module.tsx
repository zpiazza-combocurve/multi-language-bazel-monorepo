import { Route, Routes } from 'react-router-dom';

import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { AgentsTable } from './AgentsTable';

export const Agents = () => {
	return (
		<>
			<Breadcrumb url='/data-sync/agents/list' label='Agents' />
			<Routes>
				<Route path='*' element={<AgentsTable />} />
			</Routes>
		</>
	);
};
