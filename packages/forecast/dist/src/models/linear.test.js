"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const linear_1 = __importDefault(require("./linear"));
describe('SegmentModels-LinearSegment', () => {
    const linearSegment1 = new linear_1.default({
        end_idx: 41541,
        name: 'linear',
        start_idx: 39716,
        D_eff: -0.20013698630136986,
        q_start: 500,
        k: 0.273972602739726,
        slope: 1,
        q_end: 1000,
    });
    const linearSegment2 = new linear_1.default({
        end_idx: 43367,
        name: 'linear',
        start_idx: 41542,
        D_eff: 0.10006849315068493,
        q_start: 2000,
        k: -0.547945205479452,
        slope: -1,
        q_end: 1000,
    });
    test('LinearSegment-changeQStart', () => {
        expect(linearSegment1.changeQStart(2000).q_start).toBeCloseTo(2000);
        expect(linearSegment1.changeQStart(2000).q_end).toBeCloseTo(linearSegment1.segment.q_end + (2000 - linearSegment1.segment.q_start));
    });
    test('LinearSegment-changeQEnd', () => {
        expect(linearSegment1.changeQEnd(800).k).toBeCloseTo(0.1643835616438356);
        expect(linearSegment1.changeQEnd(800).D_eff).toBeCloseTo(-0.12008219178082191);
    });
    test('LinearSegment-changeEndIdx', () => {
        expect(linearSegment1.changeEndIdx(44327).end_idx).toBe(44327);
        expect(linearSegment1.changeEndIdx(44327).q_end).toBeCloseTo(1763.2876712328766);
    });
    test('LinearSegment-changeDuration', () => {
        expect(linearSegment1.changeDuration(44327 - linearSegment1.segment.start_idx + 1).end_idx).toBe(44327);
        expect(linearSegment1.changeDuration(44327 - linearSegment1.segment.start_idx + 1).q_end).toBeCloseTo(1763.2876712328766);
    });
    test('LinearSegment-changeDeff', () => {
        expect(linearSegment1.changeDeff(-0.3).D_eff).toBe(-0.3);
        expect(linearSegment1.changeDeff(-0.3).k).toBeCloseTo(0.4106776180698152);
        expect(linearSegment1.changeDeff(-0.3).q_end).toBeCloseTo(1249.4866529774126);
    });
    // test('LinearSegment-buttonQFinal', () => {
    // 	expect(linearSegment1.buttonQFinal(500).end_idx).toBe(41283);
    // 	expect(linearSegment1.buttonQFinal(500).q_end).toBeCloseTo(499.5941157023195);
    // });
    test('LinearSegment-buttonConnectPrev', () => {
        expect(linearSegment2.buttonConnectPrev(linearSegment1.segment).q_start).toBeCloseTo(linearSegment1.segment.q_end);
        expect(linearSegment2.buttonConnectPrev(linearSegment1.segment).q_end).toBeCloseTo(linearSegment2.segment.q_end + linearSegment1.segment.q_end - linearSegment2.segment.q_start);
    });
    test('LinearSegment-buttonConnectNext', () => {
        expect(linearSegment1.buttonConnectNext(linearSegment2.segment).q_end).toBe(linearSegment2.segment.q_start);
        expect(linearSegment1.buttonConnectNext(linearSegment2.segment).q_start).toBeCloseTo(linearSegment1.segment.q_start + linearSegment2.segment.q_start - linearSegment1.segment.q_end);
    });
    test('LinearSegment-buttonAnchorPrev', () => {
        expect(linearSegment2.buttonAnchorPrev(linearSegment1.segment).q_start).toBe(linearSegment1.segment.q_end);
        expect(linearSegment2.buttonAnchorPrev(linearSegment1.segment).k).toBeCloseTo(0);
        expect(linearSegment2.buttonAnchorPrev(linearSegment1.segment).D_eff).toBeCloseTo(0);
    });
    test('LinearSegment-buttonAnchorNext', () => {
        expect(linearSegment1.buttonAnchorNext(linearSegment2.segment).q_end).toBe(linearSegment2.segment.q_start);
        expect(linearSegment1.buttonAnchorNext(linearSegment2.segment).k).toBeCloseTo(0.821917808219178);
        expect(linearSegment1.buttonAnchorNext(linearSegment2.segment).D_eff).toBeCloseTo(-0.6004109589041096);
    });
    test('LinearSegment-buttonMatchSlope', () => {
        expect(linearSegment2.buttonMatchSlope(linearSegment1).q_start).toBe(linearSegment1.segment.q_end);
        expect(linearSegment2.buttonMatchSlope(linearSegment1).k).toBeCloseTo(0.273972602739726);
        expect(linearSegment2.buttonMatchSlope(linearSegment1).D_eff).toBeCloseTo(-0.10006849315068493);
        expect(linearSegment2.buttonMatchSlope(linearSegment1).q_end).toBeCloseTo(1500);
    });
    test('LinearSegment-calcQStart', () => {
        expect(linearSegment1.calcQStart({
            start_idx: 39716,
            end_idx: 41541,
            q_end: 1000,
            k: 0.273972602739726,
        }).q_start).toBeCloseTo(500);
        expect(linearSegment2.calcQStart({
            start_idx: 41542,
            end_idx: 43367,
            q_end: 1000,
            k: -0.547945205479452,
        }).q_start).toBeCloseTo(2000);
    });
    test('LinearSegment-calcEndIdx', () => {
        expect(linearSegment1.calcEndIdx({
            start_idx: 39716,
            q_start: 500,
            q_end: 1000,
            k: 0.273972602739726,
        }).end_idx).toBeCloseTo(41541);
        expect(linearSegment2.calcEndIdx({
            start_idx: 41542,
            q_start: 2000,
            q_end: 1000,
            k: -0.547945205479452,
        }).end_idx).toBeCloseTo(43367);
    });
    test('LinearSegment-calcQEnd', () => {
        expect(linearSegment1.calcQEnd({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 500,
            k: 0.273972602739726,
        }).q_end).toBeCloseTo(1000);
        expect(linearSegment2.calcQEnd({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2000,
            k: -0.547945205479452,
        }).q_end).toBeCloseTo(1000);
    });
    test('LinearSegment-calcK', () => {
        expect(linearSegment1.calcK({
            start_idx: 39716,
            end_idx: 41541,
            q_start: 500,
            q_end: 1000,
        }).k).toBeCloseTo(0.273972602739726);
        expect(linearSegment2.calcK({
            start_idx: 41542,
            end_idx: 43367,
            q_start: 2000,
            q_end: 1000,
        }).k).toBeCloseTo(-0.547945205479452);
    });
});
