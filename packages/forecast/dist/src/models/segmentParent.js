"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helpers/helper");
const math_1 = require("../helpers/math");
// helper functions needed for every segment
// 1. calculateD from start and end
// 2. calcualteQ's using multiplier
// 3. calculateEndIdx, from q_end
// 4. calculateQEnd from EndIdx
const VIEW_FIXED_DECIMAL_MAP = {
    D: 6,
    D_exp: 6,
    D_eff: 2,
    D_exp_eff: 2,
    b: 2,
    q_end: 6,
    q_start: 6,
    q_sw: 2,
    c: 2,
    realized_D_eff_sw: 2,
    target_D_eff_sw: 2,
    k: 5,
};
const VIEW_FIXED_DECIMAL_KEYS = Object.keys(VIEW_FIXED_DECIMAL_MAP);
// This is a temporary solution until we have rounding criteria
const convertDEffToCalc = (value) => Math.min(value / 100, helper_1.DEFAULT_MAX_D_EFF);
const retSelf = (x) => x;
class SegmentParent {
    constructor(segment, relativeTime = false) {
        this.segment = segment;
        // Upper bound at 1,000,000,000 for essentially unlimited headroom without running into numerical issues.
        // Lower bound away from 0 for safety of q_end and q_start.
        // The date bounds are set so that users can enter dates from the 20th and 21st century, while having a whole
        // century for super long range planning. Need to put an upper bound on date or else arrays will grow to sizes
        // that break components elsewhere.
        this.numericLarge = 1e9;
        this.numericSmall = 1e-6;
        this.dateIdxSmall = relativeTime ? -109572 : 0; // 1/1/1900 in absolute time
        this.dateIdxLarge = 109572; // 12/31/2199
    }
    getCurrentSegment() {
        return this.segment;
    }
    // Do not call from SegmentParent. Only useable by children.
    checkValidInput = (toBeCalculatedParam, params) => {
        const ranges = this.getFormCalcRange(toBeCalculatedParam, params);
        return Object.entries(params).reduce((prev, [k, v]) => {
            const [min, max] = ranges[k];
            return prev && min <= v && v <= max;
        }, true);
    };
    calcToView({ segment = this.segment, unitConvertFunc = null, idxDate = false } = {}) {
        const unitConvert = unitConvertFunc ?? retSelf;
        const idxConvert = idxDate ? retSelf : math_1.convertIdxToDate;
        let ret = {
            ...segment,
            q_start: unitConvert(segment.q_start),
            q_end: unitConvert(segment.q_end),
            start_idx: idxConvert(segment.start_idx),
            end_idx: idxConvert(segment.end_idx),
        };
        if (segment.name === 'arps_modified') {
            ret = {
                ...ret,
                q_sw: unitConvert(segment.q_sw),
                D_eff: 100 * segment.D_eff,
                D_exp_eff: 100 * segment.D_exp_eff,
                target_D_eff_sw: 100 * segment.target_D_eff_sw,
                realized_D_eff_sw: 100 * segment.realized_D_eff_sw,
            };
        }
        else if (['arps', 'arps_inc', 'exp_inc', 'exp_dec'].includes(segment.name)) {
            ret = {
                ...ret,
                D_eff: 100 * segment.D_eff,
            };
        }
        else if (segment.name === 'linear') {
            ret = {
                ...ret,
                D_eff: 100 * segment.D_eff,
                k: unitConvert(segment.k),
            };
        }
        else if (segment.name === 'flat') {
            ret = {
                ...ret,
                c: unitConvert(segment.c),
            };
        }
        Object.entries(ret).forEach(([key, value]) => {
            if (VIEW_FIXED_DECIMAL_KEYS.includes(key)) {
                ret[key] = (0, math_1.fixedFloat)(value, VIEW_FIXED_DECIMAL_MAP[key]);
            }
        });
        return ret;
    }
    // TODO: this calc range is only for keyboard action, will try to extract this part also to segments
    getCalcRange({ segment = this.segment } = {}) {
        const ret = {
            q_start: [1e-6, this.numericLarge],
            q_end: [1e-6, segment.q_start],
            start_idx: [-500000, segment.end_idx],
            end_idx: [segment.start_idx, 500000],
            duration: [1, 500000],
        };
        if (segment.name === 'arps') {
            return { ...ret, b: [0.01, 10], D_eff: [0.01, 0.99] };
        }
        if (segment.name === 'arps_inc') {
            const { start_idx, end_idx, duration, q_start } = ret;
            return {
                start_idx,
                end_idx,
                duration,
                q_start,
                q_end: [segment.q_start, Infinity],
                b: [-10, -0.01],
                D_eff: [-Infinity, -0.0001],
            };
        }
        if (segment.name === 'linear') {
            let { start_idx, end_idx, duration, q_start } = ret;
            if (segment.k < 0) {
                start_idx = [-500000, segment.end_idx];
                end_idx = [segment.start_idx, Math.floor(-segment.q_start / segment.k) + segment.start_idx];
                q_start = [(segment.start_idx - segment.end_idx) * segment.k + 1e-6, this.numericLarge];
                duration = [1, Math.floor(-segment.q_start / segment.k) + segment.start_idx];
            }
            else if (segment.k > 0) {
                start_idx = [Math.ceil(-segment.q_end / segment.k) + segment.end_idx, segment.end_idx];
                end_idx = [segment.start_idx, 500000];
                q_start = [1e-6, this.numericLarge];
                duration = [1, 500000];
            }
            else {
                start_idx = [-500000, segment.end_idx];
                end_idx = [segment.start_idx, 500000];
                q_start = [1e-6, this.numericLarge];
                duration = [1, 500000];
            }
            return {
                start_idx,
                end_idx,
                duration,
                q_start,
                q_end: [1e-6, this.numericLarge],
                k: [segment.q_start / (segment.start_idx - segment.end_idx), Infinity],
                D_eff: [-Infinity, helper_1.DAYS_IN_YEAR / (segment.end_idx - segment.start_idx)],
            };
        }
        if (segment.name === 'arps_modified') {
            return {
                ...ret,
                b: [0.01, 10],
                D_eff: [segment.target_D_eff_sw, 0.99],
                target_D_eff_sw: [0.01, segment.D_eff],
            };
        }
        if (segment.name === 'flat') {
            return { ...ret, c: [1e-6, this.numericLarge] };
        }
        if (segment.name === 'exp_inc') {
            const { start_idx, end_idx, duration, q_start } = ret;
            return {
                start_idx,
                end_idx,
                duration,
                q_start,
                q_end: [segment.q_start, Infinity],
                D_eff: [-Infinity, -0.0001],
            };
        }
        if (segment.name === 'exp_dec') {
            return { ...ret, D_eff: [0.01, 0.99] };
        }
        // empty
        const { start_idx, end_idx, duration } = ret;
        return { start_idx, end_idx, duration };
    }
    getFormViewRange({ segment = this.segment, unitConvertFunc = null, idxDate = false, toBeCalculatedParam }) {
        // unitConvertFunc should be calcToView unit convert
        const calcRange = this.getFormCalcRange(toBeCalculatedParam, segment);
        const calcLower = Object.entries(calcRange).reduce((acc, [k, v]) => ({
            ...acc,
            [k]: v[0],
        }), { name: this.type });
        const viewLower = this.calcToView({ segment: calcLower, unitConvertFunc, idxDate });
        const calcUpper = Object.entries(calcRange).reduce((acc, [k, v]) => ({
            ...acc,
            [k]: v[1],
        }), { name: this.type });
        const viewUpper = this.calcToView({ segment: calcUpper, unitConvertFunc, idxDate });
        return Object.entries(calcRange).reduce((acc, [k]) => ({
            ...acc,
            [k]: [viewLower[k], viewUpper[k]],
        }), {});
    }
    // eslint-disable-next-line class-methods-use-this
    viewToCalc({ viewSegment, unitConvertFunc = null, idxDate = false }) {
        const unitConvert = unitConvertFunc ?? retSelf;
        const idxConvert = idxDate ? retSelf : math_1.convertDateToIdx;
        let ret = {
            ...viewSegment,
            q_start: unitConvert(viewSegment.q_start),
            q_end: unitConvert(viewSegment.q_end),
            start_idx: idxConvert(viewSegment.start_idx),
            end_idx: idxConvert(viewSegment.end_idx),
        };
        if (viewSegment.name === 'arps_modified') {
            ret = {
                ...ret,
                q_sw: unitConvert(viewSegment.q_sw),
                D_eff: convertDEffToCalc(viewSegment.D_eff),
                D_exp_eff: viewSegment.D_exp_eff / 100,
                target_D_eff_sw: viewSegment.target_D_eff_sw / 100,
                realized_D_eff_sw: viewSegment.realized_D_eff_sw / 100,
            };
        }
        else if (['arps', 'arps_inc', 'exp_inc', 'exp_dec'].includes(viewSegment.name)) {
            ret = {
                ...ret,
                D_eff: convertDEffToCalc(viewSegment.D_eff),
            };
        }
        else if (viewSegment.name === 'linear') {
            ret = {
                ...ret,
                D_eff: convertDEffToCalc(viewSegment.D_eff),
                k: unitConvert(viewSegment.k),
            };
        }
        else if (viewSegment.name === 'flat') {
            ret = {
                ...ret,
                c: unitConvert(viewSegment.c),
            };
        }
        return ret;
    }
    getViewRange({ segment = this.segment, unitConvertFunc = null, idxDate = false } = {}) {
        const unitConvert = unitConvertFunc ?? retSelf;
        const idxConvert = idxDate ? retSelf : math_1.convertIdxToDate;
        const draftRet = {
            q_start: [1e-6, this.numericLarge],
            q_end: [1e-6, unitConvert(segment.q_start)],
            start_idx: [idxConvert(-500000), idxConvert(segment.end_idx)],
            end_idx: [idxConvert(segment.start_idx), idxConvert(500000)],
            duration: [1, 500000],
        };
        let ret;
        switch (segment.name) {
            case 'arps': {
                ret = { ...draftRet, b: [0.01, 10], D_eff: [1, 99] };
                break;
            }
            case 'arps_inc': {
                const { start_idx, end_idx, duration, q_start } = draftRet;
                ret = {
                    start_idx,
                    end_idx,
                    duration,
                    q_start,
                    q_end: [unitConvert(segment.q_start), this.numericLarge],
                    D_eff: [-Infinity, -0.01],
                    b: [-10, -0.01],
                };
                break;
            }
            case 'arps_modified': {
                ret = {
                    ...draftRet,
                    b: [0.01, 10],
                    D_eff: [segment.target_D_eff_sw * 100, 99],
                    target_D_eff_sw: [1, segment.D_eff * 100],
                };
                break;
            }
            case 'flat': {
                ret = { ...draftRet, c: [0, this.numericLarge] };
                break;
            }
            case 'exp_inc': {
                const { start_idx, end_idx, duration, q_start } = draftRet;
                ret = {
                    start_idx,
                    end_idx,
                    duration,
                    q_start,
                    q_end: [unitConvert(segment.q_start), this.numericLarge],
                    D_eff: [-Infinity, -0.01],
                };
                break;
            }
            case 'exp_dec': {
                ret = { ...draftRet, D_eff: [1, 99] };
                break;
            }
            case 'empty': {
                const { start_idx, end_idx, duration } = draftRet;
                ret = { start_idx, end_idx, duration };
                break;
            }
            case 'linear': {
                let { start_idx, end_idx, duration, q_start } = draftRet;
                if (segment.k < 0) {
                    start_idx = [idxConvert(-500000), idxConvert(segment.end_idx)];
                    end_idx = [
                        idxConvert(segment.start_idx),
                        idxConvert(Math.floor(-segment.q_start / segment.k) + segment.start_idx),
                    ];
                    q_start = [
                        unitConvert((segment.start_idx - segment.end_idx) * segment.k + 1e-6),
                        this.numericLarge,
                    ];
                    duration = [1, Math.floor(-segment.q_start / segment.k) + segment.start_idx];
                }
                else if (segment.k > 0) {
                    start_idx = [
                        idxConvert(Math.ceil(-segment.q_end / segment.k) + segment.end_idx),
                        idxConvert(segment.end_idx),
                    ];
                    end_idx = [idxConvert(segment.start_idx), idxConvert(500000)];
                    q_start = [1e-6, this.numericLarge];
                    duration = [1, 500000];
                }
                else {
                    start_idx = [idxConvert(-500000), idxConvert(segment.end_idx)];
                    end_idx = [idxConvert(segment.start_idx), idxConvert(500000)];
                    q_start = [1e-6, this.numericLarge];
                    duration = [1, 500000];
                }
                ret = {
                    start_idx,
                    end_idx,
                    duration,
                    q_start,
                    q_end: [1e-6, this.numericLarge],
                    k: [unitConvert(segment.q_start / (segment.start_idx - segment.end_idx)), Infinity],
                    D_eff: [-Infinity, (helper_1.DAYS_IN_YEAR / (segment.end_idx - segment.start_idx)) * 100],
                };
                break;
            }
            default: {
                throw Error('This segment does not have a name.');
            }
        }
        Object.entries(ret).forEach(([key, value]) => {
            if (VIEW_FIXED_DECIMAL_KEYS.includes(key)) {
                ret[key][0] = (0, math_1.ceilFloat)(value[0], VIEW_FIXED_DECIMAL_MAP[key]);
                ret[key][1] = (0, math_1.floorFloat)(value[1], VIEW_FIXED_DECIMAL_MAP[key]);
            }
        });
        return ret;
    }
    qMultiplication(multiplier) {
        const ret = {
            ...this.segment,
            q_start: this.segment.q_start * multiplier,
            q_end: this.segment.q_end * multiplier,
        };
        if (this.type === 'arps_modified') {
            ret.q_sw = this.segment.q_sw * multiplier;
            return ret;
        }
        if (this.type === 'flat') {
            ret.c = this.segment.c * multiplier;
        }
        return ret;
    }
    qTranslation(distance) {
        const ret = {
            ...this.segment,
            q_start: this.segment.q_start + distance,
            q_end: this.segment.q_end + distance,
        };
        return ret;
    }
    // form changes
    // This is bugged. See useKeyboardForecast adjustQStartAll for what we should actually do.
    changeQStart(newQStart) {
        if (this.type === 'linear') {
            const ret = {
                ...this.segment,
                q_start: newQStart,
            };
            ret.q_end = this.segment.q_end + newQStart - this.segment.q_start;
            return ret;
        }
        return this.qMultiplication(newQStart / this.segment.q_start);
    }
    changeStartIdx(newStartIdx) {
        const { start_idx, end_idx } = this.segment;
        const deltaT = newStartIdx - start_idx;
        const newQEnd = this.predict([end_idx - deltaT])[0];
        const ret = { ...this.segment, start_idx: newStartIdx, q_end: newQEnd };
        if (this.type === 'arps_modified') {
            ret.sw_idx += deltaT;
        }
        return ret;
    }
    changeEndIdx(newEndIdx) {
        return {
            ...this.segment,
            end_idx: newEndIdx,
            q_end: this.predict([newEndIdx])[0],
        };
    }
    changeDuration(newDuration) {
        const newEndIdx = this.segment.start_idx + newDuration - 1;
        return this.changeEndIdx(newEndIdx);
    }
    // buttons
    // connect
    buttonConnectPrev(prevSegment) {
        const { q_end: prevQEnd } = prevSegment;
        return this.changeQStart(prevQEnd);
    }
    buttonConnectNext(nextSegment) {
        const { q_start: nextQStart } = nextSegment;
        if (this.type === 'linear') {
            return this.qTranslation(nextQStart - this.segment.q_end);
        }
        return this.qMultiplication(nextQStart / this.segment.q_end);
    }
    // lock calculation entry point
    // eslint-disable-next-line complexity
    getNewSegmentWithLock(toBeCalculatedParam, param, value) {
        const input = { ...this.segment, [param]: value };
        switch (toBeCalculatedParam) {
            case 'q_start':
                return this.calcQStart(input);
            case 'q_end':
                return this.calcQEnd(input);
            case 'D_eff':
                return this.calcDeff(input);
            case 'end_idx':
                return this.calcEndIdx(input);
            case 'k':
                return this.calcK(input);
            default:
                return { ...this.segment };
        }
    }
}
exports.default = SegmentParent;
