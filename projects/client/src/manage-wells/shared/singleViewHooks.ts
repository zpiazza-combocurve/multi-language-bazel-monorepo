import { useMemo } from 'react';

import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { useProjectHeadersDataMap } from '@/helpers/project-custom-headers';
import { useWellsCollectionQuery } from '@/wells-collections/queries';

import { useWellsHeadersMap } from './utils';

function useWellHeadersData(wellId: string | null) {
	const { project } = useAlfa();

	const wellIdsArray = wellId ? [wellId] : [];
	const headersQuery = useWellsHeadersMap(wellIdsArray);
	const projectCustomHeadersDataMapQuery = useProjectHeadersDataMap(project?._id, wellIdsArray);

	return useMemo(
		() =>
			wellId
				? { ...headersQuery.data?.get(wellId), ...projectCustomHeadersDataMapQuery.data?.get(wellId) }
				: undefined,
		[headersQuery.data, projectCustomHeadersDataMapQuery.data, wellId]
	);
}

function useWellsCollectionHeadersData(collectionId: string | null) {
	const query = useWellsCollectionQuery(collectionId ?? undefined, !!collectionId);
	return query.data ?? undefined;
}

function useWellsCollectionWellsData(collectionId: string | null) {
	const query = useWellsCollectionQuery(collectionId ?? undefined, !!collectionId);
	return query.data?.wells_collection_items ?? [];
}

function useSingleViewData<T>(
	wellOrCollectionId: string,
	isWellsCollection: boolean,
	useWellData: (id: string | null) => T,
	useWellsCollectionData: (id: string | null) => T
) {
	const { isWellsCollectionsEnabled: wellsCollectionsFeatureEnabled } = useLDFeatureFlags();

	const shouldUseWellsCollection = wellsCollectionsFeatureEnabled && isWellsCollection;

	const wellId = shouldUseWellsCollection ? null : wellOrCollectionId;
	const collectionId = shouldUseWellsCollection ? wellOrCollectionId : null;

	const wellData = useWellData(wellId);
	const collectionData = useWellsCollectionData(collectionId);

	return shouldUseWellsCollection ? collectionData : wellData;
}

export function useSingleViewHeadersData(wellOrCollectionId: string, isWellsCollection: boolean) {
	return useSingleViewData(wellOrCollectionId, isWellsCollection, useWellHeadersData, useWellsCollectionHeadersData);
}

export function useSingleViewWellsData(wellOrCollectionId: string, isWellsCollection: boolean) {
	return useSingleViewData(
		wellOrCollectionId,
		isWellsCollection,
		(wellId) => (wellId ? [wellId] : []),
		useWellsCollectionWellsData
	);
}
