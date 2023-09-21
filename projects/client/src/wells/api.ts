import { postApi } from '@/helpers/routing';

export function getWellHeaderValues(
	wellId: Inpt.ObjectId<'well'>,
	headers: string[],
	projectId?: Inpt.ObjectId<'project'>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): Promise<Record<string, any>> {
	return postApi(`/well/${wellId}/values`, { headers, projectId });
}

export function startExportWells(
	wellIds: Inpt.ObjectId<'well'>[],
	projectId?: Inpt.ObjectId<'project'>
): Promise<void> {
	return postApi('/well/export', { wellIds, projectId });
}
