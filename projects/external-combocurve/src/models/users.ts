import { Types } from 'mongoose';
export { UserSchema } from '../schemas';
export interface IUser extends Document {
	_id: Types.ObjectId;
}
