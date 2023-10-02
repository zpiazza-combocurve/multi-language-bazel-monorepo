import { Types } from 'mongoose';

import { IWellDirectionalSurvey } from '@src/models/well-directional-surveys';

export class DSResponse {
	id: string;
	well: string;
	project?: string | null;
	measuredDepth: number[];
	trueVerticalDepth: number[];
	azimuth: number[];
	inclination: number[];
	deviationNS: number[];
	deviationEW: number[];
	latitude: number[];
	longitude: number[];
	createdAt?: Date;
	updatedAt?: Date;

	constructor(db: IWellDirectionalSurvey) {
		this.id = DSResponse.getFromID(db._id);
		this.well = DSResponse.getFromID(db.well);
		this.project = DSResponse.getFromID(db.project || '');
		this.measuredDepth = db.measuredDepth;
		this.trueVerticalDepth = db.trueVerticalDepth;
		this.azimuth = db.azimuth;
		this.inclination = db.inclination;
		this.deviationNS = db.deviationNS;
		this.deviationEW = db.deviationEW;
		this.latitude = db.latitude;
		this.longitude = db.longitude;
		this.createdAt = db.createdAt;
		this.updatedAt = db.updatedAt;
	}

	private static getFromID(value: string | Types.ObjectId): string {
		// Sometimes the mongo return the IDs as strings
		return typeof value === 'string' ? value : value?.toHexString();
	}
}

export type GetDSReponse = {
	data: DSResponse[];
};
