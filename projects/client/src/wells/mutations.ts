import { UseMutationOptions, useMutation } from 'react-query';

import { startExportWells } from './api';
import { StartExportWellsMutationVariables } from './types';

export const useStartExportWellsMutation = (
	options?: UseMutationOptions<void, unknown, StartExportWellsMutationVariables>
) =>
	useMutation<void, unknown, StartExportWellsMutationVariables, unknown>(
		(variables: StartExportWellsMutationVariables) => startExportWells(variables.wellIds, variables.projectId),
		options
	);
