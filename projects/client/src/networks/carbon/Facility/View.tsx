import * as joint from '@clientio/rappid';
import { faArrowFromLeft, faArrowToRight } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, alerts } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { assert } from '@/helpers/utilities';

import Diagram, {
	ExtendedDeviceInfo,
	SidebarActions,
	SidebarDeviceItem,
	SidebarEdgeItem,
	SidebarItemList,
} from '../Diagram/Diagram';
import CreateFacilityDialog from '../ModuleList/CreateFacilityDialog';
import { changeFacilityName, updateFacility } from '../api';
import { InputEdge } from '../joint/edges/InputEdge';
import { OutputEdge } from '../joint/edges/OutputEdge';
import {
	graphConvertedFacilityData,
	graphToNetworkModelFacilityDataWithError,
	networkModelFacilityDataToGraph,
	useJointStore,
} from '../joint/helpers';
import { CustomCalculationNode } from '../joint/nodes';
import { DeviceNode } from '../joint/nodes/DeviceNode';
import { DEFAULT_NODE_DATA, INPUT_PORT_GROUPS, NODES_PRESETS, OUTPUT_PORT_GROUPS } from '../shared';
import { AnyNode, FacilityNode, NetworkModelFacility, NodeType, Stream } from '../types';

interface NetworkModelFacilityViewProps {
	networkModel: NetworkModelFacility;
	invalidateNetworkModel: () => Promise<void>;
	afterSave?: () => void;
	fixedHeight?: string;
}

const NODES_TYPE_LIST: Exclude<NodeType, 'facility' | 'well_group'>[] = [
	NodeType.atmosphere,
	NodeType.econ_output,
	NodeType.oil_tank,
	NodeType.flare,
	NodeType.liquids_unloading,
	NodeType.associated_gas,
	NodeType.combustion,
	NodeType.pneumatic_device,
	NodeType.pneumatic_pump,
	NodeType.centrifugal_compressor,
	NodeType.reciprocating_compressor,
	NodeType.custom_calculation,
];

const LAYERS = [
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
];

enum DndItemType {
	inputEdge = 'input',
	outputEdge = 'output',
	node = 'node',
}

type DndItem =
	| { type: DndItemType.inputEdge | DndItemType.outputEdge; nodeType?: undefined }
	| { type: DndItemType.node; nodeType: Exclude<NodeType, 'facility'> };

const showSaveNetworkConfirmationDialog = async (message: string) => {
	return await alerts.prompt({
		title: message,
		actions: [
			{ children: 'Cancel', value: false },
			{ children: 'Save', value: true, color: 'primary' },
		],
	});
};

