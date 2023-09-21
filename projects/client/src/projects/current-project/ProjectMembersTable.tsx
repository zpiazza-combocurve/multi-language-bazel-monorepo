import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { ICellRendererParams } from 'ag-grid-community';
import { sortBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';

import { Policy, colTypes, defaultColumnDef, sortByPermissionOrder } from '@/access-policies/shared';
import { IUserData } from '@/company/Users/UsersTable';
import AgGrid from '@/components/AgGrid';
import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { useCallbackRef } from '@/components/hooks';
import { PERMISSIONS_TOOLTIP_MESSAGE, PROJECT_PERMISSION_ORDER } from '@/inpt-shared/access-policies/shared';

interface IActionCellRendererParams extends ICellRendererParams {
	project;
	canUpdateProjectPolicies: boolean;
	deleteOnClick: (policy: Policy) => Promise<void>;
	editOnClick: (policy: Policy) => Promise<void>;
}
const ActionsCellRenderer = (props: IActionCellRendererParams) => {
	const { canUpdateProjectPolicies, deleteOnClick, editOnClick, data, project } = props;
	const isProjectCreator = data._id === project.createdBy._id;
	return (
		<div
			css={`
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
			`}
		>
			<Tooltip title={(!canUpdateProjectPolicies && PERMISSIONS_TOOLTIP_MESSAGE) || 'Edit Roles'}>
				<span>
					<IconButton disabled={!canUpdateProjectPolicies} onClick={() => editOnClick(data.policy)}>
						<FontAwesomeIcon icon={faEdit} size='xs' />
					</IconButton>
				</span>
			</Tooltip>

			<Tooltip
				title={
					(!canUpdateProjectPolicies && PERMISSIONS_TOOLTIP_MESSAGE) ||
					(isProjectCreator && "Can not delete the project creator's roles") ||
					'Delete Roles'
				}
			>
				<span>
					<IconButton
						disabled={!canUpdateProjectPolicies || isProjectCreator}
						onClick={() => deleteOnClick(data.policy)}
					>
						<FontAwesomeIcon icon={faTrash} size='xs' />
					</IconButton>
				</span>
			</Tooltip>
		</div>
	);
};

const ProjectMembersTable = ({ project, canUpdateProjectPolicies, policies, editOnClick, deleteOnClick }) => {
	const [usersData, setUsersData] = useState<IUserData[]>([]);
	const defaultColDef = useMemo(() => {
		return defaultColumnDef();
	}, []);

	const columnTypes = useMemo(() => {
		return colTypes();
	}, []);

	const generateUsersData = useCallbackRef(() => {
		const data = sortBy(policies, ['member.firstName', 'member.lastName']).map((policy) => {
			const roles =
				policy?.roles
					?.sort(sortByPermissionOrder(PROJECT_PERMISSION_ORDER, '_id'))
					?.map((r) => {
						return { ...r };
					})
					?.map((role) => {
						return role.name;
					})
					.join(', ') ?? '';
			return {
				...policy.member,
				roles,
				policy,
			};
		});
		setUsersData(data);
	});

	useEffect(() => {
		generateUsersData();
	}, [policies, project, generateUsersData]);

	return (
		<AgGrid
			css={`
				height: 95%;

				&&& .ag-cell-wrapper {
					min-height: 100%;
				}
			`}
			defaultColDef={defaultColDef}
			columnTypes={columnTypes}
			suppressMultiSort
			rowData={usersData}
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
							canUpdateProjectPolicies,
							deleteOnClick,
							project,
						},
						flex: 0,
						type: 'button-container',
					},
				],
				[canUpdateProjectPolicies, deleteOnClick, editOnClick, project]
			)}
			rowBuffer={100}
		/>
	);
};

export default ProjectMembersTable;
