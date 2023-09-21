import { faRedo, faShieldCheck, faStopCircle } from '@fortawesome/pro-regular-svg-icons';
import { useMemo } from 'react';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { IconButton, Typography, alerts } from '@/components/v2';
import { withLoadingBar } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';
import { makeField } from '@/module-list/ModuleList';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';

import { DropdownFilter } from '../../components/DropDownFilter';

type DataFlowRunDetail = Assign<Item, Inpt.DataFlowRun>;

export const DataFlowRunsTable = ({ globalActions, onClick, dataFlowId }) => {
	const { moduleListProps, runFilters, apply, clear } = useModuleListRef({
		startedAtMin: '',
		startedAtMax: '',
		endedAtMin: '',
		endedAtMax: '',
		sort: 'startedAt',
		sortDir: -1,
	});
	const { canUpdate } = usePermissions(SUBJECTS.DataSyncDataFlows);

	const details = useMemo(
		() => [
			makeField('id', 'Id', false, 300),
			Fields.startedAt,
			Fields.endedAt,
			{
				key: 'isSuccess',
				cellRenderer: 'icon',
				label: 'State',
				value: ({ isSuccess }) => ({ icon: faShieldCheck, color: isSuccess ? 'green' : 'red' }),
				title: ({ isSuccess }) => (isSuccess ? 'Success' : 'Error'),
				width: 100,
				sort: false,
			},
		],
		[]
	);

	const handleStopClick = async (item: DataFlowRunDetail) => {
		if (
			await alerts.confirm({
				title: `Are you sure you want to stop data flow run?`,
				confirmText: 'Stop',
				confirmColor: 'error',
			})
		) {
			await withLoadingBar(
				postApi(`/data-sync/agents/request-abort-dataflowrun`, {
					dataFlowRunId: item._id,
				}),
				'Request to abort data flow run has been sent'
			);
			runFilters();
		}
	};

	return (
		<ModuleList
			{...moduleListProps}
			feat='DataFlowRuns'
			title={<Typography>Data Flow Runs </Typography>}
			fetch={(body) =>
				getApi(`/data-sync/data-flows/${dataFlowId}/runs`, body) as Promise<FilterResult<DataFlowRunDetail>>
			}
			onRowClicked={onClick}
			itemDetails={details}
			globalActions={
				<>
					<IconButton onClick={runFilters}>{faRedo}</IconButton>
					<DropdownFilter apply={apply} clear={clear}>
						<Filters.Title />
						<Filters.CreatedRangeFilter
							labelMin='Started from'
							labelMax='Started to'
							nameMin='startedAtMin'
							nameMax='startedAtMax'
						/>
						<Filters.CreatedRangeFilter
							labelMin='Ended from'
							labelMax='Ended to'
							nameMin='endedAtMin'
							nameMax='endedAtMax'
						/>
					</DropdownFilter>
					{globalActions}
				</>
			}
			paginationPosition='bottom'
			itemActions={(item: DataFlowRunDetail) => [
				{
					icon: faStopCircle,
					label: 'Stop',
					onClick: () => {
						handleStopClick(item);
					},
					disabled: !canUpdate || !!item.endedAt,
					color: 'warning',
				},
			]}
		/>
	);
};
