import { Document, Types } from 'mongoose';
export declare const FORECAST_BASE_PHASES: any;
export declare const FORECAST_TYPES: {
    Probabilistic: string;
    Deterministic: string;
};
export interface ForecastWellAssignmentModel extends Partial<Document> {
    data: {
        oil: Types.ObjectId;
        gas: Types.ObjectId;
        water: Types.ObjectId;
    };
    forecast: Types.ObjectId;
    well: Types.ObjectId;
}
export interface ForecastDataModel extends Partial<Document> {
    _id: Types.ObjectId;
    data_freq: string;
    forecast: Types.ObjectId;
    forecastType: string;
    P_dict: Object;
    p_extra: Object;
    phase: string;
    project: Types.ObjectId;
    warning: {
        status: boolean;
        message: string;
    };
    well: Types.ObjectId;
}
export interface DeterministicForecastDataModel extends Document {
    _id: Types.ObjectId;
    data_freq: string;
    forecast: Types.ObjectId;
    forecastType: string;
    P_dict: Object;
    p_extra: Object;
    phase: Types.ObjectId;
    project: Types.ObjectId;
    warning: {
        status: boolean;
        message: string;
    };
    well: Types.ObjectId;
}
export type ForecastParameterModel = {
    _id: Types.ObjectId;
    forecastType: string;
    forecastSubType: Object;
    P_dict: Object;
    phase: Types.ObjectId;
    project: Types.ObjectId;
    ratio: Object;
    warning: {
        status: boolean;
        message: string;
    };
    well: Types.ObjectId;
};
export interface ForecastSegmentModel {
    b?: number;
    c?: number;
    D?: number;
    D_eff?: number;
    k?: number;
    end_idx: number;
    name: string;
    q_end?: number;
    q_start?: number;
    realized_D_eff_sw?: number;
    start_idx: number;
    sw_idx?: number;
    target_D_eff_sw?: number;
}
export interface ForecastModel extends Partial<Document> {
    wells: Types.ObjectId[];
    project: Types.ObjectId;
    type: string;
}
export type DeterministicPdict = {
    P_dict: {
        best: {
            segments: ForecastSegmentModel[];
        };
    };
};
//# sourceMappingURL=forecast.d.ts.map