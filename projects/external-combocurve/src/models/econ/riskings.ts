import { IRiskingShutInRows } from '@src/api/v1/projects/econ-models/riskings/fields/shut-in-rows';
import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

export const RISKING_KEY = 'risking';
export const RISKING_NAME = 'Risking';

export type RiskingKey = typeof RISKING_KEY;
type RiskingName = typeof RISKING_NAME;

export interface IRisking extends IBaseEconModel {
	assumptionKey: RiskingKey;
	assumptionName: RiskingName;
	econ_function: {
		risking_model: IRiskingEconFunction;
		shutIn: IRiskingShutInRows;
	};
}

export interface IRiskingEconFunction {
	risk_prod: string;
	risk_ngl_drip_cond_via_gas_risk: string;
	oil: IRowField;
	gas: IRowField;
	ngl: IRowField;
	drip_condensate: IRowField;
	water: IRowField;
	well_stream: IRowField;
}

export const defaultRiskingEconFunction: IRowField = {
	rows: [
		{
			entire_well_life: 'Flat',
			multiplier: 100,
		},
	],
};
