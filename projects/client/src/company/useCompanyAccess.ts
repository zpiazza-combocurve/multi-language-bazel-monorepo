import {
	useAddGroupMutation,
	useAddUserMutation,
	useDeleteGroupMutation,
	useUpdateGroupMutation,
	useUpdateUserMutation,
} from '@/access-policies/mutations';
import {
	PERMISSIONS_QUERY_KEYS,
	useGetGroupsQuery,
	useGetPermissionsQuery,
	useGetRolesQuery,
	useGetUsersQuery,
} from '@/access-policies/queries';
import { ResourceType } from '@/access-policies/shared';
import { confirmationAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';

const useCompanyAccess = () => {
	const resourceType = ResourceType.Company;
	const resourceId = null;

	const getPermissionsQueryResult = useGetPermissionsQuery({ resourceType, resourceId });

	const getRolesQueryResult = useGetRolesQuery({ resourceType, resourceId });

	const getUsersQueryResult = useGetUsersQuery({ placeholderData: [] });

	const getGroupsQueryResult = useGetGroupsQuery({ placeholderData: [] });

	const addUserMutation = useAddUserMutation({
		onSuccess: () => {
			confirmationAlert('User Created');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const updateUserMutation = useUpdateUserMutation({
		onSuccess: () => {
			confirmationAlert('User Updated');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const addGroupMutation = useAddGroupMutation({
		onSuccess: () => {
			confirmationAlert('Group Created');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const updateGroupMutation = useUpdateGroupMutation({
		onSuccess: () => {
			confirmationAlert('Group Updated');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const deleteGroupMutation = useDeleteGroupMutation({
		onSuccess: () => {
			confirmationAlert('Group Deleted');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const isLoading =
		getPermissionsQueryResult.isLoading ||
		getUsersQueryResult.isLoading ||
		getRolesQueryResult.isLoading ||
		getGroupsQueryResult.isLoading;

	return {
		isLoading,
		addUser: addUserMutation.mutate,
		updateUser: updateUserMutation.mutate,
		addGroup: addGroupMutation.mutate,
		updateGroup: updateGroupMutation.mutate,
		deleteGroup: deleteGroupMutation.mutate,
		policies: getPermissionsQueryResult.data ?? [],
		roles: getRolesQueryResult.data ?? [],
		users: getUsersQueryResult.data ?? [],
		groups: getGroupsQueryResult.data ?? [],
	};
};

export default useCompanyAccess;
