import { Document, Model, Schema, Types } from 'mongoose';

export interface IApiCredential extends Document {
	_id: Types.ObjectId;
	apiKeyId: string;
	apiKeyName: string;
	createdAt: Date;
	createdBy: Types.ObjectId;
	serviceAccountKeyId: string;
	tenant: string;
}

export declare const ApiCredentialSchema: Schema<IApiCredential, Model<IApiCredential>>;
