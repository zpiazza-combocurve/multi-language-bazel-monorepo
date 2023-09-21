// Dummy comment to trigger CI
import * as joint from '@clientio/rappid';
import {
	faExpandArrowsAlt,
	faKeyboard,
	faList,
	faRedo,
	faSearchMinus,
	faSearchPlus,
	faSitemap,
	faUndo,
} from '@fortawesome/pro-regular-svg-icons';
import { Chip, Tooltip, emphasize } from '@material-ui/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styled, { css } from 'styled-components';

import { CTRL_OR_COMMAND_TEXT } from '@/components';
import { KeyboardShortcutsFloatingTooltip } from '@/components/KeyboardShortcutsButton';
import { useCallbackRef } from '@/components/hooks';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { Button, ButtonGroup, Divider, Icon, IconButton, Paper, alerts } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { useUnsavedWork } from '@/helpers/unsaved-work';
import { assert } from '@/helpers/utilities';

import ReactJointNew from '../../joint/ReactJoint';
import { ModelTitle } from '../ModelTitle';
import {
	CARBON_JOINTJS_CONFIG,
	CarbonJointJSService,
	JointCarbonExternalHandlers,
	PAPER_SCROLLER_MAX_ZOOM,
	PAPER_SCROLLER_MIN_ZOOM,
	PAPER_SCROLLER_ZOOM_UNIT,
} from '../joint/config';
import { AnyJointEdge, InputEdge, OutputEdge, StandardEdge } from '../joint/edges';
import { getNonOverlappingPosition, recenterAndRezoom } from '../joint/helpers';
import { AnyJointNode, CustomCalculationNode, FacilityNode } from '../joint/nodes';
import { BaseNode, getNodeTypeImageUrl } from '../joint/nodes/BaseNode';
import { DND_NETWORK_MODEL_TYPE } from '../shared';
import { STREAM_COLORS } from '../styles';
import { CustomCalculationNode as CustomCalculationNodeType, NetworkModel, Stream } from '../types';
import DiagramCorner from './DiagramCorner';
import DiagramLayerLegend, { Layer } from './DiagramLayerLegend';
import EditEdgeDialog from './EditEdgeDialog';
import EditFacilityDialog from './EditFacilityDialog';
import EditNodeDialog from './EditNodeDialog';

export const DATA_TESTID_NETWORK_MODEL_SIDEBAR = 'network-model-sidebar';

//+sidebar components
interface DeviceInfo {
	name: string;
	type: string;
	inputs: Stream[];
	outputs: Stream[];
	count?: number;
}

const IMAGE_SIZE = '38px';

const diagramToolbarTheme = css`
	.MuiButton-root.MuiButton-contained:not(.MuiButton-containedPrimary):not(.MuiButton-containedSecondary) {
		background-color: ${({ theme }) => theme.palette.background.opaque};
		&:not(.Mui-disabled) {
			color: ${({ theme }) => theme.palette.text.primary};
		}
	}
`;

export const DeviceImage = ({
	type,
	width = IMAGE_SIZE,
	height = IMAGE_SIZE,
}: {
	type: string;
	width?: string;
	height?: string;
}) => {
	const { theme } = useAlfa(['theme']);
	return <img width={width} height={height} src={getNodeTypeImageUrl(type, theme)} />;
};

