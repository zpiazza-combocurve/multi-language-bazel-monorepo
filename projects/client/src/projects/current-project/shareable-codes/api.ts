import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

const getAll = (projectId) => {
	return getApi(`/projects/${projectId}/shareable-codes`);
};

const createOne = (projectId, createBody) => {
	return postApi(`/projects/${projectId}/shareable-codes`, createBody);
};

const updateOne = (projectId, shareableCodeId, updateBody) => {
	return putApi(`/projects/${projectId}/shareable-codes/${shareableCodeId}`, updateBody);
};

const deleteOne = (projectId, shareableCodeId) => {
	return deleteApi(`/projects/${projectId}/shareable-codes/${shareableCodeId}`);
};

function useShareableCodes(projectId) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['current-project', 'shareable-codes', projectId], [projectId]);
	const { isLoading, data: shareableCodes } = useQuery(queryKey, () => getAll(projectId));
	const mutate = useCallback(
		(shareableCode) => {
			queryClient.setQueryData(queryKey, shareableCode);
		},
		[queryClient, queryKey]
	);
	const invalidateSettings = useCallback(() => queryClient.invalidateQueries(queryKey), [queryClient, queryKey]);

	return {
		shareableCodes,
		mutate,
		isLoading,
		queryKey,
		invalidateSettings,
	};
}

export default {
	getAll,
	createOne,
	updateOne,
	deleteOne,
	useShareableCodes,
};
