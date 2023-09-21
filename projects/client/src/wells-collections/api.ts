import { getApi, postApi, putApi } from '@/helpers/routing';

import { CreateWellsCollectionParams, MassCreateWellsCollectionParams, RemoveWellsCollectionParams } from './types';

export function getWellsCollectionById(
	wellsCollectionId: Inpt.ObjectId<'wells-collection'> | string | undefined
): Promise<Inpt.WellsCollection | null> {
	return getApi(`/wells-collections/${wellsCollectionId}`);
}

export function getWellsCollections(projectId: Inpt.ObjectId<'project'> | undefined): Promise<Inpt.WellsCollection[]> {
	return getApi(`/wells-collections/project/${projectId}`);
}

export function createWellsCollection(params: CreateWellsCollectionParams): Promise<Inpt.WellsCollection> {
	return postApi('/wells-collections', params);
}

export function massCreateWellsCollection(params: MassCreateWellsCollectionParams): Promise<Inpt.WellsCollection[]> {
	return postApi('/wells-collections/mass-create', params);
}

export function removeWellsCollection(params: RemoveWellsCollectionParams): Promise<void> {
	return putApi(`/wells-collections/remove-wells-collections`, params);
}

export function addWellsToWellsCollection(
	wellsCollectionId: Inpt.ObjectId<'wells-collection'>,
	wells: Inpt.ObjectId<'well'>[]
): Promise<void> {
	return putApi(`/wells-collections/${wellsCollectionId}/wells`, wells);
}

export function removeWellsFromWellsCollection(
	wellsCollectionId: Inpt.ObjectId<'wells-collection'>,
	wells: Inpt.ObjectId<'well'>[]
): Promise<void> {
	return putApi(`/wells-collections/${wellsCollectionId}/remove-wells`, wells);
}
