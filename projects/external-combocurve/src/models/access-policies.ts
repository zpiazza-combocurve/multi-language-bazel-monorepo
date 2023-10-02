/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { AccessPolicySchema } from '../schemas';

export const MEMBER_TYPES = ['teams', 'users'] as const;
export const RESOURCE_TYPES = ['company', 'project', 'forecast', 'scenario'] as const;

export type MemberTypes = (typeof MEMBER_TYPES)[number];
export type ResourceTypes = (typeof RESOURCE_TYPES)[number];

export interface IAccessPolicy extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	memberId: Types.ObjectId;
	memberType: MemberTypes;
	resourceId?: Types.ObjectId;
	resourceType: ResourceTypes;
	roles?: string[];
	updatedAt?: Date;
}