export function ExtendedDeviceInfo(props: {
	deviceInfo: DeviceInfo;
	onRename?: (name: string) => Promise<void>;
	isRenaming?: boolean;
	modelTitleLabel?: string;
}) {
	const chip = (params: { label: string; streams: Stream[] }) => {
		const streamsWithCount = params.streams.reduce(
			(acc, stream) => ({ ...acc, [stream]: (acc[stream] || 0) + 1 }),
			{}
		);

		return (
			<Chip
				size='small'
				label={
					<div css='display: flex; flex-direction: row; align-items: center; gap: 4px; flex-wrap: wrap;'>
						{params.label}
						{params.streams.length
							? // TODO sort streams oil, gas, water
							  Object.keys(streamsWithCount).map((stream) => (
									<ColoredCircle
										key={stream}
										$color={STREAM_COLORS[stream]}
										$size='0.9rem'
										$disableMargin
									>
										{streamsWithCount[stream]}
									</ColoredCircle>
							  ))
							: ' N/A'}
					</div>
				}
			/>
		);
	};

	return (
		<div
			css={`
				display: flex;
				gap: ${({ theme }) => theme.spacing(1)}px;
				align-items: center;
			`}
		>
			<DeviceImage type={props.deviceInfo.type} />
			<Divider orientation='vertical' flexItem />
			<div
				css={`
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 10px;
				`}
			>
				<div
					css={`
						display: flex;
						align-items: center;
					`}
				>
					<span
						css={`
							width: 22ch;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						`}
						title={props.deviceInfo.name}
					>
						<ModelTitle
							name={props.deviceInfo.name}
							onRename={props.onRename}
							isRenaming={props.isRenaming ?? false}
							label={props.modelTitleLabel}
						/>
					</span>
					<div css='flex: 1;' />
					{props.deviceInfo.count != null && (
						<Chip size='small' label={props.deviceInfo.count} variant='outlined' />
					)}
				</div>
				<div
					css={`
						display: flex;
						gap: ${({ theme }) => theme.spacing(1)}px;
						flex-wrap: wrap;
					`}
				>
					{chip({ label: 'Inputs', streams: props.deviceInfo.inputs ?? [] })}
					{chip({ label: 'Outputs', streams: props.deviceInfo.outputs ?? [] })}
				</div>
			</div>
		</div>
	);
}

const SidebarItemContainer = styled.div`
	background-color: ${({ theme }) => theme.palette.background.opaque};
	border-radius: 4px;
	box-shadow: 0 0 2px;
	padding: ${({ theme }) => theme.spacing(0.5)}px;
`;

const SidebarItemListContext = createContext({ extended: false });

/** Container of list of draggable items */
export function SidebarItemList(props: { title: string; children?: React.ReactNode; disableLayoutButton?: boolean }) {
	const [extended, setExtended] = useState(false);

	return (
		<SidebarItemListContext.Provider value={useMemo(() => ({ extended }), [extended])}>
			<div
				css={`
					margin-top: ${({ theme }) => theme.spacing(3)}px;
				`}
			>
				<div
					css={`
						display: flex;
						align-items: center;
					`}
				>
					<div
						css={`
							color: ${({ theme }) => theme.palette.text.disabled};
						`}
					>
						{props.title}
					</div>

					<div css='flex: 1;' />

					{!props.disableLayoutButton && (
						<IconButton size='small' tooltipTitle='Toggle Layout' onClick={() => setExtended((p) => !p)}>
							{faList}
						</IconButton>
					)}
				</div>
				<Divider
					css={`
						margin: ${({ theme }) => theme.spacing(1, 0)};
					`}
				/>
				<div
					css={`
						// TODO use css grid
						display: flex;
						flex-wrap: wrap;
						align-items: center;
						align-content: center;
						gap: ${({ theme }) => theme.spacing(3)}px;
						& > * {
							${extended && 'flex: 1;'};
						}
					`}
				>
					{props.children}
				</div>
			</div>
		</SidebarItemListContext.Provider>
	);
}

/** Draggable Link item */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function SidebarEdgeItem<T = any>(props: { item: T; label: string; icon: React.ReactNode }) {
	const [, dragRef] = useDrag({
		type: DND_NETWORK_MODEL_TYPE,
		item: props.item,
	});

	return (
		<SidebarItemContainer
			css={`
				flex: 1;
				display: flex;
				gap: ${({ theme }) => theme.spacing(1)}px;
				align-items: center;
			`}
			ref={dragRef}
		>
			<Icon>{props.icon}</Icon>
			<Divider orientation='vertical' flexItem />
			<div>{props.label}</div>
		</SidebarItemContainer>
	);
}

