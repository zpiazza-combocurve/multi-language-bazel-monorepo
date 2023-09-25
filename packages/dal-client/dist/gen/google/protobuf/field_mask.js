"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldMask = exports.protobufPackage = void 0;
/* eslint-disable */
const minimal_1 = __importDefault(require("protobufjs/minimal"));
exports.protobufPackage = "google.protobuf";
function createBaseFieldMask() {
    return { paths: [] };
}
exports.FieldMask = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.paths) {
            writer.uint32(10).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseFieldMask();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.paths.push(reader.string());
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
            paths: typeof (object) === "string"
                ? object.split(",").filter(Boolean)
                : Array.isArray(object?.paths)
                    ? object.paths.map(String)
                    : [],
        };
    },
    toJSON(message) {
        return message.paths.join(",");
    },
    create(base) {
        return exports.FieldMask.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseFieldMask();
        message.paths = object.paths?.map((e) => e) || [];
        return message;
    },
    wrap(paths) {
        const result = createBaseFieldMask();
        result.paths = paths;
        return result;
    },
    unwrap(message) {
        return message.paths;
    },
};
