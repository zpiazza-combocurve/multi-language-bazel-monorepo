import { test } from '@jest/globals';

import ArpsSegment from './arps';

describe('SegmentModels-ArpsSegment', () => {
	const arps1 = new ArpsSegment({
		end_idx: 42327,
		name: 'arps',
		start_idx: 40502,
		b: 0.9,
		D: 0.002634621592740482,
		D_eff: 0.5,
		q_start: 1105.4215017407485,
		slope: -1,
		q_end: 172.3025724018102,
	});
	const arps2 = new ArpsSegment({
		end_idx: 44153,
		name: 'arps',
		start_idx: 42328,
		b: 0.9,
		D: 0.002634621592740482,
		D_eff: 0.5,
		q_start: 1052.6412320166744,
		slope: -1,
		q_end: 164.07568679193344,
	});

	test('ArpsSegment-changeQStart', () => {
		expect(arps1.changeQStart(2000).q_start).toBeCloseTo(2000);
		expect(arps1.changeQStart(2000).q_end).toBeCloseTo(arps1.segment.q_end * (2000 / arps1.segment.q_start));
	});

	test('ArpsSegment-changeQEnd', () => {
		expect(arps1.changeQEnd(500).D).toBeCloseTo(0.0006345315453652729);
		expect(arps1.changeQEnd(500).D_eff).toBeCloseTo(0.1898222028795894);
	});

	test('ArpsSegment-changeEndIdx', () => {
		expect(arps1.changeEndIdx(44327).end_idx).toBe(44327);
		expect(arps1.changeEndIdx(44327).q_end).toBeCloseTo(84.93091857427302);
	});

	test('ArpsSegment-changeDuration', () => {
		expect(arps1.changeDuration(44327 - arps1.segment.start_idx + 1).end_idx).toBe(44327);
		expect(arps1.changeDuration(44327 - arps1.segment.start_idx + 1).q_end).toBeCloseTo(84.93091857427302);
	});

	test('ArpsSegment-changeDeff', () => {
		expect(arps1.changeDeff(0.3).D_eff).toBe(0.3);
		expect(arps1.changeDeff(0.3).D).toBeCloseTo(0.0011514665759256766);
		expect(arps1.changeDeff(0.3).q_end).toBeCloseTo(339.78552513);
	});

	test('ArpsSegment-changeB', () => {
		expect(arps1.changeB(1.1).b).toBe(1.1);
		expect(arps1.changeB(1.1).D).toBeCloseTo(0.002846237135393158);
		expect(arps1.changeB(1.1).q_end).toBeCloseTo(195.76597681);
	});

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsSegment-buttonQFinal', () => {
	// 	expect(arps1.buttonQFinal(2.0).end_idx).toBe(164041);
	// 	expect(arps1.buttonQFinal(2.0).q_end).toBeCloseTo(2);
	// });

	test('ArpsSegment-buttonConnectPrev', () => {
		expect(arps2.buttonConnectPrev(arps1.segment).q_start).toBe(arps1.segment.q_end);
		expect(arps2.buttonConnectPrev(arps1.segment).q_end).toBeCloseTo(
			(arps2.segment.q_end * arps1.segment.q_end) / arps2.segment.q_start
		);
	});

	test('ArpsSegment-buttonConnectNext', () => {
		expect(arps1.buttonConnectNext(arps2.segment).q_end).toBe(arps2.segment.q_start);
		expect(arps1.buttonConnectNext(arps2.segment).q_start).toBeCloseTo(
			(arps1.segment.q_start * arps2.segment.q_start) / arps1.segment.q_end
		);
	});

	test('ArpsSegment-buttonAnchorPrev', () => {
		expect(arps2.buttonAnchorPrev(arps1.segment).q_start).toBe(arps1.segment.q_end);
		expect(arps2.buttonAnchorPrev(arps1.segment).D).toBeCloseTo(2.7406763575548234e-5);
		expect(arps2.buttonAnchorPrev(arps1.segment).D_eff).toBeCloseTo(0.00991600546156568);
	});

	test('ArpsSegment-buttonAnchorNext', () => {
		expect(arps1.buttonAnchorNext(arps2.segment).q_end).toBe(arps2.segment.q_start);
		expect(arps1.buttonAnchorNext(arps2.segment).D).toBeCloseTo(2.7406763575548234e-5);
		expect(arps1.buttonAnchorNext(arps2.segment).D_eff).toBeCloseTo(0.00991600546156568);
	});

	test('ArpsSegment-buttonMatchSlope', () => {
		expect(arps2.buttonMatchSlope(arps1).q_start).toBe(arps1.segment.q_end);
		expect(arps2.buttonMatchSlope(arps1).D).toBeCloseTo(0.0004945448856934746);
		expect(arps2.buttonMatchSlope(arps1).D_eff).toBeCloseTo(0.154112899865548);
	});

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsSegment-calcQStart', () => {
	// 	expect(
	// 		arps1.calcQStart({
	// 			start_idx: 40502,
	// 			end_idx: 42327,
	// 			q_start: 1105.4215017407485,
	// 			q_end: 172.3025724018102,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).q_start
	// 	).toBeCloseTo(1105.4215017407485);
	// 	expect(
	// 		arps2.calcQStart({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 2332.301779425153,
	// 			q_end: 74456.82327023758,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).q_start
	// 	).toBeCloseTo(1052.6412320166744);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsSegment-calcEndIdx', () => {
	// 	expect(
	// 		arps1.calcEndIdx({
	// 			start_idx: 40502,
	// 			end_idx: 42327,
	// 			q_start: 1105.4215017407485,
	// 			q_end: 172.3025724018102,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).end_idx
	// 	).toBeCloseTo(42327);
	// 	expect(
	// 		arps2.calcEndIdx({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 2332.301779425153,
	// 			q_end: 74456.82327023758,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).end_idx
	// 	).toBeCloseTo(44153);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsSegment-calcQEnd', () => {
	// 	expect(
	// 		arps1.calcQEnd({
	// 			start_idx: 40502,
	// 			end_idx: 42327,
	// 			q_start: 1105.4215017407485,
	// 			q_end: 172.3025724018102,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).q_end
	// 	).toBeCloseTo(172.3025724018102);
	// 	expect(
	// 		arps2.calcQEnd({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 2332.301779425153,
	// 			q_end: 74456.82327023758,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).q_end
	// 	).toBeCloseTo(164.07568679193344);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsSegment-calcDeff', () => {
	// 	expect(
	// 		arps1.calcDeff({
	// 			start_idx: 40502,
	// 			end_idx: 42327,
	// 			q_start: 1105.4215017407485,
	// 			q_end: 172.3025724018102,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).D_eff
	// 	).toBeCloseTo(0.5);
	// 	expect(
	// 		arps2.calcDeff({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 2332.301779425153,
	// 			q_end: 74456.82327023758,
	// 			b: 0.9,
	// 			D_eff: 0.5,
	// 		}).D_eff
	// 	).toBeCloseTo(0.5);
	// });
});
