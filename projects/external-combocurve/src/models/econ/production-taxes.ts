import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { Calculation, RateTypes, YesNo } from './shared';
import { IBaseEconModel } from './econ-models';

export const PRODUCTION_TAXES_SEVERANCE_TAX_STATES = [
	'custom',
	'alaska',
	'alabama',
	'arkansas',
	'arizona',
	'california',
	'colorado',
	'florida',
	'idaho',
	'indiana',
	'kansas',
	'kentucky',
	'louisiana',
	'maryland',
	'michigan',
	'mississippi',
	'montana',
	'north_dakota',
	'nebraska',
	'new_mexico',
	'nevada',
	'new_york',
	'ohio',
	'oklahoma',
	'oregon',
	'pennsylvania',
	'pennsylvania horizontal',
	'pennsylvania vertical',
	'south_dakota',
	'tennessee',
	'texas',
	'utah',
	'virginia',
	'west_virginia',
	'wyoming',
];

export type ProductionSeveranceTaxStatesMethod = (typeof PRODUCTION_TAXES_SEVERANCE_TAX_STATES)[number];

export const ProductionTaxes_KEY = 'production_taxes';
export const ProductionTaxes_NAME = 'Production Taxes';

export type ProductionTaxesKey = typeof ProductionTaxes_KEY;
type ProductionTaxesName = typeof ProductionTaxes_NAME;

export interface IProductionTaxes extends IBaseEconModel {
	assumptionKey: ProductionTaxesKey;
	assumptionName: ProductionTaxesName;
	econ_function: {
		ad_valorem_tax: IAdValoremTaxEconFunction;
		severance_tax: ISeveranceTaxEconFunction;
	};
}

export interface IEscalationModelRow extends IRowField {
	escalation_model: EscalationModelObject;
}

export interface EscalationModelObject {
	escalation_model_1: 'none' | string;
	escalation_model_2: 'none' | string;
}

export interface IAdValoremTaxEconFunction extends IEscalationModelRow {
	deduct_severance_tax: YesNo | string;
	shrinkage_condition: 'shrunk' | 'unshrunk' | string;
	calculation: Calculation | string;
	rate_type: RateTypes | string;
	rows_calculation_method: 'monotonic' | 'non_monotonic' | string;
}

export interface ISeveranceTaxTaxesPhases {
	oil: IEscalationModelRow;
	gas: IEscalationModelRow;
	ngl: IEscalationModelRow;
	drip_condensate: IEscalationModelRow;
}

export interface ISeveranceTaxEconFunction extends ISeveranceTaxTaxesPhases {
	state: 'custom' | string;
	auto_calculation: string | number;
	shrinkage_condition: 'shrunk' | 'unshrunk' | string;
	calculation: Calculation | string;
	rate_type: RateTypes | string;
	rows_calculation_method: 'monotonic' | 'non_monotonic' | string;
}
