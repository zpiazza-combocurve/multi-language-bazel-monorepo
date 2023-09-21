import { faEdit, faLock, faUnlock } from '@fortawesome/pro-regular-svg-icons';
import { IconButton } from '@material-ui/core';
import { ICellRendererParams } from 'ag-grid-community';
import { keyBy, sortBy } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLockUserMutation, useUnlockUserMutation } from '@/access-policies/mutations';
import { PERMISSIONS_QUERY_KEYS } from '@/access-policies/queries';
import { Policy, User, colTypes, defaultColumnDef, sortByPermissionOrder } from '@/access-policies/shared';
import AgGrid from '@/components/AgGrid';
import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { useCallbackRef } from '@/components/hooks';
import { Tooltip, alerts } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { COMPANY_PERMISSION_ORDER, PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';

export interface IUserData extends User {
	policy: Policy;
	roles: string;
}
interface IActionCellRendererParams extends ICellRendererParams {
	canUpdateUsers: boolean;
	lockUnlockOnClick: (lock: boolean, user: User) => Promise<void>;
	editOnClick: (user: User, policy: Policy) => Promise<void>;
}

const ActionsCellRenderer = (props: IActionCellRendererParams) => {
	const { canUpdateUsers, lockUnlockOnClick, editOnClick, data } = props;
	return (
		<div
			css={`
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
			`}
		>
			{data.locked ? (
				<Tooltip title={canUpdateUsers ? 'Unlock User' : PERMISSIONS_TOOLTIP_MESSAGE}>
					<span>
						<IconButton disabled={!canUpdateUsers} onClick={() => lockUnlockOnClick(false, data)}>
							<FontAwesomeIcon icon={faUnlock} size='xs' />
						</IconButton>
					</span>
				</Tooltip>
			) : (
				<Tooltip title={canUpdateUsers ? 'Lock User' : PERMISSIONS_TOOLTIP_MESSAGE}>
					<span>
						<IconButton disabled={!canUpdateUsers} onClick={() => lockUnlockOnClick(true, data)}>
							<FontAwesomeIcon icon={faLock} size='xs' />
						</IconButton>
					</span>
				</Tooltip>
			)}
			<Tooltip title={(!canUpdateUsers && PERMISSIONS_TOOLTIP_MESSAGE) || 'Edit User'}>
				<span>
					<IconButton disabled={!canUpdateUsers} onClick={() => editOnClick({ ...data }, data.policy)}>
						<FontAwesomeIcon icon={faEdit} size='xs' />
					</IconButton>
				</span>
			</Tooltip>
		</div>
	);
};

const UsersTable = ({
	canUpdateUsers,
	policies,
	users,
	editOnClick,
}: {
	canUpdateUsers: boolean;
	policies: Policy[];
	users: User[];
	editOnClick: (user: User, policy: Policy) => void;
}) => {
	const [usersData, setUsersData] = useState<IUserData[]>([]);

	const defaultColDef = useMemo(() => {
		return defaultColumnDef();
	}, []);

	const columnTypes = useMemo(() => {
		return colTypes();
	}, []);

	const lockUserMutation = useLockUserMutation({
		onSuccess: (data) => {
			confirmationAlert(`Locked User: ${data.email}`);
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.users());
		},
	});

	const unlockUserMutation = useUnlockUserMutation({
		onSuccess: (data) => {
			confirmationAlert(`Unlocked User: ${data.email}`);
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.users());
		},
	});

	const handleLockUnlockConfirmationDialog = useCallback(
		async (lock: boolean, user: User) => {
			const result = await alerts.confirm({
				title: `${lock ? 'Lock' : 'Unlock'} User`,
				children: `Are you sure you want to ${lock ? 'lock' : 'unlock'} ${user.firstName} ${user.lastName}?`,
				confirmText: 'Confirm',
			});

			if (result) {
				if (lock) {
					lockUserMutation.mutate({ _id: user._id });
				} else {
					unlockUserMutation.mutate({ _id: user._id });
				}
			}
		},
		[lockUserMutation, unlockUserMutation]
	);

	const generateUsersData = useCallbackRef(() => {
		const policiesByMemberId = keyBy(policies, 'member._id');
		const data = sortBy(users, ['firstName', 'lastName']).map((user) => {
			const policy = policiesByMemberId[user._id];
			const roles =
				policy?.roles
					?.filter((role) => !!role)
					?.sort(sortByPermissionOrder(COMPANY_PERMISSION_ORDER, '_id'))
					?.map((r) => {
						return { ...r };
					})
					?.map((role) => {
						return role.name;
					})
					.join(', ') ?? '';
			return {
				...user,
				roles,
				policy,
			};
		});
		setUsersData(data);
	});

	useEffect(() => {
		generateUsersData();
	}, [users, policies, generateUsersData]);

	return (
		<AgGrid
			css={`
				height: 95%;

				&&& .ag-cell-wrapper {
					min-height: 100%;
				}
			`}
			defaultColDef={defaultColDef}
			suppressMultiSort
			rowData={usersData}
			columnTypes={columnTypes}
			enableRangeSelection
			columnDefs={useMemo(
				() => [
					{
						headerName: 'First Name',
						field: 'firstName',
					},
					{
						headerName: 'Last Name',
						field: 'lastName',
					},
					{
						headerName: 'Email',
						field: 'email',
					},
					{
						headerName: 'Status',
						field: 'status',
						valueGetter: (params) => {
							return params.data.locked ? 'Locked' : 'Active';
						},
						flex: 0,
					},
					{
						headerName: 'Roles',
						field: 'roles',
						flex: 2,
					},
					{
						headerName: 'Actions',
						field: 'actions',
						cellRenderer: ActionsCellRenderer,
						cellRendererParams: {
							editOnClick,
							canUpdateUsers,
							lockUnlockOnClick: handleLockUnlockConfirmationDialog,
						},
						flex: 0,
						type: 'button-container',
						sortable: false,
					},
				],
				[canUpdateUsers, handleLockUnlockConfirmationDialog, editOnClick]
			)}
			rowBuffer={100}
		/>
	);
};

export default UsersTable;
