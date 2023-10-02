/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { DailyProductionSchema } from '../schemas';

export interface IDailyProduction extends Document {
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
	hours_on: Array<number | null>;
	gas_lift_injection_pressure: Array<number | null>;
	bottom_hole_pressure: Array<number | null>;
	tubing_head_pressure: Array<number | null>;
	flowline_pressure: Array<number | null>;
	casing_head_pressure: Array<number | null>;
	operational_tag: Array<string | null>;
	vessel_separator_pressure: Array<number | null>;
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
