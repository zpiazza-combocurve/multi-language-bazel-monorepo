import { Box, Container } from '@material-ui/core';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Button } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { hexToNumber } from '@/helpers/color';
import { useDialog } from '@/helpers/dialog';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import useTags from '@/tags/useTags';

import TagDialog from './TagDialog';
import TagsTable from './TagsTable';

type PopulatedTag = Inpt.Api.Tags.PopulatedTag;

const parseTag = (tag) => {
	return {
		...tag,
		color: hexToNumber(tag.color),
	};
};

export const Tags = () => {
	const { isLoading, allTags, deleteTag, createTag, updateTag } = useTags();

	const [addEditTagDialog, promptAddEditDialog] = useDialog(TagDialog);
	const [deleteTagDialog, promptDeleteTagDialog] = useDialog(DeleteDialog);

	const handleCreateOnClick = async () => {
		const results = await promptAddEditDialog({
			title: 'Create Tag',
		});

		if (results) {
			createTag({
				record: parseTag(results),
			});
		}
	};

	const handleEditOnClick = async (tag: PopulatedTag) => {
		const results = await promptAddEditDialog({ tag, title: 'Update Tag' });

		if (results) {
			updateTag({
				_id: tag._id,
				record: parseTag(results),
			});
		}
	};

	const handleDeleteOnClick = async (tag: PopulatedTag) => {
		const { _id, name } = tag;

		await promptDeleteTagDialog({
			feat: 'tag',
			name,
			onDelete: () => {
				deleteTag({ _id });
			},
		});
	};

	useLoadingBar(isLoading);

	const {
		canCreate: canCreateTags,
		canDelete: canDeleteTags,
		canUpdate: canUpdateTags,
	} = usePermissions(SUBJECTS.Tags, null);

	return (
		<Container maxWidth='xl'>
			<Box pt={2} pb={4}>
				<Button
					variant='contained'
					color='primary'
					onClick={handleCreateOnClick}
					disabled={!canCreateTags && PERMISSIONS_TOOLTIP_MESSAGE}
				>
					Create Tag
				</Button>
			</Box>
			<TagsTable
				tags={allTags}
				canDeleteTags={canDeleteTags}
				canUpdateTags={canUpdateTags}
				deleteOnClick={handleDeleteOnClick}
				editOnClick={handleEditOnClick}
			/>
			{addEditTagDialog}
			{deleteTagDialog}
		</Container>
	);
};
