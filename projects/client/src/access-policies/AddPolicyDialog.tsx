import { yupResolver } from '@hookform/resolvers/yup';
import { sortBy } from 'lodash-es';
import { useForm } from 'react-hook-form';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFMultiSelectField } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { getFullNameWithEmail } from '@/helpers/user';
import yup from '@/helpers/yup-helpers';

import { Role, User } from './shared';

const PolicySchema = yup.object().shape({
	selectedUsers: yup.array().min(1, 'Please select a user'),
	selectedRoles: yup.array().min(1, 'Please select a role'),
});
const AddPolicyDialog = ({
	users,
	roles,
	resolve,
	onHide,
	visible,
}: DialogProps<{ selectedUsers: Inpt.ObjectId[]; selectedRoles: string[] }> & {
	users: User[];
	roles: Role[];
}) => {
	const sortedUsers = sortBy(users as (User & { name: string })[], 'name');

	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: { selectedUsers: [], selectedRoles: [] },
		resolver: yupResolver(PolicySchema),
	});

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Assign Roles</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<RHFMultiSelectField
						control={control}
						label='Users'
						name='selectedUsers'
						menuItems={sortedUsers.map((user) => ({
							value: user._id,
							label: getFullNameWithEmail(user),
						}))}
						fullWidth
						required
					/>
				</Box>
				<Box mb={2}>
					<RHFMultiSelectField
						control={control}
						label='Roles'
						name='selectedRoles'
						fullWidth
						required
						menuItems={roles.map(({ _id, name }) => ({
							value: _id,
							label: name,
						}))}
					/>
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

export default AddPolicyDialog;
