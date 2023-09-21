import { faTrash, faUndoAlt } from '@fortawesome/pro-regular-svg-icons';
import { useMutation } from 'react-query';

import { SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Box, Container, IconButton, Tooltip, Typography } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { toLocalDateTime } from '@/helpers/dates';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, postApi } from '@/helpers/routing';
import { Layout } from '@/layouts/Layout';
import { DeleteDialog } from '@/module-list/ModuleList/components';

import { DetailSidebar } from '../components/DetailSidebar';
import { MainButton } from '../components/MainButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { useDataFlow } from './DataFlowDetail.hooks';
import DataFlowScheduleManageModal from './DataFlowScheduleManage';
import DataPipelineManageModal from './pipelines/DataPipelineManage';
import { PipelineFlows } from './pipelines/PipelineFlows';

export type OverviewProps = {
	dataFlowId: string;
	onDetailClick?: (e, node) => void;
};

export const Overview: React.FC<OverviewProps> = ({ dataFlowId, onDetailClick }) => {
	const { loading, data, refetch } = useDataFlow(dataFlowId);
	const [createPipelineDialog, showCreatePipelineDialog] = useDialog(DataPipelineManageModal, { refetch });
	const [manageScheduleDialog, showManageScheduleDialog] = useDialog(DataFlowScheduleManageModal, { refetch });
	const [clearScheduleDialog, promptClearScheduleDialog] = useDialog(DeleteDialog);
	const [resetParametersDialog, promptResetParametersDialog] = useDialog(DeleteDialog);
	const { canUpdate } = usePermissions(SUBJECTS.DataSyncDataFlows);

	const { dataFlowSchedule, createdAt, description, ignorePreviousRun } = data?.dataFlow ?? {};
	const hasEnabledSchedule = dataFlowSchedule && (dataFlowSchedule.nextRunStartsAt || dataFlowSchedule.schedulePlan);
	const [deleteDialog, promptDelete] = useDialog(DeleteDialog);

	const createPipeline = () => {
		showCreatePipelineDialog({ dataFlowId });
	};

	const manageSchedule = () => {
		showManageScheduleDialog({ dataFlow: data?.dataFlow ?? {} });
	};

	const { mutateAsync: onDeleteNode } = useMutation(
		(dataFlowId: string) => deleteApi(`/data-sync/data-flows/data-pipelines/${dataFlowId}`),
		{
			onSuccess: () => {
				confirmationAlert('Data Flow Pipeline removed');
				refetch();
			},
		}
	);

	const { mutateAsync: clearScheduleAsync, isLoading: clearScheduleLoading } = useMutation(
		(dataFlowId: string) => deleteApi(`/data-sync/data-flows/${dataFlowId}/schedule`),
		{
			onSuccess: () => {
				confirmationAlert('Data Flow schedule cleared');
				refetch();
			},
		}
	);

	const { mutateAsync: resetParametersAsync, isLoading: resetParametersLoading } = useMutation(
		(dataFlowId: string) => postApi(`/data-sync/data-flows/${dataFlowId}/reset`),
		{
			onSuccess: () => {
				confirmationAlert('Data Flow parameters have been reset');
				refetch();
			},
		}
	);

	const onDelete = async (id: string) => {
		await promptDelete({
			title: 'Remove pipeline',
			onDelete: async () => {
				return onDeleteNode(id);
			},
		});
	};

	const handleClearSchedule = async () => {
		await promptClearScheduleDialog({
			title: 'Clear schedule?',
			onDelete: async () => {
				await clearScheduleAsync(dataFlowId);
			},
		});
	};

	const handleResetParameters = async () => {
		await promptResetParametersDialog({
			title: 'Reset parameters?',
			name: 'This action will reset data flow parameters from previous run.',
			onDelete: async () => {
				await resetParametersAsync(dataFlowId);
			},
		});
	};

	if (loading) {
		return <div />;
	}

	return (
		<ErrorBoundary>
			{createPipelineDialog}
			{manageScheduleDialog}
			{clearScheduleDialog}
			{resetParametersDialog}
			{deleteDialog}
			<Layout
				clean
				padded={false}
				sidebar={
					<DetailSidebar>
						<DetailSidebar.Action>
							<Typography variant='h6'>Pipeline Configuration</Typography>
							<Box>
								<Tooltip title='Reset parameters'>
									<IconButton
										size='medium'
										disabled={!canUpdate || resetParametersLoading || ignorePreviousRun}
										onClick={handleResetParameters}
									>
										{faUndoAlt}
									</IconButton>
								</Tooltip>
								<MainButton disabled={!canUpdate} onClick={createPipeline}>
									Create
								</MainButton>
							</Box>
						</DetailSidebar.Action>
						<DetailSidebar.Action>
							<Typography variant='h6'>Schedule </Typography>
							<Box>
								<Tooltip title='Clear schedule'>
									<IconButton
										size='medium'
										disabled={!canUpdate || !hasEnabledSchedule || clearScheduleLoading}
										onClick={handleClearSchedule}
									>
										{faTrash}
									</IconButton>
								</Tooltip>
								<SecondaryButton onClick={manageSchedule}>Manage</SecondaryButton>
							</Box>
						</DetailSidebar.Action>

						<DetailSidebar.Card title='Created at'>{toLocalDateTime(createdAt)}</DetailSidebar.Card>

						{!!dataFlowSchedule && (
							<>
								<DetailSidebar.Card title='Next run'>
									{toLocalDateTime(dataFlowSchedule.nextRunStartsAt)}
								</DetailSidebar.Card>

								<DetailSidebar.Card title='Last run'>
									{toLocalDateTime(dataFlowSchedule.lastRunEndedAt)}
								</DetailSidebar.Card>
							</>
						)}
						{dataFlowSchedule && dataFlowSchedule.schedulePlan && (
							<DetailSidebar.Card title='Schedule plan '>
								{dataFlowSchedule.schedulePlan}
							</DetailSidebar.Card>
						)}

						{description && <DetailSidebar.Card title='Description'>{description}</DetailSidebar.Card>}
					</DetailSidebar>
				}
			>
				<Container>
					<Box>
						<Box width='100%' height={500}>
							<PipelineFlows id={dataFlowId} onDetailClick={onDetailClick} onDelete={onDelete} />
						</Box>
					</Box>
				</Container>
			</Layout>
		</ErrorBoundary>
	);
};
