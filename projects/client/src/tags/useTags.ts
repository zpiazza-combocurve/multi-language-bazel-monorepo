import { confirmationAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { useCreateTagMutation, useDeleteTagMutation, useUpdateTagMutation } from '@/tags/mutations';
import { TAGS_QUERY_KEYS, useGetAllTags } from '@/tags/queries';

const useTags = () => {
	const getAllTagsQueryResult = useGetAllTags();

	const createTagMutation = useCreateTagMutation({
		onSuccess: () => {
			confirmationAlert('Tag Created');

			queryClient.removeQueries(TAGS_QUERY_KEYS.all);
		},
	});

	const updateTagMutation = useUpdateTagMutation({
		onSuccess: () => {
			confirmationAlert('Tag Updated');

			queryClient.removeQueries(TAGS_QUERY_KEYS.all);
		},
	});

	const deleteTagMutation = useDeleteTagMutation({
		onSuccess: () => {
			confirmationAlert('Tag Deleted');

			queryClient.removeQueries(TAGS_QUERY_KEYS.all);
		},
	});

	const isLoading =
		getAllTagsQueryResult.isLoading ||
		createTagMutation.isLoading ||
		updateTagMutation.isLoading ||
		deleteTagMutation.isLoading;

	return {
		isLoading,
		createTag: createTagMutation.mutate,
		updateTag: updateTagMutation.mutate,
		deleteTag: deleteTagMutation.mutate,
		allTags: getAllTagsQueryResult.data ?? [],
	};
};

export default useTags;
