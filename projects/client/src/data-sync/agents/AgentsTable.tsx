import { faCopy, faEye, faRedo } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import usePermissions from '@/access-policies/usePermissions';
import { IconButton } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { CUSTOM_DATA_SYNC_ACTIONS, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { makeField } from '@/module-list/ModuleList';
import ModuleList, { Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult, Item } from '@/module-list/types';
import { URLS } from '@/urls';

import AgentCreateDialog from './AgentCreateModal';
import AgentKeyDialog from './AgentKeyDialog';

type AgentItemDetail = Assign<Item, Inpt.Agent>;

const makeInstanceCountText = (instanceCount: number) => pluralize(instanceCount, `instance`, `instances`);

export const AgentsTable = () => {
	const { moduleListProps, runFilters } = useModuleListRef({
		name: '',
		sort: 'id',
		sortDir: -1,
	});
	const navigate = useNavigate();

	const workMe = (item: AgentItemDetail) => {
		navigate(`${URLS.agentInstances}?agentId=${item._id}`);
	};
	const { canCreate, ability } = usePermissions(SUBJECTS.DataSyncAgents);
	const canCopyKey = ability.can(CUSTOM_DATA_SYNC_ACTIONS.CopyKey.action, SUBJECTS.DataSyncAgents);
	const canViewKey = ability.can(CUSTOM_DATA_SYNC_ACTIONS.ViewKey.action, SUBJECTS.DataSyncAgents);

	const [createDialog, showCreateDialog] = useDialog(AgentCreateDialog);

	const [keyDialog, showKeyDialog] = useDialog(AgentKeyDialog);

	const copyKey = (item: string) => {
		navigator.clipboard.writeText(item);
		confirmationAlert(`Registration key added to clipboard`);
	};

	const showKey = useCallback(
		(item: string) => {
			showKeyDialog({ item });
		},
		[showKeyDialog]
	);

	return (
		<>
			{keyDialog}
			{createDialog}
			<ModuleList
				{...moduleListProps}
				feat='Agents'
				workMe={workMe}
				workMeName='Instances'
				fetch={(body) => getApi('/data-sync/agents', body) as Promise<FilterResult<AgentItemDetail>>}
				itemActions={useCallback(
					(item) => [
						{
							onClick: () => copyKey(item.registrationKey),
							icon: faCopy,
							disabled: !canCopyKey,
							label: 'Copy key',
						},
						{
							onClick: () => showKey(item.registrationKey),
							icon: faEye,
							disabled: !canViewKey,
							label: 'Show key',
						},
					],
					[canViewKey, canCopyKey, showKey]
				)}
				filters={
					<>
						<Filters.Title />
						<Filters.IdFilter label='Name' name='name' />
					</>
				}
				globalActions={<IconButton onClick={runFilters}>{faRedo}</IconButton>}
				canCreate={canCreate}
				onCreate={async () => {
					await showCreateDialog();
				}}
				itemDetails={[
					makeField('description', 'Name', true),
					{
						key: 'instanceCount',
						label: 'Running Instances',
						value: ({ instanceCount }) =>
							!instanceCount ? 'No instances' : makeInstanceCountText(Number(instanceCount)),
						title: ({ instanceCount }) =>
							!instanceCount ? 'No instances' : makeInstanceCountText(Number(instanceCount)),
						width: 200,
						sort: true,
					},
				]}
			/>
		</>
	);
};
