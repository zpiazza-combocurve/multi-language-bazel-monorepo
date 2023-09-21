import { Route, Routes } from 'react-router-dom';

import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { DataSourcesTable } from './DataSourcesTable';

export const DataSourcesModule = () => {
	return (
		<>
			<Breadcrumb url='/data-sync/data-sources' label='Data Sources' />
			<Routes>
				<Route path='*' element={<DataSourcesTable />} />
			</Routes>
		</>
	);
};
