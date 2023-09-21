import { UseQueryResult, useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

import { Assumption } from './shared';

export const KEYS = {
	escalationsInProject: (project) => ['assumptions', 'escalation', project],
};

export function getEconModelById(id: string): Promise<Assumption> {
	return getApi(`/cost-model/getModelById/${id}`);
}

export function getAssumptionExtendedTemplate<T>(
	projectId: string | Inpt.ObjectId<'project'>,
	assumptionKey: string
): Promise<{ template: { fields: T } }> {
	return getApi(`/cost-model/getExtendedTemplate/${projectId}/${assumptionKey}`);
}

export function getEscalationsInProject(project: string | undefined): Promise<Assumption[]> {
	return getApi(`/cost-model/searchModels`, { assumptionKey: 'escalation', project });
}

export function useEscalationsInProject(projectId: string | undefined): UseQueryResult<Assumption[]> {
	return useQuery(KEYS.escalationsInProject(projectId), () => getEscalationsInProject(projectId), {
		enabled: !!projectId,
	});
}
