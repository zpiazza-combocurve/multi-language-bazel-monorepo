/* eslint-disable */
import type { CallContext, CallOptions } from "nice-grpc-common";
import _m0 from "protobufjs/minimal";
import { FieldMask } from "../../../google/protobuf/field_mask";
import { Timestamp } from "../../../google/protobuf/timestamp";
import { DateRange } from "../../common/v1/date_range";

export const protobufPackage = "combocurve.external.v1";

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
  fieldMask:
    | string[]
    | undefined;
  /**
   * API layers are responsible for enforcing that the size of `wells` is
   * reasonable for a single request.
   */
  wells: string[];
  /** When null or missing, only company-level wells will be returned. */
  project?: string | undefined;
  dateRange: DateRange | undefined;
  createdAtRange: DateRange | undefined;
  updatedAtRange:
    | DateRange
    | undefined;
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

function createBaseExternalMonthlyProductionServiceCountRequest(): ExternalMonthlyProductionServiceCountRequest {
  return {
    wells: [],
    project: undefined,
    dateRange: undefined,
    createdAtRange: undefined,
    updatedAtRange: undefined,
    onlyPhysicalWells: undefined,
  };
}

export const ExternalMonthlyProductionServiceCountRequest = {
  encode(message: ExternalMonthlyProductionServiceCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.wells) {
      writer.uint32(10).string(v!);
    }
    if (message.project !== undefined) {
      writer.uint32(18).string(message.project);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
    }
    if (message.createdAtRange !== undefined) {
      DateRange.encode(message.createdAtRange, writer.uint32(34).fork()).ldelim();
    }
    if (message.updatedAtRange !== undefined) {
      DateRange.encode(message.updatedAtRange, writer.uint32(42).fork()).ldelim();
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(48).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceCountRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.wells.push(reader.string());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.project = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.createdAtRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.updatedAtRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 48) {
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

  fromJSON(object: any): ExternalMonthlyProductionServiceCountRequest {
    return {
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      project: isSet(object.project) ? String(object.project) : undefined,
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      createdAtRange: isSet(object.createdAtRange) ? DateRange.fromJSON(object.createdAtRange) : undefined,
      updatedAtRange: isSet(object.updatedAtRange) ? DateRange.fromJSON(object.updatedAtRange) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: ExternalMonthlyProductionServiceCountRequest): unknown {
    const obj: any = {};
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.project !== undefined && (obj.project = message.project);
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.createdAtRange !== undefined &&
      (obj.createdAtRange = message.createdAtRange ? DateRange.toJSON(message.createdAtRange) : undefined);
    message.updatedAtRange !== undefined &&
      (obj.updatedAtRange = message.updatedAtRange ? DateRange.toJSON(message.updatedAtRange) : undefined);
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceCountRequest>,
  ): ExternalMonthlyProductionServiceCountRequest {
    return ExternalMonthlyProductionServiceCountRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceCountRequest>,
  ): ExternalMonthlyProductionServiceCountRequest {
    const message = createBaseExternalMonthlyProductionServiceCountRequest();
    message.wells = object.wells?.map((e) => e) || [];
    message.project = object.project ?? undefined;
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.createdAtRange = (object.createdAtRange !== undefined && object.createdAtRange !== null)
      ? DateRange.fromPartial(object.createdAtRange)
      : undefined;
    message.updatedAtRange = (object.updatedAtRange !== undefined && object.updatedAtRange !== null)
      ? DateRange.fromPartial(object.updatedAtRange)
      : undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceCountResponse(): ExternalMonthlyProductionServiceCountResponse {
  return { count: 0 };
}

export const ExternalMonthlyProductionServiceCountResponse = {
  encode(message: ExternalMonthlyProductionServiceCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.count !== 0) {
      writer.uint32(8).int32(message.count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.count = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ExternalMonthlyProductionServiceCountResponse {
    return { count: isSet(object.count) ? Number(object.count) : 0 };
  },

  toJSON(message: ExternalMonthlyProductionServiceCountResponse): unknown {
    const obj: any = {};
    message.count !== undefined && (obj.count = Math.round(message.count));
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceCountResponse>,
  ): ExternalMonthlyProductionServiceCountResponse {
    return ExternalMonthlyProductionServiceCountResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceCountResponse>,
  ): ExternalMonthlyProductionServiceCountResponse {
    const message = createBaseExternalMonthlyProductionServiceCountResponse();
    message.count = object.count ?? 0;
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceFetchRequest(): ExternalMonthlyProductionServiceFetchRequest {
  return {
    fieldMask: undefined,
    wells: [],
    project: undefined,
    dateRange: undefined,
    createdAtRange: undefined,
    updatedAtRange: undefined,
    sort: undefined,
    skip: undefined,
    take: undefined,
    onlyPhysicalWells: undefined,
  };
}

export const ExternalMonthlyProductionServiceFetchRequest = {
  encode(message: ExternalMonthlyProductionServiceFetchRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.wells) {
      writer.uint32(18).string(v!);
    }
    if (message.project !== undefined) {
      writer.uint32(26).string(message.project);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(34).fork()).ldelim();
    }
    if (message.createdAtRange !== undefined) {
      DateRange.encode(message.createdAtRange, writer.uint32(42).fork()).ldelim();
    }
    if (message.updatedAtRange !== undefined) {
      DateRange.encode(message.updatedAtRange, writer.uint32(50).fork()).ldelim();
    }
    if (message.sort !== undefined) {
      writer.uint32(58).string(message.sort);
    }
    if (message.skip !== undefined) {
      writer.uint32(64).int32(message.skip);
    }
    if (message.take !== undefined) {
      writer.uint32(72).int32(message.take);
    }
    if (message.onlyPhysicalWells !== undefined) {
      writer.uint32(80).bool(message.onlyPhysicalWells);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceFetchRequest();
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

          message.project = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.dateRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.createdAtRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.updatedAtRange = DateRange.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.sort = reader.string();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.skip = reader.int32();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.take = reader.int32();
          continue;
        case 10:
          if (tag !== 80) {
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

  fromJSON(object: any): ExternalMonthlyProductionServiceFetchRequest {
    return {
      fieldMask: isSet(object.fieldMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.fieldMask)) : undefined,
      wells: Array.isArray(object?.wells) ? object.wells.map((e: any) => String(e)) : [],
      project: isSet(object.project) ? String(object.project) : undefined,
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
      createdAtRange: isSet(object.createdAtRange) ? DateRange.fromJSON(object.createdAtRange) : undefined,
      updatedAtRange: isSet(object.updatedAtRange) ? DateRange.fromJSON(object.updatedAtRange) : undefined,
      sort: isSet(object.sort) ? String(object.sort) : undefined,
      skip: isSet(object.skip) ? Number(object.skip) : undefined,
      take: isSet(object.take) ? Number(object.take) : undefined,
      onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
    };
  },

  toJSON(message: ExternalMonthlyProductionServiceFetchRequest): unknown {
    const obj: any = {};
    message.fieldMask !== undefined && (obj.fieldMask = FieldMask.toJSON(FieldMask.wrap(message.fieldMask)));
    if (message.wells) {
      obj.wells = message.wells.map((e) => e);
    } else {
      obj.wells = [];
    }
    message.project !== undefined && (obj.project = message.project);
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    message.createdAtRange !== undefined &&
      (obj.createdAtRange = message.createdAtRange ? DateRange.toJSON(message.createdAtRange) : undefined);
    message.updatedAtRange !== undefined &&
      (obj.updatedAtRange = message.updatedAtRange ? DateRange.toJSON(message.updatedAtRange) : undefined);
    message.sort !== undefined && (obj.sort = message.sort);
    message.skip !== undefined && (obj.skip = Math.round(message.skip));
    message.take !== undefined && (obj.take = Math.round(message.take));
    message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>,
  ): ExternalMonthlyProductionServiceFetchRequest {
    return ExternalMonthlyProductionServiceFetchRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>,
  ): ExternalMonthlyProductionServiceFetchRequest {
    const message = createBaseExternalMonthlyProductionServiceFetchRequest();
    message.fieldMask = object.fieldMask ?? undefined;
    message.wells = object.wells?.map((e) => e) || [];
    message.project = object.project ?? undefined;
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    message.createdAtRange = (object.createdAtRange !== undefined && object.createdAtRange !== null)
      ? DateRange.fromPartial(object.createdAtRange)
      : undefined;
    message.updatedAtRange = (object.updatedAtRange !== undefined && object.updatedAtRange !== null)
      ? DateRange.fromPartial(object.updatedAtRange)
      : undefined;
    message.sort = object.sort ?? undefined;
    message.skip = object.skip ?? undefined;
    message.take = object.take ?? undefined;
    message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceFetchResponse(): ExternalMonthlyProductionServiceFetchResponse {
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
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export const ExternalMonthlyProductionServiceFetchResponse = {
  encode(message: ExternalMonthlyProductionServiceFetchResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.date !== undefined) {
      Timestamp.encode(toTimestamp(message.date), writer.uint32(170).fork()).ldelim();
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
    if (message.createdAt !== undefined) {
      Timestamp.encode(toTimestamp(message.createdAt), writer.uint32(154).fork()).ldelim();
    }
    if (message.updatedAt !== undefined) {
      Timestamp.encode(toTimestamp(message.updatedAt), writer.uint32(162).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceFetchResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceFetchResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 21:
          if (tag !== 170) {
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
        case 19:
          if (tag !== 154) {
            break;
          }

          message.createdAt = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 20:
          if (tag !== 162) {
            break;
          }

          message.updatedAt = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ExternalMonthlyProductionServiceFetchResponse {
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
      createdAt: isSet(object.createdAt) ? fromJsonTimestamp(object.createdAt) : undefined,
      updatedAt: isSet(object.updatedAt) ? fromJsonTimestamp(object.updatedAt) : undefined,
    };
  },

  toJSON(message: ExternalMonthlyProductionServiceFetchResponse): unknown {
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
    message.createdAt !== undefined && (obj.createdAt = message.createdAt.toISOString());
    message.updatedAt !== undefined && (obj.updatedAt = message.updatedAt.toISOString());
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>,
  ): ExternalMonthlyProductionServiceFetchResponse {
    return ExternalMonthlyProductionServiceFetchResponse.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceFetchResponse>,
  ): ExternalMonthlyProductionServiceFetchResponse {
    const message = createBaseExternalMonthlyProductionServiceFetchResponse();
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
    message.createdAt = object.createdAt ?? undefined;
    message.updatedAt = object.updatedAt ?? undefined;
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceUpsertRequest(): ExternalMonthlyProductionServiceUpsertRequest {
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

export const ExternalMonthlyProductionServiceUpsertRequest = {
  encode(message: ExternalMonthlyProductionServiceUpsertRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceUpsertRequest();
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

  fromJSON(object: any): ExternalMonthlyProductionServiceUpsertRequest {
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

  toJSON(message: ExternalMonthlyProductionServiceUpsertRequest): unknown {
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

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>,
  ): ExternalMonthlyProductionServiceUpsertRequest {
    return ExternalMonthlyProductionServiceUpsertRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>,
  ): ExternalMonthlyProductionServiceUpsertRequest {
    const message = createBaseExternalMonthlyProductionServiceUpsertRequest();
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

function createBaseExternalMonthlyProductionServiceUpsertResponse(): ExternalMonthlyProductionServiceUpsertResponse {
  return {};
}

export const ExternalMonthlyProductionServiceUpsertResponse = {
  encode(_: ExternalMonthlyProductionServiceUpsertResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceUpsertResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceUpsertResponse();
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

  fromJSON(_: any): ExternalMonthlyProductionServiceUpsertResponse {
    return {};
  },

  toJSON(_: ExternalMonthlyProductionServiceUpsertResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>,
  ): ExternalMonthlyProductionServiceUpsertResponse {
    return ExternalMonthlyProductionServiceUpsertResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>,
  ): ExternalMonthlyProductionServiceUpsertResponse {
    const message = createBaseExternalMonthlyProductionServiceUpsertResponse();
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceDeleteByWellRequest(): ExternalMonthlyProductionServiceDeleteByWellRequest {
  return { well: "", dateRange: undefined };
}

export const ExternalMonthlyProductionServiceDeleteByWellRequest = {
  encode(
    message: ExternalMonthlyProductionServiceDeleteByWellRequest,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.well !== "") {
      writer.uint32(10).string(message.well);
    }
    if (message.dateRange !== undefined) {
      DateRange.encode(message.dateRange, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceDeleteByWellRequest();
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

  fromJSON(object: any): ExternalMonthlyProductionServiceDeleteByWellRequest {
    return {
      well: isSet(object.well) ? String(object.well) : "",
      dateRange: isSet(object.dateRange) ? DateRange.fromJSON(object.dateRange) : undefined,
    };
  },

  toJSON(message: ExternalMonthlyProductionServiceDeleteByWellRequest): unknown {
    const obj: any = {};
    message.well !== undefined && (obj.well = message.well);
    message.dateRange !== undefined &&
      (obj.dateRange = message.dateRange ? DateRange.toJSON(message.dateRange) : undefined);
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>,
  ): ExternalMonthlyProductionServiceDeleteByWellRequest {
    return ExternalMonthlyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
  },

  fromPartial(
    object: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>,
  ): ExternalMonthlyProductionServiceDeleteByWellRequest {
    const message = createBaseExternalMonthlyProductionServiceDeleteByWellRequest();
    message.well = object.well ?? "";
    message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
      ? DateRange.fromPartial(object.dateRange)
      : undefined;
    return message;
  },
};

function createBaseExternalMonthlyProductionServiceDeleteByWellResponse(): ExternalMonthlyProductionServiceDeleteByWellResponse {
  return {};
}

export const ExternalMonthlyProductionServiceDeleteByWellResponse = {
  encode(
    _: ExternalMonthlyProductionServiceDeleteByWellResponse,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalMonthlyProductionServiceDeleteByWellResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalMonthlyProductionServiceDeleteByWellResponse();
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

  fromJSON(_: any): ExternalMonthlyProductionServiceDeleteByWellResponse {
    return {};
  },

  toJSON(_: ExternalMonthlyProductionServiceDeleteByWellResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create(
    base?: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>,
  ): ExternalMonthlyProductionServiceDeleteByWellResponse {
    return ExternalMonthlyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
  },

  fromPartial(
    _: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>,
  ): ExternalMonthlyProductionServiceDeleteByWellResponse {
    const message = createBaseExternalMonthlyProductionServiceDeleteByWellResponse();
    return message;
  },
};

export type ExternalMonthlyProductionServiceDefinition = typeof ExternalMonthlyProductionServiceDefinition;
export const ExternalMonthlyProductionServiceDefinition = {
  name: "ExternalMonthlyProductionService",
  fullName: "combocurve.external.v1.ExternalMonthlyProductionService",
  methods: {
    /** Count monthly production data for multiple wells. */
    count: {
      name: "Count",
      requestType: ExternalMonthlyProductionServiceCountRequest,
      requestStream: false,
      responseType: ExternalMonthlyProductionServiceCountResponse,
      responseStream: false,
      options: {},
    },
    /** Fetch monthly production data for multiple wells. */
    fetch: {
      name: "Fetch",
      requestType: ExternalMonthlyProductionServiceFetchRequest,
      requestStream: false,
      responseType: ExternalMonthlyProductionServiceFetchResponse,
      responseStream: true,
      options: {},
    },
    /** Upsert monthly production data for multiple wells. */
    upsert: {
      name: "Upsert",
      requestType: ExternalMonthlyProductionServiceUpsertRequest,
      requestStream: true,
      responseType: ExternalMonthlyProductionServiceUpsertResponse,
      responseStream: false,
      options: {},
    },
    /**
     * Delete production data for the given well. An optional date range can be
     * provided to restrict the production data points to be deleted.
     */
    deleteByWell: {
      name: "DeleteByWell",
      requestType: ExternalMonthlyProductionServiceDeleteByWellRequest,
      requestStream: false,
      responseType: ExternalMonthlyProductionServiceDeleteByWellResponse,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface ExternalMonthlyProductionServiceImplementation<CallContextExt = {}> {
  /** Count monthly production data for multiple wells. */
  count(
    request: ExternalMonthlyProductionServiceCountRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<ExternalMonthlyProductionServiceCountResponse>>;
  /** Fetch monthly production data for multiple wells. */
  fetch(
    request: ExternalMonthlyProductionServiceFetchRequest,
    context: CallContext & CallContextExt,
  ): ServerStreamingMethodResult<DeepPartial<ExternalMonthlyProductionServiceFetchResponse>>;
  /** Upsert monthly production data for multiple wells. */
  upsert(
    request: AsyncIterable<ExternalMonthlyProductionServiceUpsertRequest>,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<ExternalMonthlyProductionServiceUpsertResponse>>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: ExternalMonthlyProductionServiceDeleteByWellRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<ExternalMonthlyProductionServiceDeleteByWellResponse>>;
}

export interface ExternalMonthlyProductionServiceClient<CallOptionsExt = {}> {
  /** Count monthly production data for multiple wells. */
  count(
    request: DeepPartial<ExternalMonthlyProductionServiceCountRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<ExternalMonthlyProductionServiceCountResponse>;
  /** Fetch monthly production data for multiple wells. */
  fetch(
    request: DeepPartial<ExternalMonthlyProductionServiceFetchRequest>,
    options?: CallOptions & CallOptionsExt,
  ): AsyncIterable<ExternalMonthlyProductionServiceFetchResponse>;
  /** Upsert monthly production data for multiple wells. */
  upsert(
    request: AsyncIterable<DeepPartial<ExternalMonthlyProductionServiceUpsertRequest>>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<ExternalMonthlyProductionServiceUpsertResponse>;
  /**
   * Delete production data for the given well. An optional date range can be
   * provided to restrict the production data points to be deleted.
   */
  deleteByWell(
    request: DeepPartial<ExternalMonthlyProductionServiceDeleteByWellRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<ExternalMonthlyProductionServiceDeleteByWellResponse>;
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
