import _ from 'lodash';
import { useForm } from 'react-hook-form';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTagsMultiSelectField } from '@/components/v2';
import { ButtonProps } from '@/components/v2/Button';
import { DialogProps } from '@/helpers/dialog';

const TagsDialog = ({
	title,
	selectedTagIds = [],
	allTags,
	resolve,
	onHide,
	visible,
	confirmText = 'Save',
	confirmColor = 'primary',
}: DialogProps<{
	tagIds: Inpt.ObjectId[];
}> & {
	title: string;
	selectedTagIds: Inpt.ObjectId[];
	allTags: Inpt.Api.Tags.PopulatedTag[];
	confirmText?: string;
	confirmColor?: ButtonProps['color'];
}) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: { tagIds: selectedTagIds },
	});

	const handleSubmit = withFormValues((values) => resolve(values));

	const sortedAllTags = _.sortBy(allTags ?? [], ({ name }) => name.toLowerCase());

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<RHFTagsMultiSelectField
					control={control}
					label='Tags'
					name='tagIds'
					fullWidth
					required
					menuItems={sortedAllTags.map(({ _id, name, color }) => ({
						value: _id,
						label: name,
						color,
					}))}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color={confirmColor} disabled={!isValid && isSubmitted} onClick={() => handleSubmit()}>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TagsDialog;
