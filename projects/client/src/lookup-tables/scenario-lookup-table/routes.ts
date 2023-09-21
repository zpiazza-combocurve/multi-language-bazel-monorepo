import { moduleUrls } from '@/routes/generate-routes';

export const lookupTablePaths = {
	root: '/',
	settings: 'settings',
	edit: 'edit',
};

export const lookupTableRoutes = {
	lookupTables: 'lookup-tables',
	scenarioLookupTables: 'lookup-tables/scenario',
	forecastLookupTables: 'lookup-tables/type-curve',
	embeddedLookupTables: 'lookup-tables/embedded',
	schedulingLookupTables: 'lookup-tables/scheduling',
	scenarioLookupTable: moduleUrls('lookup-tables/scenario', lookupTablePaths),
	forecastLookupTable: moduleUrls('lookup-tables/type-curve', lookupTablePaths),
	embeddedLookupTable: moduleUrls('lookup-tables/embedded', lookupTablePaths),
	schedulingLookupTable: moduleUrls('lookup-tables/scheduling', lookupTablePaths),
} as const;
