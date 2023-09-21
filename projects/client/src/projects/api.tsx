import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';

import { getApi, postApi } from '@/helpers/routing';

export function getProject(projectId) {
	return getApi(`/projects/getProject/${projectId}`);
}

export function getProjectSummariesCount(projectId: Inpt.ObjectId<'project'>) {
	return getApi(`/projects/${projectId}/summaries/count`);
}

export function getProjectSummariesItems(projectId: Inpt.ObjectId<'project'>) {
	return getApi(`/projects/${projectId}/summaries/items`);
}

export async function getProjectCompanyConfiguration(projectId) {
	const [config, companyConfiguration] = await Promise.all([
		getApi(`/company-forecast-settings/enforce/${projectId}`),
		getApi('/company-forecast-settings'),
	]);
	return { config, companyConfiguration };
}

export function mergeProjects(body) {
	return postApi('/projects/merge', body);
}

export function getMergeCollisions(firstProjectId, secondProjectId) {
	return getApi(`/projects/merge/${firstProjectId}/${secondProjectId}`);
}

export function getWellsOverlapAndTotalBasedOnIdField(firstProjectId, secondProjectId, field) {
	return getApi(`/projects/merge/${firstProjectId}/${secondProjectId}/wells-overlap-total?field=${field}`);
}

export function downloadMergeWellsInfo(firstProjectId, secondProjectId, field) {
	return getApi(`/projects/merge/${firstProjectId}/${secondProjectId}/wells?field=${field}`);
}

export const PROJECT_KEYS = {
	all: ['project'],
	getProject: (projectId) => [...PROJECT_KEYS.all, projectId],
};

export function useProject(id, enabled = true) {
	const queryKey = useMemo(() => PROJECT_KEYS.getProject(id), [id]);
	const query = useQuery<Assign<Inpt.Project, { createdBy: Inpt.User }>>(queryKey, () => getProject(id), {
		enabled: id !== undefined && enabled,
		suspense: true,
	});
	const queryClient = useQueryClient();
	const updateProject = useCallback(
		(newProject) => {
			queryClient.setQueryData(queryKey, newProject);
		},
		[queryClient, queryKey]
	);

	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	return { ...query, project: query.data, updateProject, reload };
}

export function useCurrentProject() {
	const { projectId } = useParams();

	return useProject(projectId);
}

export function withCurrentProject<T>(Component: React.ComponentType<T>) {
	return function WrappedComponentProject(props) {
		const { project } = useCurrentProject();
		return <Component {...props} project={project} />;
	};
}

export function useProjectSummariesCount(projectId: Inpt.ObjectId<'project'>) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['project', projectId, 'summaries', 'count'], [projectId]);
	const query = useQuery(queryKey, () => getProjectSummariesCount(projectId), { enabled: !!projectId });

	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	return { ...query, count: query.data, reload };
}

export function useProjectSummariesItems(projectId: Inpt.ObjectId<'project'>) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['project', projectId, 'summaries', 'items'], [projectId]);
	const query = useQuery(queryKey, () => getProjectSummariesItems(projectId), { enabled: !!projectId });

	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	return { ...query, items: query.data, reload };
}

export function useProjectCompanyConfiguration(id) {
	const queryKey = ['project', id, 'company-configuration'];
	const query = useQuery(queryKey, () => getProjectCompanyConfiguration(id));
	return { ...query, ...query.data };
}

export function workProject(id) {
	return getApi(`/projects/workProject/${id}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type WellsHeadersCombinations = { options: Record<string, any[]>; combinations: Record<string, any>[] };

export type HeaderOptions = {
	headers: string[];
	caseInsensitiveMatching: boolean;
};

export function getProjectWellsHeadersCombinations(
	projectId: Inpt.ObjectId<'project'>,
	headerOptions: HeaderOptions
): Promise<WellsHeadersCombinations> {
	return postApi(`/projects/${projectId}/well-headers-combinations`, headerOptions);
}
