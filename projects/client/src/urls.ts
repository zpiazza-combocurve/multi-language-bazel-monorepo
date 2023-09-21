import { serializeQuery } from '@/helpers/routing';
import { projectPaths } from '@/projects/routes';
import { ROUTES } from '@/routes/routes';

export const getQuery = (query: object) => (query ? `?${serializeQuery(query)}` : '');

export const URLS = ROUTES;

type ModuleListPaths = keyof typeof projectPaths & keyof typeof ROUTES;

export function getModuleListRoute(feat: ModuleListPaths, projectId?: string | null): string {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return projectId == null ? ROUTES[feat] : ROUTES.project(projectId)[feat];
}
