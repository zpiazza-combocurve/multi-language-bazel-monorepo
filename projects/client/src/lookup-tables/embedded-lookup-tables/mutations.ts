import { UseMutationOptions, useMutation } from 'react-query';

import {
	copyEmbeddedLookupTable,
	createEmbeddedLookupTable,
	importEmbeddedLookupTable,
	massImportEmbeddedLookupTables,
	updateEmbeddedLookupTable,
} from './api';
import {
	CopyEmbeddedLookupTableMutationVariables,
	CreateEmbeddedLookupTableMutationVariables,
	ImportEmbeddedLookupTableMutationVariables,
	MassImportEmbeddedLookupTablesMutationVariables,
	UpdateEmbeddedLookupTableMutationVariables,
} from './types';

export const useCreateEmbeddedLookupTableMutation = (
	options?: UseMutationOptions<Inpt.EmbeddedLookupTable, unknown, CreateEmbeddedLookupTableMutationVariables>
) =>
	useMutation<Inpt.EmbeddedLookupTable, unknown, CreateEmbeddedLookupTableMutationVariables, unknown>(
		(variables: CreateEmbeddedLookupTableMutationVariables) => createEmbeddedLookupTable(variables),
		options
	);

export const useUpdateEmbeddedLookupTableMutation = (
	options?: UseMutationOptions<Inpt.EmbeddedLookupTable, unknown, UpdateEmbeddedLookupTableMutationVariables>
) =>
	useMutation<Inpt.EmbeddedLookupTable, unknown, UpdateEmbeddedLookupTableMutationVariables, unknown>(
		(variables: UpdateEmbeddedLookupTableMutationVariables) =>
			updateEmbeddedLookupTable(variables.eltId, variables.data),
		options
	);

export const useCopyEmbeddedLookupTableMutation = (
	options?: UseMutationOptions<Inpt.EmbeddedLookupTable, unknown, CopyEmbeddedLookupTableMutationVariables>
) =>
	useMutation<Inpt.EmbeddedLookupTable, unknown, CopyEmbeddedLookupTableMutationVariables, unknown>(
		(variables: CopyEmbeddedLookupTableMutationVariables) => copyEmbeddedLookupTable(variables.eltId),
		options
	);

export const useImportEmbeddedLookupTableMutation = (
	options?: UseMutationOptions<Inpt.EmbeddedLookupTable, unknown, ImportEmbeddedLookupTableMutationVariables>
) =>
	useMutation<Inpt.EmbeddedLookupTable, unknown, ImportEmbeddedLookupTableMutationVariables, unknown>(
		(variables: ImportEmbeddedLookupTableMutationVariables) =>
			importEmbeddedLookupTable(variables.eltId, variables.targetProjectId),
		options
	);

export const useMassImportEmbeddedLookupTablesMutation = (
	options?: UseMutationOptions<Inpt.EmbeddedLookupTable, unknown, MassImportEmbeddedLookupTablesMutationVariables>
) =>
	useMutation<Inpt.EmbeddedLookupTable, unknown, MassImportEmbeddedLookupTablesMutationVariables, unknown>(
		(variables: MassImportEmbeddedLookupTablesMutationVariables) =>
			massImportEmbeddedLookupTables(variables.ids, variables.targetProjectId),
		options
	);
