import FlatSegment from './flat';

describe('SegmentModels-FlatSegment', () => {
	const flatSeg = new FlatSegment({
		end_idx: 44153,
		name: 'flat',
		start_idx: 42328,
		q_start: 100,
		slope: 0,
		q_end: 100,
		c: 100,
	});

	test('FlatSegment-changeQStart', () => {
		expect(flatSeg.changeQStart(300).q_start).toBe(300);
		expect(flatSeg.changeQStart(300).q_end).toBe(300);
		expect(flatSeg.changeQStart(300).c).toBe(300);
	});

	test('FlatSegment-changeEndIdx', () => {
		expect(flatSeg.changeEndIdx(44327).end_idx).toBe(44327);
		expect(flatSeg.changeEndIdx(44327).q_end).toBe(100);
	});

	test('FlatSegment-changeDuration', () => {
		expect(flatSeg.changeDuration(44327 - flatSeg.segment.start_idx + 1).end_idx).toBe(44327);
		expect(flatSeg.changeDuration(44327 - flatSeg.segment.start_idx + 1).q_end).toBe(100);
	});

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('FlatSegment-buttonQFinal', () => {
	// 	expect(flatSeg.buttonQFinal(2.0).end_idx).toBe(flatSeg.segment.end_idx);
	// 	expect(flatSeg.buttonQFinal(2.0).name).toBe(flatSeg.segment.name);
	// 	expect(flatSeg.buttonQFinal(2.0).start_idx).toBe(flatSeg.segment.start_idx);
	// 	expect(flatSeg.buttonQFinal(2.0).q_start).toBe(flatSeg.segment.q_start);
	// 	expect(flatSeg.buttonQFinal(2.0).slope).toBe(flatSeg.segment.slope);
	// 	expect(flatSeg.buttonQFinal(2.0).q_end).toBe(flatSeg.segment.q_end);
	// 	expect(flatSeg.buttonQFinal(2.0).c).toBe(flatSeg.segment.c);
	// });

	test('FlatSegment-buttonConnectPrev', () => {
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).end_idx).toBe(flatSeg.segment.end_idx);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).name).toBe(flatSeg.segment.name);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).start_idx).toBe(flatSeg.segment.start_idx);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).q_start).toBe(300);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).slope).toBe(flatSeg.segment.slope);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).q_end).toBe(300);
		expect(flatSeg.buttonConnectPrev({ q_end: 300 }).c).toBe(300);
	});

	test('FlatSegment-buttonConnectNext', () => {
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).end_idx).toBe(flatSeg.segment.end_idx);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).name).toBe(flatSeg.segment.name);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).start_idx).toBe(flatSeg.segment.start_idx);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).q_start).toBe(300);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).slope).toBe(flatSeg.segment.slope);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).q_end).toBe(300);
		expect(flatSeg.buttonConnectNext({ q_start: 300 }).c).toBe(300);
	});

	test('FlatSegment-buttonAnchorPrev', () => {
		expect(flatSeg.buttonAnchorPrev(2.0).end_idx).toBe(flatSeg.segment.end_idx);
		expect(flatSeg.buttonAnchorPrev(2.0).name).toBe(flatSeg.segment.name);
		expect(flatSeg.buttonAnchorPrev(2.0).start_idx).toBe(flatSeg.segment.start_idx);
		expect(flatSeg.buttonAnchorPrev(2.0).q_start).toBe(flatSeg.segment.q_start);
		expect(flatSeg.buttonAnchorPrev(2.0).slope).toBe(flatSeg.segment.slope);
		expect(flatSeg.buttonAnchorPrev(2.0).q_end).toBe(flatSeg.segment.q_end);
		expect(flatSeg.buttonAnchorPrev(2.0).c).toBe(flatSeg.segment.c);
	});

	test('FlatSegment-buttonAnchorNext', () => {
		expect(flatSeg.buttonAnchorNext(2.0).end_idx).toBe(flatSeg.segment.end_idx);
		expect(flatSeg.buttonAnchorNext(2.0).name).toBe(flatSeg.segment.name);
		expect(flatSeg.buttonAnchorNext(2.0).start_idx).toBe(flatSeg.segment.start_idx);
		expect(flatSeg.buttonAnchorNext(2.0).q_start).toBe(flatSeg.segment.q_start);
		expect(flatSeg.buttonAnchorNext(2.0).slope).toBe(flatSeg.segment.slope);
		expect(flatSeg.buttonAnchorNext(2.0).q_end).toBe(flatSeg.segment.q_end);
		expect(flatSeg.buttonAnchorNext(2.0).c).toBe(flatSeg.segment.c);
	});

	test('FlatSegment-buttonMatchSlope', () => {
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).end_idx).toBe(flatSeg.segment.end_idx);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).name).toBe(flatSeg.segment.name);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).start_idx).toBe(flatSeg.segment.start_idx);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).q_start).toBe(300);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).slope).toBe(flatSeg.segment.slope);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).q_end).toBe(300);
		expect(flatSeg.buttonMatchSlope({ segment: { q_end: 300 } }).c).toBe(300);
	});
});
