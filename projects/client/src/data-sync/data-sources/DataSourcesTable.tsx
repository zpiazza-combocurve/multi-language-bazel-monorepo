import { faPencil } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, getApi } from '@/helpers/routing';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';

import { useDataSourceTypes } from './DataSource.hooks';
import DataSourceCreateModal from './DataSourceCreateDialog';
import DataSourceTypesFilter from './DataSourceTypesFilter';

type DataSourceItem = Assign<Item, Inpt.DataSource>;

export const DataSourcesTable = () => {
	const { moduleListProps, runFilters } = useModuleListRef({
		name: '',
		dataSourceTypeId: '',
		sort: 'id',
		sortDir: -1,
	});

	const dataSourceTypes = useDataSourceTypes();
	const { canCreate, canUpdate, canDelete } = usePermissions(SUBJECTS.DataSyncDataSources);

	const [createDialog, showCreateDialog] = useDialog(DataSourceCreateModal, { runFilters });
	const [updateDialog, showUpdateDialog] = useDialog(DataSourceCreateModal, { type: 'update', runFilters });
	const mutation = useMutation(({ id }: DataSourceItem) => deleteApi(`/data-sync/data-sources/${id}`), {});

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
				feat='Data Source'
				onCreate={async () => {
					await showCreateDialog({ dataSourceTypes });
				}}
				canCreate={canCreate}
				canDelete={() => canDelete}
				onDelete={onDelete}
				fetch={(body) => getApi('/data-sync/data-sources', body) as Promise<FilterResult<DataSourceItem>>}
				filters={
					<>
						<Filters.Title />
						<DataSourceTypesFilter dataSourceTypes={dataSourceTypes} />
						<Filters.IdFilter label='Name' name='name' />
					</>
				}
				itemDetails={[
					{ ...Fields.name, width: 200 },
					{
						key: 'dataSourceTypeId',
						label: 'Data Source Type',
						value: ({ dataSourceTypeId }) => dataSourceTypes?.find((x) => x._id === dataSourceTypeId)?.name,
						title: ({ dataSourceTypeId }) => dataSourceTypes?.find((x) => x._id === dataSourceTypeId)?.name,
						width: 170,
						sort: false,
					},
				]}
				itemActions={useCallback(
					(item: DataSourceItem) =>
						[
							canUpdate && {
								icon: faPencil,
								label: 'Update',
								onClick: () => {
									showUpdateDialog({ item, dataSourceTypes, runFilters });
								},
								disabled: !canUpdate,
								color: 'warning',
							},
						].filter(Boolean),
					[showUpdateDialog, canUpdate, dataSourceTypes, runFilters]
				)}
			/>
		</>
	);
};
