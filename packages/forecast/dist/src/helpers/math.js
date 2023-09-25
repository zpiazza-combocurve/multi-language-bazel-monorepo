"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToDigit = exports.myBisect = exports.ceilFloat = exports.floorFloat = exports.fixedFloatWithMinimum = exports.fixedFloatWithFlexibleDecimal = exports.fixedFloat = exports.isInt = exports.isNumberAndNotZero = exports.isNumber = exports.isDate = exports.convertDateToMilli = exports.convertDateToIdxFloor = exports.convertDateToIdx = exports.convertIdxToDate = exports.convertMilliToIdx = exports.convertIdxToMilli = exports.msToDays = exports.daysToMS = exports.dateTimeToDateStr = exports.LARGE_NUMBER = exports.Q_FINAL_DECIMAL = void 0;
exports.Q_FINAL_DECIMAL = 3;
exports.LARGE_NUMBER = 1.23e15;
const dateTimeToDateStr = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStr = `${month < 9 ? '0' : ''}${month + 1}`;
    const day = date.getDate();
    const dayStr = `${day < 10 ? '0' : ''}${day}`;
    return `${monthStr}/${dayStr}/${year}`;
};
exports.dateTimeToDateStr = dateTimeToDateStr;
const daysToMS = (days) => days * 24 * 60 * 60 * 1000;
exports.daysToMS = daysToMS;
const msToDays = (ms) => ms / (24 * 60 * 60 * 1000);
exports.msToDays = msToDays;
function convertIdxToMilli(idx) {
    const val = (0, exports.daysToMS)(idx);
    return new Date(1900, 0, 1).getTime() + val;
}
exports.convertIdxToMilli = convertIdxToMilli;
function convertMilliToIdx(milli) {
    return (0, exports.msToDays)(milli - new Date(1900, 0, 1).getTime());
}
exports.convertMilliToIdx = convertMilliToIdx;
function convertIdxToDate(idx) {
    return new Date(convertIdxToMilli(idx));
}
exports.convertIdxToDate = convertIdxToDate;
function convertDateToIdx(date) {
    const startDate = new Date(1900, 0, 1).getTime();
    const endDate = new Date(date).getTime();
    return Math.round((0, exports.msToDays)(endDate - startDate));
}
exports.convertDateToIdx = convertDateToIdx;
function convertDateToIdxFloor(date) {
    const startDate = new Date(1900, 0, 1).getTime();
    const endDate = new Date(date).getTime();
    return Math.floor((0, exports.msToDays)(endDate - startDate));
}
exports.convertDateToIdxFloor = convertDateToIdxFloor;
function convertDateToMilli(date) {
    return convertIdxToMilli(convertDateToIdx(date));
}
exports.convertDateToMilli = convertDateToMilli;
// TODO move away from here, this is not math?
// TODO replace with lodash implementation
/**
 * @deprecated We can take advantage of lodash
 * @see lodash.isDate
 */
const isDate = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Date]';
};
exports.isDate = isDate;
/** @deprecated Use Number.isFinite instead */
const isNumber = (val) => {
    if (val === null) {
        return false;
    }
    if (val === 0) {
        return true;
    }
    // works for negative numbers too
    return !!Number(val);
};
exports.isNumber = isNumber;
const isNumberAndNotZero = (val) => {
    if (val === null) {
        return false;
    }
    // works for negative numbers too, but excludes 0
    return !!Number(val);
};
exports.isNumberAndNotZero = isNumberAndNotZero;
/** @deprecated Use Number.isInteger instead */
const isInt = (val) => (0, exports.isNumber)(val) && val % 1 === 0;
exports.isInt = isInt;
/**
 * @deprecated We can take advantage of lodash
 * @see lodash.round
 */
