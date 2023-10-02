/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';

export { ScenarioSchema } from '../schemas';

export interface IScenario extends Document {
	_id: Types.ObjectId;
	createdAt?: Date;
	name: string;
	wells: Types.ObjectId[];
	project: Types.ObjectId;
	updatedAt?: Date;
	createdBy: Types.ObjectId;
	columns?: IScenarioColumns;
}

export interface IScenarioColumns {
	[key: string]: IQualifierConfig;
}

export interface IQualifierConfig {
	activeQualifier: string;
	qualifiers: IQualifiers;
}

export interface IQualifiers {
	[key: string]: IQualifierName;
}

export interface IQualifierName {
	name: string;
}
