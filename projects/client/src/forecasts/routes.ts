import { defaultPages, moduleUrls } from '@/routes/generate-routes';

export const forecastPaths = {
	...defaultPages,
	view: 'view',
	manual: 'manual',
	diagnostics: 'diagnostics',
};

export const forecastRoutes = {
	forecasts: 'forecasts',
	forecastMerge: 'forecast-merge',
	forecast: moduleUrls('forecasts', forecastPaths),
	deterministic: moduleUrls('deterministic', forecastPaths),
} as const;
