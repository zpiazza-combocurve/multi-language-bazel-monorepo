import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

export const DIFFERENTIALS_KEY = 'differentials';
export const DIFFERENTIALS_NAME = 'Differentials';

export type DifferentialsKey = typeof DIFFERENTIALS_KEY;
type DifferentialsName = typeof DIFFERENTIALS_NAME;

export interface IDifferentials extends IBaseEconModel {
	assumptionKey: DifferentialsKey;
	assumptionName: DifferentialsName;
	econ_function: {
		differentials: IDifferentialsEconFunction;
	};
}

export interface IDifferentialsEconFunction {
	differentials_1: IPhaseGroup;
	differentials_2: IPhaseGroup;
	differentials_3: IPhaseGroup;
}

export interface IPhaseGroup {
	oil: IPhaseFields;
	gas: IPhaseFields;
	ngl: IPhaseFields;
	drip_condensate: IPhaseFields;
}

export interface IPhaseFields extends IRowField {
	escalation_model: 'none' | string;
}
