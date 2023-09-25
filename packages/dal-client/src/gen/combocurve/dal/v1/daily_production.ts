/* eslint-disable */
import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { FieldMask } from "../../../google/protobuf/field_mask";
import { Timestamp } from "../../../google/protobuf/timestamp";
import { DateRange } from "../../common/v1/date_range";

export const protobufPackage = "combocurve.dal.v1";

export interface DailyProductionServiceUpsertRequest {
  /**
   * A list of fields to consider during this request. The default is all
   * fields. API layers are responsible for implementing this behavior.
   */
  fieldMask:
    | string[]
    | undefined;
  /**
   * Required. The combination of `well` + `date` identifies a production
   * record.
   */
  well: string;
  /**
   * Required. The combination of `well` + `date` identifies a production
   * record.
   */
  date:
    | Date
    | undefined;
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
  fieldMask:
    | string[]
    | undefined;
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

export interface DailyProductionServiceFetchByWellRequest {
  /**
   * A list of fields to consider during this request. The default is all
   * fields. API layers are responsible for implementing this behavior.
   */
  fieldMask:
    | string[]
    | undefined;
  /**
   * API layers are responsible for enforcing that the size of `wells` is
   * reasonable for a single request.
   */
  wells: string[];
  dateRange: DateRange | undefined;
  onlyPhysicalWells?: boolean | undefined;
}

export interface DailyProductionServiceFetchByWellResponse {
  date: Date[];
  well: string;
  project?: string | undefined;
  bottomHolePressure: number[];
  casingHeadPressure: number[];
  choke: number[];
  co2Injection: number[];
  flowlinePressure: number[];
  gas: number[];
  gasInjection: number[];
  gasLiftInjectionPressure: number[];
  hoursOn: number[];
  ngl: number[];
  oil: number[];
  steamInjection: number[];
  tubingHeadPressure: number[];
  vesselSeparatorPressure: number[];
  water: number[];
  waterInjection: number[];
  customNumber0: number[];
  customNumber1: number[];
  customNumber2: number[];
  customNumber3: number[];
  customNumber4: number[];
}

export interface DailyProductionServiceSumByWellRequest {
  /**
   * A list of fields to consider during this request. The default is all
   * fields. API layers are responsible for implementing this behavior.
   */
  fieldMask:
    | string[]
    | undefined;
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
  fieldMask:
    | string[]
    | undefined;
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

function createBaseDailyProductionServiceUpsertRequest(): DailyProductionServiceUpsertRequest {
  return {
    fieldMask: undefined,
    well: "",
    date: undefined,
    project: undefined,
    bottomHolePressure: undefined,
    casingHeadPressure: undefined,
    choke: undefined,
    co2Injection: undefined,
    flowlinePressure: undefined,
    gas: undefined,
    gasInjection: undefined,
    gasLiftInjectionPressure: undefined,
    hoursOn: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    tubingHeadPressure: undefined,
    vesselSeparatorPressure: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
    operationalTag: undefined,
  };
}

export const DailyProductionServiceUpsertRequest = {
  encode(message: DailyProductionServiceUpsertRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    if (message.well !== "") {
      writer.uint32(18).string(message.well);
    }
    if (message.date !== undefined) {
      Timestamp.encode(toTimestamp(message.date), writer.uint32(26).fork()).ldelim();
    }
    if (message.project !== undefined) {
      writer.uint32(34).string(message.project);
    }
    if (message.bottomHolePressure !== undefined) {
      writer.uint32(41).double(message.bottomHolePressure);
    }
    if (message.casingHeadPressure !== undefined) {
      writer.uint32(49).double(message.casingHeadPressure);
    }
    if (message.choke !== undefined) {
      writer.uint32(57).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(65).double(message.co2Injection);
    }
    if (message.flowlinePressure !== undefined) {
      writer.uint32(73).double(message.flowlinePressure);
    }
    if (message.gas !== undefined) {
      writer.uint32(81).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(89).double(message.gasInjection);
    }
    if (message.gasLiftInjectionPressure !== undefined) {
      writer.uint32(97).double(message.gasLiftInjectionPressure);
    }
    if (message.hoursOn !== undefined) {
      writer.uint32(105).double(message.hoursOn);
    }
    if (message.ngl !== undefined) {
      writer.uint32(113).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(121).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(129).double(message.steamInjection);
    }
    if (message.tubingHeadPressure !== undefined) {
      writer.uint32(137).double(message.tubingHeadPressure);
    }
    if (message.vesselSeparatorPressure !== undefined) {
      writer.uint32(145).double(message.vesselSeparatorPressure);
    }
    if (message.water !== undefined) {
      writer.uint32(153).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(161).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(169).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(177).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(185).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(193).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(201).double(message.customNumber4);
    }
    if (message.operationalTag !== undefined) {
      writer.uint32(210).string(message.operationalTag);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceUpsertRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fieldMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.well = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.date = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.project = reader.string();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.bottomHolePressure = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.casingHeadPressure = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.choke = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.flowlinePressure = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.gasLiftInjectionPressure = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.hoursOn = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
            break;
          }

          message.tubingHeadPressure = reader.double();
          continue;
        case 18:
          if (tag !== 145) {
            break;
          }

          message.vesselSeparatorPressure = reader.double();
          continue;
        case 19:
          if (tag !== 153) {
            break;
          }

          message.water = reader.double();
          continue;
        case 20:
          if (tag !== 161) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 21:
          if (tag !== 169) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 22:
          if (tag !== 177) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 23:
          if (tag !== 185) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 24:
          if (tag !== 193) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 25:
          if (tag !== 201) {
            break;
          }

          message.customNumber4 = reader.double();
          continue;
        case 26:
          if (tag !== 210) {
            break;
          }

          message.operationalTag = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceUpsertRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      well: isSet(object.well) ? String(object.well) : "",
      date: isSet(object.date) ? fromJsonTimestamp(object.date) : undefined,
      project: isSet(object.project) ? String(object.project) : undefined,
      bottomHolePressure: isSet(object.bottomHolePressure) ? Number(object.bottomHolePressure) : undefined,
      casingHeadPressure: isSet(object.casingHeadPressure) ? Number(object.casingHeadPressure) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      flowlinePressure: isSet(object.flowlinePressure) ? Number(object.flowlinePressure) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      gasLiftInjectionPressure: isSet(object.gasLiftInjectionPressure)
        ? Number(object.gasLiftInjectionPressure)
        : undefined,
      hoursOn: isSet(object.hoursOn) ? Number(object.hoursOn) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      tubingHeadPressure: isSet(object.tubingHeadPressure) ? Number(object.tubingHeadPressure) : undefined,
      vesselSeparatorPressure: isSet(object.vesselSeparatorPressure)
        ? Number(object.vesselSeparatorPressure)
        : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
      operationalTag: isSet(object.operationalTag) ? String(object.operationalTag) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceUpsertRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    message.well !== undefined && (obj.well = message.well);
    message.date !== undefined && (obj.date = message.date.toISOString());
    message.project !== undefined && (obj.project = message.project);
    message.bottomHolePressure !== undefined && (obj.bottomHolePressure = message.bottomHolePressure);
    message.casingHeadPressure !== undefined && (obj.casingHeadPressure = message.casingHeadPressure);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.flowlinePressure !== undefined && (obj.flowlinePressure = message.flowlinePressure);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.gasLiftInjectionPressure !== undefined && (obj.gasLiftInjectionPressure = message.gasLiftInjectionPressure);
    message.hoursOn !== undefined && (obj.hoursOn = message.hoursOn);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.tubingHeadPressure !== undefined && (obj.tubingHeadPressure = message.tubingHeadPressure);
    message.vesselSeparatorPressure !== undefined && (obj.vesselSeparatorPressure = message.vesselSeparatorPressure);
    message.water !== undefined && (obj.water = message.water);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    message.operationalTag !== undefined && (obj.operationalTag = message.operationalTag);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest {
    return DailyProductionServiceUpsertRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceUpsertRequest>): DailyProductionServiceUpsertRequest {
    const message = createBaseDailyProductionServiceUpsertRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.well = object.well ?? "";
    message.date = object.date ?? undefined;
    message.project = object.project ?? undefined;
    message.bottomHolePressure = object.bottomHolePressure ?? undefined;
    message.casingHeadPressure = object.casingHeadPressure ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.flowlinePressure = object.flowlinePressure ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.gasLiftInjectionPressure = object.gasLiftInjectionPressure ?? undefined;
    message.hoursOn = object.hoursOn ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
    message.tubingHeadPressure = object.tubingHeadPressure ?? undefined;
    message.vesselSeparatorPressure = object.vesselSeparatorPressure ?? undefined;
    message.water = object.water ?? undefined;
    message.waterInjection = object.waterInjection ?? undefined;
    message.customNumber0 = object.customNumber0 ?? undefined;
    message.customNumber1 = object.customNumber1 ?? undefined;
    message.customNumber2 = object.customNumber2 ?? undefined;
    message.customNumber3 = object.customNumber3 ?? undefined;
    message.customNumber4 = object.customNumber4 ?? undefined;
    message.operationalTag = object.operationalTag ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceUpsertResponse(): DailyProductionServiceUpsertResponse {
  return {};
}

export const DailyProductionServiceUpsertResponse = {
  encode(_: DailyProductionServiceUpsertResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceUpsertResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceUpsertResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DailyProductionServiceUpsertResponse {
    return {};
  },

  toJSON(_: DailyProductionServiceUpsertResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse {
    return DailyProductionServiceUpsertResponse.fromPartial(base ?? {});
  },

  fromPartial(_: DeepPartial<DailyProductionServiceUpsertResponse>): DailyProductionServiceUpsertResponse {
    const message = createBaseDailyProductionServiceUpsertResponse();
    return message;
  },
};

function createBaseDailyProductionServiceChangeToCompanyScopeRequest(): DailyProductionServiceChangeToCompanyScopeRequest {
  return { wells: [] };
}

export const DailyProductionServiceChangeToCompanyScopeRequest = {
  encode(
    message: DailyProductionServiceChangeToCompanyScopeRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.wells) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceChangeToCompanyScopeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.wells.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceChangeToCompanyScopeRequest {
    return { wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [] };
  },

  toJSON(message: DailyProductionServiceChangeToCompanyScopeRequest): unknown {
    const obj: any = {};
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>,
  ): DailyProductionServiceChangeToCompanyScopeRequest {
    return DailyProductionServiceChangeToCompanyScopeRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>,
  ): DailyProductionServiceChangeToCompanyScopeRequest {
    const message = createBaseDailyProductionServiceChangeToCompanyScopeRequest();
    message.wells = object.wells?.map((e) => e) || [];
    return message;
  },
};

function createBaseDailyProductionServiceChangeToCompanyScopeResponse(): DailyProductionServiceChangeToCompanyScopeResponse {
  return {};
}

export const DailyProductionServiceChangeToCompanyScopeResponse = {
  encode(_: DailyProductionServiceChangeToCompanyScopeResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceChangeToCompanyScopeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceChangeToCompanyScopeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DailyProductionServiceChangeToCompanyScopeResponse {
    return {};
  },

  toJSON(_: DailyProductionServiceChangeToCompanyScopeResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>,
  ): DailyProductionServiceChangeToCompanyScopeResponse {
    return DailyProductionServiceChangeToCompanyScopeResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>,
  ): DailyProductionServiceChangeToCompanyScopeResponse {
    const message = createBaseDailyProductionServiceChangeToCompanyScopeResponse();
    return message;
  },
};

function createBaseDailyProductionServiceFetchRequest(): DailyProductionServiceFetchRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const DailyProductionServiceFetchRequest = {
  encode(message: DailyProductionServiceFetchRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.wells) {
      writer.uint32(18).string(v!);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(32).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceFetchRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fieldMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.wells.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.onlyPhysicalWells = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceFetchRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceFetchRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest {
    return DailyProductionServiceFetchRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceFetchRequest>): DailyProductionServiceFetchRequest {
    const message = createBaseDailyProductionServiceFetchRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceFetchResponse(): DailyProductionServiceFetchResponse {
  return {
    date: undefined,
    well: "",
    project: undefined,
    bottomHolePressure: undefined,
    casingHeadPressure: undefined,
    choke: undefined,
    co2Injection: undefined,
    flowlinePressure: undefined,
    gas: undefined,
    gasInjection: undefined,
    gasLiftInjectionPressure: undefined,
    hoursOn: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    tubingHeadPressure: undefined,
    vesselSeparatorPressure: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
    operationalTag: undefined,
  };
}

export const DailyProductionServiceFetchResponse = {
  encode(message: DailyProductionServiceFetchResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.date !== undefined) {
      Timestamp.encode(toTimestamp(message.date), writer.uint32(202).fork()).ldelim();
    }
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.bottomHolePressure !== undefined) {
      writer.uint32(25).double(message.bottomHolePressure);
    }
    if (message.casingHeadPressure !== undefined) {
      writer.uint32(33).double(message.casingHeadPressure);
    }
    if (message.choke !== undefined) {
      writer.uint32(41).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(49).double(message.co2Injection);
    }
    if (message.flowlinePressure !== undefined) {
      writer.uint32(57).double(message.flowlinePressure);
    }
    if (message.gas !== undefined) {
      writer.uint32(65).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(73).double(message.gasInjection);
    }
    if (message.gasLiftInjectionPressure !== undefined) {
      writer.uint32(81).double(message.gasLiftInjectionPressure);
    }
    if (message.hoursOn !== undefined) {
      writer.uint32(89).double(message.hoursOn);
    }
    if (message.ngl !== undefined) {
      writer.uint32(97).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(105).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(113).double(message.steamInjection);
    }
    if (message.tubingHeadPressure !== undefined) {
      writer.uint32(121).double(message.tubingHeadPressure);
    }
    if (message.vesselSeparatorPressure !== undefined) {
      writer.uint32(129).double(message.vesselSeparatorPressure);
    }
    if (message.water !== undefined) {
      writer.uint32(137).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(145).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(153).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(161).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(169).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(177).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(185).double(message.customNumber4);
    }
    if (message.operationalTag !== undefined) {
      writer.uint32(194).string(message.operationalTag);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceFetchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 25:
          if (tag !== 202) {
            break;
          }

          message.date = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 1:
          if (tag !== 10) {
            break;
          }

          message.well = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.bottomHolePressure = reader.double();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.casingHeadPressure = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.choke = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.flowlinePressure = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.gasLiftInjectionPressure = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.hoursOn = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.tubingHeadPressure = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.vesselSeparatorPressure = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
            break;
          }

          message.water = reader.double();
          continue;
        case 18:
          if (tag !== 145) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 19:
          if (tag !== 153) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 20:
          if (tag !== 161) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 21:
          if (tag !== 169) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 22:
          if (tag !== 177) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 23:
          if (tag !== 185) {
            break;
          }

          message.customNumber4 = reader.double();
          continue;
        case 24:
          if (tag !== 194) {
            break;
          }

          message.operationalTag = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceFetchResponse {
    return {
      date: isSet(object.date) ? fromJsonTimestamp(object.date) : undefined,
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      bottomHolePressure: isSet(object.bottomHolePressure) ? Number(object.bottomHolePressure) : undefined,
      casingHeadPressure: isSet(object.casingHeadPressure) ? Number(object.casingHeadPressure) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      flowlinePressure: isSet(object.flowlinePressure) ? Number(object.flowlinePressure) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      gasLiftInjectionPressure: isSet(object.gasLiftInjectionPressure)
        ? Number(object.gasLiftInjectionPressure)
        : undefined,
      hoursOn: isSet(object.hoursOn) ? Number(object.hoursOn) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      tubingHeadPressure: isSet(object.tubingHeadPressure) ? Number(object.tubingHeadPressure) : undefined,
      vesselSeparatorPressure: isSet(object.vesselSeparatorPressure)
        ? Number(object.vesselSeparatorPressure)
        : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
      operationalTag: isSet(object.operationalTag) ? String(object.operationalTag) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceFetchResponse): unknown {
    const obj: any = {};
    message.date !== undefined && (obj.date = message.date.toISOString());
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.bottomHolePressure !== undefined && (obj.bottomHolePressure = message.bottomHolePressure);
    message.casingHeadPressure !== undefined && (obj.casingHeadPressure = message.casingHeadPressure);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.flowlinePressure !== undefined && (obj.flowlinePressure = message.flowlinePressure);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.gasLiftInjectionPressure !== undefined && (obj.gasLiftInjectionPressure = message.gasLiftInjectionPressure);
    message.hoursOn !== undefined && (obj.hoursOn = message.hoursOn);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.tubingHeadPressure !== undefined && (obj.tubingHeadPressure = message.tubingHeadPressure);
    message.vesselSeparatorPressure !== undefined && (obj.vesselSeparatorPressure = message.vesselSeparatorPressure);
    message.water !== undefined && (obj.water = message.water);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    message.operationalTag !== undefined && (obj.operationalTag = message.operationalTag);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse {
    return DailyProductionServiceFetchResponse.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceFetchResponse>): DailyProductionServiceFetchResponse {
    const message = createBaseDailyProductionServiceFetchResponse();
    message.date = object.date ?? undefined;
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.bottomHolePressure = object.bottomHolePressure ?? undefined;
    message.casingHeadPressure = object.casingHeadPressure ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.flowlinePressure = object.flowlinePressure ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.gasLiftInjectionPressure = object.gasLiftInjectionPressure ?? undefined;
    message.hoursOn = object.hoursOn ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
    message.tubingHeadPressure = object.tubingHeadPressure ?? undefined;
    message.vesselSeparatorPressure = object.vesselSeparatorPressure ?? undefined;
    message.water = object.water ?? undefined;
    message.waterInjection = object.waterInjection ?? undefined;
    message.customNumber0 = object.customNumber0 ?? undefined;
    message.customNumber1 = object.customNumber1 ?? undefined;
    message.customNumber2 = object.customNumber2 ?? undefined;
    message.customNumber3 = object.customNumber3 ?? undefined;
    message.customNumber4 = object.customNumber4 ?? undefined;
    message.operationalTag = object.operationalTag ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceFetchByWellRequest(): DailyProductionServiceFetchByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const DailyProductionServiceFetchByWellRequest = {
  encode(message: DailyProductionServiceFetchByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.wells) {
      writer.uint32(18).string(v!);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(32).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceFetchByWellRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fieldMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.wells.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.onlyPhysicalWells = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceFetchByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceFetchByWellRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceFetchByWellRequest>): DailyProductionServiceFetchByWellRequest {
    return DailyProductionServiceFetchByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceFetchByWellRequest>): DailyProductionServiceFetchByWellRequest {
    const message = createBaseDailyProductionServiceFetchByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceFetchByWellResponse(): DailyProductionServiceFetchByWellResponse {
  return {
    date: [],
    well: "",
    project: undefined,
    bottomHolePressure: [],
    casingHeadPressure: [],
    choke: [],
    co2Injection: [],
    flowlinePressure: [],
    gas: [],
    gasInjection: [],
    gasLiftInjectionPressure: [],
    hoursOn: [],
    ngl: [],
    oil: [],
    steamInjection: [],
    tubingHeadPressure: [],
    vesselSeparatorPressure: [],
    water: [],
    waterInjection: [],
    customNumber0: [],
    customNumber1: [],
    customNumber2: [],
    customNumber3: [],
    customNumber4: [],
  };
}

export const DailyProductionServiceFetchByWellResponse = {
  encode(message: DailyProductionServiceFetchByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.date) {
      Timestamp.encode(toTimestamp(v!), writer.uint32(194).fork()).ldelim();
    }
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    writer.uint32(26).fork();
    for (const v of message.bottomHolePressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(34).fork();
    for (const v of message.casingHeadPressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(42).fork();
    for (const v of message.choke) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(50).fork();
    for (const v of message.co2Injection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(58).fork();
    for (const v of message.flowlinePressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(66).fork();
    for (const v of message.gas) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(74).fork();
    for (const v of message.gasInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(82).fork();
    for (const v of message.gasLiftInjectionPressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(90).fork();
    for (const v of message.hoursOn) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(98).fork();
    for (const v of message.ngl) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(106).fork();
    for (const v of message.oil) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(114).fork();
    for (const v of message.steamInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(122).fork();
    for (const v of message.tubingHeadPressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(130).fork();
    for (const v of message.vesselSeparatorPressure) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(138).fork();
    for (const v of message.water) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(146).fork();
    for (const v of message.waterInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(154).fork();
    for (const v of message.customNumber0) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(162).fork();
    for (const v of message.customNumber1) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(170).fork();
    for (const v of message.customNumber2) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(178).fork();
    for (const v of message.customNumber3) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(186).fork();
    for (const v of message.customNumber4) {
      writer.double(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceFetchByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceFetchByWellResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 24:
          if (tag !== 194) {
            break;
          }

          message.date.push(fromTimestamp(Timestamp.decode(reader, reader.uint32())));
          continue;
        case 1:
          if (tag !== 10) {
            break;
          }

          message.well = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag === 25) {
            message.bottomHolePressure.push(reader.double());

            continue;
          }

          if (tag === 26) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.bottomHolePressure.push(reader.double());
            }

            continue;
          }

          break;
        case 4:
          if (tag === 33) {
            message.casingHeadPressure.push(reader.double());

            continue;
          }

          if (tag === 34) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.casingHeadPressure.push(reader.double());
            }

            continue;
          }

          break;
        case 5:
          if (tag === 41) {
            message.choke.push(reader.double());

            continue;
          }

          if (tag === 42) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.choke.push(reader.double());
            }

            continue;
          }

          break;
        case 6:
          if (tag === 49) {
            message.co2Injection.push(reader.double());

            continue;
          }

          if (tag === 50) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.co2Injection.push(reader.double());
            }

            continue;
          }

          break;
        case 7:
          if (tag === 57) {
            message.flowlinePressure.push(reader.double());

            continue;
          }

          if (tag === 58) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.flowlinePressure.push(reader.double());
            }

            continue;
          }

          break;
        case 8:
          if (tag === 65) {
            message.gas.push(reader.double());

            continue;
          }

          if (tag === 66) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.gas.push(reader.double());
            }

            continue;
          }

          break;
        case 9:
          if (tag === 73) {
            message.gasInjection.push(reader.double());

            continue;
          }

          if (tag === 74) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.gasInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 10:
          if (tag === 81) {
            message.gasLiftInjectionPressure.push(reader.double());

            continue;
          }

          if (tag === 82) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.gasLiftInjectionPressure.push(reader.double());
            }

            continue;
          }

          break;
        case 11:
          if (tag === 89) {
            message.hoursOn.push(reader.double());

            continue;
          }

          if (tag === 90) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.hoursOn.push(reader.double());
            }

            continue;
          }

          break;
        case 12:
          if (tag === 97) {
            message.ngl.push(reader.double());

            continue;
          }

          if (tag === 98) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.ngl.push(reader.double());
            }

            continue;
          }

          break;
        case 13:
          if (tag === 105) {
            message.oil.push(reader.double());

            continue;
          }

          if (tag === 106) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.oil.push(reader.double());
            }

            continue;
          }

          break;
        case 14:
          if (tag === 113) {
            message.steamInjection.push(reader.double());

            continue;
          }

          if (tag === 114) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.steamInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 15:
          if (tag === 121) {
            message.tubingHeadPressure.push(reader.double());

            continue;
          }

          if (tag === 122) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.tubingHeadPressure.push(reader.double());
            }

            continue;
          }

          break;
        case 16:
          if (tag === 129) {
            message.vesselSeparatorPressure.push(reader.double());

            continue;
          }

          if (tag === 130) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.vesselSeparatorPressure.push(reader.double());
            }

            continue;
          }

          break;
        case 17:
          if (tag === 137) {
            message.water.push(reader.double());

            continue;
          }

          if (tag === 138) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.water.push(reader.double());
            }

