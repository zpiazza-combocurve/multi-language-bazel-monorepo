/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { Timestamp } from "../../../google/protobuf/timestamp";

export const protobufPackage = "combocurve.common.v1";

/** A date range. Both dates are inclusive. */
export interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

function createBaseDateRange(): DateRange {
  return { startDate: undefined, endDate: undefined };
}

export const DateRange = {
  encode(message: DateRange, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startDate !== undefined) {
      Timestamp.encode(toTimestamp(message.startDate), writer.uint32(10).fork()).ldelim();
    }
    if (message.endDate !== undefined) {
      Timestamp.encode(toTimestamp(message.endDate), writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DateRange {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDateRange();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.startDate = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.endDate = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DateRange {
    return {
      startDate: isSet(object.startDate) ? fromJsonTimestamp(object.startDate) : undefined,
      endDate: isSet(object.endDate) ? fromJsonTimestamp(object.endDate) : undefined,
    };
  },

  toJSON(message: DateRange): unknown {
    const obj: any = {};
    message.startDate !== undefined && (obj.startDate = message.startDate.toISOString());
    message.endDate !== undefined && (obj.endDate = message.endDate.toISOString());
    return obj;
  },

  create(base?: DeepPartial<DateRange>): DateRange {
    return DateRange.fromPartial(base ?? {});
  },

  fromPartial(object: DeepPartial<DateRange>): DateRange {
    const message = createBaseDateRange();
    message.startDate = object.startDate ?? undefined;
    message.endDate = object.endDate ?? undefined;
    return message;
  },
};

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
