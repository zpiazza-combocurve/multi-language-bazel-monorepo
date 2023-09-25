import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { DateRange } from "../../common/v1/date_range";
export declare const protobufPackage = "combocurve.external.v1";
export interface ExternalMonthlyProductionServiceCountRequest {
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
export interface ExternalMonthlyProductionServiceCountResponse {
    count: number;
}
export interface ExternalMonthlyProductionServiceFetchRequest {
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
export interface ExternalMonthlyProductionServiceFetchResponse {
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
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
export interface ExternalMonthlyProductionServiceUpsertRequest {
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
export interface ExternalMonthlyProductionServiceUpsertResponse {
}
export interface ExternalMonthlyProductionServiceDeleteByWellRequest {
    well: string;
    dateRange: DateRange | undefined;
}
export interface ExternalMonthlyProductionServiceDeleteByWellResponse {
}
export declare const ExternalMonthlyProductionServiceCountRequest: {
    encode(message: ExternalMonthlyProductionServiceCountRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountRequest;
    fromJSON(object: any): ExternalMonthlyProductionServiceCountRequest;
    toJSON(message: ExternalMonthlyProductionServiceCountRequest): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceCountRequest>): ExternalMonthlyProductionServiceCountRequest;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceCountRequest>): ExternalMonthlyProductionServiceCountRequest;
};
export declare const ExternalMonthlyProductionServiceCountResponse: {
    encode(message: ExternalMonthlyProductionServiceCountResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountResponse;
    fromJSON(object: any): ExternalMonthlyProductionServiceCountResponse;
    toJSON(message: ExternalMonthlyProductionServiceCountResponse): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceCountResponse>): ExternalMonthlyProductionServiceCountResponse;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceCountResponse>): ExternalMonthlyProductionServiceCountResponse;
};
export declare const ExternalMonthlyProductionServiceFetchRequest: {
    encode(message: ExternalMonthlyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchRequest;
    fromJSON(object: any): ExternalMonthlyProductionServiceFetchRequest;
    toJSON(message: ExternalMonthlyProductionServiceFetchRequest): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>): ExternalMonthlyProductionServiceFetchRequest;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>): ExternalMonthlyProductionServiceFetchRequest;
};
export declare const ExternalMonthlyProductionServiceFetchResponse: {
    encode(message: ExternalMonthlyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchResponse;
    fromJSON(object: any): ExternalMonthlyProductionServiceFetchResponse;
    toJSON(message: ExternalMonthlyProductionServiceFetchResponse): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>): ExternalMonthlyProductionServiceFetchResponse;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>): ExternalMonthlyProductionServiceFetchResponse;
};
export declare const ExternalMonthlyProductionServiceUpsertRequest: {
    encode(message: ExternalMonthlyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertRequest;
    fromJSON(object: any): ExternalMonthlyProductionServiceUpsertRequest;
    toJSON(message: ExternalMonthlyProductionServiceUpsertRequest): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>): ExternalMonthlyProductionServiceUpsertRequest;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>): ExternalMonthlyProductionServiceUpsertRequest;
};
export declare const ExternalMonthlyProductionServiceUpsertResponse: {
    encode(_: ExternalMonthlyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertResponse;
    fromJSON(_: any): ExternalMonthlyProductionServiceUpsertResponse;
    toJSON(_: ExternalMonthlyProductionServiceUpsertResponse): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>): ExternalMonthlyProductionServiceUpsertResponse;
    fromPartial(_: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>): ExternalMonthlyProductionServiceUpsertResponse;
};
export declare const ExternalMonthlyProductionServiceDeleteByWellRequest: {
    encode(message: ExternalMonthlyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellRequest;
    fromJSON(object: any): ExternalMonthlyProductionServiceDeleteByWellRequest;
    toJSON(message: ExternalMonthlyProductionServiceDeleteByWellRequest): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>): ExternalMonthlyProductionServiceDeleteByWellRequest;
    fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>): ExternalMonthlyProductionServiceDeleteByWellRequest;
};
export declare const ExternalMonthlyProductionServiceDeleteByWellResponse: {
    encode(_: ExternalMonthlyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellResponse;
    fromJSON(_: any): ExternalMonthlyProductionServiceDeleteByWellResponse;
    toJSON(_: ExternalMonthlyProductionServiceDeleteByWellResponse): unknown;
    create(base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>): ExternalMonthlyProductionServiceDeleteByWellResponse;
    fromPartial(_: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>): ExternalMonthlyProductionServiceDeleteByWellResponse;
};
export type ExternalMonthlyProductionServiceDefinition = typeof ExternalMonthlyProductionServiceDefinition;
export declare const ExternalMonthlyProductionServiceDefinition: {
    readonly name: "ExternalMonthlyProductionService";
    readonly fullName: "combocurve.external.v1.ExternalMonthlyProductionService";
    readonly methods: {
        /** Count monthly production data for multiple wells. */
        readonly count: {
            readonly name: "Count";
            readonly requestType: {
                encode(message: ExternalMonthlyProductionServiceCountRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountRequest;
                fromJSON(object: any): ExternalMonthlyProductionServiceCountRequest;
                toJSON(message: ExternalMonthlyProductionServiceCountRequest): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceCountRequest>): ExternalMonthlyProductionServiceCountRequest;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceCountRequest>): ExternalMonthlyProductionServiceCountRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: ExternalMonthlyProductionServiceCountResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountResponse;
                fromJSON(object: any): ExternalMonthlyProductionServiceCountResponse;
                toJSON(message: ExternalMonthlyProductionServiceCountResponse): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceCountResponse>): ExternalMonthlyProductionServiceCountResponse;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceCountResponse>): ExternalMonthlyProductionServiceCountResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
        /** Fetch monthly production data for multiple wells. */
        readonly fetch: {
            readonly name: "Fetch";
            readonly requestType: {
                encode(message: ExternalMonthlyProductionServiceFetchRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchRequest;
                fromJSON(object: any): ExternalMonthlyProductionServiceFetchRequest;
                toJSON(message: ExternalMonthlyProductionServiceFetchRequest): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>): ExternalMonthlyProductionServiceFetchRequest;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>): ExternalMonthlyProductionServiceFetchRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(message: ExternalMonthlyProductionServiceFetchResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchResponse;
                fromJSON(object: any): ExternalMonthlyProductionServiceFetchResponse;
                toJSON(message: ExternalMonthlyProductionServiceFetchResponse): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>): ExternalMonthlyProductionServiceFetchResponse;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>): ExternalMonthlyProductionServiceFetchResponse;
            };
            readonly responseStream: true;
            readonly options: {};
        };
        /** Upsert monthly production data for multiple wells. */
        readonly upsert: {
            readonly name: "Upsert";
            readonly requestType: {
                encode(message: ExternalMonthlyProductionServiceUpsertRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertRequest;
                fromJSON(object: any): ExternalMonthlyProductionServiceUpsertRequest;
                toJSON(message: ExternalMonthlyProductionServiceUpsertRequest): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>): ExternalMonthlyProductionServiceUpsertRequest;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>): ExternalMonthlyProductionServiceUpsertRequest;
            };
            readonly requestStream: true;
            readonly responseType: {
                encode(_: ExternalMonthlyProductionServiceUpsertResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertResponse;
                fromJSON(_: any): ExternalMonthlyProductionServiceUpsertResponse;
                toJSON(_: ExternalMonthlyProductionServiceUpsertResponse): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>): ExternalMonthlyProductionServiceUpsertResponse;
                fromPartial(_: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>): ExternalMonthlyProductionServiceUpsertResponse;
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
                encode(message: ExternalMonthlyProductionServiceDeleteByWellRequest, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellRequest;
                fromJSON(object: any): ExternalMonthlyProductionServiceDeleteByWellRequest;
                toJSON(message: ExternalMonthlyProductionServiceDeleteByWellRequest): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>): ExternalMonthlyProductionServiceDeleteByWellRequest;
                fromPartial(object: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>): ExternalMonthlyProductionServiceDeleteByWellRequest;
            };
            readonly requestStream: false;
            readonly responseType: {
                encode(_: ExternalMonthlyProductionServiceDeleteByWellResponse, writer?: _m0.Writer): _m0.Writer;
                decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellResponse;
                fromJSON(_: any): ExternalMonthlyProductionServiceDeleteByWellResponse;
                toJSON(_: ExternalMonthlyProductionServiceDeleteByWellResponse): unknown;
                create(base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>): ExternalMonthlyProductionServiceDeleteByWellResponse;
                fromPartial(_: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>): ExternalMonthlyProductionServiceDeleteByWellResponse;
            };
            readonly responseStream: false;
            readonly options: {};
        };
    };
};
export interface ExternalMonthlyProductionServiceImplementation<CallContextExt = {}> {
    /** Count monthly production data for multiple wells. */
    count(request: ExternalMonthlyProductionServiceCountRequest, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalMonthlyProductionServiceCountResponse>>;
    /** Fetch monthly production data for multiple wells. */
    fetch(request: ExternalMonthlyProductionServiceFetchRequest, context: CallContext & CallContextExt): ServerStreamingMethodResult<DeepPartial<ExternalMonthlyProductionServiceFetchResponse>>;
    /** Upsert monthly production data for multiple wells. */
    upsert(request: AsyncIterable<ExternalMonthlyProductionServiceUpsertRequest>, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: ExternalMonthlyProductionServiceDeleteByWellRequest, context: CallContext & CallContextExt): Promise<DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>>;
}
export interface ExternalMonthlyProductionServiceClient<CallOptionsExt = {}> {
    /** Count monthly production data for multiple wells. */
    count(request: DeepPartial<ExternalMonthlyProductionServiceCountRequest>, options?: CallOptions & CallOptionsExt): Promise<ExternalMonthlyProductionServiceCountResponse>;
    /** Fetch monthly production data for multiple wells. */
    fetch(request: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>, options?: CallOptions & CallOptionsExt): AsyncIterable<ExternalMonthlyProductionServiceFetchResponse>;
    /** Upsert monthly production data for multiple wells. */
    upsert(request: AsyncIterable<DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>>, options?: CallOptions & CallOptionsExt): Promise<ExternalMonthlyProductionServiceUpsertResponse>;
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell(request: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>, options?: CallOptions & CallOptionsExt): Promise<ExternalMonthlyProductionServiceDeleteByWellResponse>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export type ServerStreamingMethodResult<Response> = {
    [Symbol.asyncIterator](): AsyncIterator<Response, void>;
};
export {};