            continue;
          }

          break;
        case 18:
          if (tag === 145) {
            message.waterInjection.push(reader.double());

            continue;
          }

          if (tag === 146) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.waterInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 19:
          if (tag === 153) {
            message.customNumber0.push(reader.double());

            continue;
          }

          if (tag === 154) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber0.push(reader.double());
            }

            continue;
          }

          break;
        case 20:
          if (tag === 161) {
            message.customNumber1.push(reader.double());

            continue;
          }

          if (tag === 162) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber1.push(reader.double());
            }

            continue;
          }

          break;
        case 21:
          if (tag === 169) {
            message.customNumber2.push(reader.double());

            continue;
          }

          if (tag === 170) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber2.push(reader.double());
            }

            continue;
          }

          break;
        case 22:
          if (tag === 177) {
            message.customNumber3.push(reader.double());

            continue;
          }

          if (tag === 178) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber3.push(reader.double());
            }

            continue;
          }

          break;
        case 23:
          if (tag === 185) {
            message.customNumber4.push(reader.double());

            continue;
          }

          if (tag === 186) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber4.push(reader.double());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceFetchByWellResponse {
    return {
      date: Array.isArray(object?.date) ? object.date.map((e: any) => fromJsonTimestamp(e)) : [],
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      bottomHolePressure: Array.isArray(object?.bottomHolePressure)
        ? object.bottomHolePressure.map((e: any) => Number(e))
        : [],
      casingHeadPressure: Array.isArray(object?.casingHeadPressure)
        ? object.casingHeadPressure.map((e: any) => Number(e))
        : [],
      choke: Array.isArray(object?.choke) ? object.choke.map((e: any) => Number(e)) : [],
      co2Injection: Array.isArray(object?.co2Injection) ? object.co2Injection.map((e: any) => Number(e)) : [],
      flowlinePressure: Array.isArray(object?.flowlinePressure)
        ? object.flowlinePressure.map((e: any) => Number(e))
        : [],
      gas: Array.isArray(object?.gas) ? object.gas.map((e: any) => Number(e)) : [],
      gasInjection: Array.isArray(object?.gasInjection) ? object.gasInjection.map((e: any) => Number(e)) : [],
      gasLiftInjectionPressure: Array.isArray(object?.gasLiftInjectionPressure)
        ? object.gasLiftInjectionPressure.map((e: any) => Number(e))
        : [],
      hoursOn: Array.isArray(object?.hoursOn) ? object.hoursOn.map((e: any) => Number(e)) : [],
      ngl: Array.isArray(object?.ngl) ? object.ngl.map((e: any) => Number(e)) : [],
      oil: Array.isArray(object?.oil) ? object.oil.map((e: any) => Number(e)) : [],
      steamInjection: Array.isArray(object?.steamInjection) ? object.steamInjection.map((e: any) => Number(e)) : [],
      tubingHeadPressure: Array.isArray(object?.tubingHeadPressure)
        ? object.tubingHeadPressure.map((e: any) => Number(e))
        : [],
      vesselSeparatorPressure: Array.isArray(object?.vesselSeparatorPressure)
        ? object.vesselSeparatorPressure.map((e: any) => Number(e))
        : [],
      water: Array.isArray(object?.water)
        ? object.water.map((e: any) => Number(e))
        : [],
      waterInjection: Array.isArray(object?.waterInjection) ? object.waterInjection.map((e: any) => Number(e)) : [],
      customNumber0: Array.isArray(object?.customNumber0) ? object.customNumber0.map((e: any) => Number(e)) : [],
      customNumber1: Array.isArray(object?.customNumber1) ? object.customNumber1.map((e: any) => Number(e)) : [],
      customNumber2: Array.isArray(object?.customNumber2) ? object.customNumber2.map((e: any) => Number(e)) : [],
      customNumber3: Array.isArray(object?.customNumber3) ? object.customNumber3.map((e: any) => Number(e)) : [],
      customNumber4: Array.isArray(object?.customNumber4) ? object.customNumber4.map((e: any) => Number(e)) : [],
    };
  },

  toJSON(message: DailyProductionServiceFetchByWellResponse): unknown {
    const obj: any = {};
    if (message.date) {
      obj.date = message.date.map((e) => e.toISOString());
    } else {
      obj.date = [];
    }
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    if (message.bottomHolePressure) {
      obj.bottomHolePressure = message.bottomHolePressure.map((e) => e);
    } else {
      obj.bottomHolePressure = [];
    }
    if (message.casingHeadPressure) {
      obj.casingHeadPressure = message.casingHeadPressure.map((e) => e);
    } else {
      obj.casingHeadPressure = [];
    }
    if (message.choke) {
      obj.choke = message.choke.map((e) => e);
    } else {
      obj.choke = [];
    }
    if (message.co2Injection) {
      obj.co2Injection = message.co2Injection.map((e) => e);
    } else {
      obj.co2Injection = [];
    }
    if (message.flowlinePressure) {
      obj.flowlinePressure = message.flowlinePressure.map((e) => e);
    } else {
      obj.flowlinePressure = [];
    }
    if (message.gas) {
      obj.gas = message.gas.map((e) => e);
    } else {
      obj.gas = [];
    }
    if (message.gasInjection) {
      obj.gasInjection = message.gasInjection.map((e) => e);
    } else {
      obj.gasInjection = [];
    }
    if (message.gasLiftInjectionPressure) {
      obj.gasLiftInjectionPressure = message.gasLiftInjectionPressure.map((e) => e);
    } else {
      obj.gasLiftInjectionPressure = [];
    }
    if (message.hoursOn) {
      obj.hoursOn = message.hoursOn.map((e) => e);
    } else {
      obj.hoursOn = [];
    }
    if (message.ngl) {
      obj.ngl = message.ngl.map((e) => e);
    } else {
      obj.ngl = [];
    }
    if (message.oil) {
      obj.oil = message.oil.map((e) => e);
    } else {
      obj.oil = [];
    }
    if (message.steamInjection) {
      obj.steamInjection = message.steamInjection.map((e) => e);
    } else {
      obj.steamInjection = [];
    }
    if (message.tubingHeadPressure) {
      obj.tubingHeadPressure = message.tubingHeadPressure.map((e) => e);
    } else {
      obj.tubingHeadPressure = [];
    }
    if (message.vesselSeparatorPressure) {
      obj.vesselSeparatorPressure = message.vesselSeparatorPressure.map((e) => e);
    } else {
      obj.vesselSeparatorPressure = [];
    }
    if (message.water) {
      obj.water = message.water.map((e) => e);
    } else {
      obj.water = [];
    }
    if (message.waterInjection) {
      obj.waterInjection = message.waterInjection.map((e) => e);
    } else {
      obj.waterInjection = [];
    }
    if (message.customNumber0) {
      obj.customNumber0 = message.customNumber0.map((e) => e);
    } else {
      obj.customNumber0 = [];
    }
    if (message.customNumber1) {
      obj.customNumber1 = message.customNumber1.map((e) => e);
    } else {
      obj.customNumber1 = [];
    }
    if (message.customNumber2) {
      obj.customNumber2 = message.customNumber2.map((e) => e);
    } else {
      obj.customNumber2 = [];
    }
    if (message.customNumber3) {
      obj.customNumber3 = message.customNumber3.map((e) => e);
    } else {
      obj.customNumber3 = [];
    }
    if (message.customNumber4) {
      obj.customNumber4 = message.customNumber4.map((e) => e);
    } else {
      obj.customNumber4 = [];
    }
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceFetchByWellResponse>): DailyProductionServiceFetchByWellResponse {
    return DailyProductionServiceFetchByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceFetchByWellResponse>,
  ): DailyProductionServiceFetchByWellResponse {
    const message = createBaseDailyProductionServiceFetchByWellResponse();
    message.date = object.date?.map((e) => e) || [];
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.bottomHolePressure = object.bottomHolePressure?.map((e) => e) || [];
    message.casingHeadPressure = object.casingHeadPressure?.map((e) => e) || [];
    message.choke = object.choke?.map((e) => e) || [];
    message.co2Injection = object.co2Injection?.map((e) => e) || [];
    message.flowlinePressure = object.flowlinePressure?.map((e) => e) || [];
    message.gas = object.gas?.map((e) => e) || [];
    message.gasInjection = object.gasInjection?.map((e) => e) || [];
    message.gasLiftInjectionPressure = object.gasLiftInjectionPressure?.map((e) => e) || [];
    message.hoursOn = object.hoursOn?.map((e) => e) || [];
    message.ngl = object.ngl?.map((e) => e) || [];
    message.oil = object.oil?.map((e) => e) || [];
    message.steamInjection = object.steamInjection?.map((e) => e) || [];
    message.tubingHeadPressure = object.tubingHeadPressure?.map((e) => e) || [];
    message.vesselSeparatorPressure = object.vesselSeparatorPressure?.map((e) => e) || [];
    message.water = object.water?.map((e) => e) || [];
    message.waterInjection = object.waterInjection?.map((e) => e) || [];
    message.customNumber0 = object.customNumber0?.map((e) => e) || [];
    message.customNumber1 = object.customNumber1?.map((e) => e) || [];
    message.customNumber2 = object.customNumber2?.map((e) => e) || [];
    message.customNumber3 = object.customNumber3?.map((e) => e) || [];
    message.customNumber4 = object.customNumber4?.map((e) => e) || [];
    return message;
  },
};

