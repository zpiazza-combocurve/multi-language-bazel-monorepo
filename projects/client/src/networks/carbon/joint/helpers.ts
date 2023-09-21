import * as joint from '@clientio/rappid';
import { create } from 'zustand';

import { assert } from '@/helpers/utilities';

import {
	AnyEdge,
	DevelopmentEdge as DevelopmentEdgeType,
	Edge as EdgeType,
	InputEdge as InputEdgeType,
	LinkEdge as LinkEdgeType,
	NetworkModel,
	NetworkModelFacility,
	OutputEdge as OutputEdgeType,
	StandardEdge as StandardEdgeType,
	Stream,
} from '../types';
import { CarbonJointJSService, PAPER_SCROLLER_MAX_ZOOM, PAPER_SCROLLER_MIN_ZOOM } from './config';
import { AnyJointEdge, JointEdge } from './edges';
import { BaseEdge } from './edges/BaseEdge';
import { DevelopmentEdge } from './edges/DevelopmentEdge';
import { InputEdge } from './edges/InputEdge';
import { LinkEdge } from './edges/LinkEdge';
import { OutputEdge } from './edges/OutputEdge';
import { StandardEdge } from './edges/StandardEdge';
import { AnyJointNode } from './nodes';
import { BaseNode } from './nodes/BaseNode';
import CustomCalculationNode from './nodes/CustomCalculationNode';
import { DeviceNode } from './nodes/DeviceNode';
import { FacilityNode } from './nodes/FacilityNode';

export type graphConvertedFacilityData = Pick<NetworkModelFacility, 'edges' | 'nodes' | 'inputs' | 'outputs'>;
const OVERLAP_RANGE = 10;

export function graphToNetworkModelFacilityDataWithError(
	graph: joint.dia.Graph
): [facilityData: graphConvertedFacilityData, error: null | string] {
	const nodes = graph
		.getElements()
		.map((element) => (element as AnyJointNode).toNode()) as NetworkModelFacility['nodes'];
	const edges: EdgeType[] = [];
	const inputs: InputEdgeType[] = [];
	const outputs: OutputEdgeType[] = [];
	let error: null | string = null;
	for (const link of graph.getLinks() as AnyJointEdge[]) {
		if (link instanceof StandardEdge || link instanceof DevelopmentEdge) {
			edges.push(link.toEdge());
		} else if (link instanceof InputEdge && link.isValid()) {
			inputs.push(link.toEdge());
		} else if (link instanceof OutputEdge && link.isValid()) {
			outputs.push(link.toEdge());
		} else {
			error = 'Unattached edges will be removed upon saving.';
		}
	}
	return [{ nodes, edges, inputs, outputs }, error];
}

export function graphToNetworkModelData(graph: joint.dia.Graph): Pick<NetworkModel, 'edges' | 'nodes'> {
	const nodes = graph.getElements().map((element) => (element as AnyJointNode).toNode());
	const edges = graph.getLinks().map((link) => (link as JointEdge).toEdge());
	return {
		nodes,
		edges,
	};
}

function isInOverlappingRange(position: joint.g.PlainPoint, otherPosition: joint.g.PlainPoint) {
	return (
		Math.abs(position.x - otherPosition.x) < OVERLAP_RANGE && Math.abs(position.y - otherPosition.y) < OVERLAP_RANGE
	);
}
export function getNonOverlappingPosition(position: joint.g.PlainPoint, otherNodes: joint.dia.Element[]) {
	if (otherNodes.some((element) => isInOverlappingRange(position, element.position()))) {
		return getNonOverlappingPosition({ x: position.x + OVERLAP_RANGE, y: position.y + OVERLAP_RANGE }, otherNodes);
	}
	return position;
}

/**
 * Allows for the creation of a new edge based on the stream type.
 *
 * @param edgeOrStreamType If an `Stream` is passed, a new edge will be returned (type matched by stream). If an object
 *   of type `AnyEdge` is passed, a new edge with the provided data will be returned.
 */
export function createLinkByStreamType(edgeOrStreamType: AnyEdge | Stream): AnyJointEdge {
	const stream: Stream = (typeof edgeOrStreamType === 'string' ? edgeOrStreamType : edgeOrStreamType.by) as Stream;
	const edge = typeof edgeOrStreamType === 'string' ? undefined : edgeOrStreamType;
	switch (stream) {
		case Stream.oil:
		case Stream.gas:
		case Stream.water:
			return edge ? StandardEdge.fromEdge(edge as StandardEdgeType) : new StandardEdge({ stream_type: stream });
		case Stream.development:
			return edge
				? DevelopmentEdge.fromEdge(edge as DevelopmentEdgeType)
				: new DevelopmentEdge({ stream_type: stream });
		case Stream.link:
			return edge ? LinkEdge.fromEdge(edge as LinkEdgeType) : new LinkEdge({ stream_type: stream });
		default:
			throw new Error(`Unknown edge type ${edgeOrStreamType}`);
	}
}

