import { NodeModel } from '@combocurve/types/client';
import { Node, NodeType } from '@combocurve/types/client/network-shared';
import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Checkbox, Divider, FormControlLabel, Stack, Tooltip } from '@mui/material';
import { omit } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';

import IconButton from '@/components/v5/IconButton';
import { RHFTextField } from '@/components/v5/react-hook-form-fields';
import MuiV5ThemeProvider from '@/helpers/MuiV5ThemeProvider';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { queryClient } from '@/helpers/query-cache';
import { unsavedWorkContinue, useUnsavedWork } from '@/helpers/unsaved-work';
import { assert } from '@/helpers/utilities';
import { FilterResult } from '@/module-list/types';
import { NODE_TYPES_SCHEMAS, generateNodeForm } from '@/networks/carbon/Diagram/EditNodeDialog';
import { goNodeZohoPage } from '@/networks/carbon/Diagram/zoho';
import {
	createNodeModel,
	deleteNodeModel,
	nodeModelQuery,
	nodeModelsQuery,
	renameNodeModel,
	updateNodeModel,
} from '@/networks/carbon/api';
import { DEFAULT_NODE_DATA, NODES_PRESETS } from '@/networks/carbon/shared';
import { CustomCalculationNode, NodeModelModuleListItem } from '@/networks/carbon/types';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectId } from '@/projects/routes';

import AdvancedList from './AdvancedList';
import { FormValues, NodeDialogMode } from './NodeDialog.types';
import { ActionsGroup, EconLayoutDialog, SIDEBAR_BUTTON_PROPS, SIDEBAR_TEXT_FIELD_PROPS, TabList } from './components';
import { getInitialNodeFormData } from './helpers';

const USE_AS_COPY_TOOLTIP = `Copies and locks the node model parameters within this node. Changes to the original node model will not be reflected in this node`;

const NODE_TYPES = Object.values(
	omit(
		NodeType,
		NodeType.liquids_unloading,
		NodeType.associated_gas,
		NodeType.econ_output,
		NodeType.atmosphere,
		NodeType.facility,
		NodeType.capture
	)
);

const DUMMY_CALCULATION_NODE: CustomCalculationNode = {
	id: 'dummy',
	shape: {
		position: {
			x: 0,
			y: 0,
		},
	},
	type: NodeType.custom_calculation,
	name: '',
	description: '',
	params: DEFAULT_NODE_DATA[NodeType.custom_calculation],
};

function NodeModelList({
	type,
	selectedNodeModel,
	onSelectNodeModel,
	initialNodeModel,
}: {
	type: NodeType;
	initialNodeModel: string | null;
	selectedNodeModel: string | null;
	onSelectNodeModel: (nodeModel: string) => void;
}) {
	const currentProject = useCurrentProject();
	const itemsQuery = useQuery(nodeModelsQuery({ type, project: currentProject?.project?.name }));

	const deleteMutation = useMutation((id: string) => deleteNodeModel(id), {
		// TODO optimistic update
		onSuccess: () => {
			queryClient.invalidateQueries(nodeModelsQuery({ type }).queryKey);
			confirmationAlert(localize.nodeModel.notifications.deleted());
		},
	});

	const renameMutation = useMutation(
		({ id, name }: { id: string; name: string }) => renameNodeModel({ _id: id, name }),
		{
			onSuccess: () => {
				confirmationAlert(localize.nodeModel.notifications.renamed());
			},
		}
	); // TODO optimistic update

	return (
		<AdvancedList<NodeModelModuleListItem>
			isLoading={itemsQuery.isLoading}
			items={itemsQuery.data?.items ?? null}
			selectedItem={selectedNodeModel}
			appliedItem={initialNodeModel}
			onDelete={(item) => deleteMutation.mutate(item._id)}
			onRename={(item) => renameMutation.mutate({ id: item._id, name: item.name })}
			getKey={(item) => item._id}
			getCreatedAt={(item) => new Date(item.createdAt)}
			getCreatedBy={(item) => item.createdBy as Inpt.User}
			getName={(item) => item.name}
			onSelect={(item) => onSelectNodeModel(item._id)}
		/>
	);
}

interface NodeDialogProps
	extends DialogProps<
		Pick<Node, 'name' | 'description' | 'params'> & {
			nodeModel: string | null;
		}
	> {
	node?: Node;
	nodeModel?: NodeModel;
	mode?: NodeDialogMode;
	taggingProp?: Record<string, string>;
}

