"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyProductionServiceDefinition = exports.MonthlyProductionServiceDeleteByManyWellsResponse = exports.MonthlyProductionServiceDeleteByManyWellsRequest = exports.MonthlyProductionServiceDeleteByWellResponse = exports.MonthlyProductionServiceDeleteByWellRequest = exports.MonthlyProductionServiceDeleteByProjectResponse = exports.MonthlyProductionServiceDeleteByProjectRequest = exports.MonthlyProductionServiceCountByWellResponse = exports.MonthlyProductionServiceCountByWellRequest = exports.MonthlyProductionServiceSumByWellResponse = exports.MonthlyProductionServiceSumByWellRequest = exports.MonthlyProductionServiceFetchResponse = exports.MonthlyProductionServiceFetchRequest = exports.MonthlyProductionServiceChangeToCompanyScopeResponse = exports.MonthlyProductionServiceChangeToCompanyScopeRequest = exports.MonthlyProductionServiceUpsertResponse = exports.MonthlyProductionServiceUpsertRequest = exports.protobufPackage = void 0;
const minimal_1 = __importDefault(require("protobufjs/minimal"));
const field_mask_1 = require("../../../google/protobuf/field_mask");
const timestamp_1 = require("../../../google/protobuf/timestamp");
const date_range_1 = require("../../common/v1/date_range");
exports.protobufPackage = "combocurve.dal.v1";
function createBaseMonthlyProductionServiceUpsertRequest() {
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
exports.MonthlyProductionServiceUpsertRequest = {
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
        const message = createBaseMonthlyProductionServiceUpsertRequest();
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
        return exports.MonthlyProductionServiceUpsertRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseMonthlyProductionServiceUpsertResponse() {
    return {};
}
exports.MonthlyProductionServiceUpsertResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceUpsertResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMonthlyProductionServiceUpsertResponse();
        return message;
    },
};
function createBaseMonthlyProductionServiceChangeToCompanyScopeRequest() {
    return { wells: [] };
}
exports.MonthlyProductionServiceChangeToCompanyScopeRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.wells) {
            writer.uint32(10).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [] };
    },
    toJSON(message) {
        const obj = {};
        if (message.wells) {
            obj.wells = message.wells.map((e) => e);
        }
        else {
            obj.wells = [];
        }
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceChangeToCompanyScopeRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceChangeToCompanyScopeRequest();
        message.wells = object.wells?.map((e) => e) || [];
        return message;
    },
};
function createBaseMonthlyProductionServiceChangeToCompanyScopeResponse() {
    return {};
}
exports.MonthlyProductionServiceChangeToCompanyScopeResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceChangeToCompanyScopeResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMonthlyProductionServiceChangeToCompanyScopeResponse();
        return message;
    },
};
function createBaseMonthlyProductionServiceFetchRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.MonthlyProductionServiceFetchRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.fieldMask !== undefined) {
            field_mask_1.FieldMask.encode(field_mask_1.FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
        }
        for (const v of message.wells) {
            writer.uint32(18).string(v);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
        }
        if (message.onlyPhysicalWells !== undefined) {
            writer.uint32(32).bool(message.onlyPhysicalWells);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMonthlyProductionServiceFetchRequest();
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
            wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [],
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
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
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceFetchRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceFetchRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseMonthlyProductionServiceFetchResponse() {
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
exports.MonthlyProductionServiceFetchResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.date !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.date), writer.uint32(154).fork()).ldelim();
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMonthlyProductionServiceFetchResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 19:
                    if (tag !== 154) {
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
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceFetchResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseMonthlyProductionServiceSumByWellRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.MonthlyProductionServiceSumByWellRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.fieldMask !== undefined) {
            field_mask_1.FieldMask.encode(field_mask_1.FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
        }
        for (const v of message.wells) {
            writer.uint32(18).string(v);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
        }
        if (message.onlyPhysicalWells !== undefined) {
            writer.uint32(32).bool(message.onlyPhysicalWells);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMonthlyProductionServiceSumByWellRequest();
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
            wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [],
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
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
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceSumByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceSumByWellRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseMonthlyProductionServiceSumByWellResponse() {
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
exports.MonthlyProductionServiceSumByWellResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.MonthlyProductionServiceSumByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseMonthlyProductionServiceCountByWellRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.MonthlyProductionServiceCountByWellRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.fieldMask !== undefined) {
            field_mask_1.FieldMask.encode(field_mask_1.FieldMask.wrap(message.fieldMask), writer.uint32(10).fork()).ldelim();
        }
        for (const v of message.wells) {
            writer.uint32(18).string(v);
        }
        if (message.dateRange !== undefined) {
            date_range_1.DateRange.encode(message.dateRange, writer.uint32(26).fork()).ldelim();
        }
        if (message.onlyPhysicalWells !== undefined) {
            writer.uint32(32).bool(message.onlyPhysicalWells);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMonthlyProductionServiceCountByWellRequest();
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
                    message.dateRange = date_range_1.DateRange.decode(reader, reader.uint32());
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
            wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [],
            dateRange: isSet(object.dateRange) ? date_range_1.DateRange.fromJSON(object.dateRange) : undefined,
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
        message.dateRange !== undefined &&
            (obj.dateRange = message.dateRange ? date_range_1.DateRange.toJSON(message.dateRange) : undefined);
        message.onlyPhysicalWells !== undefined && (obj.onlyPhysicalWells = message.onlyPhysicalWells);
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceCountByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceCountByWellRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseMonthlyProductionServiceCountByWellResponse() {
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
exports.MonthlyProductionServiceCountByWellResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.MonthlyProductionServiceCountByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseMonthlyProductionServiceDeleteByProjectRequest() {
    return { project: "" };
}
exports.MonthlyProductionServiceDeleteByProjectRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.project !== "") {
            writer.uint32(10).string(message.project);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { project: isSet(object.project) ? String(object.project) : "" };
    },
    toJSON(message) {
        const obj = {};
        message.project !== undefined && (obj.project = message.project);
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceDeleteByProjectRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceDeleteByProjectRequest();
        message.project = object.project ?? "";
        return message;
    },
};
function createBaseMonthlyProductionServiceDeleteByProjectResponse() {
    return {};
}
exports.MonthlyProductionServiceDeleteByProjectResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceDeleteByProjectResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMonthlyProductionServiceDeleteByProjectResponse();
        return message;
    },
};
function createBaseMonthlyProductionServiceDeleteByWellRequest() {
    return { well: "", dateRange: undefined };
}
exports.MonthlyProductionServiceDeleteByWellRequest = {
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
        return exports.MonthlyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceDeleteByWellRequest();
        message.well = object.well ?? "";
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        return message;
    },
};
function createBaseMonthlyProductionServiceDeleteByWellResponse() {
    return {};
}
exports.MonthlyProductionServiceDeleteByWellResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMonthlyProductionServiceDeleteByWellResponse();
        return message;
    },
};
function createBaseMonthlyProductionServiceDeleteByManyWellsRequest() {
    return { wells: [] };
}
exports.MonthlyProductionServiceDeleteByManyWellsRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.wells) {
            writer.uint32(10).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { wells: Array.isArray(object?.wells) ? object.wells.map((e) => String(e)) : [] };
    },
    toJSON(message) {
        const obj = {};
        if (message.wells) {
            obj.wells = message.wells.map((e) => e);
        }
        else {
            obj.wells = [];
        }
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceDeleteByManyWellsRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMonthlyProductionServiceDeleteByManyWellsRequest();
        message.wells = object.wells?.map((e) => e) || [];
        return message;
    },
};
function createBaseMonthlyProductionServiceDeleteByManyWellsResponse() {
    return {};
}
exports.MonthlyProductionServiceDeleteByManyWellsResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MonthlyProductionServiceDeleteByManyWellsResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMonthlyProductionServiceDeleteByManyWellsResponse();
        return message;
    },
};
exports.MonthlyProductionServiceDefinition = {
    name: "MonthlyProductionService",
    fullName: "combocurve.dal.v1.MonthlyProductionService",
    methods: {
        /** Upsert monthly production data for multiple wells. */
        upsert: {
            name: "Upsert",
            requestType: exports.MonthlyProductionServiceUpsertRequest,
            requestStream: true,
            responseType: exports.MonthlyProductionServiceUpsertResponse,
            responseStream: false,
            options: {},
        },
        /** Update monthly production data for multiple wells, when the wells are changed to company scope. */
        changeToCompanyScope: {
            name: "ChangeToCompanyScope",
            requestType: exports.MonthlyProductionServiceChangeToCompanyScopeRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceChangeToCompanyScopeResponse,
            responseStream: false,
            options: {},
        },
        /**
         * Fetch monthly production data for multiple wells. Results are guaranteed to
         * be sorted by well, then by date.
         */
        fetch: {
            name: "Fetch",
            requestType: exports.MonthlyProductionServiceFetchRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceFetchResponse,
            responseStream: true,
            options: {},
        },
        /** Calculate the sum of monthly production phases for multiple wells. */
        sumByWell: {
            name: "SumByWell",
            requestType: exports.MonthlyProductionServiceSumByWellRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceSumByWellResponse,
            responseStream: true,
            options: {},
        },
        /** Calculate the amount of values of monthly production phases for multiple wells. */
        countByWell: {
            name: "CountByWell",
            requestType: exports.MonthlyProductionServiceCountByWellRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceCountByWellResponse,
            responseStream: true,
            options: {},
        },
        /** Delete all production data for the given project. */
        deleteByProject: {
            name: "DeleteByProject",
            requestType: exports.MonthlyProductionServiceDeleteByProjectRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceDeleteByProjectResponse,
            responseStream: false,
            options: {},
        },
        /**
         * Delete production data for the given well. An optional date range can be
         * provided to restrict the production data points to be deleted.
         */
        deleteByWell: {
            name: "DeleteByWell",
            requestType: exports.MonthlyProductionServiceDeleteByWellRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceDeleteByWellResponse,
            responseStream: false,
            options: {},
        },
        /** Delete all production data for the given wells. */
        deleteByManyWells: {
            name: "DeleteByManyWells",
            requestType: exports.MonthlyProductionServiceDeleteByManyWellsRequest,
            requestStream: false,
            responseType: exports.MonthlyProductionServiceDeleteByManyWellsResponse,
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
