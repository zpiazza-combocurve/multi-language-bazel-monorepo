/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { ProjectSchema } from '../schemas';

export interface IProject extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	name: string;
	updatedAt?: Date;
	wells: Types.ObjectId[];
	scenarios: Types.ObjectId[];
}
