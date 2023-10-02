/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { TagSchema } from '../schemas';

export interface ITag extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	name: string;
	description: string;
	updatedAt?: Date;
}
