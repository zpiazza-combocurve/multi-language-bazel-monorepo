"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = exports.protobufPackage = void 0;
/* eslint-disable */
const minimal_1 = __importDefault(require("protobufjs/minimal"));
const timestamp_1 = require("../../../google/protobuf/timestamp");
exports.protobufPackage = "combocurve.common.v1";
function createBaseDateRange() {
    return { startDate: undefined, endDate: undefined };
}
exports.DateRange = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.startDate !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.startDate), writer.uint32(10).fork()).ldelim();
        }
        if (message.endDate !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.endDate), writer.uint32(18).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseDateRange();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.startDate = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
                    continue;
                case 2:
                    if (tag !== 18) {
                        break;
                    }
                    message.endDate = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            startDate: isSet(object.startDate) ? fromJsonTimestamp(object.startDate) : undefined,
            endDate: isSet(object.endDate) ? fromJsonTimestamp(object.endDate) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        message.startDate !== undefined && (obj.startDate = message.startDate.toISOString());
        message.endDate !== undefined && (obj.endDate = message.endDate.toISOString());
        return obj;
    },
    create(base) {
        return exports.DateRange.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDateRange();
        message.startDate = object.startDate ?? undefined;
        message.endDate = object.endDate ?? undefined;
        return message;
    },
};
function toTimestamp(date) {
    const seconds = date.getTime() / 1_000;
    const nanos = (date.getTime() % 1_000) * 1_000_000;
    return { seconds, nanos };
}
function fromTimestamp(t) {
    let millis = (t.seconds || 0) * 1_000;
    millis += (t.nanos || 0) / 1_000_000;
    return new Date(millis);
}
function fromJsonTimestamp(o) {
    if (o instanceof Date) {
        return o;
    }
    else if (typeof o === "string") {
        return new Date(o);
    }
    else {
        return fromTimestamp(timestamp_1.Timestamp.fromJSON(o));
    }
}
function isSet(value) {
    return value !== null && value !== undefined;
}
