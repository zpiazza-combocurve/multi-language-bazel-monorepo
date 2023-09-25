import { BaseContext, BaseService } from '@combocurve/shared';
import { serviceResolver } from '@combocurve/shared/middleware';
import { Types } from 'mongoose';
import { ForecastDataModel, ForecastModel, ForecastSegmentModel, ForecastWellAssignmentModel } from '../entities/forecast';
import MultipleSegments from '../models/multipleSegments';
export declare const MAX_WELLS_IN_FORECAST = 25000;
export interface AddWellToForecastResponse {
    message: string;
    wellsIds: string[];
}
export interface ForecastDeleteResponse {
    msg: string;
}
export interface ForecastParametersResponse {
    _id: Types.ObjectId;
    P_dict: Types.ObjectId;
}
declare class ForecastService extends BaseService<BaseContext> {
    constructor(context: BaseContext);
    addWellsToForecast: (forecastId: Types.ObjectId, inputForecastWells: Types.ObjectId[]) => Promise<AddWellToForecastResponse>;
    getForecast: (forecastId: Types.ObjectId) => Promise<ForecastModel>;
    getMultipleSegments: (segments: ForecastSegmentModel[]) => Promise<MultipleSegments>;
    postDeterministicForecastSegments: (forecastId: Types.ObjectId, wellId: Types.ObjectId, phase: string, series: string, segments: ForecastSegmentModel[]) => Promise<Types.ObjectId>;
    getDeterministicForecastSegments: (forecastId: Types.ObjectId, wellId: Types.ObjectId, phase: string, series: string) => Promise<Array<ForecastSegmentModel>>;
    deleteDeterministicForecastSegments: (forecastId: Types.ObjectId, wellId: Types.ObjectId, phase: string, series: string) => Promise<void>;
    putDeterministicForecastSegments: (forecastId: Types.ObjectId, wellId: Types.ObjectId, phase: string, series: string, segments: ForecastSegmentModel[]) => Promise<Types.ObjectId>;
    getForecastParams: (forecastId: Types.ObjectId) => Promise<ForecastDataModel>;
    saveForecastWellAssignment: (forecastType: string, assignmentWellForecast: ForecastWellAssignmentModel[], forecastData: ForecastDataModel[]) => Promise<void>;
    updateForecastWellsAndGetForecast: (forecastId: Types.ObjectId, wellsToAdd: Set<string>) => Promise<ForecastModel>;
    toApiForecastSegment: (forecastSegment: ForecastSegmentModel) => {
        b: number | undefined;
        flatValue: number | undefined;
        diEffSec: number;
        slope: number | undefined;
        endDate: string;
        segmentType: string;
        qEnd: number | undefined;
        qStart: number | undefined;
        startDate: string;
        targetDSwEffSec: number | undefined;
    };
}
export { ForecastService, serviceResolver };
//# sourceMappingURL=forecasts.d.ts.map