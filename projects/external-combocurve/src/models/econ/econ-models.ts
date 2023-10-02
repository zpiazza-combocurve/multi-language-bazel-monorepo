import { Document, Types } from 'mongoose';

import { ProductionTaxesKey } from '@src/models/econ/production-taxes';

import { DateSettingsKey } from './date-settings';
import { DepreciationKey } from './depreciation';
export { AssumptionSchema } from '../../schemas';
import { ActualForecastKey } from './actual-forecast';
import { CapexKey } from './capex';
import { DifferentialsKey } from './differentials';
import { EmissionKey } from './emissions';
import { EscalationKey } from './escalations';
import { ExpensesKey } from './expenses';
import { FluidModelKey } from './fluid-model';
import { GeneralOptionsKey } from './general-options';
import { OwnershipReversionKey } from './ownership-reversions';
import { PricingKey } from './pricing';
import { ReservesCategoryKey } from './reserves-categories';
import { RiskingKey } from './riskings';
import { StreamPropertiesKey } from './stream-properties';

export type EconModelKey =
	| CapexKey
	| DifferentialsKey
	| EmissionKey
	| EscalationKey
	| OwnershipReversionKey
	| PricingKey
	| ProductionTaxesKey
	| ReservesCategoryKey
	| ExpensesKey
	| StreamPropertiesKey
	| ActualForecastKey
	| RiskingKey
	| DateSettingsKey
	| DepreciationKey
	| ActualForecastKey
	| GeneralOptionsKey
	| RiskingKey
	| FluidModelKey;

export interface IBaseEconModel extends Document {
	_id: Types.ObjectId;
	assumptionKey: string;
	assumptionName: string;
	copiedFrom: Types.ObjectId | null;
	createdAt?: Date;
	createdBy?: Types.ObjectId;
	econ_function: Record<string, unknown>;
	lastUpdatedBy?: Types.ObjectId;
	name: string;
	options: Record<string, unknown>;
	project: Types.ObjectId;
	scenario?: Types.ObjectId;
	tags?: Types.ObjectId[];
	unique: boolean;
	updatedAt?: Date;
	well?: Types.ObjectId;
}
