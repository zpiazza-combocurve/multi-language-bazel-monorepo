"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helpers/helper");
const segmentParent_1 = __importDefault(require("./segmentParent"));
class LinearSegment extends segmentParent_1.default {
    /**
     * @param {any} segment
     * @param {boolean} relativeTime
     */
    constructor(segment = null, relativeTime = false) {
        super(segment, relativeTime);
        this.type = 'linear';
    }
    // shifted from forecastChartHelper
    generateSegmentParameter(segIn) {
        const { end_idx, start_idx, q_start, k } = segIn;
        const qStartValid = this.numericSmall <= q_start && q_start <= this.numericLarge;
        const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
        const isValid = this.checkValidInput('q_end', { end_idx, start_idx, q_start, k }) && qStartValid && startIdxValid;
        if (!isValid) {
            const defaultStartIdx = startIdxValid ? start_idx : end_idx;
            const defaultQStart = 100;
            const defaultQEnd = 50;
            const defaultK = (0, helper_1.linearGetK)({
                end_idx,
                start_idx: defaultStartIdx,
                q_start: defaultQStart,
                q_end: defaultQEnd,
            });
            const defaultSlope = (0, helper_1.linearK2Slope)({ k: defaultK });
            return {
                start_idx: defaultStartIdx,
                q_start: defaultQStart,
                end_idx,
                q_end: defaultQEnd,
                k: defaultK,
                D_eff: (0, helper_1.linearK2Deff)({ k: defaultK, q_start: defaultQStart }),
                slope: defaultSlope,
                name: this.type,
            };
        }
        const D_eff = (0, helper_1.linearK2Deff)({ k, q_start });
        const thisSlope = (0, helper_1.linearK2Slope)({ k });
        return {
            start_idx,
            q_start,
            end_idx,
            q_end: (0, helper_1.predLinear)({ t: end_idx, start_idx, q_start, k }),
            k,
            D_eff,
            slope: thisSlope,
            name: this.type,
        };
    }
    getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
        let startIdxMin;
        let startIdxMax;
        let endIdxMin;
        let endIdxMax;
        let qStartMin;
        let qStartMax;
        let qEndMin;
        let qEndMax;
        let kMin;
        let kMax;
        switch (toBeCalculatedParam) {
            case 'end_idx': {
                if (segment.q_start < segment.q_end) {
                    kMin = (0, helper_1.linearGetK)({ ...segment, end_idx: this.dateIdxLarge });
                    kMax = (0, helper_1.linearGetK)({ ...segment, end_idx: segment.start_idx + 1 });
                }
                else if (segment.q_start === segment.q_end) {
                    kMin = -this.numericLarge;
                    kMax = this.numericLarge;
                }
                else {
                    kMin = (0, helper_1.linearGetK)({ ...segment, end_idx: segment.start_idx + 1 });
                    kMax = (0, helper_1.linearGetK)({ ...segment, end_idx: this.dateIdxLarge });
                }
                if (segment.k < 0) {
                    startIdxMax = (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, end_idx: this.dateIdxLarge });
                    qStartMin = segment.q_end;
                    qStartMax = Math.min(this.numericLarge, (0, helper_1.linearGetQStart)({ ...segment, end_idx: this.dateIdxLarge }));
                    qEndMin = Math.max(this.numericSmall, (0, helper_1.predLinear)({ ...segment, t: this.dateIdxLarge }));
                    qEndMax = segment.q_start;
                }
                else if (segment.k === 0) {
                    startIdxMax = this.dateIdxLarge;
                    qStartMin = qStartMax = qEndMin = qEndMax = segment.q_start;
                }
                else {
                    startIdxMax = (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, end_idx: this.dateIdxLarge });
                    qStartMin = Math.max(this.numericSmall, (0, helper_1.linearGetQStart)({ ...segment, end_idx: this.dateIdxLarge }));
                    qStartMax = segment.q_end;
                    qEndMin = segment.q_start;
                    qEndMax = Math.min(this.numericLarge, (0, helper_1.predLinear)({ ...segment, t: this.dateIdxLarge }));
                }
                return {
                    start_idx: [this.dateIdxSmall, startIdxMax],
                    end_idx: [this.dateIdxSmall, this.dateIdxLarge],
                    duration: [1, this.dateIdxLarge],
                    q_start: [qStartMin, qStartMax],
                    q_end: [qEndMin, qEndMax],
                    k: [kMin, kMax],
                };
            }
            case 'q_start': {
                if (segment.start_idx === segment.end_idx) {
                    kMin = -this.numericLarge;
                    kMax = this.numericLarge;
                }
                else {
                    kMin =
                        segment.q_end === this.numericLarge
                            ? 0
                            : (0, helper_1.linearGetK)({ ...segment, q_start: this.numericLarge });
                    kMax =
                        segment.q_end === this.numericSmall
                            ? 0
                            : (0, helper_1.linearGetK)({ ...segment, q_start: this.numericSmall });
                }
                if (segment.k < 0) {
                    startIdxMin = Math.max(this.dateIdxSmall, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, q_start: this.numericLarge }));
                    endIdxMax = Math.min(this.dateIdxLarge, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, q_start: this.numericLarge }));
                    qEndMin = this.numericSmall;
                    qEndMax = Math.max(this.numericSmall, Math.min(this.numericLarge, (0, helper_1.predLinear)({ ...segment, t: segment.end_idx, q_start: this.numericLarge })));
                }
                else if (segment.k === 0) {
                    startIdxMin = this.dateIdxSmall;
                    endIdxMax = this.dateIdxLarge;
                    qEndMin = this.numericSmall;
                    qEndMax = this.numericLarge;
                }
                else {
                    startIdxMin = Math.max(this.dateIdxSmall, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, q_start: this.numericSmall }));
                    endIdxMax = Math.min(this.dateIdxLarge, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, q_start: this.numericSmall }));
                    qEndMin = Math.min(this.numericLarge, Math.max(this.numericSmall, (0, helper_1.predLinear)({ ...segment, q_start: this.numericSmall, t: segment.end_idx })));
                    qEndMax = this.numericLarge;
                }
                startIdxMin = Math.min(segment.end_idx, startIdxMin);
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(segment.start_idx, endIdxMax);
                return {
                    start_idx: [startIdxMin, startIdxMax],
                    end_idx: [endIdxMin, endIdxMax],
                    duration: [endIdxMin - segment.start_idx + 1, endIdxMax - segment.start_idx + 1],
                    q_start: [this.numericSmall, this.numericLarge],
                    q_end: [qEndMin, qEndMax],
                    k: [kMin, kMax],
                };
            }
            case 'q_end':
                if (segment.start_idx === segment.end_idx) {
                    kMin = -this.numericLarge;
                    kMax = this.numericLarge;
                }
                else {
                    kMin =
                        segment.q_start === this.numericSmall
                            ? 0
                            : (0, helper_1.linearGetK)({ ...segment, q_end: this.numericSmall });
                    kMax =
                        segment.q_start === this.numericLarge
                            ? 0
                            : (0, helper_1.linearGetK)({ ...segment, q_end: this.numericLarge });
                }
                if (segment.k < 0) {
                    startIdxMin = Math.max(this.dateIdxSmall, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, q_end: this.numericSmall }));
                    endIdxMax = Math.min(this.dateIdxLarge, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, q_end: this.numericSmall }));
                    qStartMin = Math.max(this.numericSmall, Math.min(this.numericLarge, (0, helper_1.linearGetQStart)({ ...segment, q_end: this.numericSmall })));
                    qStartMax = this.numericLarge;
                }
                else if (segment.k === 0) {
                    startIdxMin = this.dateIdxSmall;
                    endIdxMax = this.dateIdxLarge;
                    qStartMin = this.numericSmall;
                    qStartMax = this.numericLarge;
                }
                else {
                    startIdxMin = Math.max(this.dateIdxSmall, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, q_end: this.numericLarge }));
                    endIdxMax = Math.min(this.dateIdxLarge, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, q_end: this.numericLarge }));
                    qStartMin = this.numericSmall;
                    qStartMax = Math.min(this.numericLarge, Math.max(this.numericSmall, (0, helper_1.linearGetQStart)({ ...segment, q_end: this.numericLarge })));
                }
                startIdxMin = Math.min(segment.end_idx, startIdxMin);
                startIdxMax = segment.end_idx;
                endIdxMin = segment.start_idx;
                endIdxMax = Math.max(segment.start_idx, endIdxMax);
                return {
                    start_idx: [startIdxMin, startIdxMax],
                    end_idx: [endIdxMin, endIdxMax],
                    duration: [endIdxMin - segment.start_idx + 1, endIdxMax - segment.start_idx + 1],
                    q_start: [qStartMin, qStartMax],
                    q_end: [this.numericSmall, this.numericLarge],
                    k: [kMin, kMax],
                };
            case 'k': {
                if (segment.q_start > segment.q_end) {
                    startIdxMax = Math.max(this.dateIdxSmall, Math.min(segment.end_idx, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, k: -this.numericLarge })));
                    endIdxMin = Math.min(this.dateIdxLarge, Math.max(segment.start_idx, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, k: -this.numericLarge })));
                }
                else if (segment.q_start === segment.q_end) {
                    startIdxMax = segment.end_idx;
                    endIdxMin = segment.start_idx;
                }
                else {
                    startIdxMax = Math.max(this.dateIdxSmall, Math.min(segment.end_idx, (0, helper_1.linearGetStartIdxFromQstart)({ ...segment, k: this.numericLarge })));
                    endIdxMin = Math.min(this.dateIdxLarge, Math.max(segment.start_idx, (0, helper_1.linearGetEndIdxFromQend)({ ...segment, k: this.numericLarge })));
                }
                if (segment.start_idx === segment.end_idx) {
                    qStartMin = qStartMax = segment.q_end;
                    qEndMin = qEndMax = segment.q_start;
                }
                else {
                    qStartMin = Math.min(this.numericLarge, Math.max(this.numericSmall, (0, helper_1.linearGetQStart)({ ...segment, k: this.numericLarge })));
                    qStartMax = Math.max(this.numericSmall, Math.min(this.numericLarge, (0, helper_1.linearGetQStart)({ ...segment, k: -this.numericLarge })));
                    qEndMin = Math.min(this.numericLarge, Math.max(this.numericSmall, (0, helper_1.predLinear)({ ...segment, t: segment.end_idx, k: -this.numericLarge })));
                    qEndMax = Math.max(this.numericSmall, Math.min(this.numericLarge, (0, helper_1.predLinear)({ ...segment, t: segment.end_idx, k: this.numericLarge })));
                }
                startIdxMin = this.dateIdxSmall;
                endIdxMax = this.dateIdxLarge;
                return {
                    start_idx: [startIdxMin, startIdxMax],
                    end_idx: [endIdxMin, endIdxMax],
                    duration: [endIdxMin - segment.start_idx + 1, endIdxMax - segment.start_idx + 1],
                    q_start: [qStartMin, qStartMax],
                    q_end: [qEndMin, qEndMax],
                    k: [-this.numericLarge, this.numericLarge],
                };
            }
            default:
                return this.getCalcRange({ segment });
        }
    }
    predict(idxArr) {
        const { start_idx, q_start, k } = this.segment;
        return idxArr.map((t) => (0, helper_1.predLinear)({ t, start_idx, q_start, k }));
    }
    integral(left_idx, right_idx) {
        const { k, q_start, start_idx } = this.segment;
        if (k === 0) {
            return q_start * (right_idx - left_idx);
        }
        return (0.5 * k * (right_idx * right_idx - left_idx * left_idx) + (q_start - k * start_idx) * (right_idx - left_idx));
    }
    inverseIntegral(integral, left_idx) {
        const { k, q_start, start_idx } = this.segment;
        if (k === 0) {
            return integral / q_start + left_idx;
        }
        return (start_idx -
            q_start / k +
            Math.sqrt(start_idx * start_idx -
                (2 * start_idx * q_start) / k +
                (q_start * q_start) / (k * k) +
                left_idx * left_idx -
                2 * left_idx * start_idx +
                (2 * left_idx * q_start) / k +
                (2 * integral) / k));
    }
    firstDerivative(idxArr) {
        const { k } = this.segment;
        return idxArr.map(() => k);
    }
    // form changes
    // required: q_start, q_end, start_idx, end_idx, duration, D_eff, b
    // segmentParent: q_start, start_idx, end_idx, duration
    // here: q_end, D_eff, b
    // warning: target_D_Eff_sw
    changeQEnd(newQEnd, target = 'D_eff') {
        const { start_idx, q_start, end_idx, k } = this.segment;
        switch (target) {
            case 'D_eff': {
                const newK = (0, helper_1.linearGetK)({ end_idx, start_idx, q_start, q_end: newQEnd });
                const newSlope = (0, helper_1.getSlope)({ q_start, q_end: newQEnd });
                const newDeff = (0, helper_1.linearK2Deff)({ k: newK, q_start });
                return {
                    ...this.segment,
                    slope: newSlope,
                    k: newK,
                    D_eff: newDeff,
                    q_end: newQEnd,
                };
            }
            case 'end_idx': {
                const newEndIdx = Math.floor((0, helper_1.linearGetEndIdxFromQend)({ start_idx, q_start, k, q_end: newQEnd }));
                const adjustedNewQEnd = (0, helper_1.predLinear)({ t: newEndIdx, start_idx, q_start, k });
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
        const { q_start, start_idx, end_idx } = this.segment;
        const newK = (0, helper_1.linearDeff2K)({ D_eff: newDeff, q_start });
        const newSlope = (0, helper_1.linearK2Slope)({ k: newK });
        return {
            ...this.segment,
            slope: newSlope,
            k: newK,
            D_eff: newDeff,
            q_end: (0, helper_1.predLinear)({ t: end_idx, start_idx, q_start, k: newK }),
        };
    }
    changeK(newK) {
        const { q_start, start_idx, end_idx } = this.segment;
        const newDeff = (0, helper_1.linearK2Deff)({ k: newK, q_start });
        const newSlope = (0, helper_1.linearK2Slope)({ k: newK });
        return {
            ...this.segment,
            slope: newSlope,
            k: newK,
            D_eff: newDeff,
            q_end: (0, helper_1.predLinear)({ t: end_idx, start_idx, q_start, k: newK }),
        };
    }
    // eslint-disable-next-line class-methods-use-this
    changeB() {
        throw Error('Linear segment does not have b parameter');
    }
    // eslint-disable-next-line class-methods-use-this
    changeTargetDeffSw() {
        throw Error('Linear segment does have target D-eff Sec parameter');
    }
    // buttons
    // required: qFinal, connects, anchors, matchSlope
    // segmentParent: connects
    // here: qFinal, anchors, matchSlope
    buttonQFinal(qFinalDict, prodInfo, firstSegment) {
        const { q_start, start_idx, k } = this.segment;
        const { q_final: qFinal = null, well_life_dict: wellLifeDict } = qFinalDict;
        const wellLifeEndIdx = (0, helper_1.getWellLifeIdx)(prodInfo, wellLifeDict, firstSegment);
        const wellLifeValid = wellLifeEndIdx >= start_idx;
        if (k === 0) {
            if (!wellLifeValid) {
                throw Error(`Flat: Calculated well life is before the start date of last segment.`);
            }
            if (wellLifeValid > this.dateIdxLarge) {
                throw Error('New well life is too large! Provide a smaller well life.');
            }
            return { ...this.segment, end_idx: wellLifeEndIdx };
        }
        const qFinalValid = (qFinal < q_start && k < 0) || (qFinal > q_start && k > 0);
        if (!wellLifeValid && !qFinalValid) {
            if (qFinal > q_start) {
                throw Error(`Linear: Target q Final is larger than the q Start of last segment.` +
                    ` And calculated well life is before the start date of last segment.`);
            }
            else {
                throw Error(`Linear: Target q Final is smaller than or equal to the q Start of last segment.` +
                    ` And calculated well life is before the start date of last segment.`);
            }
        }
        const qFinalEndIdx = qFinalValid ? Math.floor((qFinal - q_start) / k + start_idx) : helper_1.DEFAULT_WELL_LIFE_IDX;
        let newEndIdx;
        if (qFinalValid && wellLifeValid) {
            newEndIdx = Math.min(wellLifeEndIdx, qFinalEndIdx);
        }
        else if (qFinalValid && !wellLifeValid) {
            newEndIdx = k !== 0 ? qFinalEndIdx : helper_1.DEFAULT_WELL_LIFE_IDX;
        }
        else {
            newEndIdx = wellLifeEndIdx;
        }
        if (newEndIdx > this.dateIdxLarge) {
            throw Error(`New well life is too large! Provide a smaller well life or ${k > 0 ? 'smaller' : 'larger'} qFinal.`);
        }
        const newQEnd = (0, helper_1.predLinear)({ t: newEndIdx, start_idx, q_start, k });
        if (newQEnd < this.numericSmall) {
            throw Error('New q Final is too small! Provide a smaller well life or a larger q Final');
        }
        if (newQEnd > this.numericLarge) {
            throw Error('New q Final is too large! Provide a smaller well life or a smaller q Final');
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
        const { start_idx, end_idx, q_end: curQEnd } = this.segment;
        const newK = curQEnd === prevQEnd ? 0 : (0, helper_1.linearGetK)({ end_idx, start_idx, q_start: prevQEnd, q_end: curQEnd });
        const newDeff = (0, helper_1.linearK2Deff)({ k: newK, q_start: prevQEnd });
        return {
            ...this.segment,
            q_start: prevQEnd,
            k: newK,
            D_eff: newDeff,
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
        const { start_idx, end_idx } = this.segment;
        const newK = toMatchDerivative;
        const newDeff = (0, helper_1.linearK2Deff)({ k: newK, q_start: toMatchQStart });
        return {
            ...this.segment,
            q_start: toMatchQStart,
            q_end: (0, helper_1.predLinear)({ t: end_idx, start_idx, q_start: toMatchQStart, k: newK }),
            k: newK,
            D_eff: newDeff,
        };
    }
    calcQStart({ start_idx, end_idx, q_end, k }) {
        const new_q_start = (0, helper_1.predLinear)({ t: start_idx, start_idx: end_idx, q_start: q_end, k });
        if (new_q_start > this.numericLarge) {
            throw Error('New q Start is too large!');
        }
        else if (new_q_start < this.numericSmall) {
            throw Error('New q Start is too small!');
        }
        return {
            ...this.segment,
            q_start: new_q_start,
            start_idx,
            end_idx,
            q_end,
            k,
            D_eff: (0, helper_1.linearK2Deff)({ k, q_start: new_q_start }),
        };
    }
    // If k === 0, let's leave end_idx fixed, or peg it to start_idx when start_idx exceeds it.
    calcEndIdx({ start_idx, q_start, q_end, k }) {
        let new_end_idx;
        if (k === 0) {
            new_end_idx = start_idx > this.segment.end_idx ? start_idx : this.segment.end_idx;
        }
        else {
            new_end_idx = Math.floor((0, helper_1.linearGetEndIdxFromQend)({ start_idx, q_start, k, q_end }));
        }
        if (new_end_idx > this.dateIdxLarge) {
            throw Error('New End Date is too large!');
        }
        return {
            ...this.segment,
            end_idx: new_end_idx,
            start_idx,
            q_start,
            q_end,
            k,
            D_eff: (0, helper_1.linearK2Deff)({ k, q_start }),
        };
    }
    calcQEnd({ start_idx, end_idx, q_start, k }) {
        const new_q_end = (0, helper_1.predLinear)({ t: end_idx, start_idx, q_start, k });
        if (new_q_end > this.numericLarge) {
            throw Error('New q End is too large!');
        }
        else if (new_q_end < this.numericSmall) {
            throw Error('New q End is too small!');
        }
        return {
            ...this.segment,
            q_end: new_q_end,
            start_idx,
            end_idx,
            q_start,
            k,
            D_eff: (0, helper_1.linearK2Deff)({ k, q_start }),
        };
    }
    calcK({ start_idx, end_idx, q_start, q_end }) {
        const new_k = start_idx === end_idx ? this.segment.k : (0, helper_1.linearGetK)({ end_idx, start_idx, q_start, q_end });
        if (Math.abs(new_k) > this.numericLarge) {
            throw Error('New Slope is too large in absolute value!');
        }
        return {
            ...this.segment,
            k: new_k,
            start_idx,
            end_idx,
            q_start,
            q_end,
            D_eff: (0, helper_1.linearK2Deff)({ k: new_k, q_start }),
        };
    }
}
exports.default = LinearSegment;
