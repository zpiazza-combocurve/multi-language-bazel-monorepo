import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { useLoadingBar } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';

import { getCommentIdKey } from './shared';

function getWellCommentLabels(wellId) {
	return getApi('/well-comments/labels', { wellId });
}

function getWellComments(wellId, filters) {
	return getApi('/well-comments', { ...filters, wellId });
}

type Label = {
	key;
	name;
	_id;
};

export function useWellCommentLabels(wellId, initialFilters, projectWell) {
	const queryKey = useMemo(() => ['well-comments', wellId, 'labels'], [wellId]);
	const { data: labels = [], isLoading } = useQuery<Label[]>(queryKey, () => getWellCommentLabels(wellId));
	useLoadingBar(isLoading);
	const initialFiltersWithProjectId = useMemo(
		() => (projectWell ? { ...initialFilters, projectId: projectWell } : initialFilters),
		[initialFilters, projectWell]
	); // overwrite initialFilters's projectId with projectWell // HACK: shoudn't need to, initialFilters's projectId should be the same as projectWell
	const [filters, setFilters] = useDerivedState(initialFiltersWithProjectId);
	const [labelsToSelect, selectedLabels] = useMemo(() => {
		const _labelsToSelect = [] as Label[]; // excludes items of same filtered type
		const _selectedLabels = [] as Label[];
		labels.forEach((label) => {
			const { key, _id } = label;
			const idKey = getCommentIdKey(key);
			const filterId = filters[idKey];
			const sameId = _id === filterId;
			const isProjectKey = idKey === 'projectId';
			if (!filterId && (!isProjectKey || !projectWell)) {
				_labelsToSelect.push(label);
			}
			if (sameId) {
				_selectedLabels.push(label);
			}
		});
		return [_labelsToSelect, _selectedLabels];
	}, [filters, labels, projectWell]);
	const selectLabels = useCallback(
		(newLabels: Label[]) => {
			const newFilters = newLabels.reduce((_newFilters, { key, _id }) => {
				_newFilters[getCommentIdKey(key)] = _id;
				return _newFilters;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			}, {} as any);
			if (projectWell) {
				newFilters.projectId = projectWell;
			}
			setFilters(newFilters);
		},
		[setFilters, projectWell]
	);
	return { labels, labelsToSelect, selectedLabels, selectLabels, filters };
}

export function useWellComments(wellId, filters) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => ['well-comments', wellId, filters], [wellId, filters]);
	const { data: { items: comments = [] } = {}, isLoading: isLoadingComment } = useQuery(queryKey, () =>
		getWellComments(wellId, filters || {})
	);
	const { mutate: saveComment, isLoading: isInsertingComment } = useMutation(
		(comment: {
			text: string;
			wellId: Inpt.ObjectId;
			projectId: Inpt.ObjectId;
			scenarioId: Inpt.ObjectId;
			forecastId: Inpt.ObjectId;
		}) => {
			return postApi('/well-comments', comment);
		},
		{
			onSettled: () => {
				queryClient.invalidateQueries(queryKey);
			},
		}
	);
	useLoadingBar(isLoadingComment || isInsertingComment);
	const handleAddComment = useCallback(
		({ text, projectId, forecastId, scenarioId }) => {
			saveComment({ text, wellId, projectId, forecastId, scenarioId });
		},
		[wellId, saveComment]
	);
	return { comments, handleAddComment };
}

export function useWellInfo(wellId) {
	const { data: wellInfo, isLoading } = useQuery(
		['well', wellId],
		() => getApi(`/well/getWell/${wellId}`) as Promise<Inpt.Well>
	);
	useLoadingBar(isLoading);
	return { wellInfo };
}
