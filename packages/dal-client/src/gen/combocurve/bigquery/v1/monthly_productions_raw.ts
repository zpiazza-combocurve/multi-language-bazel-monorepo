/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "combocurve.bigquery.v1";

export interface MonthlyProductionRaw {
  ChangeType: string;
  wellId: string;
  productionDate: number;
  oil: number;
  gas: number;
  water: number;
  choke: number;
  daysOn: number;
  gasInjection: number;
  waterInjection: number;
  co2Injection: number;
  steamInjection: number;
  ngl: number;
  operationalTag: string;
  createdAt: number;
  updatedAt: number;
  projectId: string;
  customNumber0: number;
  customNumber1: number;
  customNumber2: number;
  customNumber3: number;
  customNumber4: number;
}

function createBaseMonthlyProductionRaw(): MonthlyProductionRaw {
  return {
    ChangeType: "",
    wellId: "",
    productionDate: 0,
    oil: 0,
    gas: 0,
    water: 0,
    choke: 0,
    daysOn: 0,
    gasInjection: 0,
    waterInjection: 0,
    co2Injection: 0,
    steamInjection: 0,
    ngl: 0,
    operationalTag: "",
    createdAt: 0,
    updatedAt: 0,
    projectId: "",
    customNumber0: 0,
    customNumber1: 0,
    customNumber2: 0,
    customNumber3: 0,
    customNumber4: 0,
  };
}

