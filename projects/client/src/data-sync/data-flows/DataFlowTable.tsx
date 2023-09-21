import { faPencil, faRedo } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import { IconButton } from '@/components/v2';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, getApi } from '@/helpers/routing';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';
import { URLS } from '@/urls';

import { calculateCondition } from './DataFlow.hooks';
import DataFlowManageModal from './DataFlowManage';

type DataFlowDetail = Assign<Item, Inpt.DataFlow>;

export const DataFlowTable = () => {
	const { moduleListProps, runFilters } = useModuleListRef({
		name: '',
		priority: '',
		isValid: '',
		sort: 'createdAt',
		sortDir: -1,
	});
	const navigate = useNavigate();

	const navigateToDataFlow = (id: string) => navigate(`${URLS.dataFlow}/${id}/view`);

	const workMe = (item: DataFlowDetail) => navigateToDataFlow(item._id);

	const { canCreate, canUpdate, canDelete } = usePermissions(SUBJECTS.DataSyncDataFlows);

	const [createDialog, showCreateDialog] = useDialog(DataFlowManageModal, {
		onCreate: ({ id }) => navigateToDataFlow(id),
	});
	const [updateDialog, showUpdateDialog] = useDialog(DataFlowManageModal, { type: 'update', onUpdate: runFilters });

	const mutation = useMutation(({ _id }: DataFlowDetail) => deleteApi(`/data-sync/data-flows/${_id}`), {});

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
				feat='Data Flow'
				workMe={workMe}
				onCreate={async () => {
					await showCreateDialog();
				}}
				workMeName='Details'
				canCreate={canCreate}
				canDelete={() => canDelete}
				onDelete={onDelete}
				fetch={(body) => getApi('/data-sync/data-flows', body) as Promise<FilterResult<DataFlowDetail>>}
				globalActions={<IconButton onClick={runFilters}>{faRedo}</IconButton>}
				filters={
					<>
						<Filters.Title />
						<Filters.IdFilter label='Name' name='name' />
						<Filters.IdFilter label='Priority' name='priority' />
						<Filters.IdFilter label='Validity' name='isValid' />
						<Filters.CreatedRangeFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						cellRenderer: 'conditionalIcon',
						width: 200,
						cellRendererParams: {
							calculateCondition,
						},
					},
					Fields.priority,
					{ ...Fields.createdAt, width: 180 },
					Fields.currentRun,
					Fields.scheduleLast,
					Fields.scheduleNext,
					Fields.isValid,
				]}
				itemActions={useCallback(
					(item: DataFlowDetail) =>
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
