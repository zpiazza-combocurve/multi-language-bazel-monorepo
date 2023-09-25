"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arps_1 = __importDefault(require("./arps"));
const expDec_1 = __importDefault(require("./expDec"));
describe('SegmentModels-ExpDecSegment', () => {
    const arpsSegment = new arps_1.default({
        end_idx: 43367,
        name: 'arps',
        start_idx: 41542,
        b: 0.9,
        D: 0.0075509993252247205,
        D_eff: 0.75,
        q_start: 500.5150255563849,
        slope: -1,
        q_end: 27.98902983774715,
    });
    const expDecSegment0 = new expDec_1.default({
        end_idx: 43367,
        name: 'exp_dec',
        start_idx: 41542,
        D: 0.0011794193459067877,
        D_eff: 0.35,
        q_start: 100,
        slope: -1,
        q_end: 11.620024730691494,
    });
    const expDecSegment = new expDec_1.default({
        end_idx: 45193,
        name: 'exp_dec',
        start_idx: 43368,
        D: 0.003296297890009407,
        D_eff: 0.7,
        q_start: 4.290542865400525,
        slope: -1,
        q_end: 0.010469066869520068,
    });
    test('ExpDecSegment-changeQStart', () => {
        expect(expDecSegment.changeQStart(2000).q_start).toBeCloseTo(2000);
        expect(expDecSegment.changeQStart(2000).q_end).toBeCloseTo(expDecSegment.segment.q_end * (2000 / expDecSegment.segment.q_start));
    });
    test('ExpDecSegment-changeQEnd', () => {
        expect(expDecSegment.changeQEnd(1.1).D).toBeCloseTo(0.0007458099107842384);
        expect(expDecSegment.changeQEnd(1.1).D_eff).toBeCloseTo(0.23845580374534692);
    });
    test('ExpDecSegment-changeEndIdx', () => {
        expect(expDecSegment.changeEndIdx(44327).end_idx).toBe(44327);
        expect(expDecSegment.changeEndIdx(44327).q_end).toBeCloseTo(0.18182030595876492);
    });
    test('ExpDecSegment-changeDuration', () => {
        expect(expDecSegment.changeDuration(44327 - expDecSegment.segment.start_idx + 1).end_idx).toBe(44327);
        expect(expDecSegment.changeDuration(44327 - expDecSegment.segment.start_idx + 1).q_end).toBeCloseTo(0.18182030595876492);
    });
    test('ExpDecSegment-changeDeff', () => {
        expect(expDecSegment.changeDeff(0.3).D_eff).toBe(0.3);
        expect(expDecSegment.changeDeff(0.3).D).toBeCloseTo(0.0009765227760129568);
        expect(expDecSegment.changeDeff(0.3).q_end).toBeCloseTo(0.7219923041355999);
    });
    // test('ExpDecSegment-buttonQFinal', () => {
    // 	expect(expDecSegment.buttonQFinal(0.5).end_idx).toBe(44020);
    // 	expect(expDecSegment.buttonQFinal(0.5).q_end).toBeCloseTo(0.5);
    // });
    test('ExpDecSegment-buttonConnectPrev', () => {
        expect(expDecSegment.buttonConnectPrev(arpsSegment.segment).q_start).toBe(arpsSegment.segment.q_end);
        expect(expDecSegment.buttonConnectPrev(arpsSegment.segment).q_end).toBeCloseTo((expDecSegment.segment.q_end * arpsSegment.segment.q_end) / expDecSegment.segment.q_start);
    });
    test('ExpDecSegment-buttonConnectNext', () => {
        expect(expDecSegment0.buttonConnectNext(expDecSegment.segment).q_end).toBe(expDecSegment.segment.q_start);
        expect(expDecSegment0.buttonConnectNext(expDecSegment.segment).q_start).toBeCloseTo((expDecSegment0.segment.q_start * expDecSegment.segment.q_start) / expDecSegment0.segment.q_end);
    });
    test('ExpDecSegment-buttonAnchorPrev', () => {
        expect(expDecSegment.buttonAnchorPrev(arpsSegment.segment).q_start).toBe(arpsSegment.segment.q_end);
        expect(expDecSegment.buttonAnchorPrev(arpsSegment.segment).D).toBeCloseTo(0.00432391398585065);
        expect(expDecSegment.buttonAnchorPrev(arpsSegment.segment).D_eff).toBeCloseTo(0.7938826440512048);
    });
    test('ExpDecSegment-buttonAnchorNext', () => {
        expect(expDecSegment0.buttonAnchorNext(expDecSegment.segment).q_end).toBe(expDecSegment.segment.q_start);
        expect(expDecSegment0.buttonAnchorNext(expDecSegment.segment).D).toBeCloseTo(0.0017253462569876885);
        expect(expDecSegment0.buttonAnchorNext(expDecSegment.segment).D_eff).toBeCloseTo(0.4675055054710391);
    });
    test('ExpDecSegment-buttonMatchSlope', () => {
        expect(expDecSegment.buttonMatchSlope(arpsSegment).q_start).toBe(arpsSegment.segment.q_end);
        expect(expDecSegment.buttonMatchSlope(arpsSegment).D).toBeCloseTo(0.0005634016109028092);
        expect(expDecSegment.buttonMatchSlope(arpsSegment).D_eff).toBeCloseTo(0.18598984561442478);
        expect(expDecSegment.buttonMatchSlope(arpsSegment).q_end).toBeCloseTo(10.010201289821257);
    });
    test('ExpDecSegment-calcQStart', () => {
        expect(expDecSegment0.calcQStart({ start_idx: 41542, end_idx: 43367, q_end: 11.620024730691494, D_eff: 0.35 })
            .q_start).toBeCloseTo(100);
        expect(expDecSegment.calcQStart({ start_idx: 43368, end_idx: 45193, q_end: 0.010469066869520068, D_eff: 0.7 })
            .q_start).toBeCloseTo(4.290542865400525);
    });
    test('ExpDecSegment-calcEndIdx', () => {
        expect(expDecSegment0.calcEndIdx({ start_idx: 41542, q_start: 100, q_end: 11.620024730691494, D_eff: 0.35 })
            .end_idx).toBeCloseTo(43367);
        expect(expDecSegment.calcEndIdx({
            start_idx: 43368,
            q_start: 4.290542865400525,
            q_end: 0.010469066869520068,
            D_eff: 0.7,
        }).end_idx).toBeCloseTo(45193);
    });
    test('ExpDecSegment-calcQEnd', () => {
        expect(expDecSegment0.calcQEnd({ start_idx: 41542, end_idx: 43367, q_start: 100, D_eff: 0.35 }).q_end).toBeCloseTo(11.620024730691494);
        expect(expDecSegment.calcQEnd({ start_idx: 43368, end_idx: 45193, q_start: 4.290542865400525, D_eff: 0.7 }).q_end).toBeCloseTo(0.010469066869520068);
    });
    test('ExpDecSegment-calcDeff', () => {
        expect(expDecSegment0.calcDeff({ start_idx: 41542, end_idx: 43367, q_start: 100, q_end: 11.620024730691494 }).D_eff).toBeCloseTo(0.35);
        expect(expDecSegment.calcDeff({
            start_idx: 43368,
            end_idx: 45193,
            q_start: 4.290542865400525,
            q_end: 0.010469066869520068,
        }).D_eff).toBeCloseTo(0.7);
    });
});
