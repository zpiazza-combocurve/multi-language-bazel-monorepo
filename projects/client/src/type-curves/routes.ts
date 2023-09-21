import { defaultPages, moduleUrls } from '@/routes/generate-routes';

export const typeCurvePaths = {
	...defaultPages,
	view: 'view',
	normalize: 'normalize',
	fit: 'fit',
	economics: 'economics',
};

export const typeCurveRoutes = {
	typeCurves: 'type-curves',
	typeCurve: moduleUrls('type-curves', typeCurvePaths),
} as const;
