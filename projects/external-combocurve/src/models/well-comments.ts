/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { WellCommentBucketSchema } from '../schemas';

interface WellComment {
	createdAt?: Date;
	createdBy?: Types.ObjectId;
	text: string;
}

export interface IWellCommentBucket extends Document {
	_id: Types.ObjectId;
	comments: WellComment[];
	count: number;
	createdAt?: Date;
	forecast: Types.ObjectId | null;
	index: number;
	project: Types.ObjectId | null;
	scenario: Types.ObjectId | null;
	updatedAt: Date;
	well: Types.ObjectId;
}
