import { Box, Container, Paper, Tab, Tabs } from '@material-ui/core';
import { useMemo, useState } from 'react';
import * as React from 'react';

import RolesTable from '@/access-policies/RolesTable';
import AddEditGroupDialog from '@/access-policies/groups/AddEditGroupDialog';
import GroupsTable from '@/access-policies/groups/GroupsTable';
import { Group, Policy, TabPanel, User } from '@/access-policies/shared';
import usePermissions from '@/access-policies/usePermissions';
import AddUserDialog from '@/company/Users/AddUserDialog';
import EditUserDialog from '@/company/Users/EditUserDialog';
import UsersTable from '@/company/Users/UsersTable';
import useCompanyAccess from '@/company/useCompanyAccess';
import { Button } from '@/components/v2';
import { FeatureFlags, useLDFeatureFlags } from '@/feature-flags/useLDFeatureFlags';
import { useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { PERMISSIONS_TOOLTIP_MESSAGE, ROLES, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { DeleteDialog } from '@/module-list/ModuleList/components';

import MassImportUserDialog from './Users/MassImportUserDialog';

enum SelectedTab {
	users,
	groups,
	roles,
}

const filterRolesBasedOnFeatureFlags = (roleId: string, flags: FeatureFlags) => {
	const { isDataSyncEnabled } = flags;

	switch (roleId) {
		case ROLES.DataSync.DataAdmin:
		case ROLES.DataSync.DataViewer: {
			return isDataSyncEnabled;
		}
		default:
			return true;
	}
};

export const CompanyAccess = () => {
	const { user: loggedInUser } = useAlfa(['user']);
	const { canCreate: canCreateUsers, canUpdate: canUpdateUsers } = usePermissions(SUBJECTS.Users, null);

	const { canCreate: canCreateGroups, canUpdate: canUpdateGroups } = usePermissions(SUBJECTS.Groups, null);

	const { isLoading, policies, roles, users, groups, addGroup, updateGroup, deleteGroup, addUser, updateUser } =
		useCompanyAccess();

	const flags = useLDFeatureFlags();

	const filteredRoles = useMemo(() => {
		return roles.filter((role) => filterRolesBasedOnFeatureFlags(role?._id, flags));
	}, [roles, flags]);

	const filteredPolicies = useMemo(() => {
		return policies.map((policy) => ({
			...policy,
			roles: policy.roles.filter((role) => filterRolesBasedOnFeatureFlags(role?._id, flags)),
		}));
	}, [flags, policies]);

	const [selectedTab, setSelectedTab] = useState(0);

	const [editPolicyDialog, promptEditPolicyDialog] = useDialog(EditUserDialog);
	const [addUserDialog, promptAddUserDialog] = useDialog(AddUserDialog);
	const [addEditGroupDialog, promptAddEditGroupDialog] = useDialog(AddEditGroupDialog);
	const [deleteGroupDialog, promptDeleteGroupDialog] = useDialog(DeleteDialog);
	const [massImportUserDialog, promptMassImportUserDialog] = useDialog(MassImportUserDialog);

	useLoadingBar(isLoading);

	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	const handleSelectedTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
		setSelectedTab(newValue);
	};

	const handleAddUserOnClick = async () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const results = await promptAddUserDialog({ roles: filteredRoles! });

		if (results) {
			addUser({ record: results });
		}
	};

	const handleMassAddUserOnClick = async () => {
		const results = await promptMassImportUserDialog();
		return results;
	};

	const handleEditOnClick = async (user: User, policy: Policy) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const results = await promptEditPolicyDialog({ user, roles: filteredRoles!, policy });

		if (results) {
			updateUser({
				_id: user._id,
				record: results,
			});
		}
	};

	const handleAddEditGroupOnClick = async (group?: Group) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const result = await promptAddEditGroupDialog({ roles: filteredRoles!, users: users!, group });

		if (result) {
			if (group) {
				updateGroup({
					_id: group._id,
					record: result,
				});
			} else {
				addGroup({ record: result });
			}
		}
	};

	const handleDeleteGroupOnClick = async (group: Group) => {
		await promptDeleteGroupDialog({
			feat: 'Group',
			name: group.name,
			valueToConfirm: 'Delete Group',
			requireName: true,
			onDelete: () => {
				deleteGroup({ groupId: group._id });
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
			{addUserDialog}
			{editPolicyDialog}
			{addEditGroupDialog}
			{deleteGroupDialog}
			{massImportUserDialog}

			{selectedTab !== SelectedTab.groups ? (
				<Box pt={2} pb={4}>
					<Button
						variant='contained'
						disabled={!filteredRoles.length || (!canCreateUsers && PERMISSIONS_TOOLTIP_MESSAGE)}
						color='primary'
						onClick={handleAddUserOnClick}
					>
						Add User
					</Button>
					{!loggedInUser.isEnterpriseConnection && (
						<Button
							css={`
								margin-left: 1rem;
							`}
							variant='contained'
							disabled={!canCreateUsers && PERMISSIONS_TOOLTIP_MESSAGE}
							color='primary'
							onClick={handleMassAddUserOnClick}
						>
							Import Users
						</Button>
					)}
				</Box>
			) : (
				<Box pt={2} pb={4}>
					<Button
						variant='contained'
						disabled={!filteredRoles.length || (!canCreateGroups && PERMISSIONS_TOOLTIP_MESSAGE)}
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
						<UsersTable
							canUpdateUsers={canUpdateUsers}
							policies={filteredPolicies}
							users={users}
							editOnClick={handleEditOnClick}
						/>
					</TabPanel>

					<TabPanel value={selectedTab} index={1} style={{ height: '100%' }}>
						<GroupsTable
							policies={filteredPolicies}
							groups={groups}
							canUpdateGroups={canUpdateGroups}
							editOnClick={handleAddEditGroupOnClick}
							deleteOnClick={handleDeleteGroupOnClick}
							isProjectLevel={false}
						/>
					</TabPanel>

					<TabPanel value={selectedTab} index={2} style={{ height: '100%' }}>
						<RolesTable
							policies={filteredPolicies}
							roles={filteredRoles}
							users={users}
							isProjectLevel={false}
						/>
					</TabPanel>
				</Box>
			</Box>
		</Container>
	);
};
