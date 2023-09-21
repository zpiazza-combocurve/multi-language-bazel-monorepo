import { subject } from '@casl/ability';
import { Box, Container, Paper, Tab, Tabs } from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';

import AddPolicyDialog from '@/access-policies/AddPolicyDialog';
import { AbilityContext } from '@/access-policies/Can';
import EditPolicyDialog from '@/access-policies/EditPolicyDialog';
import RolesTable from '@/access-policies/RolesTable';
import AddEditProjectGroupDialog from '@/access-policies/groups/AddEditProjectGroupDialog';
import GroupsTable from '@/access-policies/groups/GroupsTable';
import { Group, MemberType, Policy, ResourceType, TabPanel, UserMember } from '@/access-policies/shared';
import { Button } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { ACTIONS, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import ProjectMembersTable from '@/projects/current-project/ProjectMembersTable';
import useProjectAccess from '@/projects/current-project/useProjectAccess';

enum SelectedTab {
	users,
	groups,
	roles,
}

export const ProjectAccess = ({ project }) => {
	const resourceType = ResourceType.Project;
	const resourceId = project._id;

	const { isLoading, policies, users, roles, groups, addAccessPolicy, updateAccessPolicy, deleteAccessPolicy } =
		useProjectAccess(project._id);

	const ability = useContext(AbilityContext);

	const canUpdateProjectPolicies = ability.can(
		ACTIONS.Update,
		subject(SUBJECTS.ProjectAccessPolicies, {
			resourceType: ResourceType.Project,
			resourceId: project._id,
		})
	);

	const [selectedTab, setSelectedTab] = useState(0);

	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	const handleSelectedTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
		setSelectedTab(newValue);
	};

	const [addPolicyDialog, promptAddPolicyDialog] = useDialog(AddPolicyDialog);
	const [editPolicyDialog, promptEditPolicyDialog] = useDialog(EditPolicyDialog);
	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog);

	const [addNewGroupDialog, promptAddEditNewGroupDialog] = useDialog(AddEditProjectGroupDialog);
	const [deleteGroupDialog, promptDeleteGroupDialog] = useDialog(DeleteDialog);

	useLoadingBar(isLoading);

	const userPolicies = useMemo(() => policies.filter(({ memberType }) => memberType === MemberType.User), [policies]);
	const existingUsersMap = new Map<Inpt.ObjectId, boolean>(
		(userPolicies ?? []).map(({ member: { _id } }) => [_id, true])
	);
	const newUsers = users.filter(({ _id }) => !existingUsersMap.has(_id));

	const handleAssignRolesOnClick = async () => {
		const results = await promptAddPolicyDialog({ roles, users: newUsers });

		if (!results) {
			return;
		}

		const { selectedUsers, selectedRoles } = results;

		await addAccessPolicy({
			resourceType,
			resourceId,
			record: {
				selectedRoles,
				memberType: MemberType.User,
				memberIds: selectedUsers,
			},
		});
	};

	const handleDeleteOnClick = async (policy: Policy) => {
		await promptDeleteDialog({
			feat: 'project roles for',
			name: (policy.member as UserMember).email,
			onDelete: () => {
				deleteAccessPolicy({ resourceType, resourceId, policyId: policy._id });
			},
		});
	};

	const handleEditOnClick = async (policy) => {
		const results = await promptEditPolicyDialog({ policy, roles, project });

		if (!results) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const { selectedRoles } = results as any;

		await updateAccessPolicy({
			resourceType,
			resourceId,
			record: {
				memberIds: [policy.member._id],
				memberType: MemberType.User,
				selectedRoles,
			},
		});
	};

	const handleAddEditGroupOnClick = async (group?: Group) => {
		const result = await promptAddEditNewGroupDialog({ groups, group, roles, policies });

		if (!result) {
			return;
		}
		const submitMethod = group ? updateAccessPolicy : addAccessPolicy;

		await submitMethod({
			resourceType,
			resourceId,
			record: {
				selectedRoles: result.roles,
				memberType: MemberType.Group,
				memberIds: result.groupIds as Inpt.ObjectId[],
			},
		});
	};

	const handleDeleteGroupOnClick = async (group: Group) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const policyId = policies.find(({ member: { _id } }) => _id === group._id)!._id;

		await promptDeleteGroupDialog({
			feat: 'group',
			name: group.name,
			onDelete: () => {
				deleteAccessPolicy({ resourceType, resourceId, policyId });
			},
		});
	};

	return (
		<Container
			maxWidth='xl'
			css={`
				display: flex;
				flex-direction: column;
				height: 100%;
			`}
		>
			{addPolicyDialog}
			{editPolicyDialog}
			{deleteDialog}

			{addNewGroupDialog}
			{deleteGroupDialog}

			{selectedTab !== SelectedTab.groups ? (
				<Box pt={2} pb={4}>
					<Button
						disabled={!canUpdateProjectPolicies && PERMISSIONS_TOOLTIP_MESSAGE}
						variant='contained'
						color='primary'
						onClick={handleAssignRolesOnClick}
					>
						Add Users & Assign Roles
					</Button>
				</Box>
			) : (
				<Box pt={2} pb={4}>
					<Button
						variant='contained'
						disabled={!canUpdateProjectPolicies && PERMISSIONS_TOOLTIP_MESSAGE}
						color='primary'
						onClick={() => handleAddEditGroupOnClick()}
					>
						Add Group
					</Button>
				</Box>
			)}

			<Box display='flex' flexDirection='column' height='100%'>
				<Paper square>
					<Tabs
						value={selectedTab}
						onChange={handleSelectedTabChange}
						indicatorColor='primary'
						textColor='primary'
						aria-label='full width tabs example'
					>
						<Tab label='Users' />
						<Tab label='Groups' />
						<Tab label='Roles' />
					</Tabs>
				</Paper>

				<Box flex='1'>
					<TabPanel value={selectedTab} index={0} style={{ height: '100%' }}>
						<ProjectMembersTable
							project={project}
							policies={userPolicies}
							editOnClick={handleEditOnClick}
							canUpdateProjectPolicies={canUpdateProjectPolicies}
							deleteOnClick={handleDeleteOnClick}
						/>
					</TabPanel>

					<TabPanel value={selectedTab} index={1} style={{ height: '100%' }}>
						<GroupsTable
							groups={groups}
							policies={policies}
							canUpdateGroups={canUpdateProjectPolicies}
							deleteOnClick={handleDeleteGroupOnClick}
							editOnClick={handleAddEditGroupOnClick}
							isProjectLevel
						/>
					</TabPanel>

					<TabPanel value={selectedTab} index={2} style={{ height: '100%' }}>
						<RolesTable policies={policies} roles={roles} users={users} isProjectLevel />
					</TabPanel>
				</Box>
			</Box>
		</Container>
	);
};
