import { Route, Routes } from 'react-router-dom';

import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { DataFlowDetail } from './DataFlowDetail';
import { DataFlowTable } from './DataFlowTable';

export const DataFlows = () => {
	return (
		<>
			<Breadcrumb url='/data-sync/data-flows' label='Data Flows' />
			<Routes>
				<Route path=':dataFlowId/*' element={<DataFlowDetail />} />
				<Route path='*' element={<DataFlowTable />} />
			</Routes>
		</>
	);
};
