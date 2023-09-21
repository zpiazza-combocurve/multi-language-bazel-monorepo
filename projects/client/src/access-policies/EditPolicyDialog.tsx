import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@material-ui/core';
import { useForm } from 'react-hook-form';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFMultiSelectField } from '@/components/v2';
import { getFullNameWithEmail } from '@/helpers/user';
import yup from '@/helpers/yup-helpers';
import { ROLES } from '@/inpt-shared/access-policies/shared';

const EditPolicySchema = yup.object().shape({
	selectedRoles: yup.array().min(1, 'Please select a role'),
});

const EditPolicyDialog = ({ project, policy, roles, resolve, onHide, visible }) => {
	const { member, roles: policyRoles } = policy;
	const isProjectCreator = member._id === project.createdBy._id;

	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: { selectedRoles: policyRoles.map(({ _id }) => _id) },
		resolver: yupResolver(EditPolicySchema),
	});

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Edit Roles</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					<Typography variant='subtitle1' display='block' gutterBottom>
						{getFullNameWithEmail(member)}
					</Typography>
				</Box>
				<Box mb={2}>
					<RHFMultiSelectField
						control={control}
						label='Roles'
						name='selectedRoles'
						fullWidth
						required
						fixedOptions={isProjectCreator ? [ROLES.Project.ProjectAdmin] : []}
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

export default EditPolicyDialog;
