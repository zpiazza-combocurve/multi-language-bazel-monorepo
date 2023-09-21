import { faPlus } from '@fortawesome/pro-regular-svg-icons';

import { Button as MUIButton } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { pluralize } from '@/inpt-shared/helpers/text-utils';
import TagsDialog from '@/tags/TagsDialog';
import { useAddTagsMutation } from '@/tags/mutations';
import { TAGS_QUERY_KEYS, useGetAllTags } from '@/tags/queries';

export const useMassAddTags = ({
	feat,
	refresh,
	featIds,
}: {
	feat: string;
	refresh: () => void;
	featIds: Inpt.ObjectId[];
}) => {
	const text = 'Add Tags';
	const { data: allTags } = useGetAllTags();

	const addTagsMutation = useAddTagsMutation({
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
		confirmText: 'Add',
	});

	const assignTagsOnClick = async () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const results = await promptAssignTagsDialog();

		if (results) {
			addTagsMutation.mutate({
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

const MassAddTagsButton = ({
	feat,
	refresh,
	featIds,
}: {
	feat: string;
	refresh: () => void;
	featIds: Inpt.ObjectId[];
}) => {
	const { assignTagsDialog, buttonProps } = useMassAddTags({
		feat,
		refresh,
		featIds,
	});

	return (
		<>
			<MUIButton {...buttonProps} color='primary' startIcon={faPlus}>
				Add Tags
			</MUIButton>
			{assignTagsDialog}
		</>
	);
};

export default MassAddTagsButton;