export function networkModelDataToGraph(
	networkModel: NetworkModel,
	facilitiesRecord: Record<string, NetworkModelFacility>
): joint.dia.Cell[] {
	const cells = [
		...networkModel.nodes.map((node) => {
			switch (node.type) {
				case 'facility':
					assert(node.params?.facility_id, 'Facility node must have a facility_id');
					return FacilityNode.fromNode(node, facilitiesRecord[node.params.facility_id]);
				case 'custom_calculation':
					return CustomCalculationNode.fromNode(node);
				default:
					return DeviceNode.fromNode(node);
			}
		}),
		...networkModel.edges.map((edge) => createLinkByStreamType(edge)),
	];
	return cells;
}

export function networkModelFacilityDataToGraph(networkModel: NetworkModelFacility): joint.dia.Cell[] {
	return [
		...networkModel.nodes.map((node) => {
			if (node.type !== 'custom_calculation') {
				return DeviceNode.fromNode(node);
			} else {
				return CustomCalculationNode.fromNode(node, {
					skipPorts: [Stream.link],
				});
			}
		}),
		...networkModel.edges.map((edge) => StandardEdge.fromEdge(edge as StandardEdgeType)),
		...networkModel.inputs.map((edge) => InputEdge.fromEdge(edge as InputEdgeType)),
		...networkModel.outputs.map((edge) => OutputEdge.fromEdge(edge as OutputEdgeType)),
	];
}

export const createNodeInfoButton = (onClick: (elementView: AnyJointNode) => Promise<void>) =>
	new joint.elementTools.Button({
		focusOpacity: 0.5,
		// top-right corner
		x: '25%',
		y: '0%',
		action: (_evt, view) => onClick(view.model as AnyJointNode),
		markup: [
			{
				tagName: 'circle',
				selector: 'button',
				attributes: {
					r: 7,
					fill: '#001DFF',
					cursor: 'pointer',
				},
			},
			{
				tagName: 'path',
				selector: 'icon',
				attributes: {
					d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
					fill: 'none',
					stroke: '#FFFFFF',
					'stroke-width': 2,
					'pointer-events': 'none',
				},
			},
		],
	});

export const createEdgeInfoButton = (onClick: (linkView: joint.dia.LinkView) => void) =>
	new joint.linkTools.Button({
		focusOpacity: 0.5,
		distance: 30,
		action: (_evt, view) => onClick(view),
		markup: [
			{
				tagName: 'circle',
				selector: 'button',
				attributes: {
					r: 7,
					fill: '#001DFF',
					cursor: 'pointer',
				},
			},
			{
				tagName: 'path',
				selector: 'icon',
				attributes: {
					d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
					fill: 'none',
					stroke: '#FFFFFF',
					'stroke-width': 2,
					'pointer-events': 'none',
				},
			},
		],
	});

export function recenterAndRezoom(instance: CarbonJointJSService) {
	const contentRect = instance.graph.getCellsBBox(instance.graph.getCells());
	const center = contentRect?.center();
	if (center) {
		instance.paperScroller.center(center.x, center.y);
	} else {
		instance.paperScroller.center();
	}
	if (contentRect) {
		instance.paperScroller.zoomToRect(contentRect, {
			padding: 200,
			minScale: PAPER_SCROLLER_MIN_ZOOM,
			maxScale: PAPER_SCROLLER_MAX_ZOOM,
		});
	}
}

export const updatedJointShapes = {
	...joint.shapes,
	nodes: {
		Base: BaseNode,
		Device: DeviceNode,
		Facility: FacilityNode,
		CustomCalculation: CustomCalculationNode,
	},
	edges: {
		Base: BaseEdge,
		Allocation: StandardEdge,
		Input: InputEdge,
		Output: OutputEdge,
		Link: LinkEdge,
		Development: DevelopmentEdge,
	},
};

export interface JointStore {
	jointNetwork: CarbonJointJSService | null;
	setJointNetwork: (jointInstance: CarbonJointJSService | null) => void;
	jointFacility: CarbonJointJSService | null;
	setJointFacility: (jointInstance: CarbonJointJSService | null) => void;
}

export const useJointStore = create<JointStore>((set) => ({
	jointNetwork: null,
	setJointNetwork: (jointInstance: CarbonJointJSService | null) => set(() => ({ jointNetwork: jointInstance })),
	jointFacility: null,
	setJointFacility: (jointInstance: CarbonJointJSService | null) => set(() => ({ jointFacility: jointInstance })),
}));