/** Draggable item */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function SidebarDeviceItem<T = any>(props: { item: T; deviceInfo: DeviceInfo; modelTitleLabel?: string }) {
	const { extended } = useContext(SidebarItemListContext);

	const [, dragRef] = useDrag({
		type: DND_NETWORK_MODEL_TYPE,
		item: props.item,
	});

	if (extended) {
		return (
			<SidebarItemContainer ref={dragRef}>
				<ExtendedDeviceInfo deviceInfo={props.deviceInfo} modelTitleLabel={props.modelTitleLabel} />
			</SidebarItemContainer>
		);
	}

	return (
		<Tooltip title={props.deviceInfo.name} placement='top'>
			<SidebarItemContainer ref={dragRef}>
				<DeviceImage type={props.deviceInfo.type} />
			</SidebarItemContainer>
		</Tooltip>
	);
}

export function SidebarActions(props: { children: React.ReactNode }) {
	return (
		<>
			<div css='flex: 1;' />
			<Divider
				css={`
					margin: ${({ theme }) => theme.spacing(1, 0)};
				`}
			/>
			<div
				css={`
					display: flex;
					flex-direction: row;
					gap: ${({ theme }) => theme.spacing(1)}px;
				`}
			>
				<div css='flex: 1;' />
				{props.children}
			</div>
		</>
	);
}
//-sidebar components

interface Point {
	x: number;
	y: number;
}

interface DiagramProps {
	getNetworkFromGraph?: (graph: joint.dia.Graph) => NetworkModel;
	instance: CarbonJointJSService | null;
	setInstance(instance: CarbonJointJSService): void;
	initialCells: joint.dia.Cell[];
	invalidateModel: () => void;
	sidebar: React.ReactNode;
	getDropItemCell: (context: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		item: any;
		position: Point;
		nodePosition: Point;
	}) => AnyJointNode | AnyJointEdge;
	afterEditingFacility?: () => void;
	isDirty: (graph: joint.dia.Graph) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	saveModel?: any;
	layerList: Layer[];
	/** Required if showing the diagram inside a dialog */
	fixedHeight?: string;
}
export interface DiagramRef {
	graph: joint.dia.Graph;
	center: () => void;
}

/** Button without the extra padding or min-width, useful for contained icon buttons */
const FixedButton = styled(Button)`
	min-width: initial;
	padding: 6px; // see https://github.com/mui/material-ui/blob/v4.x/packages/material-ui/src/Button/Button.js#L15
`;

const JointNavigatorContainer = ({ navigator }: { navigator: joint.ui.Navigator }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;
		container.appendChild(navigator.el);
		navigator.render();
		return () => {
			container.removeChild(navigator.el);
		};
	}, [navigator]);
	return (
		<div
			ref={containerRef}
			css={`
				width: 200px;
				height: 100px;
				.joint-navigator {
					background: ${({ theme }) => theme.palette.background.opaque};
				}
				.joint-paper {
					box-shadow: none !important;
				}
			`}
		/>
	);
};

const ToggleButton = styled(FixedButton)<{ selected: boolean }>(
	({ theme, selected }) => `
&&&&& { // HACK to bump style priority
	background-color: ${selected ? emphasize(theme.palette.background.opaque, 0.3) : undefined};
}
`
);

