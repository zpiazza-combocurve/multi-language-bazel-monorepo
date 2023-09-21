import { defaultPages, moduleUrls } from '@/routes/generate-routes';

export const schedulePaths = {
	...defaultPages,
	view: 'view',
	output: 'output',
	gantt: 'gantt',
	histogram: 'histogram',
};

export const scheduleRoutes = {
	schedules: 'schedules',
	schedule: moduleUrls('schedules', schedulePaths),
} as const;
