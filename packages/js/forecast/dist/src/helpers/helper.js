"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_D_EFF = exports.DEFAULT_WELL_LIFE_IDX = exports.DAYS_IN_MONTH = exports.DAYS_IN_YEAR = exports.getWellLifeIdx = exports.shiftIdxByYear = exports.arpsModifiedSwitch = exports.arpsModifiedGetD = exports.expGetD = exports.arpsGetD = exports.linearGetStartIdxFromQstart = exports.linearGetEndIdxFromQend = exports.expGetStartIdxFromQstart = exports.expGetEndIdxFromQend = exports.arpsModifiedGetStartIdxFromQstart = exports.arpsModifiedGetEndIdxFromQend = exports.arpsGetStartIdxFromQstart = exports.arpsGetEndIdxFromQend = exports.arpsGetIdxFromDnew = exports.arpsGetDDelta = exports.expD2Deff = exports.expDeff2D = exports.expGetQStart = exports.arpsD2Deff = exports.arpsDeff2D = exports.arpsModifiedGetQStart = exports.arpsGetQStart = exports.linearGetQStart = exports.inverseIntegralArps = exports.inverseIntegralExp = exports.integralArps = exports.integralExp = exports.expGetDFromFirstDerivative = exports.arpsGetDFromFirstDerivative = exports.firstDerivativeArps = exports.firstDerivativeExp = exports.predArpsModified = exports.getSlope = exports.linearK2Slope = exports.linearGetK = exports.linearDeff2K = exports.linearK2Deff = exports.predLinear = exports.predArps = exports.predExp = exports.getDaysInMonth = exports.getLastDayOfMonth = void 0;
const math_1 = require("./math");
const DAYS_IN_YEAR = 365.25;
exports.DAYS_IN_YEAR = DAYS_IN_YEAR;
const DAYS_IN_MONTH = DAYS_IN_YEAR / 12;
exports.DAYS_IN_MONTH = DAYS_IN_MONTH;
const DEFAULT_WELL_LIFE_IDX = -1000000000;
exports.DEFAULT_WELL_LIFE_IDX = DEFAULT_WELL_LIFE_IDX;
const DEFAULT_MAX_D_EFF = 0.9999;
exports.DEFAULT_MAX_D_EFF = DEFAULT_MAX_D_EFF;
function getLastDayOfMonth(indexValue) {
    const monthDate = (0, math_1.convertIdxToDate)(indexValue);
    return (0, math_1.convertDateToIdx)(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
}
exports.getLastDayOfMonth = getLastDayOfMonth;
function getDaysInMonth(index) {
    const indexDate = (0, math_1.convertIdxToDate)(index);
    const year = indexDate.getFullYear();
    const month = indexDate.getMonth();
    return (0, math_1.convertDateToIdx)(new Date(year, month + 1, 0)) - (0, math_1.convertDateToIdx)(new Date(year, month, 0));
}
exports.getDaysInMonth = getDaysInMonth;
function predExp({ t, start_idx, q_start, D_exp }) {
    return q_start * Math.exp(-D_exp * (t - start_idx));
}
exports.predExp = predExp;
function predArps({ t, start_idx, q_start, D, b }) {
    return q_start * (1 + b * D * (t - start_idx)) ** (-1 / b);
}
exports.predArps = predArps;
function predLinear({ t, start_idx, q_start, k }) {
    return k * (t - start_idx) + q_start;
}
exports.predLinear = predLinear;
function linearK2Deff({ k, q_start }) {
    return (-k * DAYS_IN_YEAR) / q_start;
}
exports.linearK2Deff = linearK2Deff;
function linearDeff2K({ D_eff, q_start }) {
    return (-D_eff * q_start) / DAYS_IN_YEAR;
}
exports.linearDeff2K = linearDeff2K;
function linearGetK({ end_idx, start_idx, q_start, q_end }) {
    return (q_end - q_start) / (end_idx - start_idx);
}
exports.linearGetK = linearGetK;
function linearK2Slope({ k }) {
    let slope = 0;
    if (k > 0) {
        slope = 1;
    }
    else if (k < 0) {
        slope = -1;
    }
    return slope;
}
exports.linearK2Slope = linearK2Slope;
function getSlope({ q_start, q_end }) {
    let slope = 0;
    if (q_start > q_end) {
        slope = -1;
    }
    else if (q_end > q_start) {
        slope = 1;
    }
    return slope;
}
exports.getSlope = getSlope;
function predArpsModified({ t, start_idx, q_start, D, b, sw_idx, q_sw, D_exp }) {
    return t >= sw_idx
        ? predExp({ t, start_idx: sw_idx, q_start: q_sw, D_exp })
        : predArps({ t, start_idx, q_start, D, b });
}
exports.predArpsModified = predArpsModified;
function firstDerivativeExp({ t, start_idx, q_start, D_exp }) {
    return -D_exp * q_start * Math.exp(-D_exp * (t - start_idx));
}
exports.firstDerivativeExp = firstDerivativeExp;
function firstDerivativeArps({ t, start_idx, q_start, D, b }) {
    return -q_start * D * (1 + b * D * (t - start_idx)) ** -(1 / b + 1);
}
exports.firstDerivativeArps = firstDerivativeArps;
function arpsGetDFromFirstDerivative({ q_start, first_derivative }) {
    return -first_derivative / q_start;
}
exports.arpsGetDFromFirstDerivative = arpsGetDFromFirstDerivative;
function expGetDFromFirstDerivative({ q_start, first_derivative }) {
    return -first_derivative / q_start;
}
exports.expGetDFromFirstDerivative = expGetDFromFirstDerivative;
function integralExp({ left_idx, right_idx, start_idx, q_start, D_exp }) {
    if (D_exp === 0) {
        return q_start * (right_idx - left_idx);
    }
    return ((-q_start / D_exp) * (Math.exp(-D_exp * (right_idx - start_idx)) - Math.exp(-D_exp * (left_idx - start_idx))));
}
exports.integralExp = integralExp;
function integralArps({ left_idx, right_idx, start_idx, q_start, D, b }) {
    // There's floating point precision problems when b is very close to 1. Experimentally, to the precision of the
    // segment display on the app, a threshold of 1e-9 seems to avoid these errors.
    if (b > 1 + 1e-9 || b < 1 - 1e-9) {
        const q_left = predArps({ t: left_idx, start_idx, q_start, D, b });
        const q_right = predArps({ t: right_idx, start_idx, q_start, D, b });
        return (q_start ** b / (1 - b) / D) * (q_left ** (1 - b) - q_right ** (1 - b));
    }
    return (q_start / D) * (Math.log(1 + D * (right_idx - start_idx)) - Math.log(1 + D * (left_idx - start_idx)));
}
exports.integralArps = integralArps;
function inverseIntegralExp({ integral, left_idx, start_idx, q_start, D_exp }) {
    if (D_exp === 0) {
        return integral / q_start + left_idx;
    }
    return -Math.log(Math.exp(-D_exp * (left_idx - start_idx)) - (integral * D_exp) / q_start) / D_exp + start_idx;
}
exports.inverseIntegralExp = inverseIntegralExp;
function inverseIntegralArps({ integral, left_idx, start_idx, q_start, D, b }) {
    let q_left;
    let A;
    let q_right;
    if (b !== 1) {
        q_left = predArps({ left_idx, start_idx, q_start, D, b });
        A = q_left ** (1 - b) - (integral * (1 - b) * D) / q_start ** b;
        q_right = A ** (1 / (1 - b));
        return ((q_start / q_right) ** b - 1) / b / D + start_idx;
    }
    A = (integral * D) / q_start + Math.log(1 + D * (left_idx - start_idx));
    return (Math.exp(A) - 1) / D + start_idx;
}
exports.inverseIntegralArps = inverseIntegralArps;
function linearGetQStart({ k, start_idx, end_idx, q_end }) {
    return q_end - predLinear({ t: end_idx, start_idx, q_start: 0, k });
}
exports.linearGetQStart = linearGetQStart;
function arpsGetQStart({ D, b, start_idx, end_idx, q_end }) {
    return q_end / predArps({ t: end_idx, start_idx, q_start: 1, D, b });
}
exports.arpsGetQStart = arpsGetQStart;
function arpsModifiedGetQStart({ D, b, start_idx, end_idx, q_end, sw_idx, D_exp }) {
    return sw_idx > end_idx
        ? arpsGetQStart({ D, b, start_idx, end_idx, q_end })
        : arpsGetQStart({
            D,
            b,
            start_idx,
            end_idx: sw_idx,
            q_end: expGetQStart({ D_exp, start_idx: sw_idx, end_idx, q_end }),
        });
}
exports.arpsModifiedGetQStart = arpsModifiedGetQStart;
function arpsDeff2D(D_eff, b) {
    return ((1 - D_eff) ** -b - 1) / DAYS_IN_YEAR / b;
}
exports.arpsDeff2D = arpsDeff2D;
function arpsD2Deff(D, b) {
    return 1 - (1 + D * DAYS_IN_YEAR * b) ** (-1 / b);
}
exports.arpsD2Deff = arpsD2Deff;
function expGetQStart({ D_exp, start_idx, end_idx, q_end }) {
    return q_end / predExp({ t: end_idx, start_idx, q_start: 1, D_exp });
}
exports.expGetQStart = expGetQStart;
function expDeff2D(D_eff) {
    return -Math.log(1 - D_eff) / DAYS_IN_YEAR;
}
exports.expDeff2D = expDeff2D;
function expD2Deff(D) {
    return 1 - Math.exp(-DAYS_IN_YEAR * D);
}
exports.expD2Deff = expD2Deff;
function arpsGetDDelta({ D, b, delta_t }) {
    return D / (1 + b * D * delta_t);
}
exports.arpsGetDDelta = arpsGetDDelta;
function arpsGetIdxFromDnew({ start_idx, D, Dnew, b }) {
    return (D / Dnew - 1) / (b * D) + start_idx;
}
exports.arpsGetIdxFromDnew = arpsGetIdxFromDnew;
function arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end }) {
    return start_idx + ((q_start / q_end) ** b - 1) / b / D;
}
exports.arpsGetEndIdxFromQend = arpsGetEndIdxFromQend;
function arpsGetStartIdxFromQstart({ q_start, D, b, end_idx, q_end }) {
    return arpsGetEndIdxFromQend({ start_idx: end_idx, q_start, D: -D, b, q_end });
}
exports.arpsGetStartIdxFromQstart = arpsGetStartIdxFromQstart;
function arpsModifiedGetEndIdxFromQend({ start_idx, q_start, D, b, q_end, sw_idx, D_exp, q_sw }) {
    return q_end < q_sw
        ? Math.round(expGetEndIdxFromQend({ start_idx: sw_idx, q_start: q_sw, D: D_exp, q_end }))
        : arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end });
}
exports.arpsModifiedGetEndIdxFromQend = arpsModifiedGetEndIdxFromQend;
function arpsModifiedGetStartIdxFromQstart({ q_start, D, b, end_idx, q_end, target_D_eff_sw }) {
    const { sw_idx, D_exp } = arpsModifiedSwitch({ b, D, target_D_eff_sw, start_idx: 0 });
    const sw_idx_offset = Math.floor(sw_idx);
    const q_sw = predArps({ t: sw_idx_offset, start_idx: 0, q_start, D, b });
    return q_sw < q_end
        ? arpsGetStartIdxFromQstart({ q_start, D, b, end_idx, q_end })
        : Math.round(expGetStartIdxFromQstart({ q_start: q_sw, D: D_exp, end_idx, q_end }) - sw_idx_offset);
}
exports.arpsModifiedGetStartIdxFromQstart = arpsModifiedGetStartIdxFromQstart;
function expGetEndIdxFromQend({ start_idx, q_start, D, q_end }) {
    return start_idx + Math.log(q_start / q_end) / D;
}
exports.expGetEndIdxFromQend = expGetEndIdxFromQend;
function expGetStartIdxFromQstart({ q_start, D, end_idx, q_end }) {
    return expGetEndIdxFromQend({ start_idx: end_idx, q_start, q_end, D: -D });
}
exports.expGetStartIdxFromQstart = expGetStartIdxFromQstart;
function linearGetEndIdxFromQend({ start_idx, q_start, k, q_end }) {
    return start_idx + (q_end - q_start) / k;
}
exports.linearGetEndIdxFromQend = linearGetEndIdxFromQend;
function linearGetStartIdxFromQstart({ end_idx, q_start, k, q_end }) {
    return linearGetEndIdxFromQend({ start_idx: end_idx, q_end, q_start, k: -k });
}
exports.linearGetStartIdxFromQstart = linearGetStartIdxFromQstart;
function arpsGetD({ start_idx, q_start, end_idx, q_end, b }) {
    return ((q_start / q_end) ** b - 1) / b / (end_idx - start_idx);
}
exports.arpsGetD = arpsGetD;
function expGetD({ start_idx, q_start, end_idx, q_end }) {
    return -Math.log(q_end / q_start) / (end_idx - start_idx);
}
exports.expGetD = expGetD;
function arpsModifiedGetD({ q_start, q_end, b, start_idx, end_idx, target_D_eff_sw }) {
    const delta_t = end_idx - start_idx;
    const target_D_sw = expDeff2D(target_D_eff_sw);
    const pure_arps_D = arpsGetD({ start_idx, q_start, end_idx, q_end, b });
    const pure_arps_D_end = arpsGetDDelta({ D: pure_arps_D, b, delta_t });
    if (pure_arps_D_end >= target_D_sw) {
        return pure_arps_D;
    }
    const pure_exp_D = expGetD({ q_start, q_end, start_idx, end_idx });
    if (pure_exp_D <= target_D_sw) {
        throw new Error(`The D Sw-Eff-Sec is too large, we are not able to anchor with a Di Eff-Sec that is larger than D Sw-Eff-Sec}`);
    }
    else {
        // myBisect version.
        const right_boundary = Math.min(1 / b / target_D_sw, end_idx - start_idx);
        const D_t1 = (t1) => arpsGetDDelta({ D: target_D_sw, b, delta_t: -t1 });
        const f_t1 = (t1) => Math.log(q_start / q_end) - Math.log(1 + b * D_t1(t1) * t1) / b - target_D_sw * (delta_t - t1);
        try {
            const t1 = (0, math_1.myBisect)(f_t1, 0, right_boundary);
            return D_t1(t1);
        }
        catch (error) {
            // In this case myBisect failed for numerical reasons. Return a null and let the caller decide how to handle
            // the error.
            return null;
        }
    }
}
exports.arpsModifiedGetD = arpsModifiedGetD;
function arpsModifiedSwitch({ b, D, target_D_eff_sw, start_idx }) {
    if (target_D_eff_sw === 0) {
        return {
            realized_D_eff_sw: 0,
            sw_idx: start_idx + 300000,
            D_exp: 0,
            D_exp_eff: 0,
        };
    }
    const target_D_sw = expDeff2D(target_D_eff_sw);
    if (target_D_sw >= D) {
        return {
            realized_D_eff_sw: expD2Deff(D),
            sw_idx: start_idx,
            D_exp: D,
            D_exp_eff: expD2Deff(D),
        };
    }
    return {
        realized_D_eff_sw: target_D_eff_sw,
        sw_idx: arpsGetIdxFromDnew({ start_idx, D, Dnew: target_D_sw, b }),
        D_exp: target_D_sw,
        D_exp_eff: target_D_eff_sw,
    };
}
exports.arpsModifiedSwitch = arpsModifiedSwitch;
function shiftIdxByYear(origIdx, shiftNum) {
    const origDate = (0, math_1.convertIdxToDate)(origIdx);
    const newDate = new Date(origDate.getFullYear() + shiftNum, origDate.getMonth(), 0);
    return (0, math_1.convertDateToIdx)(newDate);
}
exports.shiftIdxByYear = shiftIdxByYear;
function getWellLifeIdx(prodInfo, wellLifeDict, firstSegment) {
    const { start_idx: firstSegmentStartIdx } = firstSegment;
    const { fixed_date, num, well_life_method } = wellLifeDict;
    const checkNumInvalid = num === undefined || num === null || num < 0;
    const durationFromFirstData = () => {
        if (checkNumInvalid) {
            return DEFAULT_WELL_LIFE_IDX;
        }
        if (prodInfo.startIdx === 0) {
            return shiftIdxByYear(prodInfo.startIdx, num);
        }
        return shiftIdxByYear(prodInfo.startIdx || firstSegmentStartIdx, num);
    };
    const durationFromLastData = () => {
        if (checkNumInvalid) {
            return DEFAULT_WELL_LIFE_IDX;
        }
        if (prodInfo.endIdx === 0) {
            return shiftIdxByYear(prodInfo.endIdx, num);
        }
        return shiftIdxByYear(prodInfo.endIdx || firstSegmentStartIdx, num);
    };
    const durationFromToday = () => {
        const todayIdx = (0, math_1.convertDateToIdx)(new Date());
        if (checkNumInvalid) {
            return DEFAULT_WELL_LIFE_IDX;
        }
        return shiftIdxByYear(todayIdx, num);
    };
    const fixedDate = () => {
        if (fixed_date === null || fixed_date === undefined) {
            return DEFAULT_WELL_LIFE_IDX;
        }
        return fixed_date;
    };
    switch (well_life_method) {
        case 'duration_from_first_data': {
            return durationFromFirstData();
        }
        case 'duration_from_last_data': {
            return durationFromLastData();
        }
        case 'duration_from_today': {
            return durationFromToday();
        }
        case 'fixed_date': {
            return fixedDate();
        }
        default:
            return DEFAULT_WELL_LIFE_IDX;
    }
}
exports.getWellLifeIdx = getWellLifeIdx;
