import { faMinus } from '@fortawesome/pro-regular-svg-icons';

import { Button as MUIButton } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { pluralize } from '@/inpt-shared/helpers/text-utils';
import TagsDialog from '@/tags/TagsDialog';
import { useRemoveTagsMutation } from '@/tags/mutations';
import { TAGS_QUERY_KEYS, useGetAllTags } from '@/tags/queries';

export const useMassRemoveTags = ({
	feat,
	refresh,
	featIds,
}: {
	feat: string;
	refresh: () => void;
	featIds: Inpt.ObjectId[];
}) => {
	const text = 'Remove Tags';
	const { data: allTags } = useGetAllTags();

	const removeTagsMutation = useRemoveTagsMutation({
		onSuccess: ({ nModified }) => {
			confirmationAlert(`${pluralize(nModified, 'document', 'documents')} updated`);

			// TODO Be more specific
			queryClient.removeQueries(TAGS_QUERY_KEYS.all);

			refresh();
		},
	});

	const [assignTagsDialog, promptAssignTagsDialog] = useDialog(TagsDialog, {
		title: text,
		allTags,
		confirmText: 'Remove',
		confirmColor: 'error',
	});

	const assignTagsOnClick = async () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const results = await promptAssignTagsDialog();

		if (results) {
			removeTagsMutation.mutate({
				feat,
				record: {
					featIds,
					tagIds: results.tagIds,
				},
			});
		}
	};

	return {
		assignTagsDialog,
		buttonProps: {
			tooltipTitle: text,
			disabled: !featIds.length,
			onClick: assignTagsOnClick,
		},
	};
};

const MassRemoveTagsButton = ({
	feat,
	refresh,
	featIds,
}: {
	feat: string;
	refresh: () => void;
	featIds: Inpt.ObjectId[];
}) => {
	const { assignTagsDialog, buttonProps } = useMassRemoveTags({
		feat,
		refresh,
		featIds,
	});

	return (
		<>
			<MUIButton {...buttonProps} color='primary' startIcon={faMinus}>
				Remove Tags
			</MUIButton>
			{assignTagsDialog}
		</>
	);
};

export default MassRemoveTagsButton;
