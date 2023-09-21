import { UseMutationOptions, useMutation } from 'react-query';

import {
	addWellsToWellsCollection,
	createWellsCollection,
	massCreateWellsCollection,
	removeWellsCollection,
	removeWellsFromWellsCollection,
} from './api';
import {
	AddWellsToWellsCollectionMutationVariables,
	CreateWellsCollectionParams,
	MassCreateWellsCollectionParams,
	RemoveWellsCollectionMutationVariables,
	RemoveWellsFromWellsCollectionsMutationVariables,
} from './types';

export const useCreateWellsCollectionMutation = (
	options?: UseMutationOptions<Inpt.WellsCollection, Error, CreateWellsCollectionParams>
) =>
	useMutation<Inpt.WellsCollection, Error, CreateWellsCollectionParams, unknown>(
		(variables: CreateWellsCollectionParams) => createWellsCollection(variables),
		options
	);

export const useAddWellsToWellsCollectionMutation = (
	options?: UseMutationOptions<void, Error, AddWellsToWellsCollectionMutationVariables>
) =>
	useMutation<void, Error, AddWellsToWellsCollectionMutationVariables, unknown>(
		(variables: AddWellsToWellsCollectionMutationVariables) =>
			addWellsToWellsCollection(variables.wellsCollectionId, variables.wells),
		options
	);

export const useRemoveWellsCollectionMutation = (
	options?: UseMutationOptions<void, unknown, RemoveWellsCollectionMutationVariables>
) =>
	useMutation<void, unknown, RemoveWellsCollectionMutationVariables, unknown>(
		(variables: RemoveWellsCollectionMutationVariables) => removeWellsCollection(variables),
		options
	);

export const useRemoveWellsFromWellsCollectionMutation = (
	options?: UseMutationOptions<void[], unknown, RemoveWellsFromWellsCollectionsMutationVariables>
) =>
	useMutation<void[], unknown, RemoveWellsFromWellsCollectionsMutationVariables, unknown>(
		(variables: RemoveWellsFromWellsCollectionsMutationVariables) =>
			Promise.all(
				Object.entries(variables)
					.filter(([, wells]) => wells.length > 0)
					.map(([wellCollectionId, wells]) =>
						removeWellsFromWellsCollection(wellCollectionId as Inpt.ObjectId<'wells-collection'>, wells)
					)
			),
		options
	);

export const useMassCreateWellsCollectionMutation = (
	options?: UseMutationOptions<Inpt.WellsCollection[], Error, MassCreateWellsCollectionParams>
) => {
	return useMutation<Inpt.WellsCollection[], Error, MassCreateWellsCollectionParams, unknown>(
		(variables: MassCreateWellsCollectionParams) => massCreateWellsCollection(variables),
		options
	);
};
