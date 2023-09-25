import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { DateRange } from "../../common/v1/date_range";
export declare const protobufPackage = "combocurve.dal.v1";
export interface MonthlyProductionServiceUpsertRequest {
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
    choke?: number | undefined;
    co2Injection?: number | undefined;
    daysOn?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
    operationalTag?: string | undefined;
}
export interface MonthlyProductionServiceUpsertResponse {
}
export interface MonthlyProductionServiceChangeToCompanyScopeRequest {
    wells: string[];
}
export interface MonthlyProductionServiceChangeToCompanyScopeResponse {
}
export interface MonthlyProductionServiceFetchRequest {
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
export interface MonthlyProductionServiceFetchResponse {
    date: Date | undefined;
    well: string;
    project?: string | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    daysOn?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
    operationalTag?: string | undefined;
}
export interface MonthlyProductionServiceSumByWellRequest {
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
export interface MonthlyProductionServiceSumByWellResponse {
    /**
     * NOTE: Keep this message in sync with
     * `MonthlyProductionServiceFetchResponse` for the overlapping fields.
     */
    well: string;
    project?: string | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    daysOn?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
}
export interface MonthlyProductionServiceCountByWellRequest {
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
export interface MonthlyProductionServiceCountByWellResponse {
    /**
     * NOTE: Keep this message in sync with
     * `MonthlyProductionServiceFetchResponse` for the overlapping fields.
     */
    well: string;
    project?: string | undefined;
    choke?: number | undefined;
    co2Injection?: number | undefined;
    daysOn?: number | undefined;
    gas?: number | undefined;
    gasInjection?: number | undefined;
    ngl?: number | undefined;
    oil?: number | undefined;
    steamInjection?: number | undefined;
    water?: number | undefined;
    waterInjection?: number | undefined;
    customNumber0?: number | undefined;
    customNumber1?: number | undefined;
    customNumber2?: number | undefined;
    customNumber3?: number | undefined;
    customNumber4?: number | undefined;
}
export interface MonthlyProductionServiceDeleteByProjectRequest {
    project: string;
}
export interface MonthlyProductionServiceDeleteByProjectResponse {
}
export interface MonthlyProductionServiceDeleteByWellRequest {
    well: string;
    dateRange: DateRange | undefined;
}
export interface MonthlyProductionServiceDeleteByWellResponse {
}
export interface MonthlyProductionServiceDeleteByManyWellsRequest {
    wells: string[];
}
export interface MonthlyProductionServiceDeleteByManyWellsResponse {
}
export declare const MonthlyProductionServiceUpsertRequest: {
    encode(message: MonthlyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertRequest;
    fromJSON(object: any): MonthlyProductionServiceUpsertRequest;
    toJSON(message: MonthlyProductionServiceUpsertRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest;
};
export declare const MonthlyProductionServiceUpsertResponse: {
    encode(_: MonthlyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertResponse;
    fromJSON(_: any): MonthlyProductionServiceUpsertResponse;
    toJSON(_: MonthlyProductionServiceUpsertResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse;
    fromPartial(_: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse;
};
export declare const MonthlyProductionServiceChangeToCompanyScopeRequest: {
    encode(message: MonthlyProductionServiceChangeToCompanyScopeRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeRequest;
    fromJSON(object: any): MonthlyProductionServiceChangeToCompanyScopeRequest;
    toJSON(message: MonthlyProductionServiceChangeToCompanyScopeRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>): MonthlyProductionServiceChangeToCompanyScopeRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>): MonthlyProductionServiceChangeToCompanyScopeRequest;
};
export declare const MonthlyProductionServiceChangeToCompanyScopeResponse: {
    encode(_: MonthlyProductionServiceChangeToCompanyScopeResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeResponse;
    fromJSON(_: any): MonthlyProductionServiceChangeToCompanyScopeResponse;
    toJSON(_: MonthlyProductionServiceChangeToCompanyScopeResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>): MonthlyProductionServiceChangeToCompanyScopeResponse;
    fromPartial(_: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>): MonthlyProductionServiceChangeToCompanyScopeResponse;
};
export declare const MonthlyProductionServiceFetchRequest: {
    encode(message: MonthlyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchRequest;
    fromJSON(object: any): MonthlyProductionServiceFetchRequest;
    toJSON(message: MonthlyProductionServiceFetchRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest;
};
export declare const MonthlyProductionServiceFetchResponse: {
    encode(message: MonthlyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchResponse;
    fromJSON(object: any): MonthlyProductionServiceFetchResponse;
    toJSON(message: MonthlyProductionServiceFetchResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse;
    fromPartial(object: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse;
};
export declare const MonthlyProductionServiceSumByWellRequest: {
    encode(message: MonthlyProductionServiceSumByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellRequest;
    fromJSON(object: any): MonthlyProductionServiceSumByWellRequest;
    toJSON(message: MonthlyProductionServiceSumByWellRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest;
};
export declare const MonthlyProductionServiceSumByWellResponse: {
    encode(message: MonthlyProductionServiceSumByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellResponse;
    fromJSON(object: any): MonthlyProductionServiceSumByWellResponse;
    toJSON(message: MonthlyProductionServiceSumByWellResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceSumByWellResponse>): MonthlyProductionServiceSumByWellResponse;
    fromPartial(object: DeepPartial<MonthlyProductionServiceSumByWellResponse>): MonthlyProductionServiceSumByWellResponse;
};
export declare const MonthlyProductionServiceCountByWellRequest: {
    encode(message: MonthlyProductionServiceCountByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellRequest;
    fromJSON(object: any): MonthlyProductionServiceCountByWellRequest;
    toJSON(message: MonthlyProductionServiceCountByWellRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceCountByWellRequest>): MonthlyProductionServiceCountByWellRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceCountByWellRequest>): MonthlyProductionServiceCountByWellRequest;
};
export declare const MonthlyProductionServiceCountByWellResponse: {
    encode(message: MonthlyProductionServiceCountByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellResponse;
    fromJSON(object: any): MonthlyProductionServiceCountByWellResponse;
    toJSON(message: MonthlyProductionServiceCountByWellResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceCountByWellResponse>): MonthlyProductionServiceCountByWellResponse;
    fromPartial(object: DeepPartial<MonthlyProductionServiceCountByWellResponse>): MonthlyProductionServiceCountByWellResponse;
};
export declare const MonthlyProductionServiceDeleteByProjectRequest: {
    encode(message: MonthlyProductionServiceDeleteByProjectRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectRequest;
    fromJSON(object: any): MonthlyProductionServiceDeleteByProjectRequest;
    toJSON(message: MonthlyProductionServiceDeleteByProjectRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>): MonthlyProductionServiceDeleteByProjectRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>): MonthlyProductionServiceDeleteByProjectRequest;
};
export declare const MonthlyProductionServiceDeleteByProjectResponse: {
    encode(_: MonthlyProductionServiceDeleteByProjectResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectResponse;
    fromJSON(_: any): MonthlyProductionServiceDeleteByProjectResponse;
    toJSON(_: MonthlyProductionServiceDeleteByProjectResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>): MonthlyProductionServiceDeleteByProjectResponse;
    fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>): MonthlyProductionServiceDeleteByProjectResponse;
};
export declare const MonthlyProductionServiceDeleteByWellRequest: {
    encode(message: MonthlyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellRequest;
    fromJSON(object: any): MonthlyProductionServiceDeleteByWellRequest;
    toJSON(message: MonthlyProductionServiceDeleteByWellRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>): MonthlyProductionServiceDeleteByWellRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>): MonthlyProductionServiceDeleteByWellRequest;
};
export declare const MonthlyProductionServiceDeleteByWellResponse: {
    encode(_: MonthlyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellResponse;
    fromJSON(_: any): MonthlyProductionServiceDeleteByWellResponse;
    toJSON(_: MonthlyProductionServiceDeleteByWellResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>): MonthlyProductionServiceDeleteByWellResponse;
    fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>): MonthlyProductionServiceDeleteByWellResponse;
};
export declare const MonthlyProductionServiceDeleteByManyWellsRequest: {
    encode(message: MonthlyProductionServiceDeleteByManyWellsRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsRequest;
    fromJSON(object: any): MonthlyProductionServiceDeleteByManyWellsRequest;
    toJSON(message: MonthlyProductionServiceDeleteByManyWellsRequest): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>): MonthlyProductionServiceDeleteByManyWellsRequest;
    fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>): MonthlyProductionServiceDeleteByManyWellsRequest;
};
export declare const MonthlyProductionServiceDeleteByManyWellsResponse: {
    encode(_: MonthlyProductionServiceDeleteByManyWellsResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsResponse;
    fromJSON(_: any): MonthlyProductionServiceDeleteByManyWellsResponse;
    toJSON(_: MonthlyProductionServiceDeleteByManyWellsResponse): unknown;
    create(base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>): MonthlyProductionServiceDeleteByManyWellsResponse;
    fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>): MonthlyProductionServiceDeleteByManyWellsResponse;
};
export type MonthlyProductionServiceDefinition = typeof MonthlyProductionServiceDefinition;
export declare const MonthlyProductionServiceDefinition: {
    readonly name: "MonthlyProductionService";
    readonly fullName: "combocurve.dal.v1.MonthlyProductionService";
    readonly methods: {
        /** Upsert monthly production data for multiple wells. */
        readonly upsert: {
            readonly name: "Upsert";
            readonly requestType: {
                encode(message: MonthlyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertRequest;
                fromJSON(object: any): MonthlyProductionServiceUpsertRequest;
                toJSON(message: MonthlyProductionServiceUpsertRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest;
            };
            readonly requestStream: true;
            readonly responseType: {
                encode(_: MonthlyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertResponse;
                fromJSON(_: any): MonthlyProductionServiceUpsertResponse;
                toJSON(_: MonthlyProductionServiceUpsertResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse;
                fromPartial(_: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
        readonly changeToCompanyScope: {
            readonly name: "ChangeToCompanyScope";
            readonly requestType: {
                encode(message: MonthlyProductionServiceChangeToCompanyScopeRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeRequest;
                fromJSON(object: any): MonthlyProductionServiceChangeToCompanyScopeRequest;
                toJSON(message: MonthlyProductionServiceChangeToCompanyScopeRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>): MonthlyProductionServiceChangeToCompanyScopeRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>): MonthlyProductionServiceChangeToCompanyScopeRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: MonthlyProductionServiceChangeToCompanyScopeResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeResponse;
                fromJSON(_: any): MonthlyProductionServiceChangeToCompanyScopeResponse;
                toJSON(_: MonthlyProductionServiceChangeToCompanyScopeResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>): MonthlyProductionServiceChangeToCompanyScopeResponse;
                fromPartial(_: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>): MonthlyProductionServiceChangeToCompanyScopeResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /**
         * Fetch monthly production data for multiple wells. Results are guaranteed to
         * be sorted by well, then by date.
         */
        readonly fetch: {
            readonly name: "Fetch";
            readonly requestType: {
                encode(message: MonthlyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchRequest;
                fromJSON(object: any): MonthlyProductionServiceFetchRequest;
                toJSON(message: MonthlyProductionServiceFetchRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: MonthlyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchResponse;
                fromJSON(object: any): MonthlyProductionServiceFetchResponse;
                toJSON(message: MonthlyProductionServiceFetchResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse;
                fromPartial(object: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Calculate the sum of monthly production phases for multiple wells. */
        readonly sumByWell: {
            readonly name: "SumByWell";
            readonly requestType: {
                encode(message: MonthlyProductionServiceSumByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellRequest;
                fromJSON(object: any): MonthlyProductionServiceSumByWellRequest;
                toJSON(message: MonthlyProductionServiceSumByWellRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: MonthlyProductionServiceSumByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellResponse;
                fromJSON(object: any): MonthlyProductionServiceSumByWellResponse;
                toJSON(message: MonthlyProductionServiceSumByWellResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceSumByWellResponse>): MonthlyProductionServiceSumByWellResponse;
                fromPartial(object: DeepPartial<MonthlyProductionServiceSumByWellResponse>): MonthlyProductionServiceSumByWellResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Calculate the amount of values of monthly production phases for multiple wells. */
        readonly countByWell: {
            readonly name: "CountByWell";
            readonly requestType: {
                encode(message: MonthlyProductionServiceCountByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellRequest;
                fromJSON(object: any): MonthlyProductionServiceCountByWellRequest;
                toJSON(message: MonthlyProductionServiceCountByWellRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceCountByWellRequest>): MonthlyProductionServiceCountByWellRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceCountByWellRequest>): MonthlyProductionServiceCountByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: MonthlyProductionServiceCountByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellResponse;
                fromJSON(object: any): MonthlyProductionServiceCountByWellResponse;
                toJSON(message: MonthlyProductionServiceCountByWellResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceCountByWellResponse>): MonthlyProductionServiceCountByWellResponse;
                fromPartial(object: DeepPartial<MonthlyProductionServiceCountByWellResponse>): MonthlyProductionServiceCountByWellResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Delete all production data for the given project. */
        readonly deleteByProject: {
            readonly name: "DeleteByProject";
            readonly requestType: {
                encode(message: MonthlyProductionServiceDeleteByProjectRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectRequest;
                fromJSON(object: any): MonthlyProductionServiceDeleteByProjectRequest;
                toJSON(message: MonthlyProductionServiceDeleteByProjectRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>): MonthlyProductionServiceDeleteByProjectRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>): MonthlyProductionServiceDeleteByProjectRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: MonthlyProductionServiceDeleteByProjectResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectResponse;
                fromJSON(_: any): MonthlyProductionServiceDeleteByProjectResponse;
                toJSON(_: MonthlyProductionServiceDeleteByProjectResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>): MonthlyProductionServiceDeleteByProjectResponse;
                fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>): MonthlyProductionServiceDeleteByProjectResponse;
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
                encode(message: MonthlyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellRequest;
                fromJSON(object: any): MonthlyProductionServiceDeleteByWellRequest;
                toJSON(message: MonthlyProductionServiceDeleteByWellRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>): MonthlyProductionServiceDeleteByWellRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>): MonthlyProductionServiceDeleteByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: MonthlyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellResponse;
                fromJSON(_: any): MonthlyProductionServiceDeleteByWellResponse;
                toJSON(_: MonthlyProductionServiceDeleteByWellResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>): MonthlyProductionServiceDeleteByWellResponse;
                fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>): MonthlyProductionServiceDeleteByWellResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Delete all production data for the given wells. */
        readonly deleteByManyWells: {
            readonly name: "DeleteByManyWells";
            readonly requestType: {
                encode(message: MonthlyProductionServiceDeleteByManyWellsRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsRequest;
                fromJSON(object: any): MonthlyProductionServiceDeleteByManyWellsRequest;
                toJSON(message: MonthlyProductionServiceDeleteByManyWellsRequest): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>): MonthlyProductionServiceDeleteByManyWellsRequest;
                fromPartial(object: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>): MonthlyProductionServiceDeleteByManyWellsRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: MonthlyProductionServiceDeleteByManyWellsResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsResponse;
                fromJSON(_: any): MonthlyProductionServiceDeleteByManyWellsResponse;
                toJSON(_: MonthlyProductionServiceDeleteByManyWellsResponse): unknown;
                create(base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>): MonthlyProductionServiceDeleteByManyWellsResponse;
                fromPartial(_: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>): MonthlyProductionServiceDeleteByManyWellsResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
    };
};
export interface MonthlyProductionServiceImplementation<CallContextExt = {}> {
    /** Upsert monthly production data for multiple wells. */
    upsert(request: AsyncIterable<MonthlyProductionServiceUpsertRequest>, context: CallContext & CallContextExt): Promise<DeepPartial<MonthlyProductionServiceUpsertResponse>>;
    /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope(request: MonthlyProductionServiceChangeToCompanyScopeRequest, context: CallContext & CallContextExt): Promise<DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>>;
    /**
     * Fetch monthly production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch(request: MonthlyProductionServiceFetchRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceFetchResponse>>;
    /** Calculate the sum of monthly production phases for multiple wells. */
    sumByWell(request: MonthlyProductionServiceSumByWellRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceSumByWellResponse>>;
    /** Calculate the amount of values of monthly production phases for multiple wells. */
    countByWell(request: MonthlyProductionServiceCountByWellRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceCountByWellResponse>>;
    /** Delete all production data for the given project. */
    deleteByProject(request: MonthlyProductionServiceDeleteByProjectRequest, context: CallContext & CallContextExt): Promise<DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: MonthlyProductionServiceDeleteByWellRequest, context: CallContext & CallContextExt): Promise<DeepPartial<MonthlyProductionServiceDeleteByWellResponse>>;
    /** Delete all production data for the given wells. */
    deleteByManyWells(request: MonthlyProductionServiceDeleteByManyWellsRequest, context: CallContext & CallContextExt): Promise<DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>>;
}
export interface MonthlyProductionServiceClient<CallOptionsExt = {}> {
    /** Upsert monthly production data for multiple wells. */
    upsert(request: AsyncIterable<DeepPartial<MonthlyProductionServiceUpsertRequest>>, options?: CallOptions & CallOptionsExt): Promise<MonthlyProductionServiceUpsertResponse>;
    /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope(request: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>, options?: CallOptions & CallOptionsExt): Promise<MonthlyProductionServiceChangeToCompanyScopeResponse>;
    /**
     * Fetch monthly production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch(request: DeepPartial<MonthlyProductionServiceFetchRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<MonthlyProductionServiceFetchResponse>;
    /** Calculate the sum of monthly production phases for multiple wells. */
    sumByWell(request: DeepPartial<MonthlyProductionServiceSumByWellRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<MonthlyProductionServiceSumByWellResponse>;
    /** Calculate the amount of values of monthly production phases for multiple wells. */
    countByWell(request: DeepPartial<MonthlyProductionServiceCountByWellRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<MonthlyProductionServiceCountByWellResponse>;
    /** Delete all production data for the given project. */
    deleteByProject(request: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>, options?: CallOptions & CallOptionsExt): Promise<MonthlyProductionServiceDeleteByProjectResponse>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>, options?: CallOptions & CallOptionsExt): Promise<MonthlyProductionServiceDeleteByWellResponse>;
    /** Delete all production data for the given wells. */
    deleteByManyWells(request: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>, options?: CallOptions & CallOptionsExt): Promise<MonthlyProductionServiceDeleteByManyWellsResponse>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export type ServerStreamingMethodResult<Response> = {
    [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
export {};
