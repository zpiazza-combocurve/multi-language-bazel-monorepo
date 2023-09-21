import { Skeleton } from '@material-ui/lab';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useMutation } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorBoundary from '@/components/ErrorBoundary';
import { Box, Button, Container } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { deleteApi } from '@/helpers/routing';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import { Breadcrumb } from '@/navigation/Breadcrumbs';

import { MainButton } from '../components/MainButton';
import { useDataSourceTypes } from '../data-sources/DataSource.hooks';
import { dataSyncRoutes } from './DataFlowDetail.hooks';
import { dumpJsonAsYaml, usePipeline } from './pipelines/DataPipeline.hooks';
import { usePipelineForm } from './pipelines/PipelineForm.hooks';
import { PipelineOverview } from './pipelines/PipelineOverview';

const getTemplate = (types, typeId?: string) => types?.find((el) => el?.id === typeId)?.key;

export const OverviewDetail: React.FC<{ dataFlowId: string }> = memo(({ dataFlowId }) => {
	const { pipelineId } = useParams() as { pipelineId: string; id: string };
	const { data, loading } = usePipeline(pipelineId, dataFlowId);
	const [deleteDialog, promptDelete] = useDialog(DeleteDialog);
	const navigate = useNavigate();
	const dataTypes = useDataSourceTypes();
	const {
		id: dataflowPipelineId,
		dataPipelineOrder,
		name,
		description,
		parameters,
		sourceConfig,
		targetConfig,
		steps,
	} = data ?? {};

	const targetTemplate = getTemplate(dataTypes, targetConfig?.dataSource?.dataSourceTypeId);
	const sourceTemplate = getTemplate(dataTypes, sourceConfig?.dataSource?.dataSourceTypeId);

	const pipeline = useMemo(
		() => ({
			...data,
			dataFlowId,
			name,
			description,
			order: dataPipelineOrder,
			parameters: parameters ? dumpJsonAsYaml(parameters) : '',
			steps: steps ? dumpJsonAsYaml(steps) : '',
			sourceDataSet: { ...sourceConfig, template: sourceTemplate, snapshot: sourceConfig?.configuration },
			targetDataSet: { ...targetConfig, template: targetTemplate, snapshot: targetConfig?.configuration },
			id: dataflowPipelineId,
		}),
		[
			data,
			dataFlowId,
			name,
			description,
			dataPipelineOrder,
			sourceTemplate,
			targetTemplate,
			dataflowPipelineId,
			parameters,
			steps,
			sourceConfig,
			targetConfig,
		]
	);

	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	const { form, mutation } = usePipelineForm(pipeline, 'update', { onHide: () => {}, refetch: () => {} });
	const { setValue, getValues, control, handleSubmit } = form;

	useEffect(() => {
		if (!loading) {
			form.reset(pipeline);
		}
	}, [loading, form, pipeline]);

	const setEditorValueForm = useCallback(
		(editorName) => (newValue, _ev) => {
			setValue(editorName, newValue, { shouldDirty: true });
		},
		[setValue]
	);

	const handleUpdate = handleSubmit((values) => mutation.mutate(values));

	const { mutateAsync: onDeletePipeline, isLoading: deleteLoading } = useMutation(
		(dataFlowId: string) => deleteApi(`/data-sync/data-flows/data-pipelines/${dataFlowId}`),
		{
			onSuccess: () => {
				confirmationAlert('Data Flow Pipeline removed');
				navigate(`/data-sync/data-flows/${dataFlowId}/view`);
			},
		}
	);

	const handleDelete = async () => {
		await promptDelete({
			title: 'Remove pipeline',
			onDelete: async () => {
				return onDeletePipeline(dataflowPipelineId);
			},
		});
	};

	return (
		<ErrorBoundary>
			<Breadcrumb url={dataSyncRoutes(dataFlowId).view(pipelineId).root} label={name ?? 'Loading'} />
			{deleteDialog}

			<Container>
				{pipeline.name && (
					<Box>
						<PipelineOverview control={control} getValues={getValues} setEditorValue={setEditorValueForm} />
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 14% 0 0' }}>
							<Button
								onClick={handleDelete}
								disabled={deleteLoading}
								color='error'
								variant='outlined'
								style={{ marginRight: '8px' }}
							>
								Delete
							</Button>
							<MainButton onClick={handleUpdate} disabled={mutation.isLoading}>
								Update
							</MainButton>
						</Box>
					</Box>
				)}
				{!pipeline.name && <Skeleton animation='wave' height={800} width={1000} />}
			</Container>
		</ErrorBoundary>
	);
});
