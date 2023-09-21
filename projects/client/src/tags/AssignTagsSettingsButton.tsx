import { confirmationAlert, useLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { SettingsButton } from '@/helpers/settings-page';
import { titleize } from '@/helpers/text';
import { PROJECT_KEYS, getProject } from '@/projects/api';
import TagsDialog from '@/tags/TagsDialog';
import { useAssignTagsMutation } from '@/tags/mutations';
import { TAGS_QUERY_KEYS, useGetAllTags, useGetFeatTags } from '@/tags/queries';

const AssignTagsSettingsButton = ({
	feat,
	featId,
	tooltipLabel,
	disabled,
}: {
	feat: string;
	featId: Inpt.ObjectId;
	tooltipLabel?: string;
	disabled?: boolean;
}) => {
	const [assignTagsDialog, promptAssignTagsDialog] = useDialog(TagsDialog);

	const { data: allTags } = useGetAllTags();
	const { data: featTags } = useGetFeatTags({ feat, featId });

	const assignTagsMutation = useAssignTagsMutation({
		onSuccess: async () => {
			confirmationAlert('Tags Updated');

			if (feat === 'project') {
				const key = PROJECT_KEYS.getProject(featId);
				const newProject = await queryClient.fetchQuery(key, () => getProject(featId));
				queryClient.setQueryData(key, newProject);
			}

			queryClient.invalidateQueries(TAGS_QUERY_KEYS.all);
		},
	});

	useLoadingBar(assignTagsMutation.isLoading);

	const handleAssignTagsOnClick = async () => {
		const results = await promptAssignTagsDialog({
			title: `Assign Tags to ${titleize(feat)}`,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			selectedTagIds: featTags!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			allTags: allTags!,
		});

		if (results) {
			assignTagsMutation.mutate({
				feat,
				featId,
				record: results.tagIds,
			});
		}
	};

	return (
		<>
			<SettingsButton
				primary
				onClick={handleAssignTagsOnClick}
				label='Assign Tags'
				info={['Assign company tags']}
				tooltipLabel={tooltipLabel}
				disabled={disabled}
			/>
			{assignTagsDialog}
		</>
	);
};

export default AssignTagsSettingsButton;