export const MonthlyProductionRaw = {
  encode(message: MonthlyProductionRaw, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.ChangeType !== "") {
      writer.uint32(10).string(message.ChangeType);
    }
    if (message.wellId !== "") {
      writer.uint32(18).string(message.wellId);
    }
    if (message.productionDate !== 0) {
      writer.uint32(24).int32(message.productionDate);
    }
    if (message.oil !== 0) {
      writer.uint32(33).double(message.oil);
    }
    if (message.gas !== 0) {
      writer.uint32(41).double(message.gas);
    }
    if (message.water !== 0) {
      writer.uint32(49).double(message.water);
    }
    if (message.choke !== 0) {
      writer.uint32(57).double(message.choke);
    }
    if (message.daysOn !== 0) {
      writer.uint32(65).double(message.daysOn);
    }
    if (message.gasInjection !== 0) {
      writer.uint32(73).double(message.gasInjection);
    }
    if (message.waterInjection !== 0) {
      writer.uint32(81).double(message.waterInjection);
    }
    if (message.co2Injection !== 0) {
      writer.uint32(89).double(message.co2Injection);
    }
    if (message.steamInjection !== 0) {
      writer.uint32(97).double(message.steamInjection);
    }
    if (message.ngl !== 0) {
      writer.uint32(105).double(message.ngl);
    }
    if (message.operationalTag !== "") {
      writer.uint32(114).string(message.operationalTag);
    }
    if (message.createdAt !== 0) {
      writer.uint32(120).int64(message.createdAt);
    }
    if (message.updatedAt !== 0) {
      writer.uint32(128).int64(message.updatedAt);
    }
    if (message.projectId !== "") {
      writer.uint32(138).string(message.projectId);
    }
    if (message.customNumber0 !== 0) {
      writer.uint32(145).double(message.customNumber0);
    }
    if (message.customNumber1 !== 0) {
      writer.uint32(153).double(message.customNumber1);
    }
    if (message.customNumber2 !== 0) {
      writer.uint32(161).double(message.customNumber2);
    }
    if (message.customNumber3 !== 0) {
      writer.uint32(169).double(message.customNumber3);
    }
    if (message.customNumber4 !== 0) {
      writer.uint32(177).double(message.customNumber4);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MonthlyProductionRaw {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMonthlyProductionRaw();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.ChangeType = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.wellId = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.productionDate = reader.int32();
          continue;
        case 4:
          if (tag !== 33) {
            break;
          }

          message.oil = reader.double();
          continue;
        case 5:
          if (tag !== 41) {
            break;
          }

          message.gas = reader.double();
          continue;
        case 6:
          if (tag !== 49) {
            break;
          }

          message.water = reader.double();
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

          message.daysOn = reader.double();
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

          message.waterInjection = reader.double();
          continue;
        case 11:
          if (tag !== 89) {
            break;
          }

          message.co2Injection = reader.double();
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

          message.ngl = reader.double();
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.operationalTag = reader.string();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.createdAt = longToNumber(reader.int64() as Long);
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.updatedAt = longToNumber(reader.int64() as Long);
          continue;
        case 17:
          if (tag !== 138) {
            break;
          }

          message.projectId = reader.string();
          continue;
        case 18:
          if (tag !== 145) {
            break;
          }

          message.customNumber0 = reader.double();
          continue;
        case 19:
          if (tag !== 153) {
            break;
          }

          message.customNumber1 = reader.double();
          continue;
        case 20:
          if (tag !== 161) {
            break;
          }

          message.customNumber2 = reader.double();
          continue;
        case 21:
          if (tag !== 169) {
            break;
          }

          message.customNumber3 = reader.double();
          continue;
        case 22:
          if (tag !== 177) {
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

  fromJSON(object: any): MonthlyProductionRaw {
    return {
      ChangeType: isSet(object.CHANGETYPE) ? String(object.CHANGETYPE) : "",
      wellId: isSet(object.wellId) ? String(object.wellId) : "",
      productionDate: isSet(object.productionDate) ? Number(object.productionDate) : 0,
      oil: isSet(object.oil) ? Number(object.oil) : 0,
      gas: isSet(object.gas) ? Number(object.gas) : 0,
      water: isSet(object.water) ? Number(object.water) : 0,
      choke: isSet(object.choke) ? Number(object.choke) : 0,
      daysOn: isSet(object.daysOn) ? Number(object.daysOn) : 0,
      gasInjection: isSet(object.gasInjection) ? Number(object.gasInjection) : 0,
      waterInjection: isSet(object.waterInjection) ? Number(object.waterInjection) : 0,
      co2Injection: isSet(object.co2Injection) ? Number(object.co2Injection) : 0,
      steamInjection: isSet(object.steamInjection) ? Number(object.steamInjection) : 0,
      ngl: isSet(object.ngl) ? Number(object.ngl) : 0,
      operationalTag: isSet(object.operationalTag) ? String(object.operationalTag) : "",
      createdAt: isSet(object.createdAt) ? Number(object.createdAt) : 0,
      updatedAt: isSet(object.updatedAt) ? Number(object.updatedAt) : 0,
      projectId: isSet(object.projectId) ? String(object.projectId) : "",
      customNumber0: isSet(object.customNumber0) ? Number(object.customNumber0) : 0,
      customNumber1: isSet(object.customNumber1) ? Number(object.customNumber1) : 0,
      customNumber2: isSet(object.customNumber2) ? Number(object.customNumber2) : 0,
      customNumber3: isSet(object.customNumber3) ? Number(object.customNumber3) : 0,
      customNumber4: isSet(object.customNumber4) ? Number(object.customNumber4) : 0,
    };
  },

  toJSON(message: MonthlyProductionRaw): unknown {
    const obj: any = {};
    message.ChangeType !== undefined && (obj.CHANGETYPE = message.ChangeType);
    message.wellId !== undefined && (obj.wellId = message.wellId);
    message.productionDate !== undefined && (obj.productionDate = Math.round(message.productionDate));
    message.oil !== undefined && (obj.oil = message.oil);
    message.gas !== undefined && (obj.gas = message.gas);
    message.water !== undefined && (obj.water = message.water);
    message.choke !== undefined && (obj.choke = message.choke);
    message.daysOn !== undefined && (obj.daysOn = message.daysOn);
    message.gasInjection !== undefined && (obj.gasInjection = message.gasInjection);
    message.waterInjection !== undefined && (obj.waterInjection = message.waterInjection);
    message.co2Injection !== undefined && (obj.co2Injection = message.co2Injection);
    message.steamInjection !== undefined && (obj.steamInjection = message.steamInjection);
    message.ngl !== undefined && (obj.ngl = message.ngl);
    message.operationalTag !== undefined && (obj.operationalTag = message.operationalTag);
    message.createdAt !== undefined && (obj.createdAt = Math.round(message.createdAt));
    message.updatedAt !== undefined && (obj.updatedAt = Math.round(message.updatedAt));
    message.projectId !== undefined && (obj.projectId = message.projectId);
    message.customNumber0 !== undefined && (obj.customNumber0 = message.customNumber0);
    message.customNumber1 !== undefined && (obj.customNumber1 = message.customNumber1);
    message.customNumber2 !== undefined && (obj.customNumber2 = message.customNumber2);
    message.customNumber3 !== undefined && (obj.customNumber3 = message.customNumber3);
    message.customNumber4 !== undefined && (obj.customNumber4 = message.customNumber4);
    return obj;
  },

  create(base?: DeepPartial<MonthlyProductionRaw>): MonthlyProductionRaw {
    return MonthlyProductionRaw.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<MonthlyProductionRaw>): MonthlyProductionRaw {
    const message = createBaseMonthlyProductionRaw();
    message.ChangeType = object.ChangeType ?? "";
    message.wellId = object.wellId ?? "";
    message.productionDate = object.productionDate ?? 0;
    message.oil = object.oil ?? 0;
    message.gas = object.gas ?? 0;
    message.water = object.water ?? 0;
    message.choke = object.choke ?? 0;
    message.daysOn = object.daysOn ?? 0;
    message.gasInjection = object.gasInjection ?? 0;
    message.waterInjection = object.waterInjection ?? 0;
    message.co2Injection = object.co2Injection ?? 0;
    message.steamInjection = object.steamInjection ?? 0;
    message.ngl = object.ngl ?? 0;
    message.operationalTag = object.operationalTag ?? "";
    message.createdAt = object.createdAt ?? 0;
    message.updatedAt = object.updatedAt ?? 0;
    message.projectId = object.projectId ?? "";
    message.customNumber0 = object.customNumber0 ?? 0;
    message.customNumber1 = object.customNumber1 ?? 0;
    message.customNumber2 = object.customNumber2 ?? 0;
    message.customNumber3 = object.customNumber3 ?? 0;
    message.customNumber4 = object.customNumber4 ?? 0;
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
