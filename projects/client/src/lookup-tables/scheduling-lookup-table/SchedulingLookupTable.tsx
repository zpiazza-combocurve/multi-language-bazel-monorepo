import { RouteObject } from 'react-router-dom';

function ViewLookupTable() {
	return <h1>Scheduling Lookup Table</h1>;
}

export const singleSchedulingLookupTableRoutes = [
	{ path: 'view', element: <ViewLookupTable /> },
] satisfies RouteObject[];