function KeyboardShortcutButton() {
	const [visible, setVisible] = useState(false);

	const handleToggle = () => setVisible((p) => !p);
	return (
		<>
			<ToggleButton selected={visible} variant='contained' onClick={handleToggle}>
				<Icon>{faKeyboard}</Icon>
			</ToggleButton>
			<KeyboardShortcutsFloatingTooltip
				portal
				onToggle={handleToggle}
				visible={visible}
				blocks={[
					{
						blockTitle: 'General',
						blockItems: [
							{ itemLabel: 'Show/hide port names [Toggle]', key: 'q' },
							{ itemLabel: 'Select Nodes', key: 'Alt + Mouse Drag' },
							{ itemLabel: 'Deselect Nodes', key: 'Click on empty region' },
							{ itemLabel: 'Save Changes', key: `${CTRL_OR_COMMAND_TEXT} + s` },
							{ itemLabel: 'Zoom in', key: `${CTRL_OR_COMMAND_TEXT} + Arrow Up` },
							{ itemLabel: 'Zoom in (Mouse)', key: 'Wheel Up (Empty Region)' },
							{ itemLabel: 'Zoom out', key: `${CTRL_OR_COMMAND_TEXT} + Arrow Down` },
							{ itemLabel: 'Zoom out (Mouse)', key: 'Wheel Down (Empty Region)' },
							{ itemLabel: 'Reset Zoom', key: `${CTRL_OR_COMMAND_TEXT} + 0` },
						],
					},
					{
						blockTitle: 'After Selection',
						blockItems: [
							{ itemLabel: 'Copy', key: `${CTRL_OR_COMMAND_TEXT} + c` },
							{ itemLabel: 'Cut', key: `${CTRL_OR_COMMAND_TEXT} + x` },
							{ itemLabel: 'Paste', key: `${CTRL_OR_COMMAND_TEXT} + v` },
							{ itemLabel: 'Delete', key: 'Delete/Backspace' },
							{ itemLabel: 'Append to Selection', key: 'Alt + Click on Node' },
							{ itemLabel: 'Remove from Selection', key: 'Alt + Click on Node' },
						],
					},
				]}
			/>
		</>
	);
}

