import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { getFilterSettings, getSavedFilters } from './api';

export const useSavedFilterQuery = (projectId: Inpt.ObjectId<'project'> | string | undefined) => {
	const queryClient = useQueryClient();
	const key = useMemo(() => [projectId, 'wells-saved-filters'], [projectId]);

	const invalidate = useCallback(() => queryClient.invalidateQueries(key), [key, queryClient]);

	return {
		...useQuery(key, () => getSavedFilters(projectId)),
		invalidate,
	};
};

export const useFilterSettingsQuery = (projectId: Inpt.ObjectId<'project'> | string | undefined) => {
	const queryClient = useQueryClient();
	const key = useMemo(() => [projectId, 'wells-filter-settings'], [projectId]);

	const invalidate = useCallback(() => queryClient.invalidateQueries(key), [key, queryClient]);

	return {
		...useQuery(key, () => getFilterSettings(projectId)),
		invalidate,
	};
};
