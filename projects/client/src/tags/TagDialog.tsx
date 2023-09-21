import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFColorPickerField,
	RHFTextField,
} from '@/components/v2';
import { hexToNumber, numberToHex } from '@/helpers/color';
import { DialogProps } from '@/helpers/dialog';
import TagChip from '@/tags/TagChip';

type PopulatedTag = Inpt.Api.Tags.PopulatedTag;

const AddTagDialogSchema = yup.object().shape({
	name: yup.string().required('Please enter a tag name').max(100),
	description: yup.string().max(500),
	color: yup.string().required('Please enter a color'),
});

const TagDialog = ({
	title,
	resolve,
	onHide,
	visible,
	tag,
}: DialogProps<{
	name: string;
	description: string;
}> & { title: string; tag?: PopulatedTag }) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
		watch,
	} = useForm({
		defaultValues: {
			name: tag?.name ?? '',
			description: tag?.description ?? '',
			color: numberToHex(tag?.color ?? 0),
		},
		resolver: yupResolver(AddTagDialogSchema),
	});

	const [color, name] = watch(['color', 'name']);

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<RHFTextField control={control} label='Name' name='name' fullWidth multiline />
				</Box>

				<Box mb={2}>
					<RHFTextField control={control} label='Description' name='description' fullWidth multiline />
				</Box>
				<Box mb={2}>
					<RHFColorPickerField control={control} label='Color' name='color' required fullWidth />
				</Box>
				<Box mb={2}>
					<TagChip tag={{ name, color: hexToNumber(color) }} />
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' disabled={!isValid && isSubmitted} onClick={() => handleSubmit()}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TagDialog;
