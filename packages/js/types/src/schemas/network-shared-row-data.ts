import type { NodeType, PneumaticDeviceType } from './network-shared';

interface TimeSeriesInputRowData {
	period: string | number;
}

interface PneumaticPumpRowData extends TimeSeriesInputRowData {
	count: number;
	runtime: number;
}

interface PneumaticDeviceRowData extends PneumaticPumpRowData {
	device_type: PneumaticDeviceType;
}

interface CentrifugalCompressorRowData extends TimeSeriesInputRowData {
	count: number;
	runtime: number;
}

interface DrillingRowData {
	start_date_window: string;
	consumption_rate: number;
	start_criteria: string;
	start_criteria_option: string | null;
	start_value: number | null;
	end_criteria: string;
	end_criteria_option: string | null;
	end_value: number | null;
}

type CompletionRowData = DrillingRowData;

interface FlowbackRowData {
	flowback_rate: number;
	start_date_window: string;
	start_criteria: string;
	start_criteria_option: string | null;
	start_value: number | null;
	end_criteria: string;
	end_criteria_option: string | null;
	end_value: number | null;
}

type ReciprocatingCompressorRowData = CentrifugalCompressorRowData;

interface CombustionRowData extends TimeSeriesInputRowData {
	consumption_rate: number;
}

/**
 * @example
 * 	const combustionRowData: RowDataByNodeTypeMap[NodeType.combustion];
 */
export type RowDataByNodeTypeMap = {
	[NodeType.centrifugal_compressor]: CentrifugalCompressorRowData;
	[NodeType.combustion]: CombustionRowData;
	[NodeType.completion]: CompletionRowData;
	[NodeType.drilling]: DrillingRowData;
	[NodeType.flowback]: FlowbackRowData;
	[NodeType.pneumatic_device]: PneumaticDeviceRowData;
	[NodeType.pneumatic_pump]: PneumaticPumpRowData;
	[NodeType.reciprocating_compressor]: ReciprocatingCompressorRowData;
};
