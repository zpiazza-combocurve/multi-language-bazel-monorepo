import { UseMutationOptions, useMutation } from 'react-query';

import { deleteApi, postApi, putApi } from '@/helpers/routing';

type TagVariable = Pick<Inpt.Tag, 'name' | 'color' | 'description'>;

type CreateTagMutationVariables = {
	record: TagVariable;
};

type CreateTagMutation = void;

export const useCreateTagMutation = (
	options?: UseMutationOptions<CreateTagMutation, unknown, CreateTagMutationVariables>
) =>
	useMutation<CreateTagMutation, unknown, CreateTagMutationVariables, unknown>(
		(variables: CreateTagMutationVariables) => postApi('/tags', variables.record),
		options
	);

type UpdateTagMutationVariables = {
	_id: Inpt.ObjectId<'tag'>;
	record: CreateTagMutationVariables;
};

type UpdateTagMutation = void;

export const useUpdateTagMutation = (
	options?: UseMutationOptions<UpdateTagMutation, unknown, UpdateTagMutationVariables>
) =>
	useMutation<UpdateTagMutation, unknown, UpdateTagMutationVariables, unknown>(
		(variables: UpdateTagMutationVariables) => putApi(`/tags/${variables._id}`, variables.record),
		options
	);

type DeleteTagMutationVariables = {
	_id: Inpt.ObjectId<'tag'>;
};

type DeleteTagMutation = void;

export const useDeleteTagMutation = (
	options?: UseMutationOptions<DeleteTagMutation, unknown, DeleteTagMutationVariables>
) =>
	useMutation<DeleteTagMutation, unknown, DeleteTagMutationVariables, unknown>(
		(variables: DeleteTagMutationVariables) => deleteApi(`/tags/${variables._id}`),
		options
	);

type AssignTagsMutationVariables = {
	feat: string;
	featId: Inpt.ObjectId;
	record: Inpt.ObjectId<'tag'>[];
};

type AssignTagsMutation = void;

export const useAssignTagsMutation = (
	options?: UseMutationOptions<AssignTagsMutation, unknown, AssignTagsMutationVariables>
) =>
	useMutation<AssignTagsMutation, unknown, AssignTagsMutationVariables>(
		(variables: AssignTagsMutationVariables) =>
			putApi(`/tags/assign/${variables.feat}/${variables.featId}`, variables.record),
		options
	);

type AddTagsMutationVariables = {
	feat: string;
	record: {
		featIds: Inpt.ObjectId[];
		tagIds: Inpt.ObjectId<'tag'>[];
	};
};

type AddTagsMutation = { nModified: number };

const addTags = (variables: AddTagsMutationVariables): Promise<AddTagsMutation> =>
	putApi(`/tags/${variables.feat}/add`, variables.record);

export const useAddTagsMutation = (options?: UseMutationOptions<AddTagsMutation, unknown, AddTagsMutationVariables>) =>
	useMutation<AddTagsMutation, unknown, AddTagsMutationVariables>(addTags, options);

type RemoveTagsMutationVariables = AddTagsMutationVariables;

type RemoveTagsMutation = { nModified: number };

const removeTags = (variables: RemoveTagsMutationVariables): Promise<RemoveTagsMutation> =>
	putApi(`/tags/${variables.feat}/remove`, variables.record);

export const useRemoveTagsMutation = (
	options?: UseMutationOptions<RemoveTagsMutation, unknown, RemoveTagsMutationVariables>
) => useMutation<RemoveTagsMutation, unknown, RemoveTagsMutationVariables>(removeTags, options);
