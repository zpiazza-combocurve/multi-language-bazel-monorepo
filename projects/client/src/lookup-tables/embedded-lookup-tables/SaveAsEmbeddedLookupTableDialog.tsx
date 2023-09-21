import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { hasNonWhitespace } from '@/helpers/text';
import { generateLookupTableName } from '@/lookup-tables/shared/utils';

const SaveAsEmbeddedLookupTableSchema = yup.object().shape({
	name: yup.string().required('This field is required.'),
});

export const SaveAsEmbeddedLookupTableDialog = ({ resolve, onHide, visible }: DialogProps<{ name: string }>) => {
	const { user } = useAlfa();

	const {
		control,
		formState: { isValid, isSubmitting },
		handleSubmit: withSubmitValues,
		watch,
	} = useForm({
		defaultValues: {
			name: generateLookupTableName({ user }),
		},
		resolver: yupResolver(SaveAsEmbeddedLookupTableSchema),
	});

	useLoadingBar(isSubmitting);

	const handleSubmit = withSubmitValues((values) => {
		resolve(values);
	});

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Save as a new Embedded Lookup Table</DialogTitle>
			<DialogContent>
				<RHFTextField control={control} name='name' label='Name' fullWidth />
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={handleSubmit}
					color='primary'
					disabled={!isValid || isSubmitting || !hasNonWhitespace(watch('name'))}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
};
