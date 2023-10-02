/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';

import { ITag } from './tags';
export { ForecastSchema } from '../schemas';

export const VISIBILITY = ['user', 'project', 'company'] as const;

export type Visibility = (typeof VISIBILITY)[number];

export const FORECAST_TYPE = ['probabilistic', 'deterministic'] as const;

export type ForecastType = (typeof FORECAST_TYPE)[number];

export const PROD_PREF = ['daily_only', 'daily_preference', 'monthly_only', 'monthly_preference'] as const;

export type ProdPref = (typeof PROD_PREF)[number];

export interface IForecast extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	name: string;
	wells: Types.ObjectId[];
	tags?: Array<ITag>;
	project: Types.ObjectId;
	runDate?: Date;
	running: boolean;
	type: ForecastType;
	updatedAt?: Date;
}
