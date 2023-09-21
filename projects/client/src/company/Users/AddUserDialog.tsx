import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Role } from '@/access-policies/shared';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFMultiSelectField,
	RHFTextField,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export const AddUserDialogSchema = yup.object().shape({
	email: yup
		.string()
		.email('Please enter a valid email address')
		.required('Please enter an email')
		.lowercase()
		.trim(),
	firstName: yup.string().strict().trim('Please enter a valid first name').required('Please enter a first name'),
	lastName: yup.string().strict().trim('Please enter a valid last name').required('Please enter a last name'),
	roles: yup.array().min(1, 'Please select at least one role'),
});

const defaultUserValues = {
	email: '',
	firstName: '',
	lastName: '',
	roles: [],
};

const AddUserDialog = ({
	roles,
	resolve,
	onHide,
	visible,
}: { roles: Role[] } & DialogProps<{
	firstName: string;
	lastName: string;
	email: string;
	roles: string[];
}>) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: defaultUserValues,
		resolver: yupResolver(AddUserDialogSchema),
	});

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Add User</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<RHFTextField control={control} label='First Name' name='firstName' fullWidth required />
				</Box>
				<Box mb={2}>
					<RHFTextField control={control} label='Last Name' name='lastName' fullWidth required />
				</Box>
				<Box mb={2}>
					<RHFTextField control={control} label='Email' name='email' fullWidth required />
				</Box>
				<RHFMultiSelectField
					control={control}
					label='Roles'
					name='roles'
					menuItems={roles.map(({ _id, name }) => ({ value: _id, label: name }))}
					fullWidth
					required
				/>
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

export default AddUserDialog;
