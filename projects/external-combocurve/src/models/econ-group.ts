import { Types } from 'mongoose';

export { EconGroupSchema } from '../schemas';

export interface IEconGroup extends Document {
	_id: Types.ObjectId;
	name: string;
}
