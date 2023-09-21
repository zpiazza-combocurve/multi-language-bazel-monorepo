import { ChangeEvent, PropsWithChildren, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { DialogLikeProps, withDialog } from '@/helpers/dialog';

import { ActivityStepSchema } from '../ActivitySteps/ActivityStepValidationSchema';

export default function ScheduleSettingSaveAsDialog({ visible, onHide, onSave, values }) {
	const [name, setName] = useState(values.name ? `${values.name}1` : '');
	const [error, setError] = useState<string | undefined>(undefined);

	const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
		setName(event.target.value);

		try {
			ActivityStepSchema.validateSyncAt('name', { name: event.target.value });
			setError(undefined);
		} catch (error) {
			setError(error.message);
		}
	};

	const handleSave = () => {
		onSave({ ...values, name });
		onHide();
	};

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='xs' fullWidth>
			<DialogTitle>Save As</DialogTitle>
			<DialogContent>
				<TextField
					variant='outlined'
					color='secondary'
					size='small'
					name='name'
					error={!!error}
					helperText={error}
					type='text'
					label='Configuration Name'
					placeholder='Name'
					value={name}
					onChange={handleChangeName}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					variant='text'
					color='secondary'
					onClick={handleSave}
					aria-label='Confirm save'
					disabled={error}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

type ScheduleSaveAsDialogProps = PropsWithChildren<DialogLikeProps> & { values: { name: string } };

export const scheduleSaveAsDialog = withDialog(({ resolve, visible, values }: ScheduleSaveAsDialogProps) => {
	return (
		<ScheduleSettingSaveAsDialog visible={visible} values={values} onSave={resolve} onHide={() => resolve(null)} />
	);
});
