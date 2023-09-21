import { Box } from '@material-ui/core';
import {
	CsvCell,
	CsvExportParams,
	ExcelCell,
	ExcelExportParams,
	ExcelStyle,
	ICellRendererParams,
	IDetailCellRendererParams,
	ProcessRowGroupForExportParams,
} from 'ag-grid-community';
import { keyBy, sortBy } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PermissionDescriptions } from '@/access-policies/PermissionDescriptions';
import {
	GroupMember,
	MemberType,
	Role,
	User,
	UserMember,
	colTypes,
	defaultColumnDef,
	sortByPermissionOrder,
} from '@/access-policies/shared';
import { Cell } from '@/components/AdvancedTable/ag-grid-shared';
import AgGrid from '@/components/AgGrid';
import { cell, defaultExcelStyles } from '@/components/AgGrid/master-detail/shared';
import { InfoTooltipWrapper } from '@/components/v2';
import { COMPANY_PERMISSION_ORDER, PROJECT_PERMISSION_ORDER } from '@/inpt-shared/access-policies/shared';

const getRows = (params: ProcessRowGroupForExportParams) => {
	const rows = [
		{
			outlineLevel: 1,
			cells: [cell(''), cell('First Name', 'header'), cell('Last Name', 'header'), cell('Email', 'header')],
		},
	].concat(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		...params.node.data.children.map((record: any) => [
			{
				outlineLevel: 1,
				cells: [
					cell(''),
					cell(record.firstName ?? 'N/A', 'body'),
					cell(record.lastName ?? 'N/A', 'body'),
					cell(record.email ?? 'N/A', 'body'),
				],
			},
		])
	);
	return rows;
};
interface GroupMemberWithMemberType extends GroupMember {
	memberType: MemberType;
}

interface SortedUserMember extends UserMember {
	_id: Inpt.ObjectId;
	groupList: GroupMemberWithMemberType[];
	roleAssignedByUserView: boolean;
}

const RoleFromTypeRenderer = (props: ICellRendererParams) => {
	const { data } = props;
	return (
		<Cell
			css={`
				display: flex;
				flex-direction: column;
				align-items: start;
			`}
		>
			{data.roleAssignedByUserView && <Box>(User Role)</Box>}
			{data.groupList?.map((group) => (
				<Box key={group._id}>Group Role: {group.name}</Box>
			))}
		</Cell>
	);
};

const TooltipCellRenderer = (props: ICellRendererParams) => {
	const { data } = props;
	return (
		<Cell
			css={`
				padding-left: 1rem;
			`}
		>
			<InfoTooltipWrapper tooltipTitle={<PermissionDescriptions permissions={data.permissions} />}>
				{data.name}
			</InfoTooltipWrapper>
		</Cell>
	);
};

interface RoleWithMembers extends Role {
	children: SortedUserMember[];
}

