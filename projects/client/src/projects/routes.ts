import { useParams } from 'react-router-dom';

import { assumptionRoutes } from '@/cost-model/routes';
import { forecastRoutes } from '@/forecasts/routes';
import { lookupTableRoutes } from '@/lookup-tables/scenario-lookup-table/routes';
import { networkModelsRoutes } from '@/networks/carbon/routes';
import { defaultPages, moduleUrls } from '@/routes/generate-routes';
import { scenarioRoutes } from '@/scenarios/routes';
import { scheduleRoutes } from '@/scheduling/routes';
import { typeCurveRoutes } from '@/type-curves/routes';

export const projectPaths = {
	...defaultPages,
	...scenarioRoutes,
	...assumptionRoutes,
	...forecastRoutes,
	...typeCurveRoutes,
	...scheduleRoutes,
	...lookupTableRoutes,
	...networkModelsRoutes,
	summaries: 'summaries',
	access: 'access',
	sharing: 'sharing',

	map: 'map-settings',
	dataImports: 'data-import',
	dataImport: moduleUrls('data-import', {
		root: '',
		importStep: 'import',
	}),
	well: (wellId: string) => `/wells/${wellId}`,
};

export const projectRoutes = {
	projects: '/projects',
	project: moduleUrls('projects', projectPaths),
} as const;

export const useCurrentProjectId = () => {
	const { projectId } = useParams();

	if (!projectId) {
		throw new Error('projectId should exist');
	}

	return projectId;
};

export const useCurrentProjectRoutes = () => {
	const projectId = useCurrentProjectId();

	return projectRoutes.project(projectId);
};
