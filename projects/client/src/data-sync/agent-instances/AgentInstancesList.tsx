import { faRedo } from '@fortawesome/pro-regular-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { IconButton } from '@/components/v2';
import { getApi } from '@/helpers/routing';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';
import { URLS } from '@/urls';

type AgentsItem = Assign<Item, Inpt.AgentInstance>;

export const AgentInstancesList = () => {
	const { search } = useLocation();
	const searchParams = new URLSearchParams(search);

	const { moduleListProps, runFilters } = useModuleListRef({
		version: '',
		machineName: '',
		sort: 'dataSyncAgentName',
		sortDir: -1,
		dataSyncAgentId: searchParams.get('agentId'),
	});
	const navigate = useNavigate();

	const workMe = (item: AgentsItem) => {
		navigate(`${URLS.agentInstances}/${item._id}`);
	};

	return (
		<ModuleList
			{...moduleListProps}
			feat='AgentInstances'
			workMe={workMe}
			workMeName='Details'
			fetch={(body) => getApi('/data-sync/agent-instances', body) as Promise<FilterResult<AgentsItem>>}
			globalActions={<IconButton onClick={runFilters}>{faRedo}</IconButton>}
			filters={
				<>
					<Filters.Title />
					<Filters.AgentNames />
					<Filters.IdFilter label='Machine name' name='machineName' />
					<Filters.IdFilter label='Version' name='version' />
				</>
			}
			itemDetails={[
				Fields.agentName,
				Fields.isIdle,
				Fields.version,
				{ ...Fields.createdAt, width: 180 },
				Fields.machineName,
			]}
		/>
	);
};
