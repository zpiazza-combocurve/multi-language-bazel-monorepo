import { Route, Routes } from 'react-router-dom';

import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { DataSecretsTable } from './DataSecretsTable';

export const DataSecretsModule = () => {
	return (
		<>
			<Breadcrumb url='/data-sync/secrets' label='Secrets' />
			<Routes>
				<Route path='*' element={<DataSecretsTable />} />
			</Routes>
		</>
	);
};
