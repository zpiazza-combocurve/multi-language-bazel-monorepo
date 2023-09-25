import { Document, Model, Schema, Types } from 'mongoose';

export interface IApiTenant extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	createdBy: Types.ObjectId;
	gcpProjectId: string;
	serviceAccountEmail: string;
	tenant: string;
}

export declare const ApiTenantSchema: Schema<IApiTenant, Model<IApiTenant>>;
