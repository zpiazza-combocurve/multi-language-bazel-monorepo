import { yupResolver } from '@hookform/resolvers/yup';
import { sortBy } from 'lodash';
import { useForm } from 'react-hook-form';

import { Group, Role, User } from '@/access-policies/shared';
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

const createDialogInitialValues = {
	name: '',
	description: '',
	roles: [] as Inpt.ObjectId[],
	users: [] as Inpt.ObjectId[],
};

const GroupSchema = yup.object().shape({
	name: yup.string().required('Please enter a group name'),
	roles: yup.array().min(1, 'Please select a role'),
});

const AddEditGroupDialog = ({
	roles,
	resolve,
	onHide,
	visible,
	users,
	group,
}: DialogProps<{
	name: string;
	description: string;
	users: Inpt.ObjectId[];
	roles: string[];
}> & { users: User[]; roles: Role[]; group?: Group }) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: group
			? {
					...group,
					users: group?.users?.map((user) => user._id) ?? [],
					roles: group?.roles?.map((role) => role._id) ?? [],
			  }
			: createDialogInitialValues,
		resolver: yupResolver(GroupSchema),
	});

	const title = group ? 'Edit Group' : 'Add Group';

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<RHFTextField control={control} label='Name' name='name' fullWidth required />
				</Box>
				<Box mb={2}>
					<RHFTextField control={control} label='Description' name='description' fullWidth />
				</Box>
				<Box mb={2}>
					<RHFMultiSelectField
						control={control}
						label='Users'
						name='users'
						menuItems={sortBy(
							users.map(({ _id, firstName, lastName }) => ({
								value: _id,
								label: `${firstName} ${lastName}`,
							})),
							(user) => user.label
						)}
						fullWidth
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

export default AddEditGroupDialog;
