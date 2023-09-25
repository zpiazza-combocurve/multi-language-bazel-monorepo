import { Schema, Types } from 'mongoose';

export enum MemberType {
	User = 'users',
	Group = 'groups',
}
export enum ResourceType {
	Company = 'company',
	Project = 'project',
}

export interface AccessPolicy {
	memberType: MemberType;

	memberId: Types.ObjectId;

	resourceType: ResourceType;

	resourceId: Types.ObjectId;

	roles: string[];
}

export const AccessPolicySchema = new Schema(
	{
		memberType: { type: String, enum: Object.values(MemberType), required: true },

		memberId: { type: Schema.Types.ObjectId, required: true, refPath: 'memberType' },

		resourceType: { type: String, enum: Object.values(ResourceType), required: true },

		resourceId: { type: Schema.Types.ObjectId, refPath: 'resourceType' },

		roles: [String],
	},
	{ timestamps: true }
);

AccessPolicySchema.index({ memberType: 1, memberId: 1, resourceType: 1, resourceId: 1 }, { unique: true });

AccessPolicySchema.index({ resourceType: 1, resourceId: 1 });
