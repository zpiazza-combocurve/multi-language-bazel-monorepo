import type { ObjectId } from 'mongodb';

import type {
	CustomCalculationFormula,
	CustomCalculationInput,
	CustomCalculationOutput,
	EmissionType,
	NodeType,
	SelectedFormula,
	TimeSeriesCriteria,
} from './network-shared';
import type { RowDataByNodeTypeMap } from './network-shared-row-data';

interface BaseNode {
	id: string;
	type: string;
	params?: unknown;
	nodeModel?: ObjectId | null;
	name: string;
	description?: string;
	shape: { position: { x: number; y: number } };
}

export interface WellGroupNode extends BaseNode {
	type: NodeType.well_group;
	params: {
		wells: string[];
		fluid_model: string | null; // object id of selected fluid model
	};
}

export interface FlareNode extends BaseNode {
	type: NodeType.flare;
	params: {
		pct_flare_efficiency: number;
		pct_flare_unlit: number;
		fuel_hhv: {
			value: number;
			unit: string;
		};
	};
}

export interface OilTankNode extends BaseNode {
	type: NodeType.oil_tank;
	params: {
		output_gas_fluid_model: string | null;
		oil_to_gas_ratio: number;
	};
}

export interface AtmosphereNode extends BaseNode {
	type: NodeType.atmosphere;
	params: { emission_type: EmissionType };
}

export interface CaptureNode extends BaseNode {
	type: NodeType.capture;
	params: { emission_type: EmissionType };
}

export interface LiquidsUnloadingNode extends BaseNode {
	type: NodeType.liquids_unloading;
	params?: null;
}

export interface AssociatedGasNode extends BaseNode {
	type: NodeType.associated_gas;
	params?: null;
}

export interface EconOutputNode extends BaseNode {
	type: NodeType.econ_output;
	params?: null;
}

export interface FacilityNode extends BaseNode {
	type: NodeType.facility;
	params: {
		facility_id: string;
	};
}

export interface CombustionNode extends BaseNode {
	type: NodeType.combustion;
	params: {
		time_series: {
			criteria: TimeSeriesCriteria;
			fuel_type: string;
			assigning_mode: string;
			rows: RowDataByNodeTypeMap['combustion'][];
		};
	};
}

export interface PneumaticDeviceNode extends BaseNode {
	type: NodeType.pneumatic_device;
	params: {
		time_series: {
			criteria: TimeSeriesCriteria;
			rows: RowDataByNodeTypeMap['pneumatic_device'][];
		};
		fluid_model: string | null;
	};
}

export interface PneumaticPumpNode extends BaseNode {
	type: NodeType.pneumatic_pump;
	params: {
		time_series: {
			criteria: TimeSeriesCriteria;
			assigning_mode: string;
			rows: RowDataByNodeTypeMap['pneumatic_pump'][];
		};
		fluid_model: string | null;
	};
}

export interface CentrifugalCompressorNode extends BaseNode {
	type: NodeType.centrifugal_compressor;
	params: {
		time_series: {
			assigning_mode: string;
			criteria: TimeSeriesCriteria;
			rows: RowDataByNodeTypeMap['centrifugal_compressor'][];
		};
		fluid_model: string | null;
	};
}

export interface ReciprocatingCompressorNode extends BaseNode {
	type: NodeType.reciprocating_compressor;
	params: {
		time_series: {
			assigning_mode: string;
			criteria: TimeSeriesCriteria;
			rows: RowDataByNodeTypeMap['reciprocating_compressor'][];
		};
		fluid_model: string | null;
	};
}

export interface DrillingNode extends BaseNode {
	type: NodeType.drilling;
	params: {
		time_series: {
			fuel_type: string;
			rows: RowDataByNodeTypeMap['drilling'][];
		};
	};
}

export interface CompletionNode extends BaseNode {
	type: NodeType.completion;
	params: {
		time_series: {
			fuel_type: string;
			rows: RowDataByNodeTypeMap['completion'][];
		};
	};
}

export interface FlowbackNode extends BaseNode {
	type: NodeType.flowback;
	params: {
		time_series: {
			rows: RowDataByNodeTypeMap['flowback'][];
		};
	};
}

export interface CustomCalculationNode extends BaseNode {
	type: NodeType.custom_calculation;
	params: {
		inputs: CustomCalculationInput[];
		outputs: CustomCalculationOutput[];
		formula: CustomCalculationFormula;
		fluid_model: string | null;
		active_formula: SelectedFormula;
	};
}

export type NodeByTypeMap = {
	[NodeType.well_group]: WellGroupNode;
	[NodeType.flare]: FlareNode;
	[NodeType.oil_tank]: OilTankNode;
	[NodeType.liquids_unloading]: LiquidsUnloadingNode;
	[NodeType.associated_gas]: AssociatedGasNode;
	[NodeType.econ_output]: EconOutputNode;
	[NodeType.atmosphere]: AtmosphereNode;
	[NodeType.combustion]: CombustionNode;
	[NodeType.pneumatic_device]: PneumaticDeviceNode;
	[NodeType.pneumatic_pump]: PneumaticPumpNode;
	[NodeType.centrifugal_compressor]: CentrifugalCompressorNode;
	[NodeType.reciprocating_compressor]: ReciprocatingCompressorNode;
	[NodeType.facility]: FacilityNode;
	[NodeType.drilling]: DrillingNode;
	[NodeType.completion]: CompletionNode;
	[NodeType.capture]: CaptureNode;
	[NodeType.flowback]: FlowbackNode;
	[NodeType.custom_calculation]: CustomCalculationNode;
};

export type Node = NodeByTypeMap[NodeType];
