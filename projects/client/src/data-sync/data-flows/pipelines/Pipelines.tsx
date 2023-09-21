import { faRedo, faShieldCheck } from '@fortawesome/pro-regular-svg-icons';
import { useEffect, useMemo } from 'react';

import { Box, IconButton, Typography } from '@/components/v2';
import { getApi } from '@/helpers/routing';
import { makeField } from '@/module-list/ModuleList';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';

import { LabelChip } from '../../components/LabelChip';

type DataFlowDetail = Assign<Item, Inpt.DataFlow>;

export const PipelinesTable = ({ dataFlowId, runId, onClick, globalActions, labels }) => {
	const { moduleListProps, runFilters } = useModuleListRef({
		order: '',
		state: '',
		sort: 'startedAt',
		sortDir: -1,
	});

	const details = useMemo(
		() => [
			{
				key: 'dataPipelineName',
				label: 'Pipeline Name',
				value: (item) => item.dataPipelineName,
				sort: true,
				width: 200,
			},
			makeField('pipelineProcessingState', 'Processing State', true, 160),
			Fields.startedAt,
			Fields.endedAt,
			{
				key: 'isSuccess',
				cellRenderer: 'icon',
				label: 'State',
				value: ({ isSuccess }) => ({ icon: faShieldCheck, color: isSuccess ? 'green' : 'red' }),
				title: ({ isSuccess }) => (isSuccess ? 'Success' : 'Error'),
				width: 80,
				sort: false,
			},
			makeField('dataPipelineOrder', 'Order', false, 80),
			makeField('partialResult', 'Partial Result', false),
			makeField('dataPipelineId', 'Pipeline Id', false, 300),
		],
		[]
	);

	useEffect(() => {
		if (dataFlowId && runId && runFilters) {
			runFilters?.();
		}
	}, [dataFlowId, runId, runFilters]);

	const labelTags = labels?.map((el) => {
		return <LabelChip el={el} key={el.name} />;
	});

	return (
		<ModuleList
			{...moduleListProps}
			feat='Pipelines'
			labels={labelTags}
			workMeName='Details'
			title={<Typography>Pipeline runs</Typography>}
			hideActions
			onRowClicked={onClick}
			globalActions={
				<>
					<Box sx={{ width: 122 }}>
						<Filters.IdFilter label='Order' name='order' />
					</Box>

					<Box sx={{ width: 122 }}>
						<Filters.IdFilter label='State' name='state' />
					</Box>

					<IconButton onClick={runFilters}>{faRedo}</IconButton>
					{globalActions}
				</>
			}
			fetch={(body) =>
				getApi(`/data-sync/data-flows/runs/${runId}/pipelines`, body) as Promise<FilterResult<DataFlowDetail>>
			}
			itemDetails={details}
		/>
	);
};
