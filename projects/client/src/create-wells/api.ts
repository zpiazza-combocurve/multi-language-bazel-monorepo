import { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

import { CreateGenericWellsModel, WellHeaderValue } from './models';

export function getTemplates(projectId: Inpt.ObjectId<'project'> | undefined): Promise<CreateGenericWellsModel[]> {
	return getApi(`/create-wells-templates/${projectId ?? ''}`);
}

export function saveTemplate(
	projectId: Inpt.ObjectId<'project'> | undefined,
	template: CreateGenericWellsModel
): Promise<CreateGenericWellsModel> {
	return postApi(`/create-wells-templates/${projectId ?? ''}`, template);
}

export function deleteTemplate(
	projectId: Inpt.ObjectId<'project'> | undefined,
	id: Inpt.ObjectId
): Promise<CreateGenericWellsModel> {
	return deleteApi(`/create-wells-templates/${projectId ?? ''}/${id}`);
}

export function toggleDefaultFlag(
	projectId: Inpt.ObjectId<'project'> | undefined,
	id: Inpt.ObjectId
): Promise<CreateGenericWellsModel> {
	return putApi(`/create-wells-templates/${projectId ?? ''}/${id}/default`);
}

export function createWells(
	projectId: Inpt.ObjectId<'project'> | undefined,
	wells: Record<string, WellHeaderValue>[]
): Promise<void> {
	return postApi('/well/createWells', { projectId, wells });
}

export function useUserCreateWellsTemplates(projectId: Inpt.ObjectId<'project'> | undefined) {
	const queryClient = useQueryClient();
	const key = useMemo(() => ['create-wells-templates', projectId], [projectId]);

	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...useQuery(key, () => getTemplates(projectId!)),
		invalidate: () => queryClient.invalidateQueries(key),
	};
}
