"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalMonthlyProductionServiceDefinition = exports.ExternalMonthlyProductionServiceDeleteByWellResponse = exports.ExternalMonthlyProductionServiceDeleteByWellRequest = exports.ExternalMonthlyProductionServiceUpsertResponse = exports.ExternalMonthlyProductionServiceUpsertRequest = exports.ExternalMonthlyProductionServiceFetchResponse = exports.ExternalMonthlyProductionServiceFetchRequest = exports.ExternalMonthlyProductionServiceCountResponse = exports.ExternalMonthlyProductionServiceCountRequest = exports.protobufPackage = void 0;
const minimal_1 = __importDefault(require("protobufjs/minimal"));
const field_mask_1 = require("../../../google/protobuf/field_mask");
const timestamp_1 = require("../../../google/protobuf/timestamp");
const date_range_1 = require("../../common/v1/date_range");
exports.protobufPackage = "combocurve.external.v1";
function createBaseExternalMonthlyProductionServiceCountRequest() {
    return {
        wells: [],
        project: undefined,
        dateRange: undefined,
        createdAtRange: undefined,
        updatedAtRange: undefined,
        onlyPhysicalWells: undefined,
    };
}
exports.ExternalMonthlyProductionServiceCountRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.wells) {
            writer.uint32(10).string(v);
        }
        if (message.project !== undefined) {
            writer.uint32(18).string(message.project);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
        }
        if (message.createdAtRange !== undefined) {
            date_range_1.DateRange.encode(message.createdAtRange, writer.uint32(34).fork()).ldelim();
        }
        if (message.updatedAtRange !== undefined) {
            date_range_1.DateRange.encode(message.updatedAtRange, writer.uint32(42).fork()).ldelim();
        }
        if (message.onlyPhysicalWells !== undefined) {
            writer.uint32(48).bool(message.onlyPhysicalWells);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
                    continue;
                case 4:
                    if (tag !== 34) {
                        break;
                    }
                    message.createdAtRange = date_range_1.DateRange.decode(reader, reader.uint32());
                    continue;
                case 5:
                    if (tag !== 42) {
                        break;
                    }
                    message.updatedAtRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
    fromJSON(object) {
        return {
            wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [],
            project: isSet(object.project) ? String(object.project) : undefined,
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
            createdAtRange: isSet(object.createdAtRange) ? date_range_1.DateRange.fromJSON(object.createdAtRange) : undefined,
            updatedAtRange: isSet(object.updatedAtRange) ? date_range_1.DateRange.fromJSON(object.updatedAtRange) : undefined,
            onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.wells) {
            obj.wells = message.wells.map((e) => e);
        }
        else {
            obj.wells = [];
        }
        message.project !== undefined && (obj.project = message.project);
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        message.createdAtRange !== undefined &&
            (obj.createdAtRange = message.createdAtRange ? date_range_1.DateRange.toJSON(message.createdAtRange) : undefined);
        message.updatedAtRange !== undefined &&
            (obj.updatedAtRange = message.updatedAtRange ? date_range_1.DateRange.toJSON(message.updatedAtRange) : undefined);
        message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceCountRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseExternalMonthlyProductionServiceCountRequest();
        message.wells = object.wells?.map((e) => e) || [];
        message.project = object.project ?? undefined;
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.createdAtRange = (object.createdAtRange !== undefined && object.createdAtRange !== null)
            ? date_range_1.DateRange.fromPartial(object.createdAtRange)
            : undefined;
        message.updatedAtRange = (object.updatedAtRange !== undefined && object.updatedAtRange !== null)
            ? date_range_1.DateRange.fromPartial(object.updatedAtRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseExternalMonthlyProductionServiceCountResponse() {
    return { count: 0 };
}
exports.ExternalMonthlyProductionServiceCountResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.count !== 0) {
            writer.uint32(8).int32(message.count);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { count: isSet(object.count) ? Number(object.count) : 0 };
    },
    toJSON(message) {
        const obj = {};
        message.count !== undefined && (obj.count = Math.round(message.count));
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceCountResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseExternalMonthlyProductionServiceCountResponse();
        message.count = object.count ?? 0;
        return message;
    },
};
function createBaseExternalMonthlyProductionServiceFetchRequest() {
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
exports.ExternalMonthlyProductionServiceFetchRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.fieldMask !== undefined) {
            field_mask_1.FieldMask.encode(field_mask_1.FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
        }
        for (const v of message.wells) {
            writer.uint32(18).string(v);
        }
        if (message.project !== undefined) {
            writer.uint32(26).string(message.project);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(34).fork()).ldelim();
        }
        if (message.createdAtRange !== undefined) {
            date_range_1.DateRange.encode(message.createdAtRange, writer.uint32(42).fork()).ldelim();
        }
        if (message.updatedAtRange !== undefined) {
            date_range_1.DateRange.encode(message.updatedAtRange, writer.uint32(50).fork()).ldelim();
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseExternalMonthlyProductionServiceFetchRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.fieldMask = field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.decode(reader, reader.uint32()));
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
                    continue;
                case 5:
                    if (tag !== 42) {
                        break;
                    }
                    message.createdAtRange = date_range_1.DateRange.decode(reader, reader.uint32());
                    continue;
                case 6:
                    if (tag !== 50) {
                        break;
                    }
                    message.updatedAtRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
            wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [],
            project: isSet(object.project) ? String(object.project) : undefined,
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
            createdAtRange: isSet(object.createdAtRange) ? date_range_1.DateRange.fromJSON(object.createdAtRange) : undefined,
            updatedAtRange: isSet(object.updatedAtRange) ? date_range_1.DateRange.fromJSON(object.updatedAtRange) : undefined,
            sort: isSet(object.sort) ? String(object.sort) : undefined,
            skip: isSet(object.skip) ? Number(object.skip) : undefined,
            take: isSet(object.take) ? Number(object.take) : undefined,
            onlyPhysicalWells: isSet(object.onlyPhysicalWells) ? Boolean(object.onlyPhysicalWells) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        message.fieldMask !== undefined && (obj.fieldMask = field_mask_1.FieldMask.toJSON(field_mask_1.FieldMask.wrap(message.fieldMask)));
        if (message.wells) {
            obj.wells = message.wells.map((e) => e);
        }
        else {
            obj.wells = [];
        }
        message.project !== undefined && (obj.project = message.project);
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        message.createdAtRange !== undefined &&
            (obj.createdAtRange = message.createdAtRange ? date_range_1.DateRange.toJSON(message.createdAtRange) : undefined);
        message.updatedAtRange !== undefined &&
            (obj.updatedAtRange = message.updatedAtRange ? date_range_1.DateRange.toJSON(message.updatedAtRange) : undefined);
        message.sort !== undefined && (obj.sort = message.sort);
        message.skip !== undefined && (obj.skip = Math.round(message.skip));
        message.take !== undefined && (obj.take = Math.round(message.take));
        message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceFetchRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseExternalMonthlyProductionServiceFetchRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.project = object.project ?? undefined;
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.createdAtRange = (object.createdAtRange !== undefined && object.createdAtRange !== null)
            ? date_range_1.DateRange.fromPartial(object.createdAtRange)
            : undefined;
        message.updatedAtRange = (object.updatedAtRange !== undefined && object.updatedAtRange !== null)
            ? date_range_1.DateRange.fromPartial(object.updatedAtRange)
            : undefined;
        message.sort = object.sort ?? undefined;
        message.skip = object.skip ?? undefined;
        message.take = object.take ?? undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseExternalMonthlyProductionServiceFetchResponse() {
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
exports.ExternalMonthlyProductionServiceFetchResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.date !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.date), writer.uint32(170).fork()).ldelim();
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
            timestamp_1.Timestamp.encode(toTimestamp(message.createdAt), writer.uint32(154).fork()).ldelim();
        }
        if (message.updatedAt !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.updatedAt), writer.uint32(162).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseExternalMonthlyProductionServiceFetchResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 21:
                    if (tag !== 170) {
                        break;
                    }
                    message.date = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
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
                    message.createdAt = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
                    continue;
                case 20:
                    if (tag !== 162) {
                        break;
                    }
                    message.updatedAt = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.ExternalMonthlyProductionServiceFetchResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseExternalMonthlyProductionServiceUpsertRequest() {
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
exports.ExternalMonthlyProductionServiceUpsertRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.fieldMask !== undefined) {
            field_mask_1.FieldMask.encode(field_mask_1.FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
        }
        if (message.well !== "") {
            writer.uint32(18).string(message.well);
        }
        if (message.date !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.date), writer.uint32(26).fork()).ldelim();
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseExternalMonthlyProductionServiceUpsertRequest();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.fieldMask = field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.decode(reader, reader.uint32()));
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
                    message.date = fromTimestamp(timestamp_1.Timestamp.decode(reader, reader.uint32()));
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
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
    toJSON(message) {
        const obj = {};
        message.fieldMask !== undefined && (obj.fieldMask = field_mask_1.FieldMask.toJSON(field_mask_1.FieldMask.wrap(message.fieldMask)));
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
    create(base) {
        return exports.ExternalMonthlyProductionServiceUpsertRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseExternalMonthlyProductionServiceUpsertResponse() {
    return {};
}
exports.ExternalMonthlyProductionServiceUpsertResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceUpsertResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseExternalMonthlyProductionServiceUpsertResponse();
        return message;
    },
};
function createBaseExternalMonthlyProductionServiceDeleteByWellRequest() {
    return { well: "", dateRange: undefined };
}
exports.ExternalMonthlyProductionServiceDeleteByWellRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.well !== "") {
            writer.uint32(10).string(message.well);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(18).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
            well: isSet(object.well) ? String(object.well) : "",
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        message.well !== undefined && (obj.well = message.well);
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseExternalMonthlyProductionServiceDeleteByWellRequest();
        message.well = object.well ?? "";
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        return message;
    },
};
function createBaseExternalMonthlyProductionServiceDeleteByWellResponse() {
    return {};
}
exports.ExternalMonthlyProductionServiceDeleteByWellResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.ExternalMonthlyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseExternalMonthlyProductionServiceDeleteByWellResponse();
        return message;
    },
};
exports.ExternalMonthlyProductionServiceDefinition = {
    name: "ExternalMonthlyProductionService",
    fullName: "combocurve.external.v1.ExternalMonthlyProductionService",
    methods: {
        /** Count monthly production data for multiple wells. */
        count: {
            name: "Count",
            requestType: exports.ExternalMonthlyProductionServiceCountRequest,
            requestStream: false,
            responseType: exports.ExternalMonthlyProductionServiceCountResponse,
            responseStream: false,
            options: {},
        },
        /** Fetch monthly production data for multiple wells. */
        fetch: {
            name: "Fetch",
            requestType: exports.ExternalMonthlyProductionServiceFetchRequest,
            requestStream: false,
            responseType: exports.ExternalMonthlyProductionServiceFetchResponse,
            responseStream: true,
            options: {},
        },
        /** Upsert monthly production data for multiple wells. */
        upsert: {
            name: "Upsert",
            requestType: exports.ExternalMonthlyProductionServiceUpsertRequest,
            requestStream: true,
            responseType: exports.ExternalMonthlyProductionServiceUpsertResponse,
            responseStream: false,
            options: {},
        },
        /**
         * Delete production data for the given well. An optional date range can be
         * provided to restrict the production data points to be deleted.
         */
        deleteByWell: {
            name: "DeleteByWell",
            requestType: exports.ExternalMonthlyProductionServiceDeleteByWellRequest,
            requestStream: false,
            responseType: exports.ExternalMonthlyProductionServiceDeleteByWellResponse,
            responseStream: false,
            options: {},
        },
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
