export interface IDirectionalSurveyID {
	chosenID: string;
	projectID: string | null;
}

export interface IDirectionalSurveyMeasures {
	measuredDepth: number[];
	trueVerticalDepth: number[];
	azimuth: number[];
	inclination: number[];
	deviationEW: number[];
	deviationNS: number[];
	latitude: number[];
	longitude: number[];
}

export interface IWellDependency {
	wellCount: number;
}

export interface ISpatialData {
	spatialDataType: string;
}

export interface IDataSource {
	dataSource: string;
}

export type CreateDSRequest = IDirectionalSurveyID &
	IDataSource &
	IDirectionalSurveyMeasures &
	ISpatialData &
	IWellDependency;

export type UpdateDSRequest = ISpatialData &
	IDataSource & {
		add: IDirectionalSurveyMeasures | null;
		remove: number[];
		update: IDirectionalSurveyMeasures | null;
	};
