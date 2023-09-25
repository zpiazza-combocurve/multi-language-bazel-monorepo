export { buildFieldMask, inferFieldMask } from './field-mask-helper';
export type DalClient = Awaited<ReturnType<typeof initClient>>;
export declare function initClient(config: {
    dalUrl: string;
    tenantId: string;
}): Promise<{
    dailyProduction: import("nice-grpc").RawClient<import("nice-grpc/lib/service-definitions/ts-proto").FromTsProtoServiceDefinition<{
        readonly name: "DailyProductionService";
        readonly fullName: "combocurve.dal.v1.DailyProductionService";
        readonly methods: {
            readonly upsert: {
                readonly name: "Upsert";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        well?: string | undefined;
                        date?: Date | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        well?: string | undefined;
                        date?: Date | undefined;
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
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertRequest;
                };
                readonly requestStream: true;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceUpsertResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly changeToCompanyScope: {
                readonly name: "ChangeToCompanyScope";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest): unknown;
                    create(base?: {
                        wells?: string[] | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest;
                    fromPartial(object: {
                        wells?: string[] | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceChangeToCompanyScopeResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly fetch: {
                readonly name: "Fetch";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse): unknown;
                    create(base?: {
                        date?: Date | undefined;
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse;
                    fromPartial(object: {
                        date?: Date | undefined;
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceFetchResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly sumByWell: {
                readonly name: "SumByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse): unknown;
                    create(base?: {
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse;
                    fromPartial(object: {
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceSumByWellResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly countByWell: {
                readonly name: "CountByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse): unknown;
                    create(base?: {
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse;
                    fromPartial(object: {
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceCountByWellResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly deleteByProject: {
                readonly name: "DeleteByProject";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest): unknown;
                    create(base?: {
                        project?: string | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest;
                    fromPartial(object: {
                        project?: string | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByProjectResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly deleteByWell: {
                readonly name: "DeleteByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest): unknown;
                    create(base?: {
                        well?: string | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest;
                    fromPartial(object: {
                        well?: string | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByWellResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly deleteByManyWells: {
                readonly name: "DeleteByManyWells";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest): unknown;
                    create(base?: {
                        wells?: string[] | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest;
                    fromPartial(object: {
                        wells?: string[] | undefined;
                    }): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/daily_production").DailyProductionServiceDeleteByManyWellsResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
        };
    }>, {}>;
    monthlyProduction: import("nice-grpc").RawClient<import("nice-grpc/lib/service-definitions/ts-proto").FromTsProtoServiceDefinition<{
        readonly name: "MonthlyProductionService";
        readonly fullName: "combocurve.dal.v1.MonthlyProductionService";
        readonly methods: {
            readonly upsert: {
                readonly name: "Upsert";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        well?: string | undefined;
                        date?: Date | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        well?: string | undefined;
                        date?: Date | undefined;
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
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertRequest;
                };
                readonly requestStream: true;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceUpsertResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly changeToCompanyScope: {
                readonly name: "ChangeToCompanyScope";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest): unknown;
                    create(base?: {
                        wells?: string[] | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest;
                    fromPartial(object: {
                        wells?: string[] | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceChangeToCompanyScopeResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly fetch: {
                readonly name: "Fetch";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse): unknown;
                    create(base?: {
                        date?: Date | undefined;
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse;
                    fromPartial(object: {
                        date?: Date | undefined;
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceFetchResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly sumByWell: {
                readonly name: "SumByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse): unknown;
                    create(base?: {
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse;
                    fromPartial(object: {
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceSumByWellResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly countByWell: {
                readonly name: "CountByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest): unknown;
                    create(base?: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest;
                    fromPartial(object: {
                        fieldMask?: string[] | undefined;
                        wells?: string[] | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                        onlyPhysicalWells?: boolean | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse): unknown;
                    create(base?: {
                        well?: string | undefined;
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
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse;
                    fromPartial(object: {
                        well?: string | undefined;
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
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceCountByWellResponse;
                };
                readonly responseStream: true;
                readonly options: {};
            };
            readonly deleteByProject: {
                readonly name: "DeleteByProject";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest): unknown;
                    create(base?: {
                        project?: string | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest;
                    fromPartial(object: {
                        project?: string | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByProjectResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly deleteByWell: {
                readonly name: "DeleteByWell";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest): unknown;
                    create(base?: {
                        well?: string | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest;
                    fromPartial(object: {
                        well?: string | undefined;
                        dateRange?: {
                            startDate?: Date | undefined;
                            endDate?: Date | undefined;
                        } | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByWellResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
            readonly deleteByManyWells: {
                readonly name: "DeleteByManyWells";
                readonly requestType: {
                    encode(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest;
                    fromJSON(object: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest;
                    toJSON(message: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest): unknown;
                    create(base?: {
                        wells?: string[] | undefined;
                    } | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest;
                    fromPartial(object: {
                        wells?: string[] | undefined;
                    }): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsRequest;
                };
                readonly requestStream: false;
                readonly responseType: {
                    encode(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse, writer?: import("protobufjs").Writer): import("protobufjs").Writer;
                    decode(input: Uint8Array | import("protobufjs").Reader, length?: number | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse;
                    fromJSON(_: any): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse;
                    toJSON(_: import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse): unknown;
                    create(base?: {} | undefined): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse;
                    fromPartial(_: {}): import("./gen/combocurve/dal/v1/monthly_production").MonthlyProductionServiceDeleteByManyWellsResponse;
                };
                readonly responseStream: false;
                readonly options: {};
            };
        };
    }>, {}>;
}>;
