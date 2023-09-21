import type { Facility, Network, NodeModel, User } from '@combocurve/types/client';
import {
	EdgeByStreamMap,
	EmissionType,
	NodeType,
	NonDisplayedStream,
	PneumaticDeviceType,
	SelectedFormula,
	Stream,
	type Node as AnyNode,
	type Edge,
	type InputEdge,
	type NodeByTypeMap as NodeTypeNodeMap,
	type OutputEdge,
} from '@combocurve/types/client/network-shared';

export {
	EmissionType,
	NodeType,
	NonDisplayedStream,
	PneumaticDeviceType,
	SelectedFormula,
	Stream,
	Edge,
	InputEdge,
	OutputEdge,
	AnyNode,
	NodeTypeNodeMap,
};

export type NetworkModel = Network;

export type NetworkModelFacility = Facility;

// nodes sub types
export type WellGroupNode = NodeTypeNodeMap[NodeType.well_group];
export type FlareNode = NodeTypeNodeMap[NodeType.flare];
export type OilTankNode = NodeTypeNodeMap[NodeType.oil_tank];
export type LiquidsUnloadingNode = NodeTypeNodeMap[NodeType.liquids_unloading];
export type AssociatedGasNode = NodeTypeNodeMap[NodeType.associated_gas];
export type EconOutputNode = NodeTypeNodeMap[NodeType.econ_output];
export type AtmosphereNode = NodeTypeNodeMap[NodeType.atmosphere];
export type CombustionNode = NodeTypeNodeMap[NodeType.combustion];
export type PneumaticDeviceNode = NodeTypeNodeMap[NodeType.pneumatic_device];
export type PneumaticPumpNode = NodeTypeNodeMap[NodeType.pneumatic_pump];
export type CentrifugalCompressorNode = NodeTypeNodeMap[NodeType.centrifugal_compressor];
export type ReciprocatingCompressorNode = NodeTypeNodeMap[NodeType.reciprocating_compressor];
export type FacilityNode = NodeTypeNodeMap[NodeType.facility];
export type DrillingNode = NodeTypeNodeMap[NodeType.drilling];
export type CompletionNode = NodeTypeNodeMap[NodeType.completion];
export type CaptureNode = NodeTypeNodeMap[NodeType.capture];
export type FlowbackNode = NodeTypeNodeMap[NodeType.flowback];
export type CustomCalculationNode = NodeTypeNodeMap[NodeType.custom_calculation];

// edges types
export enum EdgeType {
	standard = 'standard',
	input = 'input',
	output = 'output',
	base = 'base',
	link = 'link',
	development = 'development',
}

export type AnyEdge = Edge | InputEdge | OutputEdge;
// edges sub types
export type StandardEdge = EdgeByStreamMap[Stream.oil];
export type LinkEdge = EdgeByStreamMap[Stream.link];
export type DevelopmentEdge = EdgeByStreamMap[Stream.development];

/** `{edge_type: AnyEdge}` dictionary */
export type EdgeTypeEdgeMap = {
	[EdgeType.base]: StandardEdge;
	[EdgeType.standard]: StandardEdge;
	[EdgeType.link]: LinkEdge;
	[EdgeType.input]: InputEdge;
	[EdgeType.output]: OutputEdge;
	[EdgeType.development]: DevelopmentEdge;
};

// others

export type CustomCalculationInput = Required<CustomCalculationNode>['params']['inputs'][number];
export type CustomCalculationOutput = Required<CustomCalculationNode>['params']['outputs'][number];
export type CustomCalculationFormula = Required<CustomCalculationNode>['params']['formula'];

export interface HandleInfo {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	args?: any;
	stream_type: Stream;
	id: string;
}

export enum DndItemType {
	inputEdge = 'input',
	outputEdge = 'output',
	node = 'node',
	facility = 'facility',
}

export interface NetworkModelModuleListItem {
	_id: string;
	name: string;
	createdBy: Pick<User, '_id' | 'firstName' | 'lastName'>;
	createdAt: string;
	project: { _id: string; name: string };
}

export interface FacilityModuleListItem {
	_id: string;
	name: string;
	createdBy: Inpt.User;
	project: { _id: string; name: string };
}

export interface NodeModelModuleListItem {
	_id: string;
	name: string;
	createdBy: Pick<User, '_id' | 'firstName' | 'lastName'>;
	createdAt: string;
	project: { _id: string; name: string };
	params: NodeModel['params'];
	description: string;
	type: NodeModel['type'];
}

export interface FuelType {
	fuel_phase: string;
	fuel_unit: string;
	display_unit: string;
	label: string;
}

// Edges
export type ValueOf<T> = T[keyof T];
export type PartialValueOf<T> = Partial<T[keyof T]>;

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? DeepPartial<U>[]
		: T[P] extends Readonly<infer U>[]
		? Readonly<DeepPartial<U>>[]
		: DeepPartial<T[P]>;
};
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
