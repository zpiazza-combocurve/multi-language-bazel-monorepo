/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';

import { ITag } from '../tags';
export { EconRunSchema } from '../../schemas';

export const ECON_RUN_STATUS = ['approved', 'rejected', 'need_review'] as const;

export type EconRunStatus = (typeof ECON_RUN_STATUS)[number];

export interface IEconRun extends Document {
	_id: Types.ObjectId;
	project: Types.ObjectId;
	runDate: Date;
	scenario: Types.ObjectId;
	status?: EconRunStatus;
	tags?: Array<ITag>;
	outputParams?: IEconRunOutputParams;
}

export interface IEconRunOutputParams {
	prodAnalyticsType?: string;
}
