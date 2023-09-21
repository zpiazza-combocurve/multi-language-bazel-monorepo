import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';

import { getWellsCollectionById, getWellsCollections } from './api';

export const WELLS_COLLECTIONS_BEGIN_QUERY_KEY = 'wells-collections';

export const useWellsCollectionsQuery = (projectId: Inpt.ObjectId<'project'> | undefined, enabled: boolean) => {
	const { isWellsCollectionsEnabled: featureEnabled } = useLDFeatureFlags();

	const queryClient = useQueryClient();
	const key = useMemo(() => [WELLS_COLLECTIONS_BEGIN_QUERY_KEY, 'project', projectId], [projectId]);

	const invalidate = useCallback(() => queryClient.invalidateQueries(key), [key, queryClient]);

	return {
		...useQuery(key, () => getWellsCollections(projectId), {
			enabled: featureEnabled && enabled,
		}),
		invalidate,
	};
};

export const useWellsCollectionQuery = (
	wellsCollectionId: Inpt.ObjectId<'wells-collection'> | string | undefined,
	enabled: boolean
) => {
	const { isWellsCollectionsEnabled: featureEnabled } = useLDFeatureFlags();

	const queryClient = useQueryClient();
	const key = useMemo(() => [WELLS_COLLECTIONS_BEGIN_QUERY_KEY, wellsCollectionId], [wellsCollectionId]);

	const invalidate = useCallback(() => queryClient.invalidateQueries(key), [key, queryClient]);

	return {
		...useQuery(key, () => getWellsCollectionById(wellsCollectionId), {
			enabled: featureEnabled && enabled,
		}),
		invalidate,
	};
};
