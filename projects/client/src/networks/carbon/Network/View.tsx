import { faSearch } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Icon, InputAdornment, TextField } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { assert, filterSearch } from '@/helpers/utilities';

import Diagram, { SidebarActions, SidebarDeviceItem, SidebarItemList } from '../Diagram/Diagram';
import { ModelTitle } from '../ModelTitle';
import CreateNetworkModelDialog from '../ModuleList/CreateNetworkDialog';
import { changeNetworkName, networkQuery, updateNetworkModel, useNetworkModelFacilitiesQuery } from '../api';
import { graphToNetworkModelData, networkModelDataToGraph, useJointStore } from '../joint/helpers';
import CustomCalculationNode from '../joint/nodes/CustomCalculationNode';
import { DeviceNode } from '../joint/nodes/DeviceNode';
import { FacilityNode } from '../joint/nodes/FacilityNode';
import { DEFAULT_NODE_DATA, INPUT_PORT_GROUPS, NODES_PRESETS, OUTPUT_PORT_GROUPS } from '../shared';
import { AnyNode, DndItemType, NetworkModelFacility, NodeType, Stream } from '../types';

export const NODES_TYPE_LIST: Readonly<Exclude<NodeType, 'facility'>[]> = [
	NodeType.well_group,
	NodeType.atmosphere,
	NodeType.econ_output,
	NodeType.oil_tank,
	NodeType.flare,
	NodeType.liquids_unloading,
	NodeType.associated_gas,
	NodeType.drilling,
	NodeType.completion,
	NodeType.flowback,
	NodeType.capture,
	NodeType.custom_calculation,
] as const;

export const LAYERS = [
	{
		id: Stream.oil,
		name: 'Oil',
	},
	{
		id: Stream.gas,
		name: 'Gas',
	},
	{
		id: Stream.water,
		name: 'Water',
	},
	{
		id: Stream.link,
		name: 'Link',
	},
	{
		id: Stream.development,
		name: 'Development',
	},
];

type DndItem =
	| { type: DndItemType.node; nodeType: (typeof NODES_TYPE_LIST)[number] }
	| { type: DndItemType.facility; facility: NetworkModelFacility };

