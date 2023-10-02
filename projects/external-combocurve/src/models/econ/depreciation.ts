import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';
import { YesNo } from './shared';

export const Depreciation_KEY = 'depreciation';
export const Depreciation_NAME = 'Depreciation';

export type DepreciationKey = typeof Depreciation_KEY;
type DepreciationName = typeof Depreciation_NAME;

export interface IDepreciation extends IBaseEconModel {
	assumptionKey: DepreciationKey;
	assumptionName: DepreciationName;
	econ_function: {
		depreciation_model: IDepreciationEconFunction;
	};
}

type DepletionModel = 'unit_of_production_major' | 'unit_of_production_BOE' | 'ecl' | 'fpd' | 'never';

export interface IDepreciationRows {
	rows: IDepreciationRowObject[];
}

export interface IDepreciationRowObject {
	year: number;
	tan_factor: number;
	tan_cumulative: number;
	intan_factor: number;
	intan_cumulative: number;
}
export interface IDepreciationEconFunction {
	depreciation_or_depletion: 'depreciation' | 'depletion' | string;
	prebuilt: 'custom';
	tax_credit: number;
	tcja_bonus: YesNo | string;
	tangible_immediate_depletion: number;
	intangible_immediate_depletion: number;
	tangible_depletion_model: DepletionModel | string;
	intangible_depletion_model: DepletionModel | string;
	bonus_depreciation: IRowField;
	depreciation: IDepreciationRows;
}
