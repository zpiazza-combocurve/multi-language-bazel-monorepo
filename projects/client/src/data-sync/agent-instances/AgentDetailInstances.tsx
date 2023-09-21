import { useParams } from 'react-router-dom';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { useLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { FilterResult, Item } from '@/module-list/types';

import JsonViewerDialog from '../components/JsonViewerDialog';
import { AgentInstancesDetailComponent } from './AgentDetailInstances.component';
import { useAgentInstance, useAgentVersions, useCompareVersions } from './Agents.hooks';
import ChooseVersionDialog from './ChooseVersionDialog';

type AgentsItem = Assign<Item, Inpt.AgentInstance>;

export const AgentInstancesDetailContainer: React.FC = () => {
	const { id } = useParams() as { id: string };
	const { loading, data } = useAgentInstance(id);

	const { connectionId, version } = data?.data ?? {};
	useLoadingBar(loading);
	const [chooseVersionDialog, promptChooseVersionDialog] = useDialog(ChooseVersionDialog, { connectionId });
	const [jsonViewerDialog, showJsonViewerDialog] = useDialog(JsonViewerDialog);
	const { data: versions, isLoading: versionsLoading } = useAgentVersions();
	const hasLatestVersion = useCompareVersions(version, versions);
	const { canUpdate: canRequestUpdate } = usePermissions(SUBJECTS.DataSyncAgentInstances);

	const handleStateMessageCellClicked = ({ value }) => {
		return value && showJsonViewerDialog({ value, title: 'State detail' });
	};

	const handlePartialResultCellClicked = ({ value }) => {
		return value && showJsonViewerDialog({ value, title: 'Run history detail' });
	};

	const fetchAgentInstances = async (body) => {
		if (!id) {
			return {};
		}

		return getApi(`/data-sync/agent-instances/${id}/runs`, body);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const fetchAgentStates = async (body: any) => {
		if (!id) {
			return {};
		}
		return getApi(`/data-sync/agent-instances/${id}/states`, body) as Promise<FilterResult<AgentsItem>>;
	};

	return (
		<>
			<AgentInstancesDetailComponent
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				promptChooseVersionDialog={promptChooseVersionDialog as any}
				hasLatestVersion={hasLatestVersion}
				permissions={{ canRequestUpdate }}
				loading={loading || versionsLoading}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				fetchAgentInstances={fetchAgentInstances as any}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				fetchAgentStates={fetchAgentStates as any}
				handlePartialResultCellClicked={handlePartialResultCellClicked}
				handleStateMessageCellClicked={handleStateMessageCellClicked}
				data={data}
			/>
			{jsonViewerDialog}
			{chooseVersionDialog}
		</>
	);
};
