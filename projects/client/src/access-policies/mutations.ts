import { UseMutationOptions, useMutation } from 'react-query';

import { deleteApi, postApi, putApi } from '@/helpers/routing';

import { Group, MemberType, User } from './shared';

type AddUserMutation = Omit<User, 'isEnterpriseConnection'>;

type AddUserMutationVariables = {
	record: {
		email: string;
		firstName: string;
		lastName: string;
		roles: string[];
	};
};

export const useAddUserMutation = (options?: UseMutationOptions<AddUserMutation, unknown, AddUserMutationVariables>) =>
	useMutation<AddUserMutation, unknown, AddUserMutationVariables>(
		(variables: AddUserMutationVariables) => postApi('/user', variables.record),
		options
	);

type ImportUsersMutationVariables = {
	record: {
		users: { email: string; firstName: string; lastName: string; roles: string[] }[];
	};
};

type ImportUsersMutation = { inserted: number; total: number; errors: { name: string; message: string }[] };

export const useImportUsersMutation = (
	options?: UseMutationOptions<ImportUsersMutation, unknown, ImportUsersMutationVariables>
) =>
	useMutation<ImportUsersMutation, unknown, ImportUsersMutationVariables>(
		(variables: ImportUsersMutationVariables) => postApi('/user/mass-import', variables.record),
		options
	);

type UpdateUserMutation = void;

type UpdateUserMutationVariables = {
	_id: Inpt.ObjectId;
	record: {
		firstName: string;
		lastName: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		roles: any[];
	};
};

export const useUpdateUserMutation = (
	options?: UseMutationOptions<UpdateUserMutation, unknown, UpdateUserMutationVariables>
) =>
	useMutation<UpdateUserMutation, unknown, UpdateUserMutationVariables>(
		(variables: UpdateUserMutationVariables) => putApi(`/user/${variables._id}`, variables.record),
		options
	);

type LockUserMutation = Omit<User, 'isEnterpriseConnection'>;

type LockUserMutationVariables = {
	_id: Inpt.ObjectId;
};

export const useLockUserMutation = (
	options?: UseMutationOptions<LockUserMutation, unknown, LockUserMutationVariables>
) =>
	useMutation<LockUserMutation, unknown, LockUserMutationVariables>(
		(variables: LockUserMutationVariables) => putApi(`/user/${variables._id}/lock`),
		options
	);

type UnlockUserMutation = Omit<User, 'isEnterpriseConnection'>;

type UnlockUserMutationVariables = {
	_id: Inpt.ObjectId;
};

export const useUnlockUserMutation = (
	options?: UseMutationOptions<UnlockUserMutation, unknown, UnlockUserMutationVariables>
) =>
	useMutation<UnlockUserMutation, unknown, UnlockUserMutationVariables>(
		(variables: UnlockUserMutationVariables) => putApi(`/user/${variables._id}/unlock`),
		options
	);

type AddAccessPolicyMutationVariables = {
	resourceId: Inpt.ObjectId;
	resourceType: string;
	record: {
		selectedRoles: string[];
		memberType: MemberType;
		memberIds: Inpt.ObjectId[];
	};
};

export const useAddAccessPolicyMutation = (
	options?: UseMutationOptions<unknown, unknown, AddAccessPolicyMutationVariables>
) =>
	useMutation<unknown, unknown, AddAccessPolicyMutationVariables>(
		(variables: AddAccessPolicyMutationVariables) =>
			postApi(`/access-policies/${variables.resourceType}/${variables.resourceId}`, variables.record),
		options
	);

type UpdateAccessPolicyMutationVariables = {
	resourceId: Inpt.ObjectId;
	resourceType: string;
	record: {
		memberIds: Inpt.ObjectId[];
		memberType: MemberType;
		selectedRoles: string[];
	};
};

export const useUpdateAccessPolicyMutation = (
	options?: UseMutationOptions<unknown, unknown, UpdateAccessPolicyMutationVariables>
) =>
	useMutation<unknown, unknown, UpdateAccessPolicyMutationVariables>(
		(variables: UpdateAccessPolicyMutationVariables) =>
			putApi(`/access-policies/${variables.resourceType}/${variables.resourceId}`, variables.record),
		options
	);

type DeleteAccessPolicyMutationVariables = {
	resourceId: Inpt.ObjectId;
	resourceType: string;
	policyId: Inpt.ObjectId;
};

export const useDeleteAccessPolicyMutation = (
	options?: UseMutationOptions<unknown, unknown, DeleteAccessPolicyMutationVariables>
) =>
	useMutation<unknown, unknown, DeleteAccessPolicyMutationVariables>(
		(variables: DeleteAccessPolicyMutationVariables) =>
			deleteApi(`/access-policies/${variables.resourceType}/${variables.resourceId}/${variables.policyId}`),
		options
	);

type AddGroupMutationVariables = {
	record: {
		name: string;
		users: Inpt.ObjectId[];
		roles: string[];
		description: string;
	};
};

export const useAddGroupMutation = (options?: UseMutationOptions<Group, unknown, AddGroupMutationVariables>) => {
	return useMutation<Group, unknown, AddGroupMutationVariables>(
		(variables: AddGroupMutationVariables) => postApi(`/groups`, variables.record),
		options
	);
};

type UpdateGroupMutation = void;

type UpdateGroupMutationVariables = {
	_id: Inpt.ObjectId;
	record: {
		name: string;
		users: Inpt.ObjectId[];
		roles: string[];
		description: string;
	};
};

export const useUpdateGroupMutation = (
	options?: UseMutationOptions<UpdateGroupMutation, unknown, UpdateGroupMutationVariables>
) =>
	useMutation<UpdateGroupMutation, unknown, UpdateGroupMutationVariables>(
		(variables: UpdateGroupMutationVariables) => putApi(`/groups/${variables._id}`, variables.record),
		options
	);

type DeleteGroupMutationVariables = {
	groupId: Inpt.ObjectId;
};

export const useDeleteGroupMutation = (options?: UseMutationOptions<unknown, unknown, DeleteGroupMutationVariables>) =>
	useMutation<unknown, unknown, DeleteGroupMutationVariables>(
		(variables: DeleteGroupMutationVariables) => deleteApi(`/groups/${variables.groupId}`),
		options
	);
