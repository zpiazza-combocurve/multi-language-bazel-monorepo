"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helpers/helper");
const math_1 = require("../helpers/math");
const segmentParent_1 = __importDefault(require("./segmentParent"));
class ArpsModifiedSegment extends segmentParent_1.default {
    constructor(segment = null, relativeTime = false) {
        super(segment, relativeTime);
        this.type = 'arps_modified';
    }
    // shifted from forecastChartHelper
    generateSegmentParameter(segmentInput) {
        const { start_idx, end_idx, b, D_eff, q_start, target_D_eff_sw } = segmentInput;
        const qStartValid = this.numericSmall <= q_start && q_start <= this.numericLarge;
        const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
        const isValid = this.checkValidInput('q_end', { start_idx, end_idx, b, D_eff, q_start, target_D_eff_sw }) &&
            qStartValid &&
            startIdxValid;
        if (!isValid) {
            const defaultStartIdx = startIdxValid ? start_idx : end_idx;
            const defaultQStart = 100;
            const defaultQEnd = 50;
            const defaultB = 1.1;
            const defaultTargetDEffSw = 0.08;
            const defaultD = (0, helper_1.arpsModifiedGetD)({
                q_start: defaultQStart,
                q_end: defaultQEnd,
                b: defaultB,
                start_idx: defaultStartIdx,
                end_idx,
                target_D_eff_sw: defaultTargetDEffSw,
            });
            const defaultDEff = (0, helper_1.arpsD2Deff)(defaultD, defaultB);
            const { realized_D_eff_sw: defaultRealizedDEffSw, sw_idx: defaultSwIdx, D_exp: defaultDExp, D_exp_eff: defaultDExpEff, } = (0, helper_1.arpsModifiedSwitch)({
                b: defaultB,
                D: defaultD,
                target_D_eff_sw: defaultTargetDEffSw,
                start_idx: defaultStartIdx,
            });
            const defaultQSw = (0, helper_1.predArps)({
                t: defaultSwIdx,
                start_idx: defaultStartIdx,
                q_start: defaultQStart,
                D: defaultD,
                b: defaultB,
            });
            return {
                start_idx: defaultStartIdx,
                end_idx,
                q_start: defaultQStart,
                q_end: defaultQEnd,
                b: defaultB,
                D: defaultD,
                D_eff: defaultDEff,
                D_exp: defaultDExp,
                realized_D_eff_sw: defaultRealizedDEffSw,
                target_D_eff_sw: defaultTargetDEffSw,
                sw_idx: defaultSwIdx,
                D_exp_eff: defaultDExpEff,
                q_sw: defaultQSw,
                slope: -1,
                name: this.type,
            };
        }
        const D = (0, helper_1.arpsDeff2D)(D_eff, b);
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D, b });
        return {
            start_idx,
            q_start,
            end_idx,
            q_end: (0, helper_1.predArpsModified)({ t: end_idx, start_idx, q_start, D, b, sw_idx, q_sw, D_exp }),
            sw_idx,
            q_sw,
            b,
            D,
            D_eff,
            D_exp,
            D_exp_eff,
            target_D_eff_sw,
            realized_D_eff_sw,
            slope: -1,
            name: this.type,
        };
    }
    getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
        const D = (0, helper_1.arpsDeff2D)(segment.D_eff, segment.b);
        const { sw_idx, D_exp } = (0, helper_1.arpsModifiedSwitch)({ ...segment, D });
        const q_sw = (0, helper_1.predArps)({ ...segment, t: sw_idx, D });
        let DeffMin;
        let DeffMax;
        let DexpEffMin;
        let DexpEffMax;
        let startIdxMin;
        let startIdxMax;
        let endIdxMin;
        let endIdxMax;
        switch (toBeCalculatedParam) {
            case 'end_idx': {
                if (segment.start_idx === segment.end_idx ||
                    (0, helper_1.predExp)({ ...segment, t: this.dateIdxLarge, D_exp: (0, helper_1.expDeff2D)(segment.target_D_eff_sw) }) <
                        segment.q_end) {
                    DeffMin = Math.max(0.01, (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b));
                }
                else {
                    const Dmin = (0, helper_1.arpsModifiedGetD)({ ...segment, end_idx: this.dateIdxLarge });
                    DeffMin = Dmin !== null ? Math.max(0.01, (0, helper_1.arpsD2Deff)(Dmin, segment.b)) : 0.01;
                }
                return {
                    start_idx: [
                        this.dateIdxSmall,
                        Math.floor(Math.max(this.dateIdxSmall, Math.min(this.dateIdxLarge, (0, helper_1.arpsModifiedGetStartIdxFromQstart)({ ...segment, D, end_idx: this.dateIdxLarge })))),
                    ],
                    end_idx: [this.dateIdxSmall, this.dateIdxLarge],
                    duration: [1, this.dateIdxLarge],
                    q_start: [
                        segment.q_end,
                        Math.max(segment.q_end, Math.min(this.numericLarge, (0, helper_1.arpsModifiedGetQStart)({ ...segment, D, end_idx: this.dateIdxLarge, sw_idx, D_exp }))),
                    ],
                    q_end: [
                        Math.min(segment.q_start, Math.max(this.numericSmall, (0, helper_1.predArpsModified)({ ...segment, t: this.dateIdxLarge, D, sw_idx, q_sw, D_exp }))),
                        segment.q_start,
                    ],
                    D_eff: [Math.min(helper_1.DEFAULT_MAX_D_EFF, DeffMin), helper_1.DEFAULT_MAX_D_EFF],
                    b: [0.01, 10],
                    target_D_eff_sw: [0.01, (0, helper_1.expD2Deff)(D)],
                };
            }
            case 'q_start': {
                const qSwLimit = (0, helper_1.predArps)({ ...segment, q_start: this.numericLarge, t: sw_idx, D });
                DeffMin = Math.max(0.01, (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b));
                if (segment.start_idx === segment.end_idx) {
                    DeffMax = helper_1.DEFAULT_MAX_D_EFF;
                    DexpEffMax = Math.min(helper_1.DEFAULT_MAX_D_EFF, Math.max(0.01, (0, helper_1.expD2Deff)(D)));
                }
                else {
                    DexpEffMax = Math.max(0.01, Math.min(helper_1.DEFAULT_MAX_D_EFF, (0, helper_1.expD2Deff)(D), (0, helper_1.expD2Deff)((0, helper_1.expGetD)({ ...segment, q_start: this.numericLarge }))));
                    if ((0, helper_1.expGetD)({ ...segment, q_start: this.numericLarge }) >= (0, helper_1.expDeff2D)(segment.target_D_eff_sw)) {
                        const Dmax = (0, helper_1.arpsModifiedGetD)({ ...segment, q_start: this.numericLarge });
                        DeffMax =
                            Dmax !== null
                                ? Math.min(helper_1.DEFAULT_MAX_D_EFF, (0, helper_1.arpsD2Deff)(Dmax, segment.b))
                                : helper_1.DEFAULT_MAX_D_EFF;
                    }
                    else {
                        DeffMax = (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b);
                    }
                }
                startIdxMin = Math.min(Math.max(this.dateIdxSmall, (0, helper_1.arpsModifiedGetStartIdxFromQstart)({
                    ...segment,
                    q_start: this.numericLarge,
                    D,
                })), segment.end_idx);
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(Math.min(this.dateIdxLarge, (0, helper_1.arpsModifiedGetEndIdxFromQend)({
                    ...segment,
                    q_start: this.numericLarge,
                    D,
                    sw_idx,
                    D_exp,
                    q_sw: qSwLimit,
                })), segment.start_idx);
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [this.numericSmall, this.numericLarge],
                    q_end: [
                        this.numericSmall,
                        Math.max(Math.min(this.numericLarge, (0, helper_1.predArpsModified)({
                            ...segment,
                            t: segment.end_idx,
                            q_start: this.numericLarge,
                            D,
                            sw_idx,
                            q_sw: qSwLimit,
                            D_exp,
                        })), this.numericSmall),
                    ],
                    D_eff: [Math.min(DeffMin, DeffMax), Math.max(DeffMin, DeffMax)],
                    b: [0.01, 10],
                    target_D_eff_sw: [0.01, DexpEffMax],
                };
            }
            case 'q_end': {
                DeffMin = Math.max(0.01, (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b));
                DexpEffMax = Math.min(helper_1.DEFAULT_MAX_D_EFF, Math.max(0.01, (0, helper_1.expD2Deff)(D)));
                if (segment.start_idx === segment.end_idx) {
                    DeffMax = helper_1.DEFAULT_MAX_D_EFF;
                }
                else if ((0, helper_1.expGetD)({ ...segment, q_end: this.numericSmall }) >= (0, helper_1.expDeff2D)(segment.target_D_eff_sw)) {
                    const Dmax = (0, helper_1.arpsModifiedGetD)({ ...segment, q_end: this.numericSmall });
                    DeffMax =
                        Dmax !== null ? Math.min(helper_1.DEFAULT_MAX_D_EFF, (0, helper_1.arpsD2Deff)(Dmax, segment.b)) : helper_1.DEFAULT_MAX_D_EFF;
                }
                else {
                    DeffMax = (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b);
                }
                startIdxMin = Math.min(segment.end_idx, Math.max(this.dateIdxSmall, (0, helper_1.arpsModifiedGetStartIdxFromQstart)({ ...segment, D, q_end: this.numericSmall })));
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(segment.start_idx, Math.min(this.dateIdxLarge, (0, helper_1.arpsModifiedGetEndIdxFromQend)({
                    ...segment,
                    D,
                    q_end: this.numericSmall,
                    sw_idx,
                    D_exp,
                    q_sw,
                })));
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [
                        Math.min(this.numericLarge, Math.max(this.numericSmall, (0, helper_1.arpsModifiedGetQStart)({ ...segment, D, q_end: this.numericSmall, sw_idx, D_exp }))),
                        this.numericLarge,
                    ],
                    q_end: [this.numericSmall, this.numericLarge],
                    D_eff: [Math.min(DeffMin, DeffMax), Math.max(DeffMin, DeffMax)],
                    b: [0.01, 10],
                    target_D_eff_sw: [0.01, DexpEffMax],
                };
            }
            case 'D_eff': {
                const highD = (0, helper_1.arpsDeff2D)(helper_1.DEFAULT_MAX_D_EFF, segment.b);
                const { sw_idx: highSwIdx, D_exp: highDexp } = (0, helper_1.arpsModifiedSwitch)({ ...segment, D: highD });
                const highQsw = (0, helper_1.predArps)({ ...segment, t: highSwIdx, D: highD });
                const startEq = segment.q_start === segment.q_end ? segment.end_idx : segment.end_idx - 1;
                const endEq = segment.q_start === segment.q_end ? segment.start_idx : segment.start_idx + 1;
                DeffMin = Math.max(0.01, (0, helper_1.arpsD2Deff)((0, helper_1.expDeff2D)(segment.target_D_eff_sw), segment.b));
                DexpEffMin = 0.01; // Painful to get actual min here. Requires finding tangency w/ arps curve.
                DexpEffMax = (0, math_1.roundToDigit)(Math.min(helper_1.DEFAULT_MAX_D_EFF, (0, helper_1.expD2Deff)((0, helper_1.expGetD)({ ...segment }))), 4);
                startIdxMin = Math.min(startEq, Math.floor((0, helper_1.arpsModifiedGetStartIdxFromQstart)({ ...segment, D: highD })), Math.max(this.dateIdxSmall, Math.ceil((0, helper_1.expGetStartIdxFromQstart)({ ...segment, D: (0, helper_1.expDeff2D)(segment.target_D_eff_sw) }))));
                startIdxMax = Math.min(startEq, Math.floor((0, helper_1.arpsModifiedGetStartIdxFromQstart)({ ...segment, D: highD })));
                endIdxMin = Math.max(endEq, Math.ceil((0, helper_1.arpsModifiedGetEndIdxFromQend)({
                    ...segment,
                    D: highD,
                    sw_idx: highSwIdx,
                    D_exp: highDexp,
                    q_sw: highQsw,
                })));
                endIdxMax = Math.max(endEq, Math.ceil((0, helper_1.arpsModifiedGetEndIdxFromQend)({
                    ...segment,
                    D: highD,
                    sw_idx: highSwIdx,
                    D_exp: highDexp,
                    q_sw: highQsw,
                })), Math.min(this.dateIdxLarge, Math.floor((0, helper_1.expGetEndIdxFromQend)({ ...segment, D: (0, helper_1.expDeff2D)(segment.target_D_eff_sw) }))));
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [
                        Math.min(this.numericLarge, (0, helper_1.arpsModifiedGetQStart)({ ...segment, D: highD, sw_idx: highSwIdx, D_exp: highDexp }), Math.max(segment.q_end, (0, helper_1.expGetQStart)({ ...segment, D_exp: (0, helper_1.expDeff2D)(segment.target_D_eff_sw) }))),
                        Math.min(this.numericLarge, (0, helper_1.arpsModifiedGetQStart)({ ...segment, D: highD, sw_idx: highSwIdx, D_exp: highDexp })),
                    ],
                    q_end: [
                        Math.max(this.numericSmall, (0, helper_1.predArpsModified)({
                            ...segment,
                            t: segment.end_idx,
                            D: highD,
                            sw_idx: highSwIdx,
                            q_sw: highQsw,
                            D_exp: highDexp,
                        })),
                        Math.max(this.numericSmall, (0, helper_1.predArpsModified)({
                            ...segment,
                            t: segment.end_idx,
                            D: highD,
                            sw_idx: highSwIdx,
                            q_sw: highQsw,
                            D_exp: highDexp,
                        }), Math.min(segment.q_start, (0, helper_1.predExp)({ ...segment, t: segment.end_idx, D_exp: (0, helper_1.expDeff2D)(segment.target_D_eff_sw) }))),
                    ],
                    D_eff: [Math.min(helper_1.DEFAULT_MAX_D_EFF, DeffMin), helper_1.DEFAULT_MAX_D_EFF],
                    b: [0.01, 10],
                    target_D_eff_sw: [DexpEffMin, DexpEffMax],
                };
            }
            default:
                return this.getCalcRange({ segment });
        }
    }
    predict(idxArr) {
        const { start_idx, sw_idx, q_start, b, D, q_sw, D_exp } = this.segment;
        return idxArr.map((t) => {
            return (0, helper_1.predArpsModified)({ t, start_idx, q_start, D, b, sw_idx, q_sw, D_exp });
        });
    }
    integral(left_idx, right_idx) {
        const { D, b, sw_idx, q_sw, D_exp, q_start, start_idx } = this.segment;
        let ret = 0;
        const arpsIdxs = [Math.min(left_idx, sw_idx), Math.min(right_idx, sw_idx)];
        if (arpsIdxs[0] < arpsIdxs[1]) {
            ret += (0, helper_1.integralArps)({ left_idx: arpsIdxs[0], right_idx: arpsIdxs[1], start_idx, q_start, D, b });
        }
        const expIdxs = [Math.max(left_idx, sw_idx), Math.max(right_idx, sw_idx)];
        if (expIdxs[0] < expIdxs[1]) {
            ret += (0, helper_1.integralExp)({
                left_idx: expIdxs[0],
                right_idx: expIdxs[1],
                start_idx: sw_idx,
                q_start: q_sw,
                D_exp,
            });
        }
        return ret;
    }
    inverseIntegral(integral, left_idx) {
        const { q_start, start_idx, D, b, sw_idx, q_sw, D_exp } = this.segment;
        if (left_idx < sw_idx) {
            const thres = (0, helper_1.integralArps)({ left_idx, sw_idx, start_idx, q_start, D, b });
            if (integral < thres) {
                return (0, helper_1.inverseIntegralArps)({ integral, left_idx, start_idx, q_start, D, b });
            }
            return (0, helper_1.inverseIntegralExp)({
                integral: integral - thres,
                left_idx: sw_idx,
                start_idx: sw_idx,
                q_start: q_sw,
                D_exp,
            });
        }
        return (0, helper_1.inverseIntegralExp)({ integral, left_idx, start_idx: sw_idx, q_start: q_sw, D_exp });
    }
    firstDerivative(idxArr) {
        const { start_idx, q_start, D, b, sw_idx, q_sw, D_exp } = this.segment;
        return idxArr.map((t) => {
            if (t <= sw_idx) {
                return (0, helper_1.firstDerivativeArps)({ t, start_idx, q_start, D, b });
            }
            return (0, helper_1.firstDerivativeExp)({ t, start_idx: sw_idx, q_start: q_sw, D_exp });
        });
    }
    // form changes
    // required: q_start, q_end, start_idx, end_idx, duration, D_eff, b, target_D_eff_sw
    // segmentParent: q_start, start_idx, end_idx, duration
    // here: q_end, D_eff, b, target_D_eff_sw
    changeQEnd(newQEnd, target = 'D_eff') {
        const { start_idx, q_start, end_idx, b, target_D_eff_sw, sw_idx, q_sw, D, D_exp } = this.segment;
        switch (target) {
            case 'D_eff': {
                const newD = (0, helper_1.arpsModifiedGetD)({ q_start, q_end: newQEnd, b, start_idx, end_idx, target_D_eff_sw });
                if (newD === null) {
                    throw Error('Failed to change q Final.');
                }
                const newDeff = (0, helper_1.arpsD2Deff)(newD, b);
                const { realized_D_eff_sw, sw_idx: newSwIdx, D_exp: newDExp, D_exp_eff, } = (0, helper_1.arpsModifiedSwitch)({
                    b,
                    D: newD,
                    target_D_eff_sw,
                    start_idx,
                });
                const newQSw = (0, helper_1.predArps)({ t: newSwIdx, start_idx, q_start, D: newD, b });
                return {
                    ...this.segment,
                    D: newD,
                    D_eff: newDeff,
                    realized_D_eff_sw,
                    sw_idx: newSwIdx,
                    q_sw: newQSw,
                    q_end: newQEnd,
                    D_exp: newDExp,
                    D_exp_eff,
                };
            }
            case 'end_idx': {
                const newEndIdx = Math.floor(newQEnd > q_sw
                    ? (0, helper_1.arpsGetEndIdxFromQend)({ start_idx, q_start, D, b, q_end: newQEnd })
                    : (0, helper_1.expGetEndIdxFromQend)({ start_idx: sw_idx, q_start: q_sw, D: D_exp, q_end: newQEnd }));
                const adjustedNewQEnd = (0, helper_1.predArpsModified)({
                    t: newEndIdx,
                    start_idx,
                    q_start,
                    D,
                    b,
                    sw_idx,
                    q_sw,
                    D_exp,
                });
                return {
                    ...this.segment,
                    end_idx: newEndIdx,
                    q_end: adjustedNewQEnd,
                };
            }
            default: {
                return this.segment;
            }
        }
    }
    changeDeff(newDeff) {
        const { q_start, start_idx, end_idx, b, target_D_eff_sw } = this.segment;
        const newD = (0, helper_1.arpsDeff2D)(newDeff, b);
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D: newD,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D: newD, b });
        const newQEnd = (0, helper_1.predArpsModified)({ t: end_idx, start_idx, q_start, D: newD, b, sw_idx, q_sw, D_exp });
        return {
            ...this.segment,
            D: newD,
            D_eff: newDeff,
            realized_D_eff_sw,
            sw_idx,
            q_sw,
            q_end: newQEnd,
            D_exp,
            D_exp_eff,
        };
    }
    changeB(newB) {
        const { q_start, start_idx, end_idx, D_eff, target_D_eff_sw } = this.segment;
        const newD = (0, helper_1.arpsDeff2D)(D_eff, newB);
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b: newB,
            D: newD,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D: newD, b: newB });
        const newQEnd = (0, helper_1.predArpsModified)({ t: end_idx, start_idx, q_start, D: newD, b: newB, sw_idx, q_sw, D_exp });
        return {
            ...this.segment,
            b: newB,
            D: newD,
            realized_D_eff_sw,
            sw_idx,
            q_sw,
            q_end: newQEnd,
            D_exp,
            D_exp_eff,
        };
    }
    changeTargetDeffSw(newTargetDeffSw) {
        const { q_start, start_idx, end_idx, D, b } = this.segment;
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw: newTargetDeffSw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D, b });
        const newQEnd = (0, helper_1.predArpsModified)({ t: end_idx, start_idx, q_start, D, b, sw_idx, q_sw, D_exp });
        return {
            ...this.segment,
            realized_D_eff_sw,
            target_D_eff_sw: newTargetDeffSw,
            sw_idx,
            q_sw,
            q_end: newQEnd,
            D_exp,
            D_exp_eff,
        };
    }
    // buttons
    // required: qFinal, connects, anchors, matchSlope
    // segmentParent: connects
    // here: qFinal, anchors, matchSlope
    buttonQFinal(qFinalDict, prodInfo, firstSegment) {
        const { q_start, start_idx, D, b, q_sw, sw_idx, D_exp } = this.segment;
        const { q_final: qFinal = null, well_life_dict: wellLifeDict } = qFinalDict;
        const wellLifeEndIdx = (0, helper_1.getWellLifeIdx)(prodInfo, wellLifeDict, firstSegment);
        const wellLifeValid = wellLifeEndIdx >= start_idx;
        const qFinalValid = qFinal <= q_start;
        if (!wellLifeValid && !qFinalValid) {
            throw Error(`Modified Arps: Target q Final is larger than the q Start of last segment.` +
                ` And calculated well life is before the start date of last segment.`);
        }
        let qFinalEndIdx;
        if (qFinalValid) {
            if (qFinal > q_sw) {
                qFinalEndIdx = Math.floor((0, helper_1.arpsGetEndIdxFromQend)({ start_idx, q_start, D, b, q_end: qFinal }));
            }
            else {
                qFinalEndIdx = Math.floor((0, helper_1.expGetEndIdxFromQend)({ start_idx: sw_idx, q_start: q_sw, D: D_exp, q_end: qFinal }));
            }
        }
        else {
            qFinalEndIdx = helper_1.DEFAULT_WELL_LIFE_IDX;
        }
        let newEndIdx;
        if (qFinalValid && wellLifeValid) {
            newEndIdx = Math.min(wellLifeEndIdx, qFinalEndIdx);
        }
        else if (qFinalValid && !wellLifeValid) {
            newEndIdx = qFinalEndIdx;
        }
        else {
            newEndIdx = wellLifeEndIdx;
        }
        if (newEndIdx > this.dateIdxLarge) {
            throw Error('New well life is too large! Provide a smaller well life or larger q Final.');
        }
        const newQEnd = newEndIdx < sw_idx
            ? (0, helper_1.predArps)({ t: newEndIdx, start_idx, q_start, D, b })
            : (0, helper_1.predExp)({ t: newEndIdx, start_idx: sw_idx, q_start: q_sw, D_exp });
        if (newQEnd < this.numericSmall) {
            throw Error('New q Final is too small! Provide a smaller well life or a larger q Final');
        }
        return {
            ...this.segment,
            end_idx: newEndIdx,
            q_end: newQEnd,
        };
    }
    // anchor
    buttonAnchorPrev(prevSegment) {
        const { q_end: prevQEnd } = prevSegment;
        const { start_idx, end_idx, q_end, b, target_D_eff_sw } = this.segment;
        const newD = (0, helper_1.arpsModifiedGetD)({ q_start: prevQEnd, q_end, b, start_idx, end_idx, target_D_eff_sw });
        if (newD === null) {
            throw Error('Failed to anchor to previous segment.');
        }
        const newDeff = (0, helper_1.arpsD2Deff)(newD, b);
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D: newD,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start: prevQEnd, D: newD, b });
        return {
            ...this.segment,
            q_start: prevQEnd,
            D: newD,
            D_eff: newDeff,
            realized_D_eff_sw,
            sw_idx,
            q_sw,
            D_exp,
            D_exp_eff,
        };
    }
    buttonAnchorNext(nextSegment) {
        const { q_start: nextQStart } = nextSegment;
        return this.changeQEnd(nextQStart);
    }
    // match firstDerivative
    buttonMatchSlope(prevSegmentObject) {
        const toMatchDerivative = prevSegmentObject.firstDerivative([prevSegmentObject.segment.end_idx])[0];
        const { q_end: toMatchQStart } = prevSegmentObject.segment;
        const { b, target_D_eff_sw, start_idx, end_idx } = this.segment;
        const newD = (0, helper_1.arpsGetDFromFirstDerivative)({ q_start: toMatchQStart, first_derivative: toMatchDerivative });
        const newDeff = (0, helper_1.arpsD2Deff)(newD, b);
        const { realized_D_eff_sw, sw_idx, D_exp, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D: newD,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start: toMatchQStart, D: newD, b });
        const newQEnd = (0, helper_1.predArpsModified)({
            t: end_idx,
            start_idx,
            q_start: toMatchQStart,
            D: newD,
            b,
            sw_idx,
            q_sw,
            D_exp,
        });
        return {
            ...this.segment,
            q_start: toMatchQStart,
            D: newD,
            D_eff: newDeff,
            q_sw,
            sw_idx,
            realized_D_eff_sw,
            D_exp,
            D_exp_eff,
            q_end: newQEnd,
        };
    }
    calcQStart({ start_idx, end_idx, q_end, D_eff, b, target_D_eff_sw }) {
        const D = (0, helper_1.arpsDeff2D)(D_eff, b);
        const { sw_idx, D_exp, realized_D_eff_sw, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw,
            start_idx,
        });
        const newQStart = (0, helper_1.arpsModifiedGetQStart)({ D, b, start_idx, end_idx, q_end, sw_idx, D_exp });
        const q_sw = end_idx > sw_idx
            ? (0, helper_1.expGetQStart)({ D_exp, start_idx: sw_idx, end_idx, q_end })
            : (0, helper_1.predArps)({ t: sw_idx, start_idx, newQStart, D, b });
        if (newQStart > this.numericLarge) {
            throw Error('New q Start is too large!');
        }
        return {
            ...this.segment,
            start_idx,
            end_idx,
            q_end,
            D_eff,
            D,
            b,
            sw_idx,
            q_sw,
            D_exp,
            realized_D_eff_sw,
            target_D_eff_sw,
            D_exp_eff,
            q_start: newQStart,
        };
    }
    calcEndIdx({ start_idx, q_start, q_end, D_eff, b, target_D_eff_sw }) {
        const D = (0, helper_1.arpsDeff2D)(D_eff, b);
        const { sw_idx, D_exp, realized_D_eff_sw, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D, b });
        const newEndIdx = (0, helper_1.arpsModifiedGetEndIdxFromQend)({ start_idx, q_start, D, b, q_end, sw_idx, D_exp, q_sw });
        if (newEndIdx > this.dateIdxLarge) {
            throw Error('New End Date is too large!');
        }
        return {
            ...this.segment,
            start_idx,
            q_start,
            q_end,
            D_eff,
            D,
            b,
            target_D_eff_sw,
            sw_idx,
            q_sw,
            D_exp,
            realized_D_eff_sw,
            D_exp_eff,
            end_idx: Math.round(newEndIdx),
        };
    }
    calcQEnd({ start_idx, end_idx, q_start, D_eff, b, target_D_eff_sw }) {
        const D = (0, helper_1.arpsDeff2D)(D_eff, b);
        const { sw_idx, D_exp, realized_D_eff_sw, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D, b });
        let newQEnd;
        if (end_idx > sw_idx) {
            newQEnd = (0, helper_1.predExp)({ t: end_idx, start_idx: sw_idx, q_start: q_sw, D_exp });
        }
        else {
            newQEnd = (0, helper_1.predArps)({ t: end_idx, start_idx, q_start, D, b });
        }
        if (newQEnd > this.numericLarge) {
            throw Error('New q End is too large!');
        }
        else if (newQEnd < this.numericSmall) {
            throw Error('New q end is too small!');
        }
        return {
            ...this.segment,
            start_idx,
            end_idx,
            q_start,
            D_eff,
            D,
            b,
            target_D_eff_sw,
            sw_idx,
            q_sw,
            D_exp,
            realized_D_eff_sw,
            D_exp_eff,
            q_end: newQEnd,
        };
    }
    calcDeff({ start_idx, end_idx, q_start, q_end, b, target_D_eff_sw }) {
        const D = (0, helper_1.arpsModifiedGetD)({ q_start, q_end, b, start_idx, end_idx, target_D_eff_sw });
        if (D === null) {
            throw Error('New Di Eff-Sec is out of the range 1%-99%');
        }
        const D_eff = (0, helper_1.arpsD2Deff)(D, b);
        const { sw_idx, D_exp, realized_D_eff_sw, D_exp_eff } = (0, helper_1.arpsModifiedSwitch)({
            b,
            D,
            target_D_eff_sw,
            start_idx,
        });
        const q_sw = (0, helper_1.predArps)({ t: sw_idx, start_idx, q_start, D, b });
        if (D_eff > helper_1.DEFAULT_MAX_D_EFF) {
            throw Error('New Di Eff-Sec is too large!');
        }
        else if (D_eff < 0.01) {
            throw Error('New Di Eff-Sec is too small!');
        }
        return {
            ...this.segment,
            start_idx,
            end_idx,
            q_start,
            q_end,
            b,
            target_D_eff_sw,
            D_eff,
            D,
            sw_idx,
            q_sw,
            D_exp,
            realized_D_eff_sw,
            D_exp_eff,
        };
    }
}
exports.default = ArpsModifiedSegment;
