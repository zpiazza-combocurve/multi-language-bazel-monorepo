import { UseQueryOptions, useQuery } from 'react-query';

import { Group, Policy, Role, User } from '@/access-policies/shared';
import { getApi } from '@/helpers/routing';

const PERMISSIONS_QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minute(s) in milliseconds
const PERMISSIONS_QUERY_STALE_TIME = 1 * 60 * 1000; // 1 minute(s) in milliseconds

export const PERMISSIONS_QUERY_KEYS = {
	all: ['permissions'],
	users: () => [...PERMISSIONS_QUERY_KEYS.all, 'users'],
	groupsForResource: () => [...PERMISSIONS_QUERY_KEYS.all, 'groups'],
	rolesForResource: (variables) => [...PERMISSIONS_QUERY_KEYS.all, 'roles', variables],
	permissionsForResource: (variables) => [...PERMISSIONS_QUERY_KEYS.all, 'permissions', variables],
};

export type GetUsersQuery = User[];

export const useGetUsersQuery = (options?: UseQueryOptions<GetUsersQuery>) =>
	useQuery<GetUsersQuery>(PERMISSIONS_QUERY_KEYS.users(), () => getApi('/user'), {
		cacheTime: PERMISSIONS_QUERY_CACHE_TIME,
		staleTime: PERMISSIONS_QUERY_STALE_TIME,
		...options,
	});

export type GetGroupsQuery = Group[];

export const useGetGroupsQuery = (options?: UseQueryOptions<GetGroupsQuery>) =>
	useQuery<GetGroupsQuery>(PERMISSIONS_QUERY_KEYS.groupsForResource(), () => getApi(`/groups`), {
		cacheTime: PERMISSIONS_QUERY_CACHE_TIME,
		staleTime: PERMISSIONS_QUERY_STALE_TIME,
		...options,
	});

export type GetRolesQuery = Role[];

export type GetQueryVariables = {
	resourceType: string;
	resourceId: null | Inpt.ObjectId;
};

export const useGetRolesQuery = (variables: GetQueryVariables, options?: UseQueryOptions<GetRolesQuery>) =>
	useQuery<GetRolesQuery>(
		PERMISSIONS_QUERY_KEYS.rolesForResource(variables),
		() => getApi(`/access-policies/${variables.resourceType}/${variables.resourceId}/roles`),
		{
			cacheTime: PERMISSIONS_QUERY_CACHE_TIME,
			staleTime: PERMISSIONS_QUERY_STALE_TIME,
			...options,
		}
	);

export type GetPermissionsQuery = Policy[];

export type GetPermissionsQueryVariables = {
	resourceType: string;
	resourceId: null | Inpt.ObjectId;
};

export const useGetPermissionsQuery = (
	variables: GetPermissionsQueryVariables,
	options?: UseQueryOptions<GetPermissionsQuery>
) =>
	useQuery<GetPermissionsQuery>(
		PERMISSIONS_QUERY_KEYS.permissionsForResource(variables),
		() => getApi(`/access-policies/${variables.resourceType}/${variables.resourceId}`),
		{
			cacheTime: PERMISSIONS_QUERY_CACHE_TIME,
			staleTime: PERMISSIONS_QUERY_STALE_TIME,
			...options,
		}
	);
