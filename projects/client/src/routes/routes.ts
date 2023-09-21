import { projectRoutes } from '@/projects/routes';

import { moduleUrls } from './generate-routes';

export const ROUTES = {
	home: '/',
	...projectRoutes,
	company: '/company',
	map: '/map-settings',
	dataImports: '/data-import',
	dataImport: moduleUrls('data-import', {
		root: '',
	}),
	dataSyncRoot: '/data-sync',
	dataSyncs: '/data-sync/*',
	dataSync: moduleUrls('data-sync', { root: '' }),
	dataSources: '/data-sync/data-sources',
	agentsCore: '/data-sync/agents',
	agents: '/data-sync/agents/list',
	agentInstances: '/data-sync/agents/instances',
	dataFlow: '/data-sync/data-flows',
	dataSecrets: '/data-sync/secrets',
	kb: moduleUrls('kb', {
		root: '',
	}),
	notifications: '/notifications',
	well: (wellId: string) => `/wells/${wellId}`,
	mergeScenarios: (firstScenarioId: string, secondScenarioId: string) =>
		`/scenarios/merge/${firstScenarioId}/${secondScenarioId}`,
	mergeProjects: (firstProjectId: string, secondProjectId: string) =>
		`/merge-projects/${firstProjectId}/${secondProjectId}`,

	scenarios: '/scenarios',
	assumptions: '/econ-models',
	forecasts: '/forecasts',
	typeCurves: '/type-curves',
	schedules: '/schedules',
	lookupTables: '/lookup-tables',
	networkModels: '/network-models',
} as const;

export default ROUTES;
