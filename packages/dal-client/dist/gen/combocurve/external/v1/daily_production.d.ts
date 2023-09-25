import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { DateRange } from "../../common/v1/date_range";
export declare const protobufPackage = "combocurve.external.v1";
export interface ExternalDailyProductionServiceCountRequest {
    /**
     * API layers are responsible for enforcing that the size of `wells` is
     * reasonable for a single request.
     */
    wells: string[];
    /** When null or missing, only company-level wells will be returned. */
    project?: string | undefined;
    dateRange: DateRange | undefined;
    createdAtRange: DateRange | undefined;
    updatedAtRange: DateRange | undefined;
    onlyPhysicalWells?: boolean | undefined;
}
export interface ExternalDailyProductionServiceCountResponse {
    count: number;
}
export interface ExternalDailyProductionServiceFetchRequest {
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
    /** When null or missing, only company-level wells will be returned. */
    project?: string | undefined;
    dateRange: DateRange | undefined;
    createdAtRange: DateRange | undefined;
    updatedAtRange: DateRange | undefined;
    /**
     * Sort by the given field. Allowed fields are `well`, `date`, `createdAt`,
     * and `updatedAt`. An optional `+` or `-` prefix can be used to sort in
     * ascending or descending order, respectively. The default is ascending
     * order.
     */
    sort?: string | undefined;
    skip?: number | undefined;
    take?: number | undefined;
    onlyPhysicalWells?: boolean | undefined;
}
export interface ExternalDailyProductionServiceFetchResponse {
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
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
export interface ExternalDailyProductionServiceUpsertRequest {
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
     * company-level wells.
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
export interface ExternalDailyProductionServiceUpsertResponse {
}
export interface ExternalDailyProductionServiceDeleteByWellRequest {
    well: string;
    dateRange: DateRange | undefined;
}
export interface ExternalDailyProductionServiceDeleteByWellResponse {
}
export declare const ExternalDailyProductionServiceCountRequest: {
    encode(message: ExternalDailyProductionServiceCountRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceCountRequest;
    fromJSON(object: any): ExternalDailyProductionServiceCountRequest;
    toJSON(message: ExternalDailyProductionServiceCountRequest): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceCountRequest>): ExternalDailyProductionServiceCountRequest;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceCountRequest>): ExternalDailyProductionServiceCountRequest;
};
export declare const ExternalDailyProductionServiceCountResponse: {
    encode(message: ExternalDailyProductionServiceCountResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceCountResponse;
    fromJSON(object: any): ExternalDailyProductionServiceCountResponse;
    toJSON(message: ExternalDailyProductionServiceCountResponse): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceCountResponse>): ExternalDailyProductionServiceCountResponse;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceCountResponse>): ExternalDailyProductionServiceCountResponse;
};
export declare const ExternalDailyProductionServiceFetchRequest: {
    encode(message: ExternalDailyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceFetchRequest;
    fromJSON(object: any): ExternalDailyProductionServiceFetchRequest;
    toJSON(message: ExternalDailyProductionServiceFetchRequest): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceFetchRequest>): ExternalDailyProductionServiceFetchRequest;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceFetchRequest>): ExternalDailyProductionServiceFetchRequest;
};
export declare const ExternalDailyProductionServiceFetchResponse: {
    encode(message: ExternalDailyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceFetchResponse;
    fromJSON(object: any): ExternalDailyProductionServiceFetchResponse;
    toJSON(message: ExternalDailyProductionServiceFetchResponse): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceFetchResponse>): ExternalDailyProductionServiceFetchResponse;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceFetchResponse>): ExternalDailyProductionServiceFetchResponse;
};
export declare const ExternalDailyProductionServiceUpsertRequest: {
    encode(message: ExternalDailyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceUpsertRequest;
    fromJSON(object: any): ExternalDailyProductionServiceUpsertRequest;
    toJSON(message: ExternalDailyProductionServiceUpsertRequest): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceUpsertRequest>): ExternalDailyProductionServiceUpsertRequest;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceUpsertRequest>): ExternalDailyProductionServiceUpsertRequest;
};
export declare const ExternalDailyProductionServiceUpsertResponse: {
    encode(_: ExternalDailyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceUpsertResponse;
    fromJSON(_: any): ExternalDailyProductionServiceUpsertResponse;
    toJSON(_: ExternalDailyProductionServiceUpsertResponse): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceUpsertResponse>): ExternalDailyProductionServiceUpsertResponse;
    fromPartial(_: DeepPartial<ExternalDailyProductionServiceUpsertResponse>): ExternalDailyProductionServiceUpsertResponse;
};
export declare const ExternalDailyProductionServiceDeleteByWellRequest: {
    encode(message: ExternalDailyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceDeleteByWellRequest;
    fromJSON(object: any): ExternalDailyProductionServiceDeleteByWellRequest;
    toJSON(message: ExternalDailyProductionServiceDeleteByWellRequest): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceDeleteByWellRequest>): ExternalDailyProductionServiceDeleteByWellRequest;
    fromPartial(object: DeepPartial<ExternalDailyProductionServiceDeleteByWellRequest>): ExternalDailyProductionServiceDeleteByWellRequest;
};
export declare const ExternalDailyProductionServiceDeleteByWellResponse: {
    encode(_: ExternalDailyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceDeleteByWellResponse;
    fromJSON(_: any): ExternalDailyProductionServiceDeleteByWellResponse;
    toJSON(_: ExternalDailyProductionServiceDeleteByWellResponse): unknown;
    create(base?: DeepPartial<ExternalDailyProductionServiceDeleteByWellResponse>): ExternalDailyProductionServiceDeleteByWellResponse;
    fromPartial(_: DeepPartial<ExternalDailyProductionServiceDeleteByWellResponse>): ExternalDailyProductionServiceDeleteByWellResponse;
};
export type ExternalDailyProductionServiceDefinition = typeof ExternalDailyProductionServiceDefinition;
export declare const ExternalDailyProductionServiceDefinition: {
    readonly name: "ExternalDailyProductionService";
    readonly fullName: "combocurve.external.v1.ExternalDailyProductionService";
    readonly methods: {
        /** Count daily production data for multiple wells. */
        readonly count: {
            readonly name: "Count";
            readonly requestType: {
                encode(message: ExternalDailyProductionServiceCountRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceCountRequest;
                fromJSON(object: any): ExternalDailyProductionServiceCountRequest;
                toJSON(message: ExternalDailyProductionServiceCountRequest): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceCountRequest>): ExternalDailyProductionServiceCountRequest;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceCountRequest>): ExternalDailyProductionServiceCountRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: ExternalDailyProductionServiceCountResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceCountResponse;
                fromJSON(object: any): ExternalDailyProductionServiceCountResponse;
                toJSON(message: ExternalDailyProductionServiceCountResponse): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceCountResponse>): ExternalDailyProductionServiceCountResponse;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceCountResponse>): ExternalDailyProductionServiceCountResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Fetch daily production data for multiple wells. */
        readonly fetch: {
            readonly name: "Fetch";
            readonly requestType: {
                encode(message: ExternalDailyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceFetchRequest;
                fromJSON(object: any): ExternalDailyProductionServiceFetchRequest;
                toJSON(message: ExternalDailyProductionServiceFetchRequest): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceFetchRequest>): ExternalDailyProductionServiceFetchRequest;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceFetchRequest>): ExternalDailyProductionServiceFetchRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: ExternalDailyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceFetchResponse;
                fromJSON(object: any): ExternalDailyProductionServiceFetchResponse;
                toJSON(message: ExternalDailyProductionServiceFetchResponse): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceFetchResponse>): ExternalDailyProductionServiceFetchResponse;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceFetchResponse>): ExternalDailyProductionServiceFetchResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Upsert daily production data for multiple wells. */
        readonly upsert: {
            readonly name: "Upsert";
            readonly requestType: {
                encode(message: ExternalDailyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceUpsertRequest;
                fromJSON(object: any): ExternalDailyProductionServiceUpsertRequest;
                toJSON(message: ExternalDailyProductionServiceUpsertRequest): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceUpsertRequest>): ExternalDailyProductionServiceUpsertRequest;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceUpsertRequest>): ExternalDailyProductionServiceUpsertRequest;
            };
            readonly requestStream: true;
            readonly responseType: {
                encode(_: ExternalDailyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceUpsertResponse;
                fromJSON(_: any): ExternalDailyProductionServiceUpsertResponse;
                toJSON(_: ExternalDailyProductionServiceUpsertResponse): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceUpsertResponse>): ExternalDailyProductionServiceUpsertResponse;
                fromPartial(_: DeepPartial<ExternalDailyProductionServiceUpsertResponse>): ExternalDailyProductionServiceUpsertResponse;
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
                encode(message: ExternalDailyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceDeleteByWellRequest;
                fromJSON(object: any): ExternalDailyProductionServiceDeleteByWellRequest;
                toJSON(message: ExternalDailyProductionServiceDeleteByWellRequest): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceDeleteByWellRequest>): ExternalDailyProductionServiceDeleteByWellRequest;
                fromPartial(object: DeepPartial<ExternalDailyProductionServiceDeleteByWellRequest>): ExternalDailyProductionServiceDeleteByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: ExternalDailyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalDailyProductionServiceDeleteByWellResponse;
                fromJSON(_: any): ExternalDailyProductionServiceDeleteByWellResponse;
                toJSON(_: ExternalDailyProductionServiceDeleteByWellResponse): unknown;
                create(base?: DeepPartial<ExternalDailyProductionServiceDeleteByWellResponse>): ExternalDailyProductionServiceDeleteByWellResponse;
                fromPartial(_: DeepPartial<ExternalDailyProductionServiceDeleteByWellResponse>): ExternalDailyProductionServiceDeleteByWellResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
    };
};
export interface ExternalDailyProductionServiceImplementation<CallContextExt = {}> {
    /** Count daily production data for multiple wells. */
    count(request: ExternalDailyProductionServiceCountRequest, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalDailyProductionServiceCountResponse>>;
    /** Fetch daily production data for multiple wells. */
    fetch(request: ExternalDailyProductionServiceFetchRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<ExternalDailyProductionServiceFetchResponse>>;
    /** Upsert daily production data for multiple wells. */
    upsert(request: AsyncIterable<ExternalDailyProductionServiceUpsertRequest>, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalDailyProductionServiceUpsertResponse>>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: ExternalDailyProductionServiceDeleteByWellRequest, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalDailyProductionServiceDeleteByWellResponse>>;
}
export interface ExternalDailyProductionServiceClient<CallOptionsExt = {}> {
    /** Count daily production data for multiple wells. */
    count(request: DeepPartial<ExternalDailyProductionServiceCountRequest>, options?: CallOptions & CallOptionsExt): Promise<ExternalDailyProductionServiceCountResponse>;
    /** Fetch daily production data for multiple wells. */
    fetch(request: DeepPartial<ExternalDailyProductionServiceFetchRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<ExternalDailyProductionServiceFetchResponse>;
    /** Upsert daily production data for multiple wells. */
    upsert(request: AsyncIterable<DeepPartial<ExternalDailyProductionServiceUpsertRequest>>, options?: CallOptions & CallOptionsExt): Promise<ExternalDailyProductionServiceUpsertResponse>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: DeepPartial<ExternalDailyProductionServiceDeleteByWellRequest>, options?: CallOptions & CallOptionsExt): Promise<ExternalDailyProductionServiceDeleteByWellResponse>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export type ServerStreamingMethodResult<Response> = {
    [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
export {};
