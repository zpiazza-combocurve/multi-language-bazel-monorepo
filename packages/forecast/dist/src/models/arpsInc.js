"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helpers/helper");
const arps_1 = __importDefault(require("./arps"));
class ArpsIncSegment extends arps_1.default {
    constructor(segment = null, relativeTime = false) {
        super(segment, relativeTime);
        this.type = 'arps_inc';
    }
    // Takes care of Inc/Dec default arps parameters in the invalid case.
    generateDefaultParameters({ start_idx, end_idx, startIdxValid }) {
        const defaultStartIdx = startIdxValid ? start_idx : end_idx;
        const defaultQStart = 50;
        const defaultQEnd = 100;
        const defaultB = -1.1;
        const defaultD = (0, helper_1.arpsGetD)({
            start_idx: defaultStartIdx,
            q_start: defaultQStart,
            end_idx,
            q_end: defaultQEnd,
            b: defaultB,
        });
        return { defaultStartIdx, defaultQStart, defaultQEnd, defaultB, defaultD };
    }
    getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
        const D = (0, helper_1.arpsDeff2D)(segment.D_eff, segment.b);
        let DeffMin;
        let DeffMax;
        let startIdxMin;
        let startIdxMax;
        let endIdxMin;
        let endIdxMax;
        switch (toBeCalculatedParam) {
            case 'end_idx': {
                if (segment.start_idx === segment.end_idx) {
                    DeffMin = -this.numericLarge;
                    DeffMax = -0.01;
                }
                else {
                    DeffMin = Math.min(-0.01, Math.max(-this.numericLarge, (0, helper_1.arpsD2Deff)((0, helper_1.arpsGetD)({ ...segment, end_idx: segment.start_idx + 1 }), segment.b)));
                    DeffMax = Math.max(-this.numericLarge, Math.min(-0.01, (0, helper_1.arpsD2Deff)((0, helper_1.arpsGetD)({ ...segment, end_idx: this.dateIdxLarge }), segment.b)));
                }
                return {
                    start_idx: [
                        Math.ceil(this.dateIdxSmall),
                        Math.floor(Math.max(this.dateIdxSmall, Math.min(this.dateIdxLarge, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, D, end_idx: this.dateIdxLarge })))),
                    ],
                    end_idx: [Math.ceil(this.dateIdxSmall), Math.floor(this.dateIdxLarge)],
                    duration: [1, this.dateIdxLarge],
                    q_start: [
                        Math.min(segment.q_end, Math.max(this.numericSmall, (0, helper_1.arpsGetQStart)({ ...segment, D, end_idx: this.dateIdxLarge }))),
                        segment.q_end,
                    ],
                    q_end: [
                        segment.q_start,
                        Math.max(segment.q_start, Math.min(this.numericLarge, (0, helper_1.predArps)({ ...segment, t: this.dateIdxLarge, D }))),
                    ],
                    D_eff: [DeffMin, DeffMax],
                    b: [-10, -0.01],
                };
            }
            case 'q_start': {
                DeffMin =
                    segment.start_idx === segment.end_idx
                        ? -this.numericLarge
                        : Math.min(-0.01, Math.max(-this.numericLarge, (0, helper_1.arpsD2Deff)((0, helper_1.arpsGetD)({ ...segment, q_start: this.numericSmall }), segment.b)));
                startIdxMin = Math.min(segment.end_idx, Math.max(this.dateIdxSmall, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, q_start: this.numericSmall, D })));
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(segment.start_idx, Math.min(this.dateIdxLarge, (0, helper_1.arpsGetEndIdxFromQend)({ ...segment, q_start: this.numericSmall, D })));
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [this.numericSmall, this.numericLarge],
                    q_end: [
                        Math.min(this.numericLarge, Math.max((0, helper_1.predArps)({
                            ...segment,
                            q_start: this.numericSmall,
                            t: segment.end_idx,
                            D,
                        }), this.numericSmall)),
                        this.numericLarge,
                    ],
                    D_eff: [DeffMin, -0.01],
                    b: [-10, -0.01], // Painful to get exact bounds for b. Throw error if end up < this.numericSmall
                };
            }
            case 'q_end': {
                DeffMin =
                    segment.start_idx === segment.end_idx
                        ? -this.numericLarge
                        : Math.min(-0.01, Math.max(-this.numericLarge, (0, helper_1.arpsD2Deff)((0, helper_1.arpsGetD)({ ...segment, q_end: this.numericLarge }), segment.b)));
                startIdxMin = Math.max(this.dateIdxSmall, Math.min(segment.end_idx, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, D, q_end: this.numericLarge })));
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(segment.start_idx, Math.min(this.dateIdxLarge, (0, helper_1.arpsGetEndIdxFromQend)({ ...segment, D, q_end: this.numericLarge })));
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [
                        this.numericSmall,
                        Math.max(this.numericSmall, Math.min(this.numericLarge, (0, helper_1.arpsGetQStart)({ ...segment, D, q_end: this.numericLarge }))),
                    ],
                    q_end: [this.numericSmall, this.numericLarge],
                    D_eff: [DeffMin, -0.01],
                    b: [-10, -0.01],
                };
            }
            case 'D_eff': {
                // Perturb the bounds by this.numericSmall to prevent validation errors down the road.
                const highD = (0, helper_1.arpsDeff2D)(-0.01 - this.numericSmall, segment.b);
                const lowD = (0, helper_1.arpsDeff2D)(-this.numericLarge + this.numericSmall, segment.b);
                const startEq = segment.q_start === segment.q_end ? segment.end_idx : segment.end_idx - 1;
                const endEq = segment.q_start === segment.q_end ? segment.start_idx : segment.start_idx + 1;
                startIdxMin = Math.min(startEq, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, D: lowD }), Math.max(this.dateIdxSmall, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, D: highD })));
                startIdxMax = Math.min(startEq, (0, helper_1.arpsGetStartIdxFromQstart)({ ...segment, D: lowD }));
                endIdxMin = Math.max(endEq, (0, helper_1.arpsGetEndIdxFromQend)({ ...segment, D: lowD }));
                endIdxMax = Math.max(endEq, (0, helper_1.arpsGetEndIdxFromQend)({ ...segment, D: lowD }), Math.min(this.dateIdxLarge, (0, helper_1.arpsGetEndIdxFromQend)({ ...segment, D: highD })));
                return {
                    start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
                    end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
                    duration: [
                        Math.ceil(endIdxMin - segment.start_idx + 1),
                        Math.floor(endIdxMax - segment.start_idx + 1),
                    ],
                    q_start: [
                        Math.min(segment.q_end, (0, helper_1.arpsGetQStart)({ ...segment, D: highD }), Math.max(this.numericSmall, (0, helper_1.arpsGetQStart)({ ...segment, D: lowD }))),
                        Math.min(segment.q_end, (0, helper_1.arpsGetQStart)({ ...segment, D: highD })),
                    ],
                    q_end: [
                        Math.max(segment.q_start, (0, helper_1.predArps)({ ...segment, t: segment.end_idx, D: highD })),
                        Math.max(segment.q_start, (0, helper_1.predArps)({ ...segment, t: segment.end_idx, D: highD }), Math.min(this.numericLarge, (0, helper_1.predArps)({ ...segment, t: segment.end_idx, D: lowD }))),
                    ],
                    D_eff: [-this.numericLarge, -0.01],
                    b: [-10, -0.01],
                };
            }
            default:
                return this.getCalcRange({ segment });
        }
    }
    calcDeff({ start_idx, end_idx, q_start, q_end, b }) {
        const D = start_idx === end_idx ? this.segment.D : (0, helper_1.arpsGetD)({ start_idx, q_start, end_idx, q_end, b });
        const new_D_eff = (0, helper_1.arpsD2Deff)(D, b);
        if (new_D_eff > -0.01 || new_D_eff < -this.numericLarge) {
            throw Error('New Di Eff-Sec is out of bounds!');
        }
        const ret = {
            ...this.segment,
            start_idx,
            end_idx,
            q_start,
            q_end,
            b,
            D_eff: new_D_eff,
            D,
        };
        return ret;
    }
    buttonQFinal(qFinalDict, prodInfo, firstSegment) {
        const { q_start, start_idx, D, b } = this.segment;
        const { q_final: qFinal = null, well_life_dict: wellLifeDict } = qFinalDict;
        const wellLifeEndIdx = (0, helper_1.getWellLifeIdx)(prodInfo, wellLifeDict, firstSegment);
        const wellLifeValid = wellLifeEndIdx >= start_idx;
        const qFinalValid = qFinal >= q_start;
        if (!wellLifeValid && !qFinalValid) {
            throw Error(`Arps: Target q Final is smaller than the q Start of last segment.` +
                ` And calculated well life is before the start date of last segment.`);
        }
        const qFinalEndIdx = qFinalValid
            ? Math.floor((0, helper_1.arpsGetEndIdxFromQend)({ start_idx, q_start, D, b, q_end: qFinal }))
            : helper_1.DEFAULT_WELL_LIFE_IDX;
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
            throw Error('New well life is too large! Provide a smaller well life or smaller q Final.');
        }
        const newQEnd = (0, helper_1.predArps)({ t: newEndIdx, start_idx, q_start, D, b });
        if (newQEnd > this.numericLarge) {
            throw Error('New q Final is too large! Provide a smaller well life or smaller q Final.');
        }
        return {
            ...this.segment,
            end_idx: newEndIdx,
            q_end: newQEnd,
        };
    }
}
exports.default = ArpsIncSegment;
