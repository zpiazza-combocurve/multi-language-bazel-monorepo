"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expInc_1 = __importDefault(require("./expInc"));
describe('SegmentModels-ExpIncSegment', () => {
    const expIncSegment1 = new expInc_1.default({
        end_idx: 41541,
        name: 'exp_inc',
        start_idx: 39716,
        D: -0.001,
        D_eff: -0.44087418167106884,
        q_start: 104.25043154224356,
        slope: 1,
        q_end: 646.6440575097611,
    });
    const expIncSegment2 = new expInc_1.default({
        end_idx: 43367,
        name: 'exp_inc',
        start_idx: 41542,
        D: -0.0018977335538944429,
        D_eff: -1,
        q_start: 2332.301779425153,
        slope: 1,
        q_end: 74456.82327023758,
    });
    test('ExpIncSegment-changeQStart', () => {
        expect(expIncSegment1.changeQStart(2000).q_start).toBeCloseTo(2000);
        expect(expIncSegment1.changeQStart(2000).q_end).toBeCloseTo(expIncSegment1.segment.q_end * (2000 / expIncSegment1.segment.q_start));
    });
    test('ExpIncSegment-changeQEnd', () => {
        expect(expIncSegment1.changeQEnd(800).D).toBeCloseTo(-0.0011166113575362417);
        expect(expIncSegment1.changeQEnd(800).D_eff).toBeCloseTo(-0.5035700269833632);
    });
    test('ExpIncSegment-changeEndIdx', () => {
        expect(expIncSegment1.changeEndIdx(44327).end_idx).toBe(44327);
        expect(expIncSegment1.changeEndIdx(44327).q_end).toBeCloseTo(10485.99671821605);
    });
    test('ExpIncSegment-changeDuration', () => {
        expect(expIncSegment1.changeDuration(44327 - expIncSegment1.segment.start_idx + 1).end_idx).toBe(44327);
        expect(expIncSegment1.changeDuration(44327 - expIncSegment1.segment.start_idx + 1).q_end).toBeCloseTo(10485.99671821605);
    });
    test('ExpIncSegment-changeDeff', () => {
        expect(expIncSegment1.changeDeff(-0.3).D_eff).toBe(-0.3);
        expect(expIncSegment1.changeDeff(-0.3).D).toBeCloseTo(-0.0007183142079876552);
        expect(expIncSegment1.changeDeff(-0.3).q_end).toBeCloseTo(386.72715933109714);
    });
    // test('ExpIncSegment-buttonQFinal', () => {
    // 	expect(expIncSegment1.buttonQFinal(500).end_idx).toBe(41283);
    // 	expect(expIncSegment1.buttonQFinal(500).q_end).toBeCloseTo(499.5941157023195);
    // });
    test('ExpIncSegment-buttonConnectPrev', () => {
        expect(expIncSegment2.buttonConnectPrev(expIncSegment1.segment).q_start).toBeCloseTo(expIncSegment1.segment.q_end);
        expect(expIncSegment2.buttonConnectPrev(expIncSegment1.segment).q_end).toBeCloseTo((expIncSegment2.segment.q_end * expIncSegment1.segment.q_end) / expIncSegment2.segment.q_start);
    });
    test('ExpIncSegment-buttonConnectNext', () => {
        expect(expIncSegment1.buttonConnectNext(expIncSegment2.segment).q_end).toBe(expIncSegment2.segment.q_start);
        expect(expIncSegment1.buttonConnectNext(expIncSegment2.segment).q_start).toBeCloseTo((expIncSegment1.segment.q_start * expIncSegment2.segment.q_start) / expIncSegment1.segment.q_end);
    });
    test('ExpIncSegment-buttonAnchorPrev', () => {
        expect(expIncSegment2.buttonAnchorPrev(expIncSegment1.segment).q_start).toBe(expIncSegment1.segment.q_end);
        expect(expIncSegment2.buttonAnchorPrev(expIncSegment1.segment).D).toBeCloseTo(-0.0026006458535768415);
        expect(expIncSegment2.buttonAnchorPrev(expIncSegment1.segment).D_eff).toBeCloseTo(-1.5854146415526515);
    });
    test('ExpIncSegment-buttonAnchorNext', () => {
        expect(expIncSegment1.buttonAnchorNext(expIncSegment2.segment).q_end).toBe(expIncSegment2.segment.q_start);
        expect(expIncSegment1.buttonAnchorNext(expIncSegment2.segment).D).toBeCloseTo(-0.001702912299682399);
        expect(expIncSegment1.buttonAnchorNext(expIncSegment2.segment).D_eff).toBeCloseTo(-0.8626286029637884);
    });
    test('ExpIncSegment-buttonMatchSlope', () => {
        expect(expIncSegment2.buttonMatchSlope(expIncSegment1).q_start).toBe(expIncSegment1.segment.q_end);
        expect(expIncSegment2.buttonMatchSlope(expIncSegment1).D).toBeCloseTo(-0.001);
        expect(expIncSegment2.buttonMatchSlope(expIncSegment1).D_eff).toBeCloseTo(-0.44087418167106884);
        expect(expIncSegment2.buttonMatchSlope(expIncSegment1).q_end).toBeCloseTo(4011.000539055306);
    });
    test('ExpIncSegment-calcQStart', () => {
        expect(expIncSegment1.calcQStart({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 104.25043154224356,
            q_end: 646.6440575097611,
            D_eff: -0.44087418167106884,
        }).q_start).toBeCloseTo(104.25043154224356);
        expect(expIncSegment2.calcQStart({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2332.301779425153,
            q_end: 74456.82327023758,
            D_eff: -1,
        }).q_start).toBeCloseTo(2332.301779425153);
    });
    test('ExpIncSegment-calcEndIdx', () => {
        expect(expIncSegment1.calcEndIdx({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 104.25043154224356,
            q_end: 646.6440575097611,
            D_eff: -0.44087418167106884,
        }).end_idx).toBeCloseTo(41541);
        expect(expIncSegment2.calcEndIdx({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2332.301779425153,
            q_end: 74456.82327023758,
            D_eff: -1,
        }).end_idx).toBeCloseTo(43367);
    });
    test('ExpIncSegment-calcQEnd', () => {
        expect(expIncSegment1.calcQEnd({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 104.25043154224356,
            q_end: 646.6440575097611,
            D_eff: -0.44087418167106884,
        }).q_end).toBeCloseTo(646.6440575097611);
        expect(expIncSegment2.calcQEnd({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2332.301779425153,
            q_end: 74456.82327023758,
            D_eff: -1,
        }).q_end).toBeCloseTo(74456.82327023758);
    });
    test('ExpIncSegment-calcDeff', () => {
        expect(expIncSegment1.calcDeff({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 104.25043154224356,
            q_end: 646.6440575097611,
            D_eff: -0.44087418167106884,
        }).D_eff).toBeCloseTo(-0.44087418167106884);
        expect(expIncSegment2.calcDeff({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2332.301779425153,
            q_end: 74456.82327023758,
            D_eff: -1,
        }).D_eff).toBeCloseTo(-1);
    });
});
