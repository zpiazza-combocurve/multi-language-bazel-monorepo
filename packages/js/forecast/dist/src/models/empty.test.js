"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const empty_1 = __importDefault(require("./empty"));
describe('SegmentModels-EmptySegment', () => {
    const emptySeg = new empty_1.default({
        end_idx: 44153,
        name: 'empty',
        start_idx: 42328,
        q_start: 0,
        slope: 0,
        q_end: 0,
    });
    test('EmptySegment-changeEndIdx', () => {
        expect(emptySeg.changeEndIdx(44327).end_idx).toBe(44327);
        expect(emptySeg.changeEndIdx(44327).q_end).toBe(0);
    });
    test('EmptySegment-changeDuration', () => {
        expect(emptySeg.changeDuration(44327 - emptySeg.segment.start_idx + 1).end_idx).toBe(44327);
        expect(emptySeg.changeDuration(44327 - emptySeg.segment.start_idx + 1).q_end).toBe(0);
    });
    // test('EmptySegment-buttonQFinal', () => {
    // 	expect(emptySeg.buttonQFinal(2.0).end_idx).toBe(emptySeg.segment.end_idx);
    // 	expect(emptySeg.buttonQFinal(2.0).name).toBe(emptySeg.segment.name);
    // 	expect(emptySeg.buttonQFinal(2.0).start_idx).toBe(emptySeg.segment.start_idx);
    // 	expect(emptySeg.buttonQFinal(2.0).q_start).toBe(emptySeg.segment.q_start);
    // 	expect(emptySeg.buttonQFinal(2.0).slope).toBe(emptySeg.segment.slope);
    // 	expect(emptySeg.buttonQFinal(2.0).q_end).toBe(emptySeg.segment.q_end);
    // });
    test('EmptySegment-buttonConnectPrev', () => {
        expect(emptySeg.buttonConnectPrev(2.0).end_idx).toBe(emptySeg.segment.end_idx);
        expect(emptySeg.buttonConnectPrev(2.0).name).toBe(emptySeg.segment.name);
        expect(emptySeg.buttonConnectPrev(2.0).start_idx).toBe(emptySeg.segment.start_idx);
        expect(emptySeg.buttonConnectPrev(2.0).q_start).toBe(emptySeg.segment.q_start);
        expect(emptySeg.buttonConnectPrev(2.0).slope).toBe(emptySeg.segment.slope);
        expect(emptySeg.buttonConnectPrev(2.0).q_end).toBe(emptySeg.segment.q_end);
    });
    test('EmptySegment-buttonConnectNext', () => {
        expect(emptySeg.buttonConnectNext(2.0).end_idx).toBe(emptySeg.segment.end_idx);
        expect(emptySeg.buttonConnectNext(2.0).name).toBe(emptySeg.segment.name);
        expect(emptySeg.buttonConnectNext(2.0).start_idx).toBe(emptySeg.segment.start_idx);
        expect(emptySeg.buttonConnectNext(2.0).q_start).toBe(emptySeg.segment.q_start);
        expect(emptySeg.buttonConnectNext(2.0).slope).toBe(emptySeg.segment.slope);
        expect(emptySeg.buttonConnectNext(2.0).q_end).toBe(emptySeg.segment.q_end);
    });
    test('EmptySegment-buttonAnchorPrev', () => {
        expect(emptySeg.buttonAnchorPrev(2.0).end_idx).toBe(emptySeg.segment.end_idx);
        expect(emptySeg.buttonAnchorPrev(2.0).name).toBe(emptySeg.segment.name);
        expect(emptySeg.buttonAnchorPrev(2.0).start_idx).toBe(emptySeg.segment.start_idx);
        expect(emptySeg.buttonAnchorPrev(2.0).q_start).toBe(emptySeg.segment.q_start);
        expect(emptySeg.buttonAnchorPrev(2.0).slope).toBe(emptySeg.segment.slope);
        expect(emptySeg.buttonAnchorPrev(2.0).q_end).toBe(emptySeg.segment.q_end);
    });
    test('EmptySegment-buttonAnchorNext', () => {
        expect(emptySeg.buttonAnchorNext(2.0).end_idx).toBe(emptySeg.segment.end_idx);
        expect(emptySeg.buttonAnchorNext(2.0).name).toBe(emptySeg.segment.name);
        expect(emptySeg.buttonAnchorNext(2.0).start_idx).toBe(emptySeg.segment.start_idx);
        expect(emptySeg.buttonAnchorNext(2.0).q_start).toBe(emptySeg.segment.q_start);
        expect(emptySeg.buttonAnchorNext(2.0).slope).toBe(emptySeg.segment.slope);
        expect(emptySeg.buttonAnchorNext(2.0).q_end).toBe(emptySeg.segment.q_end);
    });
    test('EmptySegment-buttonMatchSlope', () => {
        expect(emptySeg.buttonMatchSlope(2.0).end_idx).toBe(emptySeg.segment.end_idx);
        expect(emptySeg.buttonMatchSlope(2.0).name).toBe(emptySeg.segment.name);
        expect(emptySeg.buttonMatchSlope(2.0).start_idx).toBe(emptySeg.segment.start_idx);
        expect(emptySeg.buttonMatchSlope(2.0).q_start).toBe(emptySeg.segment.q_start);
        expect(emptySeg.buttonMatchSlope(2.0).slope).toBe(emptySeg.segment.slope);
        expect(emptySeg.buttonMatchSlope(2.0).q_end).toBe(emptySeg.segment.q_end);
    });
});