function Diagram(props: DiagramProps) {
	const {
		getNetworkFromGraph,
		sidebar,
		getDropItemCell,
		afterEditingFacility,
		saveModel,
		initialCells,
		instance,
		setInstance,
		isDirty,
		invalidateModel,
		layerList,
		fixedHeight,
	} = props;
	const [editNodeDialog, promptEditNodeDialog] = useDialog(EditNodeDialog);
	const [editEdgeDialog, promptEditEdgeDialog] = useDialog(EditEdgeDialog);
	const [editFacilityDialog, promptEditFacilityDialog] = useDialog(EditFacilityDialog);
	const [hasUndo, setHasUndo] = useState(false);
	const [hasRedo, setHasRedo] = useState(false);

	const graphLayout = useMemo(
		() =>
			instance
				? new joint.layout.TreeLayout({
						graph: instance.graph,
						parentGap: 200,
						siblingGap: 200,
				  })
				: null,
		[instance]
	);

	const [, dropRef] = useDrop({
		accept: DND_NETWORK_MODEL_TYPE,
		drop: (item, monitor) => {
			assert(instance, 'jointInstance is not defined');
			const { graph, paper } = instance;
			const offset = monitor.getClientOffset();
			assert(offset, 'expected client offset');

			const currentNodes = graph.getElements();

			const isInvalidOffset = offset.x == null || offset.y == null;
			// if it is invalid it is most likely comming from a test, use `0` as default values. // TODO investigate how to improve testing
			const position = isInvalidOffset ? { x: 100, y: 100 } : paper.clientToLocalPoint(offset.x, offset.y);

			const nodePosition = {
				x: position.x - BaseNode.SIZE / 2,
				y: position.y - BaseNode.SIZE / 2,
			};

			const newNode = getDropItemCell({ item, position, nodePosition });
			const nonOverlappingPosition = getNonOverlappingPosition(nodePosition, currentNodes);
			newNode.position(nonOverlappingPosition.x, nonOverlappingPosition.y);
			newNode.toFront();

			graph.addCell(newNode);
		},
	});

	const editNodeInfo = useCallbackRef(async (element: AnyJointNode) => {
		assert(instance, 'expected joint instance');

		instance.keyboardService.disable();

		const response = await promptEditNodeDialog({
			network: getNetworkFromGraph?.(instance.graph),
			node: element.toNode(),
		});
		instance.keyboardService.enable();
		if (response) {
			const { name, description, nodeModel, ...params } = response;
			element.setName(name);
			element.prop({ description, nodeModel });
			element.prop(
				'params',
				{
					...element.attributes.params,
					...params,
				},
				{ rewrite: true }
			);
			// Refresh ports if it is a custom calculation node
			if (element.attributes.nodeType === 'custom_calculation') {
				const existingPorts = element.getPorts();
				const newPorts = CustomCalculationNode.getPorts(element.toNode() as CustomCalculationNodeType);
				const portsToRemove = existingPorts.filter((port) => !newPorts.find((p) => p.id === port.id));
				const portsToAdd = newPorts.filter((port) => !existingPorts.find((p) => p.id === port.id));
				portsToRemove.forEach((port) => element.removePort(port));
				portsToAdd.forEach((port) => {
					element.addPort(port);
					if (instance.selection.collection.some((e) => e.id === element.id)) {
						element.movePortsOnSelection();
					}
				});
			}
		}
		invalidateModel();
	});

	const editEdgeInfo = useCallbackRef(async (linkView: joint.dia.LinkView) => {
		assert(instance, 'expected joint instance');

		const link = linkView.model as AnyJointEdge;
		const edge = link.toEdge();
		instance.keyboardService.disable();
		const response = await promptEditEdgeDialog({
			edge,
			type: link.attributes.edgeType,
		});
		instance.keyboardService.enable();
		if (!response) return;
		const { name, description, params } = response;

		link.prop({
			name,
			description,
		});
		link.prop(
			'params',
			{
				...link.attributes.params,
				...params,
			},
			{ rewrite: true }
		);
		if (link instanceof StandardEdge) {
			link.updateLabel();
		} else {
			const { name } = response;
			link.setName(name);
		}
	});

	const editFacility = useCallbackRef(async (node: FacilityNode) => {
		assert(instance, 'expected instance');
		if (isDirty(instance.graph)) {
			const confirmation = await alerts.confirm({
				title: 'Edit Facility',
				helperText: 'Editing the facility requires saving the Carbon Network beforehands. Continue?',
				confirmText: 'Save & Continue',
				cancelText: 'Cancel',
			});
			if (!confirmation) return;
			await saveModel();
		}
		instance.keyboardService.disable();
		const facilityId = node.attributes.params.facility_id;
		assert(facilityId, 'expected facility id');
		const response = await promptEditFacilityDialog({ facilityId, node: node.toNode() });
		instance.keyboardService.enable();
		if (!response) {
			// Facility name could be changed even if the facility isn't edited
			invalidateModel();
			return;
		}
		const { name, description, ...params } = response;
		node.prop({ name, description, params });
		if (!name) node.removeProp('name');
		if (!description) node.removeProp('description');
		if (afterEditingFacility) {
			afterEditingFacility();
		}
	});

	const handleAutoLayout = useCallback(() => {
		if (!instance || !graphLayout) return;
		instance.commandManager.initBatchCommand();
		const links = instance.graph.getLinks();
		const IOEdges = links.filter((link) => link instanceof InputEdge || link instanceof OutputEdge);

		// Temporarily remove I/O edges so that they don't affect the layout
		instance.graph.removeCells(IOEdges);

		// Add temp root for laying out the subgraphs and standalone nodes (nodes that are not connected to any other node)
		const rootNode = new joint.shapes.standard.Rectangle();

		const sources = instance.graph.getSources();

		// Group sources by standalone (not connected to any other node) and subgraph (source from a subgraph)
		const groupedSources = sources.reduce(
			(acc, source) => {
				const isSink = instance.graph.isSink(source);
				if (isSink) {
					acc.standalone.push(source);
				} else {
					acc['subgraph'].push(source);
				}
				return acc;
			},
			{ standalone: [], subgraph: [] } as { standalone: joint.dia.Element[]; subgraph: joint.dia.Element[] }
		);

		// All the temp nodes and links that are used for laying out the graph are stored here
		// they will be removed after the layout is done
		const cellsToAdd: joint.dia.Cell[] = [rootNode];

		// Subgraphs are connected to the temp root node
		groupedSources.subgraph.forEach((source) => {
			const tempLink = new joint.shapes.standard.Link({
				source: {
					id: rootNode.id,
				},
				target: {
					id: source.id,
				},
			});
			cellsToAdd.push(tempLink);
		});

		// First standalone node is connected to the temp root node,
		// while the rest are connected to the next standalone node
		groupedSources.standalone.forEach((source, idx) => {
			if (idx % 5 === 0) {
				const tempLink = new joint.shapes.standard.Link({
					source: {
						id: rootNode.id,
					},
					target: {
						id: source.id,
					},
				});
				cellsToAdd.push(tempLink);
			} else {
				const tempLink = new joint.shapes.standard.Link({
					source: {
						id: groupedSources.standalone[idx - 1].id,
					},
					target: {
						id: source.id,
					},
				});
				cellsToAdd.push(tempLink);
			}
		});
		instance.graph.addCells(cellsToAdd);

		graphLayout.layout();

		// Remove temp root node and links
		instance.graph.removeCells(cellsToAdd);

		// Center view on elements
		const center = instance.graph.getCellsBBox(instance.graph.getCells())?.center();
		if (center) {
			instance.paperScroller.center(center.x, center.y);
		} else {
			instance.paperScroller.center();
		}

		// Re-add I/O edges
		instance.graph.addCells(IOEdges);

		// Remove all vertices
		links.forEach((link) => {
			link.vertices([]);
		});

		// Keep count to prevent I/O edges from overlapping after layout
		const inputOffset = {};
		const outputOffset = {};

		// Re-add I/O edges and reposition them
		IOEdges.forEach((link) => {
			if (link instanceof InputEdge) {
				const target = link.getTargetElement();
				if (target) {
					inputOffset[target.id] = (inputOffset[target.id] ?? 0) + 1;
					link.set('source', {
						y: target.position().y + inputOffset[target.id] * 50,
						x: target.position().x - 200 - inputOffset[target.id] * 10,
					});
				}
			} else {
				const source = link.getSourceElement();
				if (source) {
					outputOffset[source.id] = (outputOffset[source.id] ?? 0) + 1;
					link.set('target', {
						y: source.position().y + outputOffset[source.id] * 50,
						x: source.position().x + 200 + outputOffset[source.id] * 10,
					});
				}
			}

			// Re-render the edges to update the positions
			link.findView(instance.paper).render();
		});
		instance.commandManager.storeBatchCommand();
	}, [graphLayout, instance]);

	useEffect(() => {
		if (instance) {
			instance.commandManager.on('stack', (_opt) => {
				setHasUndo(instance.commandManager.hasUndo());
				setHasRedo(instance.commandManager.hasRedo());
			});
		}
		return () => {
			instance?.commandManager.unbind('stack');
			setHasUndo(false);
			setHasRedo(false);
		};
	}, [instance]);

	// Memoize the ReactJoint instance to avoid infinite re-renders.
	const ReactJointMemo = useMemo(
		() => (
			<ReactJointNew<JointCarbonExternalHandlers, AnyJointNode>
				initialCells={initialCells}
				onInstanceInitialized={(instance) => {
					setInstance(instance);
					recenterAndRezoom(instance);
				}}
				config={CARBON_JOINTJS_CONFIG}
				externalHandlers={{
					onEditDevice: editNodeInfo,
					onEditFacility: editFacility,
					onEditEdge: editEdgeInfo,
				}}
			/>
		),
		[editNodeInfo, editFacility, editEdgeInfo, initialCells, setInstance]
	);

	useUnsavedWork(hasUndo);

	useEffect(() => {
		if (instance) {
			instance.keyboardService.addShortcut('ctrl+s', (evt: Event) => {
				evt.preventDefault();
				saveModel();
				return false;
			});
		}
	}, [instance, saveModel]);

	useEffect(() => {
		let lastInstance;
		if (instance) {
			lastInstance = instance;
		}
		return () => lastInstance?.keyboardService.destroy();
	}, [instance]);

	return (
		<div
			css={`
				width: 100%;
				height: ${fixedHeight ?? '100%'};
				display: flex;
				flex-direction: row;
			`}
		>
			{editNodeDialog}
			{editEdgeDialog}
			{editFacilityDialog}
			<Paper
				css={`
					flex: 1 1;
					min-width: 20rem;
					padding: ${({ theme }) => theme.spacing(3)}px;
					display: flex;
					flex-direction: column;
					gap: ${({ theme }) => theme.spacing(1)}px;
					height: 100%;
					overflow-y: auto;
				`}
				data-testid={DATA_TESTID_NETWORK_MODEL_SIDEBAR} // used for testing
			>
				{sidebar}
			</Paper>
			<div
				css={`
					position: relative;
					overflow: hidden;
					${diagramToolbarTheme}
				`}
				ref={dropRef}
			>
				{instance && (
					<>
						<DiagramCorner position={DiagramCorner.Position.topLeft}>
							<div
								css={`
									display: flex;
									gap: ${({ theme }) => theme.spacing(1)}px;
								`}
							>
								<ButtonGroup variant='contained'>
									<FixedButton onClick={() => instance.commandManager.undo()} disabled={!hasUndo}>
										<Icon>{faUndo}</Icon>
									</FixedButton>
									<FixedButton onClick={() => instance.commandManager.redo()} disabled={!hasRedo}>
										<Icon>{faRedo}</Icon>
									</FixedButton>
								</ButtonGroup>
								<FixedButton
									variant='contained'
									onClick={handleAutoLayout}
									tooltipTitle='Auto-layout Graph'
								>
									<Icon
										css={`
											transform: rotate(-90deg);
										`}
									>
										{faSitemap}
									</Icon>
								</FixedButton>
							</div>
						</DiagramCorner>

						<DiagramCorner position={DiagramCorner.Position.topRight}>
							<ButtonGroup variant='contained' orientation='vertical'>
								<FixedButton
									onClick={() => {
										instance.paperScroller.zoom(+PAPER_SCROLLER_ZOOM_UNIT, {
											max: PAPER_SCROLLER_MAX_ZOOM,
										});
									}}
									disabled={!instance}
								>
									<Icon>{faSearchPlus}</Icon>
								</FixedButton>
								<FixedButton
									onClick={() => {
										instance.paperScroller.zoom(-PAPER_SCROLLER_ZOOM_UNIT, {
											min: PAPER_SCROLLER_MIN_ZOOM,
										});
									}}
									disabled={!instance}
								>
									<Icon>{faSearchMinus}</Icon>
								</FixedButton>
								<FixedButton
									onClick={() => {
										recenterAndRezoom(instance);
									}}
									disabled={!instance}
								>
									<Icon>{faExpandArrowsAlt}</Icon>
								</FixedButton>
							</ButtonGroup>
							<KeyboardShortcutButton />
						</DiagramCorner>
						<DiagramCorner position={DiagramCorner.Position.bottomRight}>
							<DiagramLayerLegend graph={instance.graph} paper={instance.paper} layerList={layerList} />
							<JointNavigatorContainer navigator={instance.navigator} />
						</DiagramCorner>
					</>
				)}
				{ReactJointMemo}
			</div>
		</div>
	);
}

export default Diagram;