const fixedFloat = (val, placesPastDecimal = 2) => {
    if (!(0, exports.isNumber)(val)) {
        return null;
    }
    return Number(parseFloat(val).toFixed(placesPastDecimal));
};
exports.fixedFloat = fixedFloat;
const fixedFloatWithFlexibleDecimal = (val, placesPastDecimal = 2, percentageThreshold = 0.001) => {
    if (!Number.isFinite(val)) {
        return null;
    }
    const origTargetValue = (0, exports.fixedFloat)(val, placesPastDecimal);
    if (Math.abs(val) < 1e-100) {
        return origTargetValue;
    }
    if (Math.abs((val - origTargetValue) / val) < percentageThreshold) {
        return origTargetValue;
    }
    for (let decimal = placesPastDecimal; decimal < 101; decimal++) {
        const thisVal = (0, exports.fixedFloat)(val, decimal);
        if (Math.abs((val - thisVal) / val) < percentageThreshold) {
            return thisVal;
        }
    }
    return (0, exports.fixedFloat)(0, placesPastDecimal);
};
exports.fixedFloatWithFlexibleDecimal = fixedFloatWithFlexibleDecimal;
/**
 * Used to get a rounded number, when the final rounded number is lower than the minimum unit of that decimal will get
 * the minimum unit for the rounding result
 *
 * @example
 * 	fixedFloatWithMinimum(0.0001, 2) = 0.01 = 10**-2
 */
const fixedFloatWithMinimum = (val, placesPastDecimal = 2) => {
    if (!Number.isFinite(val)) {
        return null;
    }
    const origTargetValue = (0, exports.fixedFloat)(val, placesPastDecimal);
    const minimum = 10 ** -placesPastDecimal;
    if (origTargetValue < 0) {
        return Math.min(origTargetValue, -minimum);
    }
    return Math.max(origTargetValue, minimum);
};
exports.fixedFloatWithMinimum = fixedFloatWithMinimum;
/**
 * @deprecated We can take advantage of lodash
 * @see lodash.floor
 */
const floorFloat = (val, placesPastDecimal = 2) => {
    const multiplier = 10 ** placesPastDecimal;
    return Math.floor(val * multiplier) / multiplier;
};
exports.floorFloat = floorFloat;
/**
 * @deprecated We can take advantage of lodash
 * @see lodash.ceil
 */
const ceilFloat = (val, placesPastDecimal = 2) => {
    const multiplier = 10 ** placesPastDecimal;
    return Math.ceil(val * multiplier) / multiplier;
};
exports.ceilFloat = ceilFloat;
// TODO add some description
const myBisect = (f, a, b, tol = 2e-6) => {
    const cur_pair = [a, b];
    const cur_val = [f(a), f(b)];
    if (cur_val[0] * cur_val[1] > 0) {
        throw new Error('bisect 2 side should have different sign');
    }
    else if (cur_val.findIndex((val) => val === 0) > 0) {
        return cur_pair[cur_val.findIndex((val) => val === 0)];
    }
    const negative_0_bool = Number(cur_val[0] < 0);
    let new_x = (cur_pair[0] + cur_pair[1]) / 2;
    let new_val = f(new_x);
    let i = 0;
    while (Math.abs(new_val) >= tol) {
        i += 1;
        if (i === 90) {
            break;
        }
        if (new_val < 0) {
            cur_pair[1 - negative_0_bool] = new_x;
        }
        else {
            cur_pair[negative_0_bool] = new_x;
        }
        new_x = (cur_pair[0] + cur_pair[1]) / 2;
        new_val = f(new_x);
    }
    return new_x;
};
exports.myBisect = myBisect;
const roundToDigit = (num, digit, direction = null) => {
    const place = 10 ** digit;
    if (direction === 'down') {
        return Math.floor((num + Number.EPSILON) * place) / place;
    }
    else if (direction === 'up') {
        return Math.ceil((num + Number.EPSILON) * place) / place;
    }
    else {
        return Math.round((num + Number.EPSILON) * place) / place;
    }
};
exports.roundToDigit = roundToDigit;