function NetworkModelView() {
	const { networkId } = useParams();
	const queryClient = useQueryClient();

	assert(networkId, 'networkId is not defined');

	const { data: networkModel } = useQuery({ ...networkQuery(networkId), suspense: true });
	assert(networkModel, 'networkModel is not defined');

	const invalidateNetworkModel = useCallback(
		() => queryClient.invalidateQueries(networkQuery(networkId).queryKey),
		[networkId, queryClient]
	);

	const [jointNetwork, setJointNetwork] = useJointStore((state) => [state.jointNetwork, state.setJointNetwork]);
	const [initialCells, setInitialCells] = useState<joint.dia.Cell[]>([]);
	const [search, setSearch] = useState('');

	const [createNetworkModelDialog, showCreateNetworkModelDialog] = useDialog(CreateNetworkModelDialog);

	const facilitiesQuery = useNetworkModelFacilitiesQuery();

	const updateNetworkModelMutation = useMutation(
		() => {
			assert(jointNetwork, 'jointNetwork is not defined');
			return updateNetworkModel({
				..._.omit(networkModel, 'name'), //Removing name from the object to prevent it from being overwritten
				...graphToNetworkModelData(jointNetwork.graph),
			});
		},
		{
			onSuccess: () => {
				invalidateNetworkModel();
				confirmationAlert(
					localize.operations.networkModel.update.complete({ networkModelName: networkModel.name })
				);
			},
		}
	);

	const changeNetworkNameMutation = useMutation<unknown, unknown, string>(
		(name) => {
			return changeNetworkName(networkModel._id, name);
		},
		{
			onSuccess: () => {
				confirmationAlert(
					localize.operations.networkModel.update.complete({ networkModelName: networkModel.name })
				);
			},
		}
	);

	useEffect(() => {
		if (!facilitiesQuery.isSuccess) return;
		setInitialCells(networkModelDataToGraph(networkModel, _.keyBy(facilitiesQuery.data, '_id')));
	}, [facilitiesQuery.data, facilitiesQuery.isSuccess, networkModel]);

	const handleSaveAs = async () => {
		assert(jointNetwork, 'jointNetwork is not defined');
		showCreateNetworkModelDialog({
			initialData: graphToNetworkModelData(jointNetwork.graph),
			taggingProp: getTaggingProp('carbonNetwork', 'saveAsNetwork'),
		});
	};

	const handleInvalidate = useCallback(() => {
		facilitiesQuery.invalidate();
		invalidateNetworkModel();
	}, [facilitiesQuery, invalidateNetworkModel]);

	return (
		<Diagram
			layerList={LAYERS}
			getNetworkFromGraph={(graph) => ({ ...networkModel, ...graphToNetworkModelData(graph) })}
			initialCells={initialCells}
			instance={jointNetwork}
			setInstance={setJointNetwork}
			afterEditingFacility={handleInvalidate}
			invalidateModel={handleInvalidate}
			isDirty={(graph) => {
				const currentNetworkModel = graphToNetworkModelData(graph);
				const savedNetworkModel = {
					nodes: networkModel.nodes,
					edges: networkModel.edges,
				};
				return (
					!_.isMatch(currentNetworkModel, savedNetworkModel) ||
					currentNetworkModel.nodes.length !== savedNetworkModel.nodes.length ||
					currentNetworkModel.edges.length !== savedNetworkModel.edges.length
				);
			}}
			saveModel={() => {
				updateNetworkModelMutation.mutate();
			}}
			getDropItemCell={(context) => {
				const item = context.item as DndItem;

				if (item.type === DndItemType.node) {
					if (item.nodeType !== NodeType.custom_calculation) {
						return DeviceNode.fromNode({
							name: NODES_PRESETS[item.nodeType].name,
							params: DEFAULT_NODE_DATA[item.nodeType],
							shape: {
								position: context.nodePosition,
							},
							type: item.nodeType,
						} as AnyNode);
					} else {
						return CustomCalculationNode.fromNode({
							name: NODES_PRESETS[item.nodeType].name,
							params: DEFAULT_NODE_DATA[item.nodeType],
							shape: {
								position: context.nodePosition,
							},
							type: item.nodeType,
						});
					}
				} else {
					const facility = _.keyBy(facilitiesQuery.data ?? [], '_id')[item.facility._id];
					assert(facility, 'expected facility');
					return FacilityNode.fromNode(
						{
							type: NodeType.facility,
							params: { facility_id: item.facility._id },
							shape: { position: context.nodePosition },
						},
						facility
					);
				}
			}}
			sidebar={
				<>
					<ModelTitle
						name={networkModel.name}
						label={localize.network.label()}
						onRename={(name) => changeNetworkNameMutation.mutateAsync(name)}
						isRenaming={changeNetworkNameMutation.isLoading}
					/>
					<TextField
						label='Search'
						variant='outlined'
						onChange={useDebounce((ev) => setSearch(ev.target.value))}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Icon fontSize='small'>{faSearch}</Icon>
								</InputAdornment>
							),
						}}
						size='small'
					/>
					{createNetworkModelDialog}
					<SidebarItemList title='Devices'>
						{filterSearch(NODES_TYPE_LIST, search, (type: string) => NODES_PRESETS[type].name).map(
							(type) => (
								<SidebarDeviceItem<DndItem>
									key={type}
									item={{ type: DndItemType.node, nodeType: type }}
									deviceInfo={{
										type,
										name: NODES_PRESETS[type].name,
										inputs: NODES_PRESETS[type].ports
											.filter((port) => INPUT_PORT_GROUPS.includes(port.portsGroup))
											.map((port) => port.stream),
										outputs: NODES_PRESETS[type].ports
											.filter((port) => OUTPUT_PORT_GROUPS.includes(port.portsGroup))
											.map((port) => port.stream),
									}}
									modelTitleLabel='Device'
								/>
							)
						)}
					</SidebarItemList>
					<SidebarItemList title='Facilities'>
						{facilitiesQuery.isSuccess &&
							filterSearch(
								facilitiesQuery.data,
								search,
								(facility: NetworkModelFacility) => facility.name
							).map((facility) => (
								<SidebarDeviceItem
									key={facility._id}
									item={{ type: 'facility', facility }}
									deviceInfo={{
										type: 'facility',
										name: facility.name,
										inputs: facility.inputs.length
											? facility.inputs.map((edge) => edge.by)
											: [Stream.link],
										outputs: facility.outputs.map((edge) => edge.by),
										count: facility.nodes.length,
									}}
									modelTitleLabel='Facility'
								/>
							))}
					</SidebarItemList>
					<SidebarActions>
						<Button
							color='secondary'
							variant='outlined'
							onClick={() => {
								updateNetworkModelMutation.mutate();
							}}
							disabled={updateNetworkModelMutation.isLoading || !jointNetwork}
							{...getTaggingProp('carbonNetwork', 'saveNetwork')}
						>
							Save
						</Button>
						<Button
							color='secondary'
							variant='contained'
							onClick={handleSaveAs}
							disabled={updateNetworkModelMutation.isLoading || !jointNetwork}
						>
							Save As
						</Button>
					</SidebarActions>
				</>
			}
		/>
	);
}

export default NetworkModelView;
