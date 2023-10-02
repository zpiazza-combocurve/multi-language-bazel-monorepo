import { Document, Types } from 'mongoose';

export interface IWellDirectionalSurvey extends Document {
	_id: Types.ObjectId;
	chosenID?: string;
	dataSource?: string;
	schemaVersion: number;
	well: Types.ObjectId;
	project?: Types.ObjectId | null;
	measuredDepth: Array<number>;
	trueVerticalDepth: Array<number>;
	azimuth: Array<number>;
	inclination: Array<number>;
	deviationNS: Array<number>;
	deviationEW: Array<number>;
	latitude: Array<number>;
	longitude: Array<number>;
	createdAt?: Date;
	updatedAt?: Date;
}
