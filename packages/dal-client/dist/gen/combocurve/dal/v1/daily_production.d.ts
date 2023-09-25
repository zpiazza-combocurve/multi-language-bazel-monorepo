import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { DateRange } from "../../common/v1/date_range";
export declare const protobufPackage = "combocurve.dal.v1";
export interface DailyProductionServiceUpsertRequest {
    /**
     * A list of fields to consider during this request. The default is all
     * fields. API layers are responsible for implementing this behavior.
     */
    fieldMask: string[] | undefined;
    /**
     * Required. The combination of `well` + `date` identifies a production
     * record.
     */
    well: string;
    /**
     * Required. The combination of `well` + `date` identifies a production
     * record.
     */
    date: Date | undefined;
    /**
     * Project ID for the well this record corresponds to, or empty for
     * company-level wells. This is used during insert but ignored for update.
     */
    project?: string | undefined;
    bottomHolePressure?: number | undefined;
    casingHeadPressure?: number | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    flowlinePressure?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    gasLiftInjectionPressure?: number | undefined;
    hoursOn?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    tubingHeadPressure?: number | undefined;
    vesselSeparatorPressure?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
    operationalTag?: string | undefined;
}
export interface DailyProductionServiceUpsertResponse {
}
export interface DailyProductionServiceChangeToCompanyScopeRequest {
    wells: string[];
}
export interface DailyProductionServiceChangeToCompanyScopeResponse {
}
export interface DailyProductionServiceFetchRequest {
    /**
     * A list of fields to consider during this request. The default is all
     * fields. API layers are responsible for implementing this behavior.
     */
    fieldMask: string[] | undefined;
    /**
     * API layers are responsible for enforcing that the size of `wells` is
     * reasonable for a single request.
     */
    wells: string[];
    dateRange: DateRange | undefined;
    onlyPhysicalWells?: boolean | undefined;
}
export interface DailyProductionServiceFetchResponse {
    date: Date | undefined;
    well: string;
    project?: string | undefined;
    bottomHolePressure?: number | undefined;
    casingHeadPressure?: number | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    flowlinePressure?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    gasLiftInjectionPressure?: number | undefined;
    hoursOn?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    tubingHeadPressure?: number | undefined;
    vesselSeparatorPressure?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
    operationalTag?: string | undefined;
}
export interface DailyProductionServiceSumByWellRequest {
    /**
     * A list of fields to consider during this request. The default is all
     * fields. API layers are responsible for implementing this behavior.
     */
    fieldMask: string[] | undefined;
    /**
     * API layers are responsible for enforcing that the size of `wells` is
     * reasonable for a single request.
     */
    wells: string[];
    dateRange: DateRange | undefined;
    onlyPhysicalWells?: boolean | undefined;
}
export interface DailyProductionServiceSumByWellResponse {
    /**
     * NOTE: Keep this message in sync with `DailyProductionServiceFetchResponse`
     * for the overlapping fields.
     */
    well: string;
    project?: string | undefined;
    bottomHolePressure?: number | undefined;
    casingHeadPressure?: number | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    flowlinePressure?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    gasLiftInjectionPressure?: number | undefined;
    hoursOn?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    tubingHeadPressure?: number | undefined;
    vesselSeparatorPressure?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
}
export interface DailyProductionServiceCountByWellRequest {
    /**
     * A list of fields to consider during this request. The default is all
     * fields. API layers are responsible for implementing this behavior.
     */
    fieldMask: string[] | undefined;
    /**
     * API layers are responsible for enforcing that the size of `wells` is
     * reasonable for a single request.
     */
    wells: string[];
    dateRange: DateRange | undefined;
    onlyPhysicalWells?: boolean | undefined;
}
export interface DailyProductionServiceCountByWellResponse {
    /**
     * NOTE: Keep this message in sync with `DailyProductionServiceFetchResponse`
     * for the overlapping fields.
     */
    well: string;
    project?: string | undefined;
    bottomHolePressure?: number | undefined;
    casingHeadPressure?: number | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    flowlinePressure?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    gasLiftInjectionPressure?: number | undefined;
    hoursOn?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    tubingHeadPressure?: number | undefined;
    vesselSeparatorPressure?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
}
export interface DailyProductionServiceDeleteByProjectRequest {
    project: string;
}
export interface DailyProductionServiceDeleteByProjectResponse {
}
export interface DailyProductionServiceDeleteByWellRequest {
    well: string;
    dateRange: DateRange | undefined;
}
export interface DailyProductionServiceDeleteByWellResponse {
}
export interface DailyProductionServiceDeleteByManyWellsRequest {
    wells: string[];
}
export interface DailyProductionServiceDeleteByManyWellsResponse {
}
export declare const DailyProductionServiceUpsertRequest: {
    encode(message: DailyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertRequest;
    fromJSON(object: any): DailyProductionServiceUpsertRequest;
    toJSON(message: DailyProductionServiceUpsertRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest;
};
export declare const DailyProductionServiceUpsertResponse: {
    encode(_: DailyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertResponse;
    fromJSON(_: any): DailyProductionServiceUpsertResponse;
    toJSON(_: DailyProductionServiceUpsertResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse;
    fromPartial(_: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse;
};
export declare const DailyProductionServiceChangeToCompanyScopeRequest: {
    encode(message: DailyProductionServiceChangeToCompanyScopeRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeRequest;
    fromJSON(object: any): DailyProductionServiceChangeToCompanyScopeRequest;
    toJSON(message: DailyProductionServiceChangeToCompanyScopeRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>): DailyProductionServiceChangeToCompanyScopeRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>): DailyProductionServiceChangeToCompanyScopeRequest;
};
export declare const DailyProductionServiceChangeToCompanyScopeResponse: {
    encode(_: DailyProductionServiceChangeToCompanyScopeResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeResponse;
    fromJSON(_: any): DailyProductionServiceChangeToCompanyScopeResponse;
    toJSON(_: DailyProductionServiceChangeToCompanyScopeResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>): DailyProductionServiceChangeToCompanyScopeResponse;
    fromPartial(_: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>): DailyProductionServiceChangeToCompanyScopeResponse;
};
export declare const DailyProductionServiceFetchRequest: {
    encode(message: DailyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchRequest;
    fromJSON(object: any): DailyProductionServiceFetchRequest;
    toJSON(message: DailyProductionServiceFetchRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest;
};
export declare const DailyProductionServiceFetchResponse: {
    encode(message: DailyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchResponse;
    fromJSON(object: any): DailyProductionServiceFetchResponse;
    toJSON(message: DailyProductionServiceFetchResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse;
    fromPartial(object: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse;
};
export declare const DailyProductionServiceSumByWellRequest: {
    encode(message: DailyProductionServiceSumByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellRequest;
    fromJSON(object: any): DailyProductionServiceSumByWellRequest;
    toJSON(message: DailyProductionServiceSumByWellRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest;
};
export declare const DailyProductionServiceSumByWellResponse: {
    encode(message: DailyProductionServiceSumByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellResponse;
    fromJSON(object: any): DailyProductionServiceSumByWellResponse;
    toJSON(message: DailyProductionServiceSumByWellResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse;
    fromPartial(object: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse;
};
export declare const DailyProductionServiceCountByWellRequest: {
    encode(message: DailyProductionServiceCountByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellRequest;
    fromJSON(object: any): DailyProductionServiceCountByWellRequest;
    toJSON(message: DailyProductionServiceCountByWellRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest;
};
export declare const DailyProductionServiceCountByWellResponse: {
    encode(message: DailyProductionServiceCountByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellResponse;
    fromJSON(object: any): DailyProductionServiceCountByWellResponse;
    toJSON(message: DailyProductionServiceCountByWellResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceCountByWellResponse>): DailyProductionServiceCountByWellResponse;
    fromPartial(object: DeepPartial<DailyProductionServiceCountByWellResponse>): DailyProductionServiceCountByWellResponse;
};
export declare const DailyProductionServiceDeleteByProjectRequest: {
    encode(message: DailyProductionServiceDeleteByProjectRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectRequest;
    fromJSON(object: any): DailyProductionServiceDeleteByProjectRequest;
    toJSON(message: DailyProductionServiceDeleteByProjectRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByProjectRequest>): DailyProductionServiceDeleteByProjectRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceDeleteByProjectRequest>): DailyProductionServiceDeleteByProjectRequest;
};
export declare const DailyProductionServiceDeleteByProjectResponse: {
    encode(_: DailyProductionServiceDeleteByProjectResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectResponse;
    fromJSON(_: any): DailyProductionServiceDeleteByProjectResponse;
    toJSON(_: DailyProductionServiceDeleteByProjectResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByProjectResponse>): DailyProductionServiceDeleteByProjectResponse;
    fromPartial(_: DeepPartial<DailyProductionServiceDeleteByProjectResponse>): DailyProductionServiceDeleteByProjectResponse;
};
export declare const DailyProductionServiceDeleteByWellRequest: {
    encode(message: DailyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellRequest;
    fromJSON(object: any): DailyProductionServiceDeleteByWellRequest;
    toJSON(message: DailyProductionServiceDeleteByWellRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByWellRequest>): DailyProductionServiceDeleteByWellRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceDeleteByWellRequest>): DailyProductionServiceDeleteByWellRequest;
};
export declare const DailyProductionServiceDeleteByWellResponse: {
    encode(_: DailyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellResponse;
    fromJSON(_: any): DailyProductionServiceDeleteByWellResponse;
    toJSON(_: DailyProductionServiceDeleteByWellResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse;
    fromPartial(_: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse;
};
export declare const DailyProductionServiceDeleteByManyWellsRequest: {
    encode(message: DailyProductionServiceDeleteByManyWellsRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsRequest;
    fromJSON(object: any): DailyProductionServiceDeleteByManyWellsRequest;
    toJSON(message: DailyProductionServiceDeleteByManyWellsRequest): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>): DailyProductionServiceDeleteByManyWellsRequest;
    fromPartial(object: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>): DailyProductionServiceDeleteByManyWellsRequest;
};
export declare const DailyProductionServiceDeleteByManyWellsResponse: {
    encode(_: DailyProductionServiceDeleteByManyWellsResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsResponse;
    fromJSON(_: any): DailyProductionServiceDeleteByManyWellsResponse;
    toJSON(_: DailyProductionServiceDeleteByManyWellsResponse): unknown;
    create(base?: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>): DailyProductionServiceDeleteByManyWellsResponse;
    fromPartial(_: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>): DailyProductionServiceDeleteByManyWellsResponse;
};
export type DailyProductionServiceDefinition = typeof DailyProductionServiceDefinition;
export declare const DailyProductionServiceDefinition: {
    readonly name: "DailyProductionService";
    readonly fullName: "combocurve.dal.v1.DailyProductionService";
    readonly methods: {
        /** Upsert daily production data for multiple wells. */
        readonly upsert: {
            readonly name: "Upsert";
            readonly requestType: {
                encode(message: DailyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertRequest;
                fromJSON(object: any): DailyProductionServiceUpsertRequest;
                toJSON(message: DailyProductionServiceUpsertRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest;
            };
            readonly requestStream: true;
            readonly responseType: {
                encode(_: DailyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertResponse;
                fromJSON(_: any): DailyProductionServiceUpsertResponse;
                toJSON(_: DailyProductionServiceUpsertResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse;
                fromPartial(_: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Update daily production data for multiple wells, when the wells are changed to company scope. */
        readonly changeToCompanyScope: {
            readonly name: "ChangeToCompanyScope";
            readonly requestType: {
                encode(message: DailyProductionServiceChangeToCompanyScopeRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeRequest;
                fromJSON(object: any): DailyProductionServiceChangeToCompanyScopeRequest;
                toJSON(message: DailyProductionServiceChangeToCompanyScopeRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>): DailyProductionServiceChangeToCompanyScopeRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>): DailyProductionServiceChangeToCompanyScopeRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: DailyProductionServiceChangeToCompanyScopeResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeResponse;
                fromJSON(_: any): DailyProductionServiceChangeToCompanyScopeResponse;
                toJSON(_: DailyProductionServiceChangeToCompanyScopeResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>): DailyProductionServiceChangeToCompanyScopeResponse;
                fromPartial(_: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>): DailyProductionServiceChangeToCompanyScopeResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /**
         * Fetch daily production data for multiple wells. Results are guaranteed to
         * be sorted by well, then by date.
         */
        readonly fetch: {
            readonly name: "Fetch";
            readonly requestType: {
                encode(message: DailyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchRequest;
                fromJSON(object: any): DailyProductionServiceFetchRequest;
                toJSON(message: DailyProductionServiceFetchRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: DailyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchResponse;
                fromJSON(object: any): DailyProductionServiceFetchResponse;
                toJSON(message: DailyProductionServiceFetchResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse;
                fromPartial(object: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Calculate the sum of daily production phases for multiple wells. */
        readonly sumByWell: {
            readonly name: "SumByWell";
            readonly requestType: {
                encode(message: DailyProductionServiceSumByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellRequest;
                fromJSON(object: any): DailyProductionServiceSumByWellRequest;
                toJSON(message: DailyProductionServiceSumByWellRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: DailyProductionServiceSumByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellResponse;
                fromJSON(object: any): DailyProductionServiceSumByWellResponse;
                toJSON(message: DailyProductionServiceSumByWellResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse;
                fromPartial(object: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Calculate the amount of values of daily production phases for multiple wells. */
        readonly countByWell: {
            readonly name: "CountByWell";
            readonly requestType: {
                encode(message: DailyProductionServiceCountByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellRequest;
                fromJSON(object: any): DailyProductionServiceCountByWellRequest;
                toJSON(message: DailyProductionServiceCountByWellRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: DailyProductionServiceCountByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellResponse;
                fromJSON(object: any): DailyProductionServiceCountByWellResponse;
                toJSON(message: DailyProductionServiceCountByWellResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceCountByWellResponse>): DailyProductionServiceCountByWellResponse;
                fromPartial(object: DeepPartial<DailyProductionServiceCountByWellResponse>): DailyProductionServiceCountByWellResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Delete all production data for the given project. */
        readonly deleteByProject: {
            readonly name: "DeleteByProject";
            readonly requestType: {
                encode(message: DailyProductionServiceDeleteByProjectRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectRequest;
                fromJSON(object: any): DailyProductionServiceDeleteByProjectRequest;
                toJSON(message: DailyProductionServiceDeleteByProjectRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByProjectRequest>): DailyProductionServiceDeleteByProjectRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceDeleteByProjectRequest>): DailyProductionServiceDeleteByProjectRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: DailyProductionServiceDeleteByProjectResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectResponse;
                fromJSON(_: any): DailyProductionServiceDeleteByProjectResponse;
                toJSON(_: DailyProductionServiceDeleteByProjectResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByProjectResponse>): DailyProductionServiceDeleteByProjectResponse;
                fromPartial(_: DeepPartial<DailyProductionServiceDeleteByProjectResponse>): DailyProductionServiceDeleteByProjectResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /**
         * Delete production data for the given well. An optional date range can be
         * provided to restrict the production data points to be deleted.
         */
        readonly deleteByWell: {
            readonly name: "DeleteByWell";
            readonly requestType: {
                encode(message: DailyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellRequest;
                fromJSON(object: any): DailyProductionServiceDeleteByWellRequest;
                toJSON(message: DailyProductionServiceDeleteByWellRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByWellRequest>): DailyProductionServiceDeleteByWellRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceDeleteByWellRequest>): DailyProductionServiceDeleteByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: DailyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellResponse;
                fromJSON(_: any): DailyProductionServiceDeleteByWellResponse;
                toJSON(_: DailyProductionServiceDeleteByWellResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse;
                fromPartial(_: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Delete all production data for the given wells. */
        readonly deleteByManyWells: {
            readonly name: "DeleteByManyWells";
            readonly requestType: {
                encode(message: DailyProductionServiceDeleteByManyWellsRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsRequest;
                fromJSON(object: any): DailyProductionServiceDeleteByManyWellsRequest;
                toJSON(message: DailyProductionServiceDeleteByManyWellsRequest): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>): DailyProductionServiceDeleteByManyWellsRequest;
                fromPartial(object: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>): DailyProductionServiceDeleteByManyWellsRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: DailyProductionServiceDeleteByManyWellsResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsResponse;
                fromJSON(_: any): DailyProductionServiceDeleteByManyWellsResponse;
                toJSON(_: DailyProductionServiceDeleteByManyWellsResponse): unknown;
                create(base?: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>): DailyProductionServiceDeleteByManyWellsResponse;
                fromPartial(_: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>): DailyProductionServiceDeleteByManyWellsResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
    };
};
export interface DailyProductionServiceImplementation<CallContextExt = {}> {
    /** Upsert daily production data for multiple wells. */
    upsert(request: AsyncIterable<DailyProductionServiceUpsertRequest>, context: CallContext & CallContextExt): Promise<DeepPartial<DailyProductionServiceUpsertResponse>>;
    /** Update daily production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope(request: DailyProductionServiceChangeToCompanyScopeRequest, context: CallContext & CallContextExt): Promise<DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>>;
    /**
     * Fetch daily production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch(request: DailyProductionServiceFetchRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceFetchResponse>>;
    /** Calculate the sum of daily production phases for multiple wells. */
    sumByWell(request: DailyProductionServiceSumByWellRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceSumByWellResponse>>;
    /** Calculate the amount of values of daily production phases for multiple wells. */
    countByWell(request: DailyProductionServiceCountByWellRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceCountByWellResponse>>;
    /** Delete all production data for the given project. */
    deleteByProject(request: DailyProductionServiceDeleteByProjectRequest, context: CallContext & CallContextExt): Promise<DeepPartial<DailyProductionServiceDeleteByProjectResponse>>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: DailyProductionServiceDeleteByWellRequest, context: CallContext & CallContextExt): Promise<DeepPartial<DailyProductionServiceDeleteByWellResponse>>;
    /** Delete all production data for the given wells. */
    deleteByManyWells(request: DailyProductionServiceDeleteByManyWellsRequest, context: CallContext & CallContextExt): Promise<DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>>;
}
export interface DailyProductionServiceClient<CallOptionsExt = {}> {
    /** Upsert daily production data for multiple wells. */
    upsert(request: AsyncIterable<DeepPartial<DailyProductionServiceUpsertRequest>>, options?: CallOptions & CallOptionsExt): Promise<DailyProductionServiceUpsertResponse>;
    /** Update daily production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope(request: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>, options?: CallOptions & CallOptionsExt): Promise<DailyProductionServiceChangeToCompanyScopeResponse>;
    /**
     * Fetch daily production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch(request: DeepPartial<DailyProductionServiceFetchRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<DailyProductionServiceFetchResponse>;
    /** Calculate the sum of daily production phases for multiple wells. */
    sumByWell(request: DeepPartial<DailyProductionServiceSumByWellRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<DailyProductionServiceSumByWellResponse>;
    /** Calculate the amount of values of daily production phases for multiple wells. */
    countByWell(request: DeepPartial<DailyProductionServiceCountByWellRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<DailyProductionServiceCountByWellResponse>;
    /** Delete all production data for the given project. */
    deleteByProject(request: DeepPartial<DailyProductionServiceDeleteByProjectRequest>, options?: CallOptions & CallOptionsExt): Promise<DailyProductionServiceDeleteByProjectResponse>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: DeepPartial<DailyProductionServiceDeleteByWellRequest>, options?: CallOptions & CallOptionsExt): Promise<DailyProductionServiceDeleteByWellResponse>;
    /** Delete all production data for the given wells. */
    deleteByManyWells(request: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>, options?: CallOptions & CallOptionsExt): Promise<DailyProductionServiceDeleteByManyWellsResponse>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export type ServerStreamingMethodResult<Response> = {
    [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
export {};
