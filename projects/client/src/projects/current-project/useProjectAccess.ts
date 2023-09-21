import {
	useAddAccessPolicyMutation,
	useDeleteAccessPolicyMutation,
	useUpdateAccessPolicyMutation,
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

const useProjectAccess = (projectId: Inpt.ObjectId) => {
	const resourceType = ResourceType.Project;
	const resourceId = projectId;

	const getPermissionsQueryResult = useGetPermissionsQuery({
		resourceType,
		resourceId,
	});

	const getRolesQueryResult = useGetRolesQuery({ resourceType, resourceId });

	const getUsersQueryResult = useGetUsersQuery();
	const getGroupsQueryResult = useGetGroupsQuery();

	const addAccessPolicyMutation = useAddAccessPolicyMutation({
		onSuccess: () => {
			confirmationAlert('Added');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const updateAccessPolicyMutation = useUpdateAccessPolicyMutation({
		onSuccess: () => {
			confirmationAlert('Changes Saved');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const deleteAccessPolicyMutation = useDeleteAccessPolicyMutation({
		onSuccess: () => {
			confirmationAlert('Deleted');
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	const isLoading =
		getPermissionsQueryResult.isLoading || getRolesQueryResult.isLoading || getUsersQueryResult.isLoading;

	return {
		isLoading,
		policies: getPermissionsQueryResult.data ?? [],
		users: getUsersQueryResult.data ?? [],
		roles: getRolesQueryResult.data ?? [],
		groups: getGroupsQueryResult.data ?? [],
		deleteAccessPolicy: deleteAccessPolicyMutation.mutate,
		addAccessPolicy: addAccessPolicyMutation.mutate,
		updateAccessPolicy: updateAccessPolicyMutation.mutate,
	};
};

export default useProjectAccess;
