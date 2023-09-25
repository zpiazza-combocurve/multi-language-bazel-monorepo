/* eslint-disable */
import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { FieldMask } from "../../../google/protobuf/field_mask";
import { Timestamp } from "../../../google/protobuf/timestamp";
import { DateRange } from "../../common/v1/date_range";

export const protobufPackage = "combocurve.dal.v1";

export interface MonthlyProductionServiceUpsertRequest {
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

export interface MonthlyProductionServiceFetchByWellRequest {
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

export interface MonthlyProductionServiceFetchByWellResponse {
  date: Date[];
  well: string;
  project?: string | undefined;
  choke: number[];
  co2Injection: number[];
  daysOn: number[];
  gas: number[];
  gasInjection: number[];
  ngl: number[];
  oil: number[];
  steamInjection: number[];
  water: number[];
  waterInjection: number[];
  customNumber0: number[];
  customNumber1: number[];
  customNumber2: number[];
  customNumber3: number[];
  customNumber4: number[];
}

export interface MonthlyProductionServiceSumByWellRequest {
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

function createBaseMonthlyProductionServiceUpsertRequest(): MonthlyProductionServiceUpsertRequest {
  return {
    fieldMask: undefined,
    well: "",
    date: undefined,
    project: undefined,
    choke: undefined,
    co2Injection: undefined,
    daysOn: undefined,
    gas: undefined,
    gasInjection: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
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

export const MonthlyProductionServiceUpsertRequest = {
  encode(message: MonthlyProductionServiceUpsertRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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
    if (message.choke !== undefined) {
      writer.uint32(41).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(49).double(message.co2Injection);
    }
    if (message.daysOn !== undefined) {
      writer.uint32(57).double(message.daysOn);
    }
    if (message.gas !== undefined) {
      writer.uint32(65).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(73).double(message.gasInjection);
    }
    if (message.ngl !== undefined) {
      writer.uint32(81).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(89).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(97).double(message.steamInjection);
    }
    if (message.water !== undefined) {
      writer.uint32(105).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(113).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(121).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(129).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(137).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(145).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(153).double(message.customNumber4);
    }
    if (message.operationalTag !== undefined) {
      writer.uint32(162).string(message.operationalTag);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceUpsertRequest();
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

          message.daysOn = reader.double();
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

          message.ngl = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.water = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 18:
          if (tag !== 145) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 19:
          if (tag !== 153) {
            break;
          }

          message.customNumber4 = reader.double();
          continue;
        case 20:
          if (tag !== 162) {
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

  fromJSON(object: any): MonthlyProductionServiceUpsertRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      well: isSet(object.well) ? String(object.well) : "",
      date: isSet(object.date) ? fromJsonTimestamp(object.date) : undefined,
      project: isSet(object.project) ? String(object.project) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      daysOn: isSet(object.daysOn) ? Number(object.daysOn) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
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

  toJSON(message: MonthlyProductionServiceUpsertRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    message.well !== undefined && (obj.well = message.well);
    message.date !== undefined && (obj.date = message.date.toISOString());
    message.project !== undefined && (obj.project = message.project);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.daysOn !== undefined && (obj.daysOn = message.daysOn);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
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

  create(base?: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest {
    return MonthlyProductionServiceUpsertRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<MonthlyProductionServiceUpsertRequest>): MonthlyProductionServiceUpsertRequest {
    const message = createBaseMonthlyProductionServiceUpsertRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.well = object.well ?? "";
    message.date = object.date ?? undefined;
    message.project = object.project ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.daysOn = object.daysOn ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
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

function createBaseMonthlyProductionServiceUpsertResponse(): MonthlyProductionServiceUpsertResponse {
  return {};
}

export const MonthlyProductionServiceUpsertResponse = {
  encode(_: MonthlyProductionServiceUpsertResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceUpsertResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceUpsertResponse();
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

  fromJSON(_: any): MonthlyProductionServiceUpsertResponse {
    return {};
  },

  toJSON(_: MonthlyProductionServiceUpsertResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(base?: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse {
    return MonthlyProductionServiceUpsertResponse.fromPartial(base ?? {});
  },

  fromPartial(_: DeepPartial<MonthlyProductionServiceUpsertResponse>): MonthlyProductionServiceUpsertResponse {
    const message = createBaseMonthlyProductionServiceUpsertResponse();
    return message;
  },
};

function createBaseMonthlyProductionServiceChangeToCompanyScopeRequest(): MonthlyProductionServiceChangeToCompanyScopeRequest {
  return { wells: [] };
}

export const MonthlyProductionServiceChangeToCompanyScopeRequest = {
  encode(
    message: MonthlyProductionServiceChangeToCompanyScopeRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.wells) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceChangeToCompanyScopeRequest();
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

  fromJSON(object: any): MonthlyProductionServiceChangeToCompanyScopeRequest {
    return { wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [] };
  },

  toJSON(message: MonthlyProductionServiceChangeToCompanyScopeRequest): unknown {
    const obj: any = {};
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>,
  ): MonthlyProductionServiceChangeToCompanyScopeRequest {
    return MonthlyProductionServiceChangeToCompanyScopeRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>,
  ): MonthlyProductionServiceChangeToCompanyScopeRequest {
    const message = createBaseMonthlyProductionServiceChangeToCompanyScopeRequest();
    message.wells = object.wells?.map((e) => e) || [];
    return message;
  },
};

function createBaseMonthlyProductionServiceChangeToCompanyScopeResponse(): MonthlyProductionServiceChangeToCompanyScopeResponse {
  return {};
}

export const MonthlyProductionServiceChangeToCompanyScopeResponse = {
  encode(
    _: MonthlyProductionServiceChangeToCompanyScopeResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceChangeToCompanyScopeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceChangeToCompanyScopeResponse();
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

  fromJSON(_: any): MonthlyProductionServiceChangeToCompanyScopeResponse {
    return {};
  },

  toJSON(_: MonthlyProductionServiceChangeToCompanyScopeResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>,
  ): MonthlyProductionServiceChangeToCompanyScopeResponse {
    return MonthlyProductionServiceChangeToCompanyScopeResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>,
  ): MonthlyProductionServiceChangeToCompanyScopeResponse {
    const message = createBaseMonthlyProductionServiceChangeToCompanyScopeResponse();
    return message;
  },
};

function createBaseMonthlyProductionServiceFetchRequest(): MonthlyProductionServiceFetchRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const MonthlyProductionServiceFetchRequest = {
  encode(message: MonthlyProductionServiceFetchRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceFetchRequest();
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

  fromJSON(object: any): MonthlyProductionServiceFetchRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceFetchRequest): unknown {
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

  create(base?: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest {
    return MonthlyProductionServiceFetchRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<MonthlyProductionServiceFetchRequest>): MonthlyProductionServiceFetchRequest {
    const message = createBaseMonthlyProductionServiceFetchRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseMonthlyProductionServiceFetchResponse(): MonthlyProductionServiceFetchResponse {
  return {
    date: undefined,
    well: "",
    project: undefined,
    choke: undefined,
    co2Injection: undefined,
    daysOn: undefined,
    gas: undefined,
    gasInjection: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
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

export const MonthlyProductionServiceFetchResponse = {
  encode(message: MonthlyProductionServiceFetchResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.date !== undefined) {
      Timestamp.encode(toTimestamp(message.date), writer.uint32(154).fork()).ldelim();
    }
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.choke !== undefined) {
      writer.uint32(25).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(33).double(message.co2Injection);
    }
    if (message.daysOn !== undefined) {
      writer.uint32(41).double(message.daysOn);
    }
    if (message.gas !== undefined) {
      writer.uint32(49).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(57).double(message.gasInjection);
    }
    if (message.ngl !== undefined) {
      writer.uint32(65).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(73).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(81).double(message.steamInjection);
    }
    if (message.water !== undefined) {
      writer.uint32(89).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(97).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(105).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(113).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(121).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(129).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(137).double(message.customNumber4);
    }
    if (message.operationalTag !== undefined) {
      writer.uint32(146).string(message.operationalTag);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceFetchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 19:
          if (tag !== 154) {
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

          message.choke = reader.double();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.daysOn = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.water = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
            break;
          }

          message.customNumber4 = reader.double();
          continue;
        case 18:
          if (tag !== 146) {
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

  fromJSON(object: any): MonthlyProductionServiceFetchResponse {
    return {
      date: isSet(object.date) ? fromJsonTimestamp(object.date) : undefined,
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      daysOn: isSet(object.daysOn) ? Number(object.daysOn) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
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

  toJSON(message: MonthlyProductionServiceFetchResponse): unknown {
    const obj: any = {};
    message.date !== undefined && (obj.date = message.date.toISOString());
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.daysOn !== undefined && (obj.daysOn = message.daysOn);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
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

  create(base?: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse {
    return MonthlyProductionServiceFetchResponse.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<MonthlyProductionServiceFetchResponse>): MonthlyProductionServiceFetchResponse {
    const message = createBaseMonthlyProductionServiceFetchResponse();
    message.date = object.date ?? undefined;
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.daysOn = object.daysOn ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
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

function createBaseMonthlyProductionServiceFetchByWellRequest(): MonthlyProductionServiceFetchByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const MonthlyProductionServiceFetchByWellRequest = {
  encode(message: MonthlyProductionServiceFetchByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceFetchByWellRequest();
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

  fromJSON(object: any): MonthlyProductionServiceFetchByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceFetchByWellRequest): unknown {
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

  create(base?: DeepPartial<MonthlyProductionServiceFetchByWellRequest>): MonthlyProductionServiceFetchByWellRequest {
    return MonthlyProductionServiceFetchByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceFetchByWellRequest>,
  ): MonthlyProductionServiceFetchByWellRequest {
    const message = createBaseMonthlyProductionServiceFetchByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseMonthlyProductionServiceFetchByWellResponse(): MonthlyProductionServiceFetchByWellResponse {
  return {
    date: [],
    well: "",
    project: undefined,
    choke: [],
    co2Injection: [],
    daysOn: [],
    gas: [],
    gasInjection: [],
    ngl: [],
    oil: [],
    steamInjection: [],
    water: [],
    waterInjection: [],
    customNumber0: [],
    customNumber1: [],
    customNumber2: [],
    customNumber3: [],
    customNumber4: [],
  };
}

export const MonthlyProductionServiceFetchByWellResponse = {
  encode(message: MonthlyProductionServiceFetchByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.date) {
      Timestamp.encode(toTimestamp(v!), writer.uint32(146).fork()).ldelim();
    }
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    writer.uint32(26).fork();
    for (const v of message.choke) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(34).fork();
    for (const v of message.co2Injection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(42).fork();
    for (const v of message.daysOn) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(50).fork();
    for (const v of message.gas) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(58).fork();
    for (const v of message.gasInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(66).fork();
    for (const v of message.ngl) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(74).fork();
    for (const v of message.oil) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(82).fork();
    for (const v of message.steamInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(90).fork();
    for (const v of message.water) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(98).fork();
    for (const v of message.waterInjection) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(106).fork();
    for (const v of message.customNumber0) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(114).fork();
    for (const v of message.customNumber1) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(122).fork();
    for (const v of message.customNumber2) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(130).fork();
    for (const v of message.customNumber3) {
      writer.double(v);
    }
    writer.ldelim();
    writer.uint32(138).fork();
    for (const v of message.customNumber4) {
      writer.double(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceFetchByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceFetchByWellResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 18:
          if (tag !== 146) {
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
            message.choke.push(reader.double());

            continue;
          }

          if (tag === 26) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.choke.push(reader.double());
            }

            continue;
          }

          break;
        case 4:
          if (tag === 33) {
            message.co2Injection.push(reader.double());

            continue;
          }

          if (tag === 34) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.co2Injection.push(reader.double());
            }

            continue;
          }

          break;
        case 5:
          if (tag === 41) {
            message.daysOn.push(reader.double());

            continue;
          }

          if (tag === 42) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.daysOn.push(reader.double());
            }

            continue;
          }

          break;
        case 6:
          if (tag === 49) {
            message.gas.push(reader.double());

            continue;
          }

          if (tag === 50) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.gas.push(reader.double());
            }

            continue;
          }

          break;
        case 7:
          if (tag === 57) {
            message.gasInjection.push(reader.double());

            continue;
          }

          if (tag === 58) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.gasInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 8:
          if (tag === 65) {
            message.ngl.push(reader.double());

            continue;
          }

          if (tag === 66) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.ngl.push(reader.double());
            }

            continue;
          }

          break;
        case 9:
          if (tag === 73) {
            message.oil.push(reader.double());

            continue;
          }

          if (tag === 74) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.oil.push(reader.double());
            }

            continue;
          }

          break;
        case 10:
          if (tag === 81) {
            message.steamInjection.push(reader.double());

            continue;
          }

          if (tag === 82) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.steamInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 11:
          if (tag === 89) {
            message.water.push(reader.double());

            continue;
          }

          if (tag === 90) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.water.push(reader.double());
            }

            continue;
          }

          break;
        case 12:
          if (tag === 97) {
            message.waterInjection.push(reader.double());

            continue;
          }

          if (tag === 98) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.waterInjection.push(reader.double());
            }

            continue;
          }

          break;
        case 13:
          if (tag === 105) {
            message.customNumber0.push(reader.double());

            continue;
          }

          if (tag === 106) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber0.push(reader.double());
            }

            continue;
          }

          break;
        case 14:
          if (tag === 113) {
            message.customNumber1.push(reader.double());

            continue;
          }

          if (tag === 114) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber1.push(reader.double());
            }

            continue;
          }

          break;
        case 15:
          if (tag === 121) {
            message.customNumber2.push(reader.double());

            continue;
          }

          if (tag === 122) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber2.push(reader.double());
            }

            continue;
          }

          break;
        case 16:
          if (tag === 129) {
            message.customNumber3.push(reader.double());

            continue;
          }

          if (tag === 130) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.customNumber3.push(reader.double());
            }

            continue;
          }

          break;
        case 17:
          if (tag === 137) {
            message.customNumber4.push(reader.double());

            continue;
          }

          if (tag === 138) {
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

  fromJSON(object: any): MonthlyProductionServiceFetchByWellResponse {
    return {
      date: Array.isArray(object?.date) ? object.date.map((e: any) => fromJsonTimestamp(e)) : [],
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      choke: Array.isArray(object?.choke) ? object.choke.map((e: any) => Number(e)) : [],
      co2Injection: Array.isArray(object?.co2Injection) ? object.co2Injection.map((e: any) => Number(e)) : [],
      daysOn: Array.isArray(object?.daysOn) ? object.daysOn.map((e: any) => Number(e)) : [],
      gas: Array.isArray(object?.gas) ? object.gas.map((e: any) => Number(e)) : [],
      gasInjection: Array.isArray(object?.gasInjection) ? object.gasInjection.map((e: any) => Number(e)) : [],
      ngl: Array.isArray(object?.ngl) ? object.ngl.map((e: any) => Number(e)) : [],
      oil: Array.isArray(object?.oil) ? object.oil.map((e: any) => Number(e)) : [],
      steamInjection: Array.isArray(object?.steamInjection) ? object.steamInjection.map((e: any) => Number(e)) : [],
      water: Array.isArray(object?.water) ? object.water.map((e: any) => Number(e)) : [],
      waterInjection: Array.isArray(object?.waterInjection) ? object.waterInjection.map((e: any) => Number(e)) : [],
      customNumber0: Array.isArray(object?.customNumber0) ? object.customNumber0.map((e: any) => Number(e)) : [],
      customNumber1: Array.isArray(object?.customNumber1) ? object.customNumber1.map((e: any) => Number(e)) : [],
      customNumber2: Array.isArray(object?.customNumber2) ? object.customNumber2.map((e: any) => Number(e)) : [],
      customNumber3: Array.isArray(object?.customNumber3) ? object.customNumber3.map((e: any) => Number(e)) : [],
      customNumber4: Array.isArray(object?.customNumber4) ? object.customNumber4.map((e: any) => Number(e)) : [],
    };
  },

  toJSON(message: MonthlyProductionServiceFetchByWellResponse): unknown {
    const obj: any = {};
    if (message.date) {
      obj.date = message.date.map((e) => e.toISOString());
    } else {
      obj.date = [];
    }
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
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
    if (message.daysOn) {
      obj.daysOn = message.daysOn.map((e) => e);
    } else {
      obj.daysOn = [];
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

  create(base?: DeepPartial<MonthlyProductionServiceFetchByWellResponse>): MonthlyProductionServiceFetchByWellResponse {
    return MonthlyProductionServiceFetchByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceFetchByWellResponse>,
  ): MonthlyProductionServiceFetchByWellResponse {
    const message = createBaseMonthlyProductionServiceFetchByWellResponse();
    message.date = object.date?.map((e) => e) || [];
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.choke = object.choke?.map((e) => e) || [];
    message.co2Injection = object.co2Injection?.map((e) => e) || [];
    message.daysOn = object.daysOn?.map((e) => e) || [];
    message.gas = object.gas?.map((e) => e) || [];
    message.gasInjection = object.gasInjection?.map((e) => e) || [];
    message.ngl = object.ngl?.map((e) => e) || [];
    message.oil = object.oil?.map((e) => e) || [];
    message.steamInjection = object.steamInjection?.map((e) => e) || [];
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

function createBaseMonthlyProductionServiceSumByWellRequest(): MonthlyProductionServiceSumByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const MonthlyProductionServiceSumByWellRequest = {
  encode(message: MonthlyProductionServiceSumByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceSumByWellRequest();
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

  fromJSON(object: any): MonthlyProductionServiceSumByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceSumByWellRequest): unknown {
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

  create(base?: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest {
    return MonthlyProductionServiceSumByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<MonthlyProductionServiceSumByWellRequest>): MonthlyProductionServiceSumByWellRequest {
    const message = createBaseMonthlyProductionServiceSumByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseMonthlyProductionServiceSumByWellResponse(): MonthlyProductionServiceSumByWellResponse {
  return {
    well: "",
    project: undefined,
    choke: undefined,
    co2Injection: undefined,
    daysOn: undefined,
    gas: undefined,
    gasInjection: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
  };
}

export const MonthlyProductionServiceSumByWellResponse = {
  encode(message: MonthlyProductionServiceSumByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.choke !== undefined) {
      writer.uint32(25).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(33).double(message.co2Injection);
    }
    if (message.daysOn !== undefined) {
      writer.uint32(41).double(message.daysOn);
    }
    if (message.gas !== undefined) {
      writer.uint32(49).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(57).double(message.gasInjection);
    }
    if (message.ngl !== undefined) {
      writer.uint32(65).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(73).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(81).double(message.steamInjection);
    }
    if (message.water !== undefined) {
      writer.uint32(89).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(97).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(105).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(113).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(121).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(129).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(137).double(message.customNumber4);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceSumByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceSumByWellResponse();
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

          message.choke = reader.double();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.daysOn = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.water = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
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

  fromJSON(object: any): MonthlyProductionServiceSumByWellResponse {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      daysOn: isSet(object.daysOn) ? Number(object.daysOn) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceSumByWellResponse): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.daysOn !== undefined && (obj.daysOn = message.daysOn);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.water !== undefined && (obj.water = message.water);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    return obj;
  },

  create(base?: DeepPartial<MonthlyProductionServiceSumByWellResponse>): MonthlyProductionServiceSumByWellResponse {
    return MonthlyProductionServiceSumByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceSumByWellResponse>,
  ): MonthlyProductionServiceSumByWellResponse {
    const message = createBaseMonthlyProductionServiceSumByWellResponse();
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.daysOn = object.daysOn ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
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

function createBaseMonthlyProductionServiceCountByWellRequest(): MonthlyProductionServiceCountByWellRequest {
  return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}

export const MonthlyProductionServiceCountByWellRequest = {
  encode(message: MonthlyProductionServiceCountByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceCountByWellRequest();
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

  fromJSON(object: any): MonthlyProductionServiceCountByWellRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceCountByWellRequest): unknown {
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

  create(base?: DeepPartial<MonthlyProductionServiceCountByWellRequest>): MonthlyProductionServiceCountByWellRequest {
    return MonthlyProductionServiceCountByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceCountByWellRequest>,
  ): MonthlyProductionServiceCountByWellRequest {
    const message = createBaseMonthlyProductionServiceCountByWellRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseMonthlyProductionServiceCountByWellResponse(): MonthlyProductionServiceCountByWellResponse {
  return {
    well: "",
    project: undefined,
    choke: undefined,
    co2Injection: undefined,
    daysOn: undefined,
    gas: undefined,
    gasInjection: undefined,
    ngl: undefined,
    oil: undefined,
    steamInjection: undefined,
    water: undefined,
    waterInjection: undefined,
    customNumber0: undefined,
    customNumber1: undefined,
    customNumber2: undefined,
    customNumber3: undefined,
    customNumber4: undefined,
  };
}

export const MonthlyProductionServiceCountByWellResponse = {
  encode(message: MonthlyProductionServiceCountByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.choke !== undefined) {
      writer.uint32(25).double(message.choke);
    }
    if (message.co2Injection !== undefined) {
      writer.uint32(33).double(message.co2Injection);
    }
    if (message.daysOn !== undefined) {
      writer.uint32(41).double(message.daysOn);
    }
    if (message.gas !== undefined) {
      writer.uint32(49).double(message.gas);
    }
    if (message.gasInjection !== undefined) {
      writer.uint32(57).double(message.gasInjection);
    }
    if (message.ngl !== undefined) {
      writer.uint32(65).double(message.ngl);
    }
    if (message.oil !== undefined) {
      writer.uint32(73).double(message.oil);
    }
    if (message.steamInjection !== undefined) {
      writer.uint32(81).double(message.steamInjection);
    }
    if (message.water !== undefined) {
      writer.uint32(89).double(message.water);
    }
    if (message.waterInjection !== undefined) {
      writer.uint32(97).double(message.waterInjection);
    }
    if (message.customNumber0 !== undefined) {
      writer.uint32(105).double(message.customNumber0);
    }
    if (message.customNumber1 !== undefined) {
      writer.uint32(113).double(message.customNumber1);
    }
    if (message.customNumber2 !== undefined) {
      writer.uint32(121).double(message.customNumber2);
    }
    if (message.customNumber3 !== undefined) {
      writer.uint32(129).double(message.customNumber3);
    }
    if (message.customNumber4 !== undefined) {
      writer.uint32(137).double(message.customNumber4);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceCountByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceCountByWellResponse();
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

          message.choke = reader.double();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.co2Injection = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.daysOn = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 7:
          if (tag !== 57) {
            break;
          }

          message.gasInjection = reader.double();
          continue;
        case 8:
          if (tag !== 65) {
            break;
          }

          message.ngl = reader.double();
          continue;
        case 9:
          if (tag !== 73) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 10:
          if (tag !== 81) {
            break;
          }

          message.steamInjection = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.water = reader.double();
          continue;
        case 12:
          if (tag !== 97) {
            break;
          }

          message.waterInjection = reader.double();
          continue;
        case 13:
          if (tag !== 105) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 14:
          if (tag !== 113) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 15:
          if (tag !== 121) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 16:
          if (tag !== 129) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 17:
          if (tag !== 137) {
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

  fromJSON(object: any): MonthlyProductionServiceCountByWellResponse {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      project: isSet(object.project) ? String(object.project) : undefined,
      choke: isSet(object.choke) ? Number(object.choke) : undefined,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : undefined,
      daysOn: isSet(object.daysOn) ? Number(object.daysOn) : undefined,
      gas: isSet(object.gas) ? Number(object.gas) : undefined,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : undefined,
      ngl: isSet(object.ngl) ? Number(object.ngl) : undefined,
      oil: isSet(object.oil) ? Number(object.oil) : undefined,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : undefined,
      water: isSet(object.water) ? Number(object.water) : undefined,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : undefined,
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : undefined,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : undefined,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : undefined,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : undefined,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceCountByWellResponse): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.project !== undefined && (obj.project = message.project);
    message.choke !== undefined && (obj.choke = message.choke);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.daysOn !== undefined && (obj.daysOn = message.daysOn);
    message.gas !== undefined && (obj.gas = message.gas);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.oil !== undefined && (obj.oil = message.oil);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.water !== undefined && (obj.water = message.water);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    return obj;
  },

  create(base?: DeepPartial<MonthlyProductionServiceCountByWellResponse>): MonthlyProductionServiceCountByWellResponse {
    return MonthlyProductionServiceCountByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceCountByWellResponse>,
  ): MonthlyProductionServiceCountByWellResponse {
    const message = createBaseMonthlyProductionServiceCountByWellResponse();
    message.well = object.well ?? "";
    message.project = object.project ?? undefined;
    message.choke = object.choke ?? undefined;
    message.co2Injection = object.co2Injection ?? undefined;
    message.daysOn = object.daysOn ?? undefined;
    message.gas = object.gas ?? undefined;
    message.gasInjection = object.gasInjection ?? undefined;
    message.ngl = object.ngl ?? undefined;
    message.oil = object.oil ?? undefined;
    message.steamInjection = object.steamInjection ?? undefined;
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

function createBaseMonthlyProductionServiceDeleteByProjectRequest(): MonthlyProductionServiceDeleteByProjectRequest {
  return { project: "" };
}

export const MonthlyProductionServiceDeleteByProjectRequest = {
  encode(
    message: MonthlyProductionServiceDeleteByProjectRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByProjectRequest();
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

  fromJSON(object: any): MonthlyProductionServiceDeleteByProjectRequest {
    return { project: isSet(object.project) ? String(object.project) : "" };
  },

  toJSON(message: MonthlyProductionServiceDeleteByProjectRequest): unknown {
    const obj: any = {};
    message.project !== undefined && (obj.project = message.project);
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>,
  ): MonthlyProductionServiceDeleteByProjectRequest {
    return MonthlyProductionServiceDeleteByProjectRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>,
  ): MonthlyProductionServiceDeleteByProjectRequest {
    const message = createBaseMonthlyProductionServiceDeleteByProjectRequest();
    message.project = object.project ?? "";
    return message;
  },
};

function createBaseMonthlyProductionServiceDeleteByProjectResponse(): MonthlyProductionServiceDeleteByProjectResponse {
  return {};
}

export const MonthlyProductionServiceDeleteByProjectResponse = {
  encode(_: MonthlyProductionServiceDeleteByProjectResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByProjectResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByProjectResponse();
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

  fromJSON(_: any): MonthlyProductionServiceDeleteByProjectResponse {
    return {};
  },

  toJSON(_: MonthlyProductionServiceDeleteByProjectResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>,
  ): MonthlyProductionServiceDeleteByProjectResponse {
    return MonthlyProductionServiceDeleteByProjectResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>,
  ): MonthlyProductionServiceDeleteByProjectResponse {
    const message = createBaseMonthlyProductionServiceDeleteByProjectResponse();
    return message;
  },
};

function createBaseMonthlyProductionServiceDeleteByWellRequest(): MonthlyProductionServiceDeleteByWellRequest {
  return { well: "", dateRange: undefined };
}

export const MonthlyProductionServiceDeleteByWellRequest = {
  encode(message: MonthlyProductionServiceDeleteByWellRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByWellRequest();
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

  fromJSON(object: any): MonthlyProductionServiceDeleteByWellRequest {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
    };
  },

  toJSON(message: MonthlyProductionServiceDeleteByWellRequest): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    return obj;
  },

  create(base?: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>): MonthlyProductionServiceDeleteByWellRequest {
    return MonthlyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>,
  ): MonthlyProductionServiceDeleteByWellRequest {
    const message = createBaseMonthlyProductionServiceDeleteByWellRequest();
    message.well = object.well ?? "";
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    return message;
  },
};

function createBaseMonthlyProductionServiceDeleteByWellResponse(): MonthlyProductionServiceDeleteByWellResponse {
  return {};
}

export const MonthlyProductionServiceDeleteByWellResponse = {
  encode(_: MonthlyProductionServiceDeleteByWellResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByWellResponse();
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

  fromJSON(_: any): MonthlyProductionServiceDeleteByWellResponse {
    return {};
  },

  toJSON(_: MonthlyProductionServiceDeleteByWellResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>,
  ): MonthlyProductionServiceDeleteByWellResponse {
    return MonthlyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<MonthlyProductionServiceDeleteByWellResponse>,
  ): MonthlyProductionServiceDeleteByWellResponse {
    const message = createBaseMonthlyProductionServiceDeleteByWellResponse();
    return message;
  },
};

function createBaseMonthlyProductionServiceDeleteByManyWellsRequest(): MonthlyProductionServiceDeleteByManyWellsRequest {
  return { wells: [] };
}

export const MonthlyProductionServiceDeleteByManyWellsRequest = {
  encode(
    message: MonthlyProductionServiceDeleteByManyWellsRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    for (const v of message.wells) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByManyWellsRequest();
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

  fromJSON(object: any): MonthlyProductionServiceDeleteByManyWellsRequest {
    return { wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [] };
  },

  toJSON(message: MonthlyProductionServiceDeleteByManyWellsRequest): unknown {
    const obj: any = {};
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>,
  ): MonthlyProductionServiceDeleteByManyWellsRequest {
    return MonthlyProductionServiceDeleteByManyWellsRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>,
  ): MonthlyProductionServiceDeleteByManyWellsRequest {
    const message = createBaseMonthlyProductionServiceDeleteByManyWellsRequest();
    message.wells = object.wells?.map((e) => e) || [];
    return message;
  },
};

function createBaseMonthlyProductionServiceDeleteByManyWellsResponse(): MonthlyProductionServiceDeleteByManyWellsResponse {
  return {};
}

export const MonthlyProductionServiceDeleteByManyWellsResponse = {
  encode(_: MonthlyProductionServiceDeleteByManyWellsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionServiceDeleteByManyWellsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionServiceDeleteByManyWellsResponse();
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

  fromJSON(_: any): MonthlyProductionServiceDeleteByManyWellsResponse {
    return {};
  },

  toJSON(_: MonthlyProductionServiceDeleteByManyWellsResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>,
  ): MonthlyProductionServiceDeleteByManyWellsResponse {
    return MonthlyProductionServiceDeleteByManyWellsResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>,
  ): MonthlyProductionServiceDeleteByManyWellsResponse {
    const message = createBaseMonthlyProductionServiceDeleteByManyWellsResponse();
    return message;
  },
};

export type MonthlyProductionServiceDefinition = typeof MonthlyProductionServiceDefinition;
export const MonthlyProductionServiceDefinition = {
  name: "MonthlyProductionService",
  fullName: "combocurve.dal.v1.MonthlyProductionService",
  methods: {
    /** Upsert monthly production data for multiple wells. */
    upsert: {
      name: "Upsert",
      requestType: MonthlyProductionServiceUpsertRequest,
      requestStream: true,
      responseType: MonthlyProductionServiceUpsertResponse,
      responseStream: false,
      options: {},
    },
    /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
    changeToCompanyScope: {
      name: "ChangeToCompanyScope",
      requestType: MonthlyProductionServiceChangeToCompanyScopeRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceChangeToCompanyScopeResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Fetch monthly production data for multiple wells. Results are guaranteed to
     * be sorted by well, then by date.
     */
    fetch: {
      name: "Fetch",
      requestType: MonthlyProductionServiceFetchRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceFetchResponse,
      responseStream: true,
      options: {},
    },
    /** Fetch monthly production data for multiple wells. Returns a column-structured result per well. */
    fetchByWell: {
      name: "FetchByWell",
      requestType: MonthlyProductionServiceFetchByWellRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceFetchByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Calculate the sum of monthly production phases for multiple wells. */
    sumByWell: {
      name: "SumByWell",
      requestType: MonthlyProductionServiceSumByWellRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceSumByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Calculate the amount of values of monthly production phases for multiple wells. */
    countByWell: {
      name: "CountByWell",
      requestType: MonthlyProductionServiceCountByWellRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceCountByWellResponse,
      responseStream: true,
      options: {},
    },
    /** Delete all production data for the given project. */
    deleteByProject: {
      name: "DeleteByProject",
      requestType: MonthlyProductionServiceDeleteByProjectRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceDeleteByProjectResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell: {
      name: "DeleteByWell",
      requestType: MonthlyProductionServiceDeleteByWellRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceDeleteByWellResponse,
      responseStream: false,
      options: {},
    },
    /** Delete all production data for the given wells. */
    deleteByManyWells: {
      name: "DeleteByManyWells",
      requestType: MonthlyProductionServiceDeleteByManyWellsRequest,
      requestStream: false,
      responseType: MonthlyProductionServiceDeleteByManyWellsResponse,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface MonthlyProductionServiceImplementation<CallContextExt = {}> {
  /** Upsert monthly production data for multiple wells. */
  upsert(
    request: AsyncIterable<MonthlyProductionServiceUpsertRequest>,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<MonthlyProductionServiceUpsertResponse>>;
  /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
  changeToCompanyScope(
    request: MonthlyProductionServiceChangeToCompanyScopeRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<MonthlyProductionServiceChangeToCompanyScopeResponse>>;
  /**
   * Fetch monthly production data for multiple wells. Results are guaranteed to
   * be sorted by well, then by date.
   */
  fetch(
    request: MonthlyProductionServiceFetchRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceFetchResponse>>;
  /** Fetch monthly production data for multiple wells. Returns a column-structured result per well. */
  fetchByWell(
    request: MonthlyProductionServiceFetchByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceFetchByWellResponse>>;
  /** Calculate the sum of monthly production phases for multiple wells. */
  sumByWell(
    request: MonthlyProductionServiceSumByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceSumByWellResponse>>;
  /** Calculate the amount of values of monthly production phases for multiple wells. */
  countByWell(
    request: MonthlyProductionServiceCountByWellRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<MonthlyProductionServiceCountByWellResponse>>;
  /** Delete all production data for the given project. */
  deleteByProject(
    request: MonthlyProductionServiceDeleteByProjectRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<MonthlyProductionServiceDeleteByProjectResponse>>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: MonthlyProductionServiceDeleteByWellRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<MonthlyProductionServiceDeleteByWellResponse>>;
  /** Delete all production data for the given wells. */
  deleteByManyWells(
    request: MonthlyProductionServiceDeleteByManyWellsRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<MonthlyProductionServiceDeleteByManyWellsResponse>>;
}

export interface MonthlyProductionServiceClient<CallOptionsExt = {}> {
  /** Upsert monthly production data for multiple wells. */
  upsert(
    request: AsyncIterable<DeepPartial<MonthlyProductionServiceUpsertRequest>>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<MonthlyProductionServiceUpsertResponse>;
  /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
  changeToCompanyScope(
    request: DeepPartial<MonthlyProductionServiceChangeToCompanyScopeRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<MonthlyProductionServiceChangeToCompanyScopeResponse>;
  /**
   * Fetch monthly production data for multiple wells. Results are guaranteed to
   * be sorted by well, then by date.
   */
  fetch(
    request: DeepPartial<MonthlyProductionServiceFetchRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<MonthlyProductionServiceFetchResponse>;
  /** Fetch monthly production data for multiple wells. Returns a column-structured result per well. */
  fetchByWell(
    request: DeepPartial<MonthlyProductionServiceFetchByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<MonthlyProductionServiceFetchByWellResponse>;
  /** Calculate the sum of monthly production phases for multiple wells. */
  sumByWell(
    request: DeepPartial<MonthlyProductionServiceSumByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<MonthlyProductionServiceSumByWellResponse>;
  /** Calculate the amount of values of monthly production phases for multiple wells. */
  countByWell(
    request: DeepPartial<MonthlyProductionServiceCountByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<MonthlyProductionServiceCountByWellResponse>;
  /** Delete all production data for the given project. */
  deleteByProject(
    request: DeepPartial<MonthlyProductionServiceDeleteByProjectRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<MonthlyProductionServiceDeleteByProjectResponse>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: DeepPartial<MonthlyProductionServiceDeleteByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<MonthlyProductionServiceDeleteByWellResponse>;
  /** Delete all production data for the given wells. */
  deleteByManyWells(
    request: DeepPartial<MonthlyProductionServiceDeleteByManyWellsRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<MonthlyProductionServiceDeleteByManyWellsResponse>;
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
