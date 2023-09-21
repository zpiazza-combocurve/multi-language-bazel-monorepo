import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { IconButton } from '@material-ui/core';
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
import { useEffect, useMemo, useState } from 'react';

import {
	Group,
	GroupWithMembers,
	MemberType,
	Policy,
	colTypes,
	defaultColumnDef,
	sortByPermissionOrder,
} from '@/access-policies/shared';
import AgGrid from '@/components/AgGrid';
import { cell, defaultExcelStyles } from '@/components/AgGrid/master-detail/shared';
import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { useCallbackRef } from '@/components/hooks';
import { Tooltip } from '@/components/v2';
import {
	COMPANY_PERMISSION_ORDER,
	PERMISSIONS_TOOLTIP_MESSAGE,
	PROJECT_PERMISSION_ORDER,
} from '@/inpt-shared/access-policies/shared';

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

interface GroupsTableProps {
	policies: Policy[];
	groups: Group[];
	canUpdateGroups: boolean;
	deleteOnClick: (group: Group) => Promise<void>;
	editOnClick: (group) => Promise<void>;
	isProjectLevel?: boolean;
}

export const SimpleCellRenderer = (props: ICellRendererParams) => {
	return (
		<span
			css={`
				padding-left: 1rem;
			`}
		>
			{props.value}
		</span>
	);
};

interface IActionCellRendererParams extends ICellRendererParams {
	canUpdateGroups: boolean;
	deleteOnClick: (group: Group) => Promise<void>;
	editOnClick: (group) => Promise<void>;
}

const ActionsCellRenderer = (props: IActionCellRendererParams) => {
	const { canUpdateGroups, deleteOnClick, editOnClick, data } = props;
	return (
		<div
			css={`
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
			`}
		>
			<Tooltip title={(!canUpdateGroups && PERMISSIONS_TOOLTIP_MESSAGE) || 'Edit Group'}>
				<span>
					<IconButton
						disabled={!canUpdateGroups}
						onClick={() => editOnClick({ ...data, roles: data.rolesData })}
					>
						<FontAwesomeIcon icon={faEdit} size='xs' />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title={(!canUpdateGroups && PERMISSIONS_TOOLTIP_MESSAGE) || 'Delete Group'}>
				<span>
					<IconButton disabled={!canUpdateGroups} onClick={() => deleteOnClick(data)}>
						<FontAwesomeIcon icon={faTrash} size='xs' />
					</IconButton>
				</span>
			</Tooltip>
		</div>
	);
};

const GroupsTable: React.FC<GroupsTableProps> = ({
	groups,
	canUpdateGroups,
	deleteOnClick,
	editOnClick,
	policies,
	isProjectLevel,
}) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [groupData, setGroupData] = useState<any[]>();
	const groupById = keyBy<GroupWithMembers>(groups, '_id');
	const groupList = isProjectLevel
		? policies.map(({ member: { _id } }) => groupById[_id] ?? null).filter((group) => !!group)
		: groups;
	const policyGroupById = keyBy<Group>(groupList, '_id');
	const groupMap = isProjectLevel ? (groupList.length ? policyGroupById : []) : groupById;
	const policiesByMemberId = keyBy(
		policies.filter((policy) => policy.memberType === MemberType.Group),
		'member._id'
	);
	const permissionOrder = isProjectLevel ? PROJECT_PERMISSION_ORDER : COMPANY_PERMISSION_ORDER;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const defaultColDef = useMemo<any>(() => {
		return defaultColumnDef();
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const columnTypes = useMemo<any>(() => {
		return colTypes();
	}, []);

	const defaultCsvExportParams = useMemo<CsvExportParams>(() => {
		return {
			getCustomContentBelowRow: (params) => {
				const rows = getRows(params);
				return rows.map((row) => row.cells) as CsvCell[][];
			},
			columnWidth: 200,
			fileName: 'groups-table.csv',
		};
	}, []);
	const defaultExcelExportParams = useMemo<ExcelExportParams>(() => {
		return {
			getCustomContentBelowRow: (params) => {
				const rows = getRows(params);
				return rows.map((row) => row.cells) as ExcelCell[][];
			},
			columnWidth: 200,
			fileName: 'groups-table.xlsx',
		};
	}, []);

	const excelStyles = useMemo<ExcelStyle[]>(() => {
		return defaultExcelStyles();
	}, []);

	const generateRowData = useCallbackRef(() => {
		const gData = Object.keys(groupMap).map((groupId) => {
			const rolesData = policiesByMemberId[groupId]?.roles
				?.filter((role) => !!role)
				?.sort(sortByPermissionOrder(permissionOrder, '_id'))
				?.map(({ name, permissions, _id }) => {
					return { name, permissions, _id };
				});
			return {
				...groupMap[groupId],
				rolesData,
				roles:
					rolesData
						?.map((role) => {
							return role.name;
						})
						.join(', ') ?? '',
				children: sortBy(groupMap[groupId]?.users, 'firstName', 'lastName')?.map((user) => {
					return {
						...user,
					};
				}),
			};
		});
		setGroupData(gData);
	});

	useEffect(() => {
		generateRowData();
	}, [groups, policies, isProjectLevel, generateRowData]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const detailCellRendererParams = useMemo<any>(() => {
		return {
			// level 2 grid options
			detailGridOptions: {
				columnDefs: [
					{ headerName: 'First Name', field: 'firstName' },
					{ headerName: 'Last Name', field: 'lastName' },
					{ headerName: 'Email', field: 'email' },
				],
				defaultColDef: {
					flex: 1,
					...defaultColDef,
				},
				groupDefaultExpanded: 1,
				detailRowHeight: 240,
				columnTypes,
				enableRangeSelection: true,
			},
			getDetailRowData: (params) => {
				params.successCallback(params.data.children);
			},
		} as IDetailCellRendererParams;
	}, [defaultColDef, columnTypes]);

	return (
		<AgGrid
			css={`
				height: 95%;

				&&& .ag-cell-wrapper {
					min-height: 100%;
				}
			`}
			columnTypes={columnTypes}
			defaultColDef={defaultColDef}
			suppressMultiSort
			defaultCsvExportParams={defaultCsvExportParams}
			defaultExcelExportParams={defaultExcelExportParams}
			excelStyles={excelStyles}
			enableRangeSelection
			rowData={groupData}
			columnDefs={useMemo(
				() => [
					{
						headerName: 'Name',
						field: 'name',
						cellRenderer: 'agGroupCellRenderer',
						cellRendererParams: {
							innerRenderer: SimpleCellRenderer,
						},
					},
					{
						headerName: 'Description',
						field: 'description',
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
							deleteOnClick,
							editOnClick,
							canUpdateGroups,
						},
						type: 'button-container',
						sortable: false,
						flex: 0,
					},
				],
				[canUpdateGroups, deleteOnClick, editOnClick]
			)}
			masterDetail
			detailCellRendererParams={detailCellRendererParams}
			rowBuffer={100}
		/>
	);
};
export default GroupsTable;
