import { NetworkShared } from '@combocurve/types/client';

// Time Series Input
export enum TimeSeriesTableOperations {
	CLEAR = 'CLEAR',
	ADD = 'ADD',
	DELETE_ROW = 'DELETE_ROW',
}

import TimeSeriesInputCommonCriteriaOptions = NetworkShared.TimeSeriesCriteria;
export { TimeSeriesInputCommonCriteriaOptions };

export type BasicEdgeFormFields = Pick<NetworkShared.Edge, 'name' | 'description'>;

/** Edge TSIs */

// Row Data Types
export interface StandardEdgeRowData {
	allocation: number;
	period: string | number;
}

// Inputs
export interface StandardEdgeTimeSeriesInput {
	criteria: TimeSeriesInputCommonCriteriaOptions;
	rows: StandardEdgeRowData[];
}

/** Node TSIs */

// Row Data Types
export type PneumaticPumpRowData = NetworkShared.RowDataByNodeTypeMap['pneumatic_pump'];
export type PneumaticDeviceRowData = NetworkShared.RowDataByNodeTypeMap['pneumatic_device'];
export type CentrifugalCompressorRowData = NetworkShared.RowDataByNodeTypeMap['centrifugal_compressor'];
export type ReciprocatingCompressorRowData = NetworkShared.RowDataByNodeTypeMap['reciprocating_compressor'];
export type DrillingRowData = NetworkShared.RowDataByNodeTypeMap['drilling'];
export type CompletionRowData = NetworkShared.RowDataByNodeTypeMap['completion'];
export type FlowbackRowData = NetworkShared.RowDataByNodeTypeMap['flowback'];
export type CombustionRowData = NetworkShared.RowDataByNodeTypeMap['combustion'];

/** List of nodes with time series data */
type TimeSeriesNodeTypes = {
	[K in keyof NetworkShared.NodeByTypeMap]: NetworkShared.NodeByTypeMap[K]['params'] extends { time_series: unknown }
		? K
		: never;
}[keyof NetworkShared.NodeByTypeMap];

// probably don't need this
export type NodeTimeSeries<T extends TimeSeriesNodeTypes> = NetworkShared.NodeByTypeMap[T]['params']['time_series'];
