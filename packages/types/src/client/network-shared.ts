import type { Client } from '../helpers';
import {
	Edge as EdgeBase,
	EdgeByStreamMap as EdgeByStreamMapBase,
	EmissionType,
	InputEdge as InputEdgeBase,
	Node as NodeBase,
	NodeByTypeMap as NodeByTypeMapBase,
	NodeType,
	NonDisplayedStream,
	OutputEdge as OutputEdgeBase,
	PneumaticDeviceType,
	RowDataByNodeTypeMap as RowDataByNodeTypeMapBase,
	SelectedFormula,
	Stream,
	TimeSeriesCriteria,
} from '../schemas/network-shared';

export { Stream, NodeType, NonDisplayedStream, SelectedFormula, EmissionType, TimeSeriesCriteria, PneumaticDeviceType };

// nodes
export type Node = Client<NodeBase>;
export type NodeByTypeMap = Client<NodeByTypeMapBase>;

// edges
export type Edge = Client<EdgeBase>;
export type EdgeByStreamMap = Client<EdgeByStreamMapBase>;
export type InputEdge = Client<InputEdgeBase>;
export type OutputEdge = Client<OutputEdgeBase>;

// node data
export type RowDataByNodeTypeMap = Client<RowDataByNodeTypeMapBase>;