function NetworkModelFacilityView(props: NetworkModelFacilityViewProps) {
	const { networkModel, invalidateNetworkModel, afterSave, fixedHeight } = props;
	const [jointFacility, setJointFacility] = useJointStore((state) => [state.jointFacility, state.setJointFacility]);
	const [initialCells, setInitialCells] = useState<joint.dia.Cell[]>([]);
	const [createFacilityDialog, showCreateFacilityDialog] = useDialog(CreateFacilityDialog);

	const updateFacilityMutation = useMutation(
		(facilityData: graphConvertedFacilityData) => {
			assert(jointFacility);
			return updateFacility({
				..._.omit(networkModel, 'name'), // Removing name from the object to prevent it from being overwritten
				...facilityData,
			});
		},
		{
			onSuccess: () => {
				afterSave?.();
				invalidateNetworkModel();
				confirmationAlert(
					localize.operations.networkModelFacility.update.complete({ facilityName: networkModel.name })
				);
			},
		}
	);

	const changeFacilityNameMutation = useMutation<void, unknown, string>(
		(name) => changeFacilityName(networkModel._id, name),
		{
			onSuccess: () => {
				confirmationAlert(
					localize.operations.networkModelFacility.update.complete({ facilityName: networkModel.name })
				);
			},
		}
	);

	const checkErrorAndGetFacilityData = useCallback(async () => {
		assert(jointFacility, 'jointFacility is not defined');
		const [facilityData, error] = graphToNetworkModelFacilityDataWithError(jointFacility.graph);
		let continueToSave = true;
		if (error) {
			continueToSave = await showSaveNetworkConfirmationDialog(error);
		}

		return { facilityData, continueToSave };
	}, [jointFacility]);

	const handleSave = async () => {
		const { facilityData, continueToSave } = await checkErrorAndGetFacilityData();
		if (continueToSave) {
			updateFacilityMutation.mutate(facilityData);
		}
	};

	const handleSaveAs = async () => {
		const { facilityData, continueToSave } = await checkErrorAndGetFacilityData();
		if (continueToSave) {
			showCreateFacilityDialog({
				initialData: facilityData,
				taggingProp: getTaggingProp('carbonNetwork', 'saveAsFacility'),
			});
		}
	};

	useEffect(() => {
		setInitialCells(networkModelFacilityDataToGraph(networkModel));
	}, [networkModel]);

	return (
		<Diagram
			layerList={LAYERS}
			fixedHeight={fixedHeight}
			initialCells={initialCells}
			instance={jointFacility}
			setInstance={setJointFacility}
			invalidateModel={invalidateNetworkModel}
			isDirty={(graph) => {
				const [facilityData, error] = graphToNetworkModelFacilityDataWithError(graph);
				return (
					!!error ||
					!_.isMatch(facilityData, {
						inputs: networkModel.inputs,
						outputs: networkModel.outputs,
						nodes: networkModel.nodes,
						edges: networkModel.edges,
					})
				);
			}}
			saveModel={() => handleSave()}
			getDropItemCell={(context) => {
				const item = context.item as DndItem;
				if (item.type === DndItemType.node) {
					if (item.nodeType !== 'custom_calculation') {
						return DeviceNode.fromNode({
							type: item.nodeType,
							params: DEFAULT_NODE_DATA[item.nodeType],
							shape: { position: context.nodePosition },
							name: NODES_PRESETS[item.nodeType].name,
						} as Exclude<AnyNode, FacilityNode>);
					} else {
						return CustomCalculationNode.fromNode(
							{
								type: item.nodeType,
								params: DEFAULT_NODE_DATA[item.nodeType],
								shape: { position: context.nodePosition },
								name: NODES_PRESETS[item.nodeType].name,
							},
							{
								skipPorts: [Stream.link],
							}
						);
					}
				}
				if (item.type === DndItemType.inputEdge) {
					return new InputEdge({
						source: context.position,
						target: new joint.g.Point(context.position).offset(200, 0),
					});
				}
				return new OutputEdge({
					source: context.position,
					target: new joint.g.Point(context.position).offset(200, 0),
				});
			}}
			sidebar={
				<>
					<ExtendedDeviceInfo
						deviceInfo={{
							name: networkModel.name,
							type: 'facility',
							inputs: networkModel.inputs.map((edge) => edge.by),
							outputs: networkModel.outputs.map((edge) => edge.by),
							count: networkModel.nodes.length,
						}}
						onRename={(name) => changeFacilityNameMutation.mutateAsync(name)}
						isRenaming={changeFacilityNameMutation.isLoading}
						modelTitleLabel='Facility'
					/>
					<SidebarItemList title='Edges' disableLayoutButton>
						<SidebarEdgeItem<DndItem>
							item={{ type: DndItemType.inputEdge }}
							label='Input'
							icon={faArrowToRight}
						/>
						<SidebarEdgeItem<DndItem>
							item={{ type: DndItemType.outputEdge }}
							label='Output'
							icon={faArrowFromLeft}
						/>
					</SidebarItemList>
					{createFacilityDialog}
					<SidebarItemList title='Devices'>
						{NODES_TYPE_LIST.map((type) => (
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
						))}
					</SidebarItemList>
					<SidebarActions>
						<Button
							color='secondary'
							variant='contained'
							onClick={() => handleSave()}
							disabled={updateFacilityMutation.isLoading}
						>
							Save Facility
						</Button>
						<Button
							color='secondary'
							variant='contained'
							onClick={handleSaveAs}
							disabled={updateFacilityMutation.isLoading || !jointFacility}
						>
							Save As
						</Button>
					</SidebarActions>
				</>
			}
		/>
	);
}

export default NetworkModelFacilityView;
