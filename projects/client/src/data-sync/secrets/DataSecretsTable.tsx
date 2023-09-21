import { faPencil, faRedo } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import { IconButton } from '@/components/v2';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, getApi } from '@/helpers/routing';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';

import DataSecretCreateDialog from './DataSecretCreateDialog';

type DataSecretItem = Assign<Item, Inpt.DataSecret>;

export const DataSecretsTable = () => {
	const { moduleListProps, runFilters } = useModuleListRef({
		sort: 'id',
		sortDir: -1,
	});

	const { canUpdate, canCreate, canDelete } = usePermissions(SUBJECTS.DataSyncSecrets);
	const [createDialog, showCreateDialog] = useDialog(DataSecretCreateDialog, { runFilters });
	const [updateDialog, showUpdateDialog] = useDialog(DataSecretCreateDialog, { type: 'update', runFilters });

	const mutation = useMutation(({ key }: DataSecretItem) => deleteApi(`/data-sync/data-secrets/${key}`), {});

	const onDelete = useCallback(
		async (item) => {
			return mutation.mutateAsync(item);
		},
		[mutation]
	);

	return (
		<>
			{createDialog}
			{updateDialog}
			<ModuleList
				{...moduleListProps}
				feat='Data secret'
				canCreate={canCreate}
				onCreate={async () => {
					await showCreateDialog();
				}}
				canDelete={() => canDelete}
				onDelete={onDelete}
				fetch={(body) => getApi('/data-sync/data-secrets', body) as Promise<FilterResult<DataSecretItem>>}
				globalActions={<IconButton onClick={runFilters}>{faRedo}</IconButton>}
				filters={
					<>
						<Filters.Title />
						<Filters.IdFilter label='Key' name='key' />
					</>
				}
				itemDetails={[Fields.key, Fields.hidden]}
				itemActions={useCallback(
					(item: DataSecretItem) =>
						[
							canUpdate && {
								icon: faPencil,
								label: 'Update',
								onClick: () => {
									showUpdateDialog({ item });
								},
								disabled: !canUpdate,
								color: 'warning',
							},
						].filter(Boolean),
					[showUpdateDialog, canUpdate]
				)}
			/>
		</>
	);
};
