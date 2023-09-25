"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDict = exports.mapObjectKeys = exports.objectFromKeys = exports.splitQueryProps = exports.parseObjectId = exports.paginator = exports.objToBuffer = exports.numberWithCommas = exports.getYearMonthFromDate = exports.getValidQuery = exports.getSeconds = exports.getProjection = exports.getAutoIncrementedName = exports.removeNonAlphanumeric = exports.genInptId = exports.deepMerge = exports.daysToMS = exports.convertIdxToMilli = exports.convertIdxToDate = exports.makeLocal = exports.convertUtcDateToIdx = exports.convertDateToIdxWithDateInput = exports.convertDateToIdx = exports.clone = exports.bufferToObj = void 0;
// @ts-ignore
const utilities_1 = require("combocurve-utils/utilities");
Object.defineProperty(exports, "clone", { enumerable: true, get: function () { return utilities_1.clone; } });
Object.defineProperty(exports, "getAutoIncrementedName", { enumerable: true, get: function () { return utilities_1.getAutoIncrementedName; } });
const mongoose_1 = require("mongoose");
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const beginningOfTime = new Date(1900, 0, 1);
const getSeconds = (ms) => ms / (1000 * 60);
exports.getSeconds = getSeconds;
const daysToMS = (days) => days * 24 * 60 * 60 * 1000;
exports.daysToMS = daysToMS;
const msToDays = (ms) => ms / (24 * 60 * 60 * 1000);
const numberWithCommas = (num) => {
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};
exports.numberWithCommas = numberWithCommas;
const month2num = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
};
function convertIdxToMilli(idx) {
    const val = idx * 24 * 60 * 60 * 1000;
    return new Date(1900, 0, 1).getTime() + val;
}
exports.convertIdxToMilli = convertIdxToMilli;
function convertIdxToDate(idx) {
    return new Date(convertIdxToMilli(idx));
}
exports.convertIdxToDate = convertIdxToDate;
function convertDateToIdxWithDateInput(date) {
    const startDate = new Date(1900, 0, 1).getTime();
    const endDate = new Date(date).getTime();
    return Math.round(msToDays(endDate - startDate));
}
exports.convertDateToIdxWithDateInput = convertDateToIdxWithDateInput;
function convertUtcDateToIdx(date) {
    const startMs = Date.UTC(1900, 0, 1);
    const endMs = date.getTime();
    return Math.round(msToDays(endMs - startMs));
}
exports.convertUtcDateToIdx = convertUtcDateToIdx;
function makeLocal(date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
exports.makeLocal = makeLocal;
function convertDateToIdx(props, make15th = false) {
    let endDate;
    const { year, month } = props;
    const startDate = beginningOfTime;
    const date = make15th ? new Date(new Date(props.date || '').setDate(15)) : new Date(props.date || '');
    const isDate = date.toString() !== 'Invalid Date';
    if (!isDate && (!year || !month)) {
        return false;
    }
    if (isDate) {
        endDate = date;
    }
    if (year && month) {
        const m = typeof month === 'string' ? month.toLowerCase() : month;
        const m2n = month2num[m];
        if (!m2n) {
            return false;
        }
        endDate = new Date(year, month2num[m], 15);
    }
    if (!endDate) {
        return false;
    }
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}
exports.convertDateToIdx = convertDateToIdx;
function getYearMonthFromDate(d) {
    const date = new Date(d);
    const isDate = date.toString() !== 'Invalid Date';
    if (!isDate) {
        return false;
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return { year, month };
}
exports.getYearMonthFromDate = getYearMonthFromDate;
const getValidQuery = (props, query) => {
    const valid = {};
    props.forEach((p) => {
        if (query[p]) {
            valid[p] = query[p];
        }
        if (valid[p] === 'true') {
            valid[p] = true;
        }
        if (valid[p] === 'false') {
            valid[p] = false;
        }
    });
    return valid;
};
exports.getValidQuery = getValidQuery;
const splitQueryProps = (props, query) => {
    const output = props.reduce((_prev, cur) => {
        const prev = _prev;
        prev.push(query[cur] ? query[cur].split(',') : []);
        return prev;
    }, []);
    return output;
};
exports.splitQueryProps = splitQueryProps;
class InvalidIdError extends Error {
    expected;
    constructor(message) {
        super(message);
        this.name = InvalidIdError.name;
        this.expected = true;
    }
}
const parseObjectId = (id) => {
    try {
        return mongoose_1.Types.ObjectId(id);
    }
    catch (e) {
        throw new InvalidIdError('We can not find the record you are looking for');
    }
};
exports.parseObjectId = parseObjectId;
const getProjection = (fields) => fields.reduce((accumulator, field) => ({ ...accumulator, [field]: true }), {});
exports.getProjection = getProjection;
const paginator = (pageSize) => function paginate(array) {
    const numPages = Math.ceil(array.length / pageSize);
    const pages = [];
    for (let i = 0; i < numPages; i += 1) {
        pages.push(array.slice(i * pageSize, Math.min((i + 1) * pageSize, array.length)));
    }
    return pages;
};
exports.paginator = paginator;
const objectFromKeys = (keys, valueResolver) => keys.reduce((accumulator, key, index) => {
    accumulator[key] = valueResolver(key, index);
    return accumulator;
}, {});
exports.objectFromKeys = objectFromKeys;
const genInptId = () => {
    return `INPT${new short_unique_id_1.default().randomUUID(10)}`;
};
exports.genInptId = genInptId;
const removeNonAlphanumeric = (value) => value.replace(/[^A-Za-z0-9]/g, '');
exports.removeNonAlphanumeric = removeNonAlphanumeric;
function isObject(item) {
    return !!item && typeof item === 'object' && !Array.isArray(item);
}
function deepMerge(obj1, obj2) {
    const one = obj1;
    const two = obj2;
    if (isObject(one) && isObject(two)) {
        Object.keys(two).forEach((key) => {
            if (isObject(two[key])) {
                if (!one[key] || !isObject(one[key])) {
                    one[key] = two[key];
                }
                deepMerge(one[key], two[key]);
            }
            else {
                Object.assign(one, { [key]: two[key] });
            }
        });
    }
    return one;
}
exports.deepMerge = deepMerge;
const objToBuffer = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');
exports.objToBuffer = objToBuffer;
const bufferToObj = (buffer) => JSON.parse(Buffer.from(buffer, 'base64').toString('ascii'));
exports.bufferToObj = bufferToObj;
const mapObjectKeys = (obj, keyMap) => Object.entries(obj).reduce((res, [key, value]) => ({ ...res, [keyMap[key] ?? key]: value }), {});
exports.mapObjectKeys = mapObjectKeys;
function isDict(item) {
    return !!item && typeof item === 'object' && item.constructor === Object;
}
exports.isDict = isDict;
//# sourceMappingURL=utilities.js.map