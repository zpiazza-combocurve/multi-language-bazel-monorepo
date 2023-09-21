import { useQuery, useQueryClient } from 'react-query';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

export function getSortings(project) {
	return getApi('/sortings', { project });
}
export function getSorting(id) {
	return getApi(`/sortings/${id}`);
}
export function saveSorting(body) {
	return postApi('/sortings', body);
}
export function updateSorting(id, body) {
	return putApi(`/sortings/${id}`, body);
}
export function deleteSorting(id) {
	return deleteApi(`/sortings/${id}`);
}
export function updateDefaultSorting(id, remove) {
	return putApi(`/sortings/${id}/default`, { remove });
}

export function useSortings(projectId) {
	const queryClient = useQueryClient();
	const queryKey = ['sortings', projectId];
	const { isLoading, data: sortings } = useQuery(queryKey, () => getSortings(projectId));

	const reload = () => {
		queryClient.invalidateQueries(queryKey);
	};

	const onSortGet = (id) => getSorting(id);

	const onSortSave = async (sorting) => {
		await saveSorting(sorting);
		reload();
	};

	const onSortUpdate = async (id, sorting) => {
		await updateSorting(id, sorting);
		reload();
	};

	const onSortDelete = async (id) => {
		await deleteSorting(id);
		reload();
	};

	const onUpdateDefaultSorting = async (id, remove) => {
		await updateDefaultSorting(id, remove);
		reload();
	};

	return { sortings, isLoading, onSortGet, onSortSave, onSortUpdate, onSortDelete, onUpdateDefaultSorting, reload };
}