function NodeDialog(props: NodeDialogProps) {
	const { mode, nodeModel, node: initialNode, ...dialogProps } = props;

	assert(mode, 'Mode must be provided');
	if (mode === NodeDialogMode.node) assert(initialNode, 'Node must be provided in node mode');

	const {
		type,
		initialValues,
		nodeModel: initialNodeModel,
	} = getInitialNodeFormData({
		mode,
		node: initialNode,
		nodeModel,
		type: NodeDialogMode.model && !nodeModel ? NodeType.well_group : undefined,
	});

	const [selectedNodeType, setSelectedNodeType] = useState(type);
	const [selectedNodeModel, setSelectedNodeModel] = useState<null | string>(initialNodeModel ?? null);
	const project = useCurrentProjectId();
	const currentProject = useCurrentProject();
	const [usingAsCopy, setUsingAsCopy] = useState(() => !initialNodeModel);

	const form = useForm<FormValues>({
		defaultValues: initialValues,
		resolver: yupResolver(NODE_TYPES_SCHEMAS[selectedNodeType]),
	});
	const {
		watch,
		reset,
		handleSubmit,
		formState: { isDirty },
	} = form;

	const formNodeType = watch('type');

	useUnsavedWork(isDirty);
	const selectedNodeModelQuery = useQuery({
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		...nodeModelQuery(selectedNodeModel!),
		enabled: selectedNodeModel != null,
		onSuccess: (nodeModel) => {
			reset(getInitialNodeFormData({ mode, type: selectedNodeType, node: initialNode, nodeModel }).initialValues);
		},
	});

	const handleClear = () => {
		reset(getInitialNodeFormData({ mode, node: initialNode, type: selectedNodeType }).initialValues);
	};

	const handleUndoChanges = () => {
		reset(
			getInitialNodeFormData({
				mode,
				type: selectedNodeType,
				node: initialNode,
				nodeModel: selectedNodeModelQuery.data,
			}).initialValues
		);
	};

	const saveAsMutation = useMutation(
		({
			name: _name,
			description: _description,
			type,
			nodeModelDescription,
			nodeModelName,
			mode: _mode,
			...params
		}: FormValues) =>
			createNodeModel({
				name: nodeModelName,
				description: nodeModelDescription,
				type,
				params: params as NodeModel['params'],
				project,
			}),
		{
			// TODO optimistic update
			onSuccess: (data, values) => {
				setSelectedNodeModel(data._id);
				queryClient.invalidateQueries(nodeModelsQuery({ type: values.type }).queryKey);
				confirmationAlert(localize.nodeModel.notifications.created());
			},
		}
	);

	const saveMutation = useMutation(
		async ({
			name: _name,
			mode: _mode,
			description: _description,
			type,
			nodeModelDescription,
			nodeModelName,
			...params
		}: FormValues) => {
			assert(selectedNodeModel, 'selectedNodeModel must be defined');

			type NodeModelUpdate = Partial<NodeModel> & { _id: string };

			const update = {
				_id: selectedNodeModel,
				description: nodeModelDescription,
				type,
				params,
				project,
			} as NodeModelUpdate;

			if (nodeModelName) {
				// only update if nodeModelName is not empty, note that nodeModelName is empty by default and not required
				update.name = nodeModelName;
			}

			return updateNodeModel(update);
		},
		{
			onSuccess: (data) => {
				// TODO optimistically update
				reset(getInitialNodeFormData({ mode, node: initialNode, nodeModel: data }).initialValues);
				queryClient.invalidateQueries(nodeModelsQuery({ type: formNodeType }).queryKey);
				confirmationAlert(localize.nodeModel.notifications.updated());
			},
		}
	);

	const handleUse = handleSubmit((params) => {
		const parsedParams = omit(params, ['type', 'mode', 'nodeModelName', 'nodeModelDescription']);
		// TODO use carbon model reference instead of params if using carbon model
		dialogProps.resolve({
			...parsedParams,
			nodeModel: usingAsCopy ? null : selectedNodeModel,
		});
	});

	const handleZohoRedirect = () => goNodeZohoPage(formNodeType);

	const handleChangeNodeType = useCallback(
		async (nodeType: NodeType) => {
			if (isDirty && !(await unsavedWorkContinue())) return;
			setSelectedNodeType(nodeType);
			setSelectedNodeModel(null);
			reset(getInitialNodeFormData({ mode, type: nodeType }).initialValues);
		},
		[isDirty, mode, reset]
	);

	const handleSaveAs = handleSubmit((values) => saveAsMutation.mutate(values));

	const handleSave = handleSubmit((values) => saveMutation.mutate(values));

	const handleSelectNodeModel = async (id: string) => {
		if (isDirty && !(await unsavedWorkContinue())) {
			return;
		}
		setUsingAsCopy(false);

		const nodeModelsResult = queryClient.getQueryData<FilterResult<NodeModelModuleListItem>>(
			nodeModelsQuery({ type: selectedNodeType, project: currentProject?.project?.name }).queryKey,
			{ exact: true }
		);
		const nodeModels = nodeModelsResult?.items ?? [];
		const nodeModel = nodeModels.find((cm) => cm._id === id);
		setSelectedNodeModel(id);

		reset(
			getInitialNodeFormData({
				mode,
				node: initialNode,
				nodeModel: nodeModel as unknown as NodeModel, // TODO fix hacky hack
			}).initialValues
		);
	};

	const checkForUnsavedChanges = useCallback(
		async (event) => {
			if (isDirty && !(await unsavedWorkContinue())) {
				event.preventDefault();
			} else dialogProps.onHide?.();
		},
		[dialogProps, isDirty]
	);

	const nodeModelName = watch('nodeModelName');

	return (
		<FormProvider {...form}>
			<EconLayoutDialog
				{...dialogProps}
				onHide={checkForUnsavedChanges}
				topbarActions={<IconButton onClick={handleZohoRedirect}>{faQuestion}</IconButton>}
				actions={
					initialNode && (
						<>
							<Button color='inherit' onClick={checkForUnsavedChanges}>
								Cancel
							</Button>
							<Button variant='contained' color='secondary' onClick={handleUse}>
								Apply
							</Button>
						</>
					)
				}
				extraHeaders={
					initialNode && (
						<MuiV5ThemeProvider>
							<RHFTextField sx={{ m: 1 }} name='name' label='Node Display Name' variant='outlined' />
						</MuiV5ThemeProvider>
					)
				}
				tabs={
					<TabList
						tabs={initialNode?.type ? [initialNode.type] : NODE_TYPES}
						selected={selectedNodeType}
						onChange={handleChangeNodeType}
						getTitle={(nodeType) => NODES_PRESETS[nodeType as string]?.name ?? nodeType}
					/>
				}
				sidebar={
					<MuiV5ThemeProvider>
						<ActionsGroup>
							<Button {...SIDEBAR_BUTTON_PROPS} onClick={handleClear}>
								Clear
							</Button>
							<Button {...SIDEBAR_BUTTON_PROPS} onClick={handleUndoChanges}>
								Undo Changes
							</Button>
							<Button {...SIDEBAR_BUTTON_PROPS} onClick={handleSaveAs} disabled={!nodeModelName}>
								Save As
							</Button>
							<Button {...SIDEBAR_BUTTON_PROPS} onClick={handleSave} disabled={selectedNodeModel == null}>
								Save
							</Button>
						</ActionsGroup>
						<Divider />
						<RHFTextField
							{...SIDEBAR_TEXT_FIELD_PROPS}
							name='nodeModelName'
							label='New Model Name'
							variant='outlined'
						/>
						<Divider />
						{initialNode && (
							<Box>
								<Tooltip title={USE_AS_COPY_TOOLTIP}>
									<FormControlLabel
										control={<Checkbox />}
										checked={usingAsCopy}
										onChange={async (_ev, value) => {
											setUsingAsCopy(value);
											if (value) {
												setSelectedNodeModel(null);
											}
										}}
										label='Use As A Copy'
									/>
								</Tooltip>
							</Box>
						)}
						<NodeModelList
							initialNodeModel={initialNodeModel ?? null}
							type={selectedNodeType}
							selectedNodeModel={selectedNodeModel}
							onSelectNodeModel={handleSelectNodeModel}
						/>
					</MuiV5ThemeProvider>
				}
			>
				<Stack spacing={2}>
					<MuiV5ThemeProvider>
						<RHFTextField name='nodeModelDescription' label='Model Description' />
					</MuiV5ThemeProvider>
					{useMemo(
						() =>
							formNodeType &&
							generateNodeForm({
								type: formNodeType,
								node:
									mode === NodeDialogMode.model && formNodeType === NodeType.custom_calculation
										? DUMMY_CALCULATION_NODE
										: initialNode,
							}),
						[formNodeType, initialNode, mode]
					)}
				</Stack>
			</EconLayoutDialog>
		</FormProvider>
	);
}

export default NodeDialog;
