/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { MonthlyProductionSchema } from '../schemas';

export interface IMonthlyProduction extends Document {
	_id: Types.ObjectId;
	project?: Types.ObjectId | null;
	well: Types.ObjectId;
	chosenID?: unknown;
	createdAt?: Date;
	startIndex: number;
	updatedAt?: Date;

	index: Array<number | null>;
	oil: Array<number | null>;
	gas: Array<number | null>;
	choke: Array<number | null>;
	water: Array<number | null>;
	days_on: Array<number | null>;
	operationalTag: Array<string | null>;
	gasInjection?: Array<number | null>;
	waterInjection?: Array<number | null>;
	co2Injection?: Array<number | null>;
	steamInjection?: Array<number | null>;
	ngl?: Array<number | null>;
	customNumber0?: Array<number | null>;
	customNumber1?: Array<number | null>;
	customNumber2?: Array<number | null>;
	customNumber3?: Array<number | null>;
	customNumber4?: Array<number | null>;
}
