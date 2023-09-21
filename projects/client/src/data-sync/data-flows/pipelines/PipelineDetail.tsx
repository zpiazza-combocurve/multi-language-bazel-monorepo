import { faRedo } from '@fortawesome/pro-regular-svg-icons';
import { useEffect, useMemo } from 'react';

import { Box, IconButton, Typography } from '@/components/v2';
import { getApi } from '@/helpers/routing';
import { makeField } from '@/module-list/ModuleList';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';

import { LabelChip } from '../../components/LabelChip';

type DataFlowDetail = Assign<Item, Inpt.DataFlow>;

export const PipelineDetail = ({ labels, dataFlowId, runId, pipelineId, globalActions }) => {
	const { moduleListProps, runFilters } = useModuleListRef({
		severity: '',
		sort: 'loggedAt',
		sortDir: -1,
	});

	const details = useMemo(
		() => [
			Fields.loggedAt,
			makeField('severityLevel', 'Severity', true, 130),
			Fields.message,
			makeField('scope', 'Scope', true),
			makeField('parameters', 'Parameters', false),
		],
		[]
	);

	useEffect(() => {
		if (dataFlowId && runId && pipelineId && runFilters) {
			runFilters();
		}
	}, [runFilters, dataFlowId, runId, pipelineId]);

	const labelTags = labels?.map((el) => {
		return <LabelChip key={el.name} el={el} />;
	});

	return (
		<ModuleList
			{...moduleListProps}
			feat='Logs'
			labels={labelTags}
			workMeName='Details'
			title={<Typography>Logs</Typography>}
			fetch={(body) =>
				getApi(`/data-sync/data-flows/runs/${runId}/pipelines/${pipelineId}/logs`, body) as Promise<
					FilterResult<DataFlowDetail>
				>
			}
			globalActions={
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box sx={{ width: 122 }}>
						<Filters.IdFilter label='Severity' name='severity' />
					</Box>

					<IconButton onClick={runFilters}>{faRedo}</IconButton>
					{globalActions}
				</Box>
			}
			itemDetails={details}
			hideActions
		/>
	);
};
