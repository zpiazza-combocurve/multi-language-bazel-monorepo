import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { Policy, Role, User } from '@/access-policies/shared';
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
import yup from '@/helpers/yup-helpers';

const EditUserSchema = yup.object().shape({
	firstName: yup.string().strict().trim('Please enter a valid first name').required('Please enter a first name'),
	lastName: yup.string().strict().trim('Please enter a valid last name').required('Please enter a last name'),
	roles: yup.array().min(1, 'Please select at least one role'),
});

const EditUserDialog = ({
	policy,
	roles,
	resolve,
	onHide,
	visible,
	user,
}: DialogProps<{
	firstName: string;
	lastName: string;
	email: string;
	roles: string[];
}> & { user: User; roles: Role[]; policy: Policy }) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			roles: (policy?.roles ?? []).map(({ _id }) => _id),
		},
		resolver: yupResolver(EditUserSchema),
	});

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Edit User</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<RHFTextField
						control={control}
						label='First Name'
						name='firstName'
						fullWidth
						required
						inputProps={{ readOnly: user.isEnterpriseConnection }}
					/>
				</Box>
				<Box mb={2}>
					<RHFTextField
						control={control}
						label='Last Name'
						name='lastName'
						fullWidth
						required
						inputProps={{ readOnly: user.isEnterpriseConnection }}
					/>
				</Box>
				<Box mb={2}>
					<RHFTextField
						control={control}
						label='Email'
						name='email'
						fullWidth
						required
						inputProps={{ readOnly: true }}
					/>
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

export default EditUserDialog;
