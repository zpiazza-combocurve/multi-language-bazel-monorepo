import { yupResolver } from '@hookform/resolvers/yup';
import { keyBy } from 'lodash';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Group, Policy, Role } from '@/access-policies/shared';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFMultiSelectField } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import yup from '@/helpers/yup-helpers';

const GroupSchema = yup.object().shape({
	groupIds: yup.array().required('Required'),
	roles: yup.array().required('Required'),
});

const AddEditProjectGroupDialog = ({
	resolve,
	onHide,
	visible,
	group,
	groups,
	roles,
	policies,
}: DialogProps<{
	groupIds: string[];
	roles: string[];
}> & { roles: Role[]; groups: Group[]; group?: Group; policies: Policy[] }) => {
	const policyById = keyBy<Policy>(policies, 'member._id');
	const groupsWithoutExistingPolicy = groups.filter((group) => (!policyById[group._id] ? group : null));

	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: group
			? { roles: group.roles?.map((role) => role._id) ?? [], groupIds: [group._id] }
			: { roles: [], groupIds: [] },
		resolver: yupResolver(GroupSchema),
	});

	const title = group ? `Edit ${group.name}` : 'Add Group';

	const handleSubmit = withFormValues((values) => resolve(values));
	const groupItems = useMemo(
		() =>
			group
				? [{ value: group._id, label: group.name }]
				: groupsWithoutExistingPolicy.map(({ _id, name }) => ({
						value: _id,
						label: name,
				  })),
		[group, groupsWithoutExistingPolicy]
	);

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Box mb={2}>
					{!group ? (
						<RHFMultiSelectField
							control={control}
							label='Group'
							name='groupIds'
							menuItems={groupItems}
							fullWidth
							required
							autoComplete
						/>
					) : null}
					<RHFMultiSelectField
						control={control}
						label='Roles'
						name='roles'
						menuItems={roles.map(({ _id, name }) => ({ value: _id, label: name }))}
						fullWidth
						required
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

export default AddEditProjectGroupDialog;
