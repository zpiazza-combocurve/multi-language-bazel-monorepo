import { defaultPages, moduleUrls } from '@/routes/generate-routes';

export const scenarioPaths = {
	...defaultPages,
	view: 'view',
	reports: 'reports',
	reportManagment: 'reports/management',
};

export const scenarioRoutes = {
	scenarios: 'scenarios',
	scenario: moduleUrls('scenarios', scenarioPaths),
} as const;
