import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

const RATE_TYPE = ['gross_well_head'] as const;
type RateType = (typeof RATE_TYPE)[number];

export const ROWS_CALCULATION_METHOD = ['monotonic', 'non_monotonic'] as const;
type RowsCalculationMethod = (typeof ROWS_CALCULATION_METHOD)[number];

export const STREAM_PROPERTIES_KEY = 'stream_properties';
export const STREAM_PROPERTIES_NAME = 'Stream Properties';

export type StreamPropertiesKey = typeof STREAM_PROPERTIES_KEY;
type StreamPropertiesName = typeof STREAM_PROPERTIES_NAME;

export interface IStreamProperties extends IBaseEconModel {
	assumptionKey: StreamPropertiesKey;
	assumptionName: StreamPropertiesName;
	econ_function: {
		yields: IYieldsEconFunction;
		shrinkage: IShrinkageEconFunction;
		loss_flare: ILossFlareEconFunction;
		btu_content: IBtuContentEconFunction;
	};
}

export interface IYieldsEconFunction {
	rate_type: RateType;
	rows_calculation_method: RowsCalculationMethod;
	ngl: IRowField;
	drip_condensate: IRowField;
	saved_from_standard_view: boolean;
}

export interface IShrinkageEconFunction {
	rate_type: RateType;
	rows_calculation_method: RowsCalculationMethod;
	oil: IRowField;
	gas: IRowField;
	saved_from_standard_view: boolean;
}

export interface ILossFlareEconFunction {
	rate_type: RateType;
	rows_calculation_method: RowsCalculationMethod;
	oil_loss: IRowField;
	gas_loss: IRowField;
	gas_flare: IRowField;
	saved_from_standard_view: boolean;
}

export interface IBtuContentEconFunction {
	unshrunk_gas: number;
	shrunk_gas: number;
	saved_from_standard_view: boolean;
}
