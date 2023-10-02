import { cloneDeep } from 'lodash';

import { initInitialOwnership, initReversion } from '@src/api/v1/ownership-qualifiers/default-ownership-qualifier';

import { InitialOwnership, Reversion } from './ownership-qualifiers';
import { IBaseEconModel } from './econ-models';

export const OWNERSHIP_REVERSION_KEY = 'ownership_reversion';
export const OWNERSHIP_REVERSION_NAME = 'Ownership and Reversion';

export type OwnershipReversionKey = typeof OWNERSHIP_REVERSION_KEY;
type OwnershipReversionName = typeof OWNERSHIP_REVERSION_NAME;

export interface IOwnershipReversions extends IBaseEconModel {
	assumptionKey: OwnershipReversionKey;
	assumptionName: OwnershipReversionName;
	econ_function: {
		ownership: IOwnershipReversionEconFunction;
	};
}

export interface IOwnershipReversionEconFunction {
	initial_ownership: InitialOwnership;
	first_reversion: Reversion;
	second_reversion: Reversion;
	third_reversion: Reversion;
	fourth_reversion: Reversion;
	fifth_reversion: Reversion;
	sixth_reversion: Reversion;
	seventh_reversion: Reversion;
	eighth_reversion: Reversion;
	ninth_reversion: Reversion;
	tenth_reversion: Reversion;
}

export const defaultOwnershipReversionEconFunction = {
	initial_ownership: cloneDeep(initInitialOwnership),
	first_reversion: cloneDeep(initReversion),
	second_reversion: cloneDeep(initReversion),
	third_reversion: cloneDeep(initReversion),
	fourth_reversion: cloneDeep(initReversion),
	fifth_reversion: cloneDeep(initReversion),
	sixth_reversion: cloneDeep(initReversion),
	seventh_reversion: cloneDeep(initReversion),
	eighth_reversion: cloneDeep(initReversion),
	ninth_reversion: cloneDeep(initReversion),
	tenth_reversion: cloneDeep(initReversion),
};
