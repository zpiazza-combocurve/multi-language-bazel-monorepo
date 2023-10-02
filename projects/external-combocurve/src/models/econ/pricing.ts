import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

export const Pricing_FREQUENCY = ['monthly', 'yearly', 'constant'] as const;
export const Pricing_CALCULATION_METHOD = ['simple', 'compound', 'constant'] as const;

export type PricingFrequency = (typeof Pricing_FREQUENCY)[number];
export type CalculationMethod = (typeof Pricing_CALCULATION_METHOD)[number];

export const Pricing_KEY = 'pricing';
export const Pricing_NAME = 'Pricing';

export type PricingKey = typeof Pricing_KEY;
type PricingName = typeof Pricing_NAME;

export interface IPricing extends IBaseEconModel {
	assumptionKey: PricingKey;
	assumptionName: PricingName;
	econ_function: {
		price_model: IPricingEconFunction;
		breakeven: IBreakeven;
	};
}

export interface IBreakeven {
	npv_discount: number;
	based_on_price_ratio: string;
	price_ratio: string;
}

export interface PricingType extends IRowField {
	cap: string | number;
	escalation_model: 'none' | string;
}
export interface IPricingEconFunction {
	oil: PricingType;
	gas: PricingType;
	ngl: PricingType;
	drip_condensate: PricingType;
}