function createBaseDailyProductionServiceSumByWellRequest(): DailyProductionServiceSumByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const DailyProductionServiceSumByWellRequest = {
  encode(message: DailyProductionServiceSumByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.wells) {
      writer.uint32(18).string(v!);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(32).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceSumByWellRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fieldMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.wells.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.onlyPhysicalWells = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceSumByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceSumByWellRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest {
    return DailyProductionServiceSumByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceSumByWellRequest>): DailyProductionServiceSumByWellRequest {
    const message = createBaseDailyProductionServiceSumByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceSumByWellResponse(): DailyProductionServiceSumByWellResponse {
  return {
    well: "",
    project: undefined,
    bottomHolePressure: undefined,
    casingHeadPressure: undefined,
    choke: undefined,
    co2Injection: undefined,
    flowlinePressure: undefined,
    gas: undefined,
    gasInjection: undefined,
    gasLiftInjectionPressure: undefined,
    hoursOn: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    tubingHeadPressure: undefined,
    vesselSeparatorPressure: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
  };
}

export const DailyProductionServiceSumByWellResponse = {
  encode(message: DailyProductionServiceSumByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.bottomHolePressure !== undefined) {
      writer.uint32(25).double(message.bottomHolePressure);
    }
    if (message.casingHeadPressure !== undefined) {
      writer.uint32(33).double(message.casingHeadPressure);
    }
    if (message.choke !== undefined) {
      writer.uint32(41).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(49).double(message.co2Injection);
    }
    if (message.flowlinePressure !== undefined) {
      writer.uint32(57).double(message.flowlinePressure);
    }
    if (message.gas !== undefined) {
      writer.uint32(65).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(73).double(message.gasInjection);
    }
    if (message.gasLiftInjectionPressure !== undefined) {
      writer.uint32(81).double(message.gasLiftInjectionPressure);
    }
    if (message.hoursOn !== undefined) {
      writer.uint32(89).double(message.hoursOn);
    }
    if (message.ngl !== undefined) {
      writer.uint32(97).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(105).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(113).double(message.steamInjection);
    }
    if (message.tubingHeadPressure !== undefined) {
      writer.uint32(121).double(message.tubingHeadPressure);
    }
    if (message.vesselSeparatorPressure !== undefined) {
      writer.uint32(129).double(message.vesselSeparatorPressure);
    }
    if (message.water !== undefined) {
      writer.uint32(137).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(145).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(153).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(161).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(169).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(177).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(185).double(message.customNumber4);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceSumByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceSumByWellResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.well = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag !== 25) {
            break;
          }

          message.bottomHolePressure = reader.double();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.casingHeadPressure = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.choke = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.flowlinePressure = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.gasLiftInjectionPressure = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.hoursOn = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.tubingHeadPressure = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.vesselSeparatorPressure = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
            break;
          }

          message.water = reader.double();
          continue;
        case 18:
          if (tag !== 145) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 19:
          if (tag !== 153) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 20:
          if (tag !== 161) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 21:
          if (tag !== 169) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 22:
          if (tag !== 177) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 23:
          if (tag !== 185) {
            break;
          }

          message.customNumber4 = reader.double();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceSumByWellResponse {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      bottomHolePressure: isSet(object.bottomHolePressure) ? Number(object.bottomHolePressure) : undefined,
      casingHeadPressure: isSet(object.casingHeadPressure) ? Number(object.casingHeadPressure) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      flowlinePressure: isSet(object.flowlinePressure) ? Number(object.flowlinePressure) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      gasLiftInjectionPressure: isSet(object.gasLiftInjectionPressure)
        ? Number(object.gasLiftInjectionPressure)
        : undefined,
      hoursOn: isSet(object.hoursOn) ? Number(object.hoursOn) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      tubingHeadPressure: isSet(object.tubingHeadPressure) ? Number(object.tubingHeadPressure) : undefined,
      vesselSeparatorPressure: isSet(object.vesselSeparatorPressure)
        ? Number(object.vesselSeparatorPressure)
        : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceSumByWellResponse): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.bottomHolePressure !== undefined && (obj.bottomHolePressure = message.bottomHolePressure);
    message.casingHeadPressure !== undefined && (obj.casingHeadPressure = message.casingHeadPressure);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.flowlinePressure !== undefined && (obj.flowlinePressure = message.flowlinePressure);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.gasLiftInjectionPressure !== undefined && (obj.gasLiftInjectionPressure = message.gasLiftInjectionPressure);
    message.hoursOn !== undefined && (obj.hoursOn = message.hoursOn);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.tubingHeadPressure !== undefined && (obj.tubingHeadPressure = message.tubingHeadPressure);
    message.vesselSeparatorPressure !== undefined && (obj.vesselSeparatorPressure = message.vesselSeparatorPressure);
    message.water !== undefined && (obj.water = message.water);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse {
    return DailyProductionServiceSumByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceSumByWellResponse>): DailyProductionServiceSumByWellResponse {
    const message = createBaseDailyProductionServiceSumByWellResponse();
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.bottomHolePressure = object.bottomHolePressure ?? undefined;
    message.casingHeadPressure = object.casingHeadPressure ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.flowlinePressure = object.flowlinePressure ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.gasLiftInjectionPressure = object.gasLiftInjectionPressure ?? undefined;
    message.hoursOn = object.hoursOn ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
    message.tubingHeadPressure = object.tubingHeadPressure ?? undefined;
    message.vesselSeparatorPressure = object.vesselSeparatorPressure ?? undefined;
    message.water = object.water ?? undefined;
    message.waterInjection = object.waterInjection ?? undefined;
    message.customNumber0 = object.customNumber0 ?? undefined;
    message.customNumber1 = object.customNumber1 ?? undefined;
    message.customNumber2 = object.customNumber2 ?? undefined;
    message.customNumber3 = object.customNumber3 ?? undefined;
    message.customNumber4 = object.customNumber4 ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceCountByWellRequest(): DailyProductionServiceCountByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const DailyProductionServiceCountByWellRequest = {
  encode(message: DailyProductionServiceCountByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.wells) {
      writer.uint32(18).string(v!);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(32).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceCountByWellRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.fieldMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.wells.push(reader.string());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.onlyPhysicalWells = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceCountByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceCountByWellRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest {
    return DailyProductionServiceCountByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DailyProductionServiceCountByWellRequest>): DailyProductionServiceCountByWellRequest {
    const message = createBaseDailyProductionServiceCountByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceCountByWellResponse(): DailyProductionServiceCountByWellResponse {
  return {
    well: "",
    project: undefined,
    bottomHolePressure: undefined,
    casingHeadPressure: undefined,
    choke: undefined,
    co2Injection: undefined,
    flowlinePressure: undefined,
    gas: undefined,
    gasInjection: undefined,
    gasLiftInjectionPressure: undefined,
    hoursOn: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    tubingHeadPressure: undefined,
    vesselSeparatorPressure: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
  };
}

export const DailyProductionServiceCountByWellResponse = {
  encode(message: DailyProductionServiceCountByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.bottomHolePressure !== undefined) {
      writer.uint32(24).int32(message.bottomHolePressure);
    }
    if (message.casingHeadPressure !== undefined) {
      writer.uint32(32).int32(message.casingHeadPressure);
    }
    if (message.choke !== undefined) {
      writer.uint32(40).int32(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(48).int32(message.co2Injection);
    }
    if (message.flowlinePressure !== undefined) {
      writer.uint32(56).int32(message.flowlinePressure);
    }
    if (message.gas !== undefined) {
      writer.uint32(64).int32(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(72).int32(message.gasInjection);
    }
    if (message.gasLiftInjectionPressure !== undefined) {
      writer.uint32(80).int32(message.gasLiftInjectionPressure);
    }
    if (message.hoursOn !== undefined) {
      writer.uint32(88).int32(message.hoursOn);
    }
    if (message.ngl !== undefined) {
      writer.uint32(96).int32(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(104).int32(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(112).int32(message.steamInjection);
    }
    if (message.tubingHeadPressure !== undefined) {
      writer.uint32(120).int32(message.tubingHeadPressure);
    }
    if (message.vesselSeparatorPressure !== undefined) {
      writer.uint32(128).int32(message.vesselSeparatorPressure);
    }
    if (message.water !== undefined) {
      writer.uint32(136).int32(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(144).int32(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(152).int32(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(160).int32(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(168).int32(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(176).int32(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(184).int32(message.customNumber4);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceCountByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceCountByWellResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.well = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.bottomHolePressure = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.casingHeadPressure = reader.int32();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.choke = reader.int32();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.co2Injection = reader.int32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.flowlinePressure = reader.int32();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.gas = reader.int32();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.gasInjection = reader.int32();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.gasLiftInjectionPressure = reader.int32();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.hoursOn = reader.int32();
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.ngl = reader.int32();
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.oil = reader.int32();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.steamInjection = reader.int32();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.tubingHeadPressure = reader.int32();
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.vesselSeparatorPressure = reader.int32();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.water = reader.int32();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.waterInjection = reader.int32();
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.customNumber0 = reader.int32();
          continue;
        case 20:
          if (tag !== 160) {
            break;
          }

          message.customNumber1 = reader.int32();
          continue;
        case 21:
          if (tag !== 168) {
            break;
          }

          message.customNumber2 = reader.int32();
          continue;
        case 22:
          if (tag !== 176) {
            break;
          }

          message.customNumber3 = reader.int32();
          continue;
        case 23:
          if (tag !== 184) {
            break;
          }

          message.customNumber4 = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceCountByWellResponse {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      bottomHolePressure: isSet(object.bottomHolePressure) ? Number(object.bottomHolePressure) : undefined,
      casingHeadPressure: isSet(object.casingHeadPressure) ? Number(object.casingHeadPressure) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      flowlinePressure: isSet(object.flowlinePressure) ? Number(object.flowlinePressure) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      gasLiftInjectionPressure: isSet(object.gasLiftInjectionPressure)
        ? Number(object.gasLiftInjectionPressure)
        : undefined,
      hoursOn: isSet(object.hoursOn) ? Number(object.hoursOn) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      tubingHeadPressure: isSet(object.tubingHeadPressure) ? Number(object.tubingHeadPressure) : undefined,
      vesselSeparatorPressure: isSet(object.vesselSeparatorPressure)
        ? Number(object.vesselSeparatorPressure)
        : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceCountByWellResponse): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.bottomHolePressure !== undefined && (obj.bottomHolePressure = Math.round(message.bottomHolePressure));
    message.casingHeadPressure !== undefined && (obj.casingHeadPressure = Math.round(message.casingHeadPressure));
    message.choke !== undefined && (obj.choke = Math.round(message.choke));
    message.co2Injection !== undefined && (obj.co2Injection = Math.round(message.co2Injection));
    message.flowlinePressure !== undefined && (obj.flowlinePressure = Math.round(message.flowlinePressure));
    message.gas !== undefined && (obj.gas = Math.round(message.gas));
    message.gasInjection !== undefined && (obj.gasInjection = Math.round(message.gasInjection));
    message.gasLiftInjectionPressure !== undefined &&
      (obj.gasLiftInjectionPressure = Math.round(message.gasLiftInjectionPressure));
    message.hoursOn !== undefined && (obj.hoursOn = Math.round(message.hoursOn));
    message.ngl !== undefined && (obj.ngl = Math.round(message.ngl));
    message.oil !== undefined && (obj.oil = Math.round(message.oil));
    message.steamInjection !== undefined && (obj.steamInjection = Math.round(message.steamInjection));
    message.tubingHeadPressure !== undefined && (obj.tubingHeadPressure = Math.round(message.tubingHeadPressure));
    message.vesselSeparatorPressure !== undefined &&
      (obj.vesselSeparatorPressure = Math.round(message.vesselSeparatorPressure));
    message.water !== undefined && (obj.water = Math.round(message.water));
    message.waterInjection !== undefined && (obj.waterInjection = Math.round(message.waterInjection));
    message.customNumber0 !== undefined && (obj.customNumber0 = Math.round(message.customNumber0));
    message.customNumber1 !== undefined && (obj.customNumber1 = Math.round(message.customNumber1));
    message.customNumber2 !== undefined && (obj.customNumber2 = Math.round(message.customNumber2));
    message.customNumber3 !== undefined && (obj.customNumber3 = Math.round(message.customNumber3));
    message.customNumber4 !== undefined && (obj.customNumber4 = Math.round(message.customNumber4));
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceCountByWellResponse>): DailyProductionServiceCountByWellResponse {
    return DailyProductionServiceCountByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceCountByWellResponse>,
  ): DailyProductionServiceCountByWellResponse {
    const message = createBaseDailyProductionServiceCountByWellResponse();
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.bottomHolePressure = object.bottomHolePressure ?? undefined;
    message.casingHeadPressure = object.casingHeadPressure ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.flowlinePressure = object.flowlinePressure ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.gasLiftInjectionPressure = object.gasLiftInjectionPressure ?? undefined;
    message.hoursOn = object.hoursOn ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
    message.tubingHeadPressure = object.tubingHeadPressure ?? undefined;
    message.vesselSeparatorPressure = object.vesselSeparatorPressure ?? undefined;
    message.water = object.water ?? undefined;
    message.waterInjection = object.waterInjection ?? undefined;
    message.customNumber0 = object.customNumber0 ?? undefined;
    message.customNumber1 = object.customNumber1 ?? undefined;
    message.customNumber2 = object.customNumber2 ?? undefined;
    message.customNumber3 = object.customNumber3 ?? undefined;
    message.customNumber4 = object.customNumber4 ?? undefined;
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByProjectRequest(): DailyProductionServiceDeleteByProjectRequest {
  return { project: "" };
}

export const DailyProductionServiceDeleteByProjectRequest = {
  encode(message: DailyProductionServiceDeleteByProjectRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByProjectRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.project = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceDeleteByProjectRequest {
    return { project: isSet(object.project) ? String(object.project) : "" };
  },

  toJSON(message: DailyProductionServiceDeleteByProjectRequest): unknown {
    const obj: any = {};
    message.project !== undefined && (obj.project = message.project);
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceDeleteByProjectRequest>,
  ): DailyProductionServiceDeleteByProjectRequest {
    return DailyProductionServiceDeleteByProjectRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceDeleteByProjectRequest>,
  ): DailyProductionServiceDeleteByProjectRequest {
    const message = createBaseDailyProductionServiceDeleteByProjectRequest();
    message.project = object.project ?? "";
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByProjectResponse(): DailyProductionServiceDeleteByProjectResponse {
  return {};
}

export const DailyProductionServiceDeleteByProjectResponse = {
  encode(_: DailyProductionServiceDeleteByProjectResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByProjectResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByProjectResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DailyProductionServiceDeleteByProjectResponse {
    return {};
  },

  toJSON(_: DailyProductionServiceDeleteByProjectResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceDeleteByProjectResponse>,
  ): DailyProductionServiceDeleteByProjectResponse {
    return DailyProductionServiceDeleteByProjectResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<DailyProductionServiceDeleteByProjectResponse>,
  ): DailyProductionServiceDeleteByProjectResponse {
    const message = createBaseDailyProductionServiceDeleteByProjectResponse();
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByWellRequest(): DailyProductionServiceDeleteByWellRequest {
  return { well: "", dateRange: undefined };
}

export const DailyProductionServiceDeleteByWellRequest = {
  encode(message: DailyProductionServiceDeleteByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByWellRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.well = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceDeleteByWellRequest {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
    };
  },

  toJSON(message: DailyProductionServiceDeleteByWellRequest): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceDeleteByWellRequest>): DailyProductionServiceDeleteByWellRequest {
    return DailyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceDeleteByWellRequest>,
  ): DailyProductionServiceDeleteByWellRequest {
    const message = createBaseDailyProductionServiceDeleteByWellRequest();
    message.well = object.well ?? "";
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByWellResponse(): DailyProductionServiceDeleteByWellResponse {
  return {};
}

export const DailyProductionServiceDeleteByWellResponse = {
  encode(_: DailyProductionServiceDeleteByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByWellResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DailyProductionServiceDeleteByWellResponse {
    return {};
  },

  toJSON(_: DailyProductionServiceDeleteByWellResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse {
    return DailyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(_: DeepPartial<DailyProductionServiceDeleteByWellResponse>): DailyProductionServiceDeleteByWellResponse {
    const message = createBaseDailyProductionServiceDeleteByWellResponse();
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByManyWellsRequest(): DailyProductionServiceDeleteByManyWellsRequest {
  return { wells: [] };
}

export const DailyProductionServiceDeleteByManyWellsRequest = {
  encode(
    message: DailyProductionServiceDeleteByManyWellsRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.wells) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByManyWellsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.wells.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DailyProductionServiceDeleteByManyWellsRequest {
    return { wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [] };
  },

  toJSON(message: DailyProductionServiceDeleteByManyWellsRequest): unknown {
    const obj: any = {};
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>,
  ): DailyProductionServiceDeleteByManyWellsRequest {
    return DailyProductionServiceDeleteByManyWellsRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>,
  ): DailyProductionServiceDeleteByManyWellsRequest {
    const message = createBaseDailyProductionServiceDeleteByManyWellsRequest();
    message.wells = object.wells?.map((e) => e) || [];
    return message;
  },
};

function createBaseDailyProductionServiceDeleteByManyWellsResponse(): DailyProductionServiceDeleteByManyWellsResponse {
  return {};
}

export const DailyProductionServiceDeleteByManyWellsResponse = {
  encode(_: DailyProductionServiceDeleteByManyWellsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DailyProductionServiceDeleteByManyWellsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDailyProductionServiceDeleteByManyWellsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): DailyProductionServiceDeleteByManyWellsResponse {
    return {};
  },

  toJSON(_: DailyProductionServiceDeleteByManyWellsResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>,
  ): DailyProductionServiceDeleteByManyWellsResponse {
    return DailyProductionServiceDeleteByManyWellsResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>,
  ): DailyProductionServiceDeleteByManyWellsResponse {
    const message = createBaseDailyProductionServiceDeleteByManyWellsResponse();
    return message;
  },
};

export type DailyProductionServiceDefinition = typeof DailyProductionServiceDefinition;
export const DailyProductionServiceDefinition = {
  name: "DailyProductionService",
  fullName: "combocurve.dal.v1.DailyProductionService",
  methods: {
    /** Upsert daily production data for multiple wells. */
    upsert: {
      name: "Upsert",
      requestType: DailyProductionServiceUpsertRequest,
      requestStream: true,
      responseType: DailyProductionServiceUpsertResponse,
      responseStream: false,
      options: {},
    },
    /** Update daily production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope: {
      name: "ChangeToCompanyScope",
      requestType: DailyProductionServiceChangeToCompanyScopeRequest,
      requestStream: false,
      responseType: DailyProductionServiceChangeToCompanyScopeResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Fetch daily production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch: {
      name: "Fetch",
      requestType: DailyProductionServiceFetchRequest,
      requestStream: false,
      responseType: DailyProductionServiceFetchResponse,
      responseStream: true,
      options: {},
    },
    /** Fetch daily production data for multiple wells. Returns a column-structured result per well. */
    fetchByWell: {
      name: "FetchByWell",
      requestType: DailyProductionServiceFetchByWellRequest,
      requestStream: false,
      responseType: DailyProductionServiceFetchByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Calculate the sum of daily production phases for multiple wells. */
    sumByWell: {
      name: "SumByWell",
      requestType: DailyProductionServiceSumByWellRequest,
      requestStream: false,
      responseType: DailyProductionServiceSumByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Calculate the amount of values of daily production phases for multiple wells. */
    countByWell: {
      name: "CountByWell",
      requestType: DailyProductionServiceCountByWellRequest,
      requestStream: false,
      responseType: DailyProductionServiceCountByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Delete all production data for the given project. */
    deleteByProject: {
      name: "DeleteByProject",
      requestType: DailyProductionServiceDeleteByProjectRequest,
      requestStream: false,
      responseType: DailyProductionServiceDeleteByProjectResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell: {
      name: "DeleteByWell",
      requestType: DailyProductionServiceDeleteByWellRequest,
      requestStream: false,
      responseType: DailyProductionServiceDeleteByWellResponse,
      responseStream: false,
      options: {},
    },
    /** Delete all production data for the given wells. */
    deleteByManyWells: {
      name: "DeleteByManyWells",
      requestType: DailyProductionServiceDeleteByManyWellsRequest,
      requestStream: false,
      responseType: DailyProductionServiceDeleteByManyWellsResponse,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface DailyProductionServiceImplementation<CallContextExt = {}> {
  /** Upsert daily production data for multiple wells. */
  upsert(
    request: AsyncIterable<DailyProductionServiceUpsertRequest>,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<DailyProductionServiceUpsertResponse>>;
  /** Update daily production data for multiple wells, when the wells are changed to company scope. */
  changeToCompanyScope(
    request: DailyProductionServiceChangeToCompanyScopeRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<DailyProductionServiceChangeToCompanyScopeResponse>>;
  /**
   * Fetch daily production data for multiple wells. Results are guaranteed to
   * be sorted by well, then by date.
   */
  fetch(
    request: DailyProductionServiceFetchRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceFetchResponse>>;
  /** Fetch daily production data for multiple wells. Returns a column-structured result per well. */
  fetchByWell(
    request: DailyProductionServiceFetchByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceFetchByWellResponse>>;
  /** Calculate the sum of daily production phases for multiple wells. */
  sumByWell(
    request: DailyProductionServiceSumByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceSumByWellResponse>>;
  /** Calculate the amount of values of daily production phases for multiple wells. */
  countByWell(
    request: DailyProductionServiceCountByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<DailyProductionServiceCountByWellResponse>>;
  /** Delete all production data for the given project. */
  deleteByProject(
    request: DailyProductionServiceDeleteByProjectRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<DailyProductionServiceDeleteByProjectResponse>>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: DailyProductionServiceDeleteByWellRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<DailyProductionServiceDeleteByWellResponse>>;
  /** Delete all production data for the given wells. */
  deleteByManyWells(
    request: DailyProductionServiceDeleteByManyWellsRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<DailyProductionServiceDeleteByManyWellsResponse>>;
}

export interface DailyProductionServiceClient<CallOptionsExt = {}> {
  /** Upsert daily production data for multiple wells. */
  upsert(
    request: AsyncIterable<DeepPartial<DailyProductionServiceUpsertRequest>>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DailyProductionServiceUpsertResponse>;
  /** Update daily production data for multiple wells, when the wells are changed to company scope. */
  changeToCompanyScope(
    request: DeepPartial<DailyProductionServiceChangeToCompanyScopeRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DailyProductionServiceChangeToCompanyScopeResponse>;
  /**
   * Fetch daily production data for multiple wells. Results are guaranteed to
   * be sorted by well, then by date.
   */
  fetch(
    request: DeepPartial<DailyProductionServiceFetchRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<DailyProductionServiceFetchResponse>;
  /** Fetch daily production data for multiple wells. Returns a column-structured result per well. */
  fetchByWell(
    request: DeepPartial<DailyProductionServiceFetchByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<DailyProductionServiceFetchByWellResponse>;
  /** Calculate the sum of daily production phases for multiple wells. */
  sumByWell(
    request: DeepPartial<DailyProductionServiceSumByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<DailyProductionServiceSumByWellResponse>;
  /** Calculate the amount of values of daily production phases for multiple wells. */
  countByWell(
    request: DeepPartial<DailyProductionServiceCountByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<DailyProductionServiceCountByWellResponse>;
  /** Delete all production data for the given project. */
  deleteByProject(
    request: DeepPartial<DailyProductionServiceDeleteByProjectRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DailyProductionServiceDeleteByProjectResponse>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: DeepPartial<DailyProductionServiceDeleteByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DailyProductionServiceDeleteByWellResponse>;
  /** Delete all production data for the given wells. */
  deleteByManyWells(
    request: DeepPartial<DailyProductionServiceDeleteByManyWellsRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<DailyProductionServiceDeleteByManyWellsResponse>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function toTimestamp(date: Date): Timestamp {
  const seconds = date.getTime() / 1_000;
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = (t.seconds || 0) * 1_000;
  millis += (t.nanos || 0) / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export type ServerStreamingMethodResult<Response> = { [Symbol.asyncIterator](): AsyncIterator<Response, void> };