const RolesTable = ({ policies, roles, users, isProjectLevel }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const detailDefaultColDef = useMemo<any>(() => {
		return defaultColumnDef();
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const columnTypes = useMemo<any>(() => {
		return colTypes();
	}, []);

	const [rolesData, setRolesData] = useState<RoleWithMembers[]>([]);

	const defaultCsvExportParams = useMemo<CsvExportParams>(() => {
		return {
			getCustomContentBelowRow: (params) => {
				const rows = getRows(params);
				return rows.map((row) => row.cells) as CsvCell[][];
			},
			columnWidth: 200,
			fileName: 'roles-table.csv',
		};
	}, []);
	const defaultExcelExportParams = useMemo<ExcelExportParams>(() => {
		return {
			getCustomContentBelowRow: (params) => {
				const rows = getRows(params);
				return rows.map((row) => row.cells) as ExcelCell[][];
			},
			columnWidth: 200,
			fileName: 'roles-table.xlsx',
		};
	}, []);

	const excelStyles = useMemo<ExcelStyle[]>(() => {
		return defaultExcelStyles();
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const detailCellRendererParams = useMemo<any>(() => {
		return {
			// level 2 grid options
			detailGridOptions: {
				columnDefs: [
					{
						headerName: 'First Name',
						field: 'firstName',
					},
					{ headerName: 'Last Name', field: 'lastName' },
					{ headerName: 'Email', field: 'email' },
					{
						headerName: 'Roles',
						field: 'roles',
						cellRenderer: RoleFromTypeRenderer,
						valueGetter: (params) => {
							const roles: string[] = [];
							if (params.data.roleAssignedByUserView) {
								roles.push(`(User Role)`);
							}
							params.data.groupList?.forEach((group) => roles.push(`Group Role: ${group.name}`));
							return roles;
						},
					},
				],
				enableRangeSelection: true,
				columnTypes,
				defaultColDef: { ...detailDefaultColDef, flex: 1, autoHeight: true },
				groupDefaultExpanded: 1,
				detailRowHeight: 240,
			},
			getDetailRowData: (params) => {
				params.successCallback(params.data.children);
			},
		} as IDetailCellRendererParams;
	}, [detailDefaultColDef, columnTypes]);

	const findUserMemberIndex = (users, userTofind) => {
		return users?.findIndex((user) => user?._id === userTofind) ?? -1;
	};

	const addUserMemberToList = useCallback((list, member) => {
		if (!member) return;
		const foundIndex = findUserMemberIndex(list, member?._id);
		if (foundIndex > -1) {
			list[foundIndex].roleAssignedByUserView = true;
		} else {
			list.push({
				...member,
				roleAssignedByUserView: true,
				groupList: [],
			});
		}
	}, []);

	const addGroupToUser = useCallback((list, member, user, usersById) => {
		const foundIndex = findUserMemberIndex(list, user);
		if (foundIndex > -1) {
			list[foundIndex].groupList.push({ ...member });
		} else {
			list.push({
				...usersById[user],
				groupList: [{ ...member }],
				roleAssignedByUserView: false,
			});
		}
	}, []);

	useEffect(() => {
		const rolesData: Record<string, RoleWithMembers> = {};
		const rolesById = keyBy<Role>(roles, '_id');
		const usersById = keyBy<User>(users, '_id');

		policies.forEach(({ member, roles: policyRoles, memberType }) => {
			policyRoles.filter(Boolean).forEach(({ _id }) => {
				rolesData[_id] ??= { ...rolesById[_id] } as RoleWithMembers;
				rolesData[_id].children ??= [];
				if (memberType === MemberType.User) {
					addUserMemberToList(rolesData[_id].children, member);
				} else if (memberType === MemberType.Group) {
					member.users.forEach((user: Inpt.ObjectId) => {
						addGroupToUser(rolesData[_id].children, member, user, usersById);
					});
				}
			});
		});

		const sortedPermission = Object.keys(rolesData)
			.sort(sortByPermissionOrder(isProjectLevel ? PROJECT_PERMISSION_ORDER : COMPANY_PERMISSION_ORDER))
			.map((role) => {
				return {
					...rolesData[role],
					children: sortBy(rolesData[role].children, 'firstName', 'lastName').filter(
						(member) => member.email
					),
				};
			});
		setRolesData(sortedPermission);
	}, [policies, roles, users, addGroupToUser, addUserMemberToList, isProjectLevel]);

	return (
		<AgGrid
			css={`
				height: 95%;

				&&& .ag-cell-wrapper {
					min-height: 100%;
				}
			`}
			defaultColDef={{
				resizable: true,
				flex: 1,
			}}
			defaultCsvExportParams={defaultCsvExportParams}
			defaultExcelExportParams={defaultExcelExportParams}
			excelStyles={excelStyles}
			enableRangeSelection
			rowData={rolesData}
			columnDefs={useMemo(
				() => [
					{
						headerName: 'Name',
						field: 'name',
						cellRenderer: 'agGroupCellRenderer',
						cellRendererParams: {
							innerRenderer: TooltipCellRenderer,
						},
					},
					{
						headerName: 'Description',
						field: 'description',
						wrapText: true,
					},
				],
				[]
			)}
			masterDetail
			detailCellRendererParams={detailCellRendererParams}
			rowBuffer={100}
		/>
	);
};

export default RolesTable;
