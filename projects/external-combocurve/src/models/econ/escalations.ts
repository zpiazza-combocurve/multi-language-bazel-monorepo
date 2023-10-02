import { IRowField } from '@src/api/v1/projects/econ-models/row-fields/econ-function-row-fields';

import { IBaseEconModel } from './econ-models';

export const ESCALATION_FREQUENCY = ['monthly', 'yearly', 'constant'] as const;
export const ESCALATION_CALCULATION_METHOD = ['simple', 'compound', 'constant'] as const;

export type EscalationFrequency = (typeof ESCALATION_FREQUENCY)[number];
export type CalculationMethod = (typeof ESCALATION_CALCULATION_METHOD)[number];

export const ESCALATION_KEY = 'escalation';
export const ESCALATION_NAME = 'Escalation';

export type EscalationKey = typeof ESCALATION_KEY;
type EscalationName = typeof ESCALATION_NAME;

export interface IEscalation extends IBaseEconModel {
	assumptionKey: EscalationKey;
	assumptionName: EscalationName;
	econ_function: {
		escalation_model: IEscalationEconFunction;
	};
}

export interface IEscalationEconFunction extends IRowField {
	escalation_frequency: EscalationFrequency;
	calculation_method: CalculationMethod;
}

export const defaultEscalationEconFunction: IEscalationEconFunction = {
	rows: [
		{
			entire_well_life: 'Flat',
			pct_per_year: 0,
		},
	],
	escalation_frequency: 'monthly',
	calculation_method: 'compound',
};
