"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyProductionServiceDefinition = exports.DailyProductionServiceDeleteByManyWellsResponse = exports.DailyProductionServiceDeleteByManyWellsRequest = exports.DailyProductionServiceDeleteByWellResponse = exports.DailyProductionServiceDeleteByWellRequest = exports.DailyProductionServiceDeleteByProjectResponse = exports.DailyProductionServiceDeleteByProjectRequest = exports.DailyProductionServiceCountByWellResponse = exports.DailyProductionServiceCountByWellRequest = exports.DailyProductionServiceSumByWellResponse = exports.DailyProductionServiceSumByWellRequest = exports.DailyProductionServiceFetchResponse = exports.DailyProductionServiceFetchRequest = exports.DailyProductionServiceChangeToCompanyScopeResponse = exports.DailyProductionServiceChangeToCompanyScopeRequest = exports.DailyProductionServiceUpsertResponse = exports.DailyProductionServiceUpsertRequest = exports.protobufPackage = void 0;
const minimal_1 = __importDefault(require("protobufjs/minimal"));
const field_mask_1 = require("../../../google/protobuf/field_mask");
const timestamp_1 = require("../../../google/protobuf/timestamp");
const date_range_1 = require("../../common/v1/date_range");
exports.protobufPackage = "combocurve.dal.v1";
function createBaseDailyProductionServiceUpsertRequest() {
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
exports.DailyProductionServiceUpsertRequest = {
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseDailyProductionServiceUpsertRequest();
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
    fromJSON(object) {
        return {
            fieldMask: isSet(object.fieldMask) ? field_mask_1.FieldMask.unwrap(field_mask_1.FieldMask.fromJSON(object.fieldMask)) : undefined,
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
    toJSON(message) {
        const obj = {};
        message.fieldMask !== undefined && (obj.fieldMask = field_mask_1.FieldMask.toJSON(field_mask_1.FieldMask.wrap(message.fieldMask)));
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
    create(base) {
        return exports.DailyProductionServiceUpsertRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseDailyProductionServiceUpsertResponse() {
    return {};
}
exports.DailyProductionServiceUpsertResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceUpsertResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseDailyProductionServiceUpsertResponse();
        return message;
    },
};
function createBaseDailyProductionServiceChangeToCompanyScopeRequest() {
    return { wells: [] };
}
exports.DailyProductionServiceChangeToCompanyScopeRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.wells) {
            writer.uint32(10).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
        return exports.DailyProductionServiceChangeToCompanyScopeRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceChangeToCompanyScopeRequest();
        message.wells = object.wells?.map((e) => e) || [];
        return message;
    },
};
function createBaseDailyProductionServiceChangeToCompanyScopeResponse() {
    return {};
}
exports.DailyProductionServiceChangeToCompanyScopeResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceChangeToCompanyScopeResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseDailyProductionServiceChangeToCompanyScopeResponse();
        return message;
    },
};
function createBaseDailyProductionServiceFetchRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.DailyProductionServiceFetchRequest = {
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
        const message = createBaseDailyProductionServiceFetchRequest();
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
        return exports.DailyProductionServiceFetchRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceFetchRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseDailyProductionServiceFetchResponse() {
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
exports.DailyProductionServiceFetchResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.date !== undefined) {
            timestamp_1.Timestamp.encode(toTimestamp(message.date), writer.uint32(202).fork()).ldelim();
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseDailyProductionServiceFetchResponse();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 25:
                    if (tag !== 202) {
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
    fromJSON(object) {
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.DailyProductionServiceFetchResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseDailyProductionServiceSumByWellRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.DailyProductionServiceSumByWellRequest = {
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
        const message = createBaseDailyProductionServiceSumByWellRequest();
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
        return exports.DailyProductionServiceSumByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceSumByWellRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseDailyProductionServiceSumByWellResponse() {
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
exports.DailyProductionServiceSumByWellResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.DailyProductionServiceSumByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseDailyProductionServiceCountByWellRequest() {
    return { fieldMask: undefined, wells: [], dateRange: undefined, onlyPhysicalWells: undefined };
}
exports.DailyProductionServiceCountByWellRequest = {
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
        const message = createBaseDailyProductionServiceCountByWellRequest();
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
        return exports.DailyProductionServiceCountByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceCountByWellRequest();
        message.fieldMask = object.fieldMask ?? undefined;
        message.wells = object.wells?.map((e) => e) || [];
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        message.onlyPhysicalWells = object.onlyPhysicalWells ?? undefined;
        return message;
    },
};
function createBaseDailyProductionServiceCountByWellResponse() {
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
exports.DailyProductionServiceCountByWellResponse = {
    encode(message, writer = minimal_1.default.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
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
    toJSON(message) {
        const obj = {};
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
    create(base) {
        return exports.DailyProductionServiceCountByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(object) {
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
function createBaseDailyProductionServiceDeleteByProjectRequest() {
    return { project: "" };
}
exports.DailyProductionServiceDeleteByProjectRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.project !== "") {
            writer.uint32(10).string(message.project);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { project: isSet(object.project) ? String(object.project) : "" };
    },
    toJSON(message) {
        const obj = {};
        message.project !== undefined && (obj.project = message.project);
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceDeleteByProjectRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceDeleteByProjectRequest();
        message.project = object.project ?? "";
        return message;
    },
};
function createBaseDailyProductionServiceDeleteByProjectResponse() {
    return {};
}
exports.DailyProductionServiceDeleteByProjectResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceDeleteByProjectResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseDailyProductionServiceDeleteByProjectResponse();
        return message;
    },
};
function createBaseDailyProductionServiceDeleteByWellRequest() {
    return { well: "", dateRange: undefined };
}
exports.DailyProductionServiceDeleteByWellRequest = {
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
        return exports.DailyProductionServiceDeleteByWellRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceDeleteByWellRequest();
        message.well = object.well ?? "";
        message.dateRange = (object.dateRange !== undefined && object.dateRange !== null)
            ? date_range_1.DateRange.fromPartial(object.dateRange)
            : undefined;
        return message;
    },
};
function createBaseDailyProductionServiceDeleteByWellResponse() {
    return {};
}
exports.DailyProductionServiceDeleteByWellResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceDeleteByWellResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseDailyProductionServiceDeleteByWellResponse();
        return message;
    },
};
function createBaseDailyProductionServiceDeleteByManyWellsRequest() {
    return { wells: [] };
}
exports.DailyProductionServiceDeleteByManyWellsRequest = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.wells) {
            writer.uint32(10).string(v);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
        return exports.DailyProductionServiceDeleteByManyWellsRequest.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseDailyProductionServiceDeleteByManyWellsRequest();
        message.wells = object.wells?.map((e) => e) || [];
        return message;
    },
};
function createBaseDailyProductionServiceDeleteByManyWellsResponse() {
    return {};
}
exports.DailyProductionServiceDeleteByManyWellsResponse = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.DailyProductionServiceDeleteByManyWellsResponse.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseDailyProductionServiceDeleteByManyWellsResponse();
        return message;
    },
};
exports.DailyProductionServiceDefinition = {
    name: "DailyProductionService",
    fullName: "combocurve.dal.v1.DailyProductionService",
    methods: {
        /** Upsert daily production data for multiple wells. */
        upsert: {
            name: "Upsert",
            requestType: exports.DailyProductionServiceUpsertRequest,
            requestStream: true,
            responseType: exports.DailyProductionServiceUpsertResponse,
            responseStream: false,
            options: {},
        },
        /** Update daily production data for multiple wells, when the wells are changed to company scope. */
        changeToCompanyScope: {
            name: "ChangeToCompanyScope",
            requestType: exports.DailyProductionServiceChangeToCompanyScopeRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceChangeToCompanyScopeResponse,
            responseStream: false,
            options: {},
        },
        /**
         * Fetch daily production data for multiple wells. Results are guaranteed to
         * be sorted by well, then by date.
         */
        fetch: {
            name: "Fetch",
            requestType: exports.DailyProductionServiceFetchRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceFetchResponse,
            responseStream: true,
            options: {},
        },
        /** Calculate the sum of daily production phases for multiple wells. */
        sumByWell: {
            name: "SumByWell",
            requestType: exports.DailyProductionServiceSumByWellRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceSumByWellResponse,
            responseStream: true,
            options: {},
        },
        /** Calculate the amount of values of daily production phases for multiple wells. */
        countByWell: {
            name: "CountByWell",
            requestType: exports.DailyProductionServiceCountByWellRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceCountByWellResponse,
            responseStream: true,
            options: {},
        },
        /** Delete all production data for the given project. */
        deleteByProject: {
            name: "DeleteByProject",
            requestType: exports.DailyProductionServiceDeleteByProjectRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceDeleteByProjectResponse,
            responseStream: false,
            options: {},
        },
        /**
         * Delete production data for the given well. An optional date range can be
         * provided to restrict the production data points to be deleted.
         */
        deleteByWell: {
            name: "DeleteByWell",
            requestType: exports.DailyProductionServiceDeleteByWellRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceDeleteByWellResponse,
            responseStream: false,
            options: {},
        },
        /** Delete all production data for the given wells. */
        deleteByManyWells: {
            name: "DeleteByManyWells",
            requestType: exports.DailyProductionServiceDeleteByManyWellsRequest,
            requestStream: false,
            responseType: exports.DailyProductionServiceDeleteByManyWellsResponse,
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
