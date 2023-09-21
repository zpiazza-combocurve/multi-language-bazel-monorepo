import * as React from 'react';

export enum MemberType {
	User = 'users',
	Group = 'groups',
}

export enum ResourceType {
	Company = 'company',
	Project = 'project',
}

export interface Role {
	_id: string;
	name: string;
	description: string;
	permissions: string[];
}

export interface Group {
	_id: Inpt.ObjectId;
	name: string;
	description: string;
	roles: Role[];
	users: UserMember[];
}

export interface GroupWithMembers extends Group {
	members?: UserMember[];
}

export interface User {
	_id: Inpt.ObjectId;
	firstName: string;
	lastName: string;
	email: string;
	locked: boolean;
	isEnterpriseConnection: boolean;
}

export interface UserMember {
	_id: Inpt.ObjectId;
	firstName: string;
	lastName: string;
	email: string;
	memberType?: MemberType;
}

export interface GroupMember {
	_id: Inpt.ObjectId;
	roles: Role[];
	users: Inpt.ObjectId[];
	name: string;
	memberType?: MemberType;
	description: string;
}

export interface Policy {
	_id: Inpt.ObjectId;
	member: UserMember | GroupMember;
	roles: Role[];
	memberType: MemberType;
}

export interface TabPanelProps {
	children?: React.ReactNode;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	index: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	style?: any;
}

export const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, style } = props;

	return (
		<div hidden={value !== index} style={style ?? {}}>
			{value === index && children}
		</div>
	);
};

export const sortByPermissionOrder = (permissionOrder: Record<string, number>, propertyToSort?: string) => {
	if (propertyToSort) {
		return (x, y) => {
			if (permissionOrder[x[propertyToSort]] === undefined) return -1;
			if (permissionOrder[y[propertyToSort]] === undefined) return 1;
			return permissionOrder[x[propertyToSort]] - permissionOrder[y[propertyToSort]];
		};
	}
	return (x, y) => {
		if (permissionOrder[x] === undefined) return -1;
		if (permissionOrder[y] === undefined) return 1;
		return permissionOrder[x] - permissionOrder[y];
	};
};

export const defaultColumnDef = () => {
	return {
		resizable: true,
		valueGetter: (params) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			if (!params.data[params.colDef.field!]) {
				return 'N/A';
			}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			return params.data[params.colDef.field!];
		},
		filterParams: { suppressAndOrCondition: true },
		floatingFilterComponentParams: { suppressFilterButton: true },
		type: 'string',
		sortable: true,
		flex: 1,
	};
};

export const colTypes = () => {
	return {
		string: {
			filter: 'agTextColumnFilter',
			floatingFilter: true,
			filterParams: { filterOptions: ['contains', 'startsWith'] },
		},
	};
};
