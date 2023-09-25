import ArpsModifiedSegment from './arpsModified';

describe('SegmentModels-ArpsModifiedSegment', () => {
	const arpsModified1 = new ArpsModifiedSegment({
		end_idx: 41541,
		name: 'arps_modified',
		start_idx: 39716,
		b: 1.2,
		D_eff: 0.7,
		D_exp_eff: 0.1642692837733597,
		D_exp: 0.0004913041137924118,
		D: 0.007394171697767069,
		q_start: 11610.343976473521,
		q_sw: 1212.1670596908082,
		realized_D_eff_sw: 0.1499999999999998,
		slope: -1,
		sw_idx: 41299.46462254695,
		target_D_eff_sw: 0.15,
		q_end: 1076.529446753029,
	});
	// const arpsModified2 = new ArpsModifiedSegment({
	// 	end_idx: 43367,
	// 	name: 'arps_modified',
	// 	start_idx: 41542,
	// 	b: 0.9,
	// 	D_eff: 0.3,
	// 	D_exp_eff: 0.08294697325587852,
	// 	D_exp: 0.00023707045056285483,
	// 	D: 0.0011514665759256766,
	// 	q_start: 647.2910249971006,
	// 	q_sw: 111.80517520914623,
	// 	realized_D_eff_sw: 0.07999999999999996,
	// 	slope: -1,
	// 	sw_idx: 45263.88634126455,
	// 	target_D_eff_sw: 0.08,
	// 	q_end: 198.9649382566774,
	// });

	test('ArpsModifiedSegment-changeQStart', () => {
		expect(arpsModified1.changeQStart(2000).q_start).toBeCloseTo(2000);
		expect(arpsModified1.changeQStart(2000).q_end).toBeCloseTo(
			arpsModified1.segment.q_end * (2000 / arpsModified1.segment.q_start)
		);
		expect(arpsModified1.changeQStart(2000).q_sw).toBeCloseTo(
			arpsModified1.segment.q_sw * (2000 / arpsModified1.segment.q_start)
		);
	});

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-changeQEnd', () => {
	// 	expect(arpsModified1.changeQEnd(500).D).toBeCloseTo(0.01933653425902262);
	// 	expect(arpsModified1.changeQEnd(500).D_eff).toBeCloseTo(0.8464760160000424);
	// 	expect(arpsModified1.changeQEnd(500).q_sw).toBeCloseTo(544.0701379720686);
	// 	expect(arpsModified1.changeQEnd(500).sw_idx).toBeCloseTo(41369.06968668247);
	// 	expect(arpsModified1.changeQEnd(500).D_exp).toBeCloseTo(0.0004913041137924124);
	// 	expect(arpsModified1.changeQEnd(500).D_exp_eff).toBeCloseTo(0.1642692837733598);
	// 	expect(arpsModified1.changeQEnd(500).realized_D_eff_sw).toBeCloseTo(0.15);
	// 	expect(arpsModified1.changeQEnd(500).q_end).toBeCloseTo(500);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-changeEndIdx', () => {
	// 	expect(arpsModified1.changeEndIdx(44327).end_idx).toBe(44327);
	// 	expect(arpsModified1.changeEndIdx(44327).q_end).toBeCloseTo(273.88940939);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-changeDuration', () => {
	// 	expect(arpsModified1.changeDuration(44327 - arpsModified1.segment.start_idx + 1).end_idx).toBe(44327);
	// 	expect(arpsModified1.changeDuration(44327 - arpsModified1.segment.start_idx + 1).q_end).toBeCloseTo(
	// 		273.88940939
	// 	);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-changeDeff', () => {
	// 	expect(arpsModified1.changeDeff(0.3).D).toBeCloseTo(0.0012188029196759538);
	// 	expect(arpsModified1.changeDeff(0.3).D_eff).toBeCloseTo(0.3);
	// 	expect(arpsModified1.changeDeff(0.3).q_sw).toBeCloseTo(5445.350621937514);
	// 	expect(arpsModified1.changeDeff(0.3).sw_idx).toBeCloseTo(40728.43500442125);
	// 	expect(arpsModified1.changeDeff(0.3).D_exp).toBeCloseTo(0.0004913041137924124);
	// 	expect(arpsModified1.changeDeff(0.3).D_exp_eff).toBeCloseTo(0.1642692837733598);
	// 	expect(arpsModified1.changeDeff(0.3).realized_D_eff_sw).toBeCloseTo(0.15);
	// 	expect(arpsModified1.changeDeff(0.3).q_end).toBeCloseTo(3652.98858375);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-changeB', () => {
	// 	expect(arpsModified1.changeB(0.3).b).toBeCloseTo(0.3);
	// 	expect(arpsModified1.changeB(0.3).D).toBeCloseTo(0.0039702371359018685);
	// 	expect(arpsModified1.changeB(0.3).D_eff).toBeCloseTo(0.7);
	// 	expect(arpsModified1.changeB(0.3).q_sw).toBeCloseTo(8.549419142291896);
	// 	expect(arpsModified1.changeB(0.3).sw_idx).toBeCloseTo(46186.7135503271);
	// 	expect(arpsModified1.changeB(0.3).D_exp).toBeCloseTo(0.00045597801540714583);
	// 	expect(arpsModified1.changeB(0.3).D_exp_eff).toBeCloseTo(0.15341610152881524);
	// 	expect(arpsModified1.changeB(0.3).realized_D_eff_sw).toBeCloseTo(0.15);
	// 	expect(arpsModified1.changeB(0.3).q_end).toBeCloseTo(247.1477398);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonQFinal', () => {
	// 	expect(arpsModified1.buttonQFinal(300).end_idx).toBe(44141);
	// 	expect(arpsModified1.buttonQFinal(300).q_end).toBeCloseTo(300.0973658188429);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonConnectPrev', () => {
	// 	expect(arpsModified2.buttonConnectPrev(arpsModified1.segment).q_start).toBe(arpsModified1.segment.q_end);
	// 	expect(arpsModified2.buttonConnectPrev(arpsModified1.segment).q_end).toBeCloseTo(
	// 		(arpsModified2.segment.q_end * arpsModified1.segment.q_end) / arpsModified2.segment.q_start
	// 	);
	// 	expect(arpsModified2.buttonConnectPrev(arpsModified1.segment).q_sw).toBeCloseTo(
	// 		(arpsModified2.segment.q_sw * arpsModified1.segment.q_end) / arpsModified2.segment.q_start
	// 	);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonConnectNext', () => {
	// 	expect(arpsModified1.buttonConnectNext(arpsModified2.segment).q_end).toBe(arpsModified2.segment.q_start);
	// 	expect(arpsModified1.buttonConnectNext(arpsModified2.segment).q_start).toBeCloseTo(
	// 		(arpsModified1.segment.q_start * arpsModified2.segment.q_start) / arpsModified1.segment.q_end
	// 	);
	// 	expect(arpsModified1.buttonConnectNext(arpsModified2.segment).q_sw).toBeCloseTo(
	// 		(arpsModified1.segment.q_sw * arpsModified2.segment.q_start) / arpsModified1.segment.q_end
	// 	);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonAnchorPrev', () => {
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).q_start).toBe(arpsModified1.segment.q_end);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).D).toBeCloseTo(0.0021735686827293772);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).D_eff).toBeCloseTo(0.45065466301506296);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).q_sw).toBeCloseTo(91.79271161406935);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).sw_idx).toBeCloseTo(45717.647240628896);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).D_exp).toBeCloseTo(0.00023707045056285496);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).D_exp_eff).toBeCloseTo(0.08294697325587863);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).realized_D_eff_sw).toBeCloseTo(0.08);
	// 	expect(arpsModified2.buttonAnchorPrev(arpsModified1.segment).q_end).toBeCloseTo(198.96493826);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonAnchorNext', () => {
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).q_start).toBe(arpsModified1.segment.q_start);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).D).toBeCloseTo(0.014049828293174601);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).D_eff).toBeCloseTo(0.8060581299176122);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).q_sw).toBeCloseTo(709.9774797746819);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).sw_idx).toBeCloseTo(41352.85329382378);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).D_exp).toBeCloseTo(0.0004913041137924124);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).D_exp_eff).toBeCloseTo(0.1642692837733598);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).realized_D_eff_sw).toBeCloseTo(0.15);
	// 	expect(arpsModified1.buttonAnchorNext(arpsModified2.segment).q_end).toBe(arpsModified2.segment.q_start);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-buttonMatchSlope', () => {
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).q_start).toBe(arpsModified1.segment.q_end);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).D).toBeCloseTo(0.0004913041137924119);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).D_eff).toBeCloseTo(0.1532508100290182);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).q_sw).toBeCloseTo(479.0592986346693);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).sw_idx).toBeCloseTo(43967.28466132267);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).D_exp).toBeCloseTo(0.00023707045056285496);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).D_exp_eff).toBeCloseTo(0.08294697325587863);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).realized_D_eff_sw).toBeCloseTo(0.08);
	// 	expect(arpsModified2.buttonMatchSlope(arpsModified1).q_end).toBeCloseTo(557.86056977);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-calcQStart', () => {
	// 	expect(
	// 		arpsModified1.calcQStart({
	// 			start_idx: 39716,
	// 			end_idx: 41541,
	// 			q_start: 11610.343976473521,
	// 			q_end: 1076.529446753029,
	// 			b: 1.2,
	// 			D_eff: 0.7,
	// 			realized_D_eff_sw: 0.1499999999999998,
	// 		}).q_start
	// 	).toBeCloseTo(11610.343976473521);
	// 	expect(
	// 		arpsModified2.calcQStart({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 647.2910249971006,
	// 			q_end: 198.9649382566774,
	// 			b: 0.9,
	// 			D_eff: 0.3,
	// 			realized_D_eff_sw: 0.07999999999999996,
	// 		}).q_start
	// 	).toBeCloseTo(647.2910249971006);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-calcEndIdx', () => {
	// 	expect(
	// 		arpsModified1.calcEndIdx({
	// 			start_idx: 39716,
	// 			end_idx: 41541,
	// 			q_start: 11610.343976473521,
	// 			q_end: 1076.529446753029,
	// 			b: 1.2,
	// 			D_eff: 0.7,
	// 			realized_D_eff_sw: 0.1499999999999998,
	// 		}).end_idx
	// 	).toBeCloseTo(41541);
	// 	expect(
	// 		arpsModified2.calcEndIdx({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 647.2910249971006,
	// 			q_end: 198.9649382566774,
	// 			b: 0.9,
	// 			D_eff: 0.3,
	// 			realized_D_eff_sw: 0.07999999999999996,
	// 		}).end_idx
	// 	).toBeCloseTo(43367);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-calcQEnd', () => {
	// 	expect(
	// 		arpsModified1.calcQEnd({
	// 			start_idx: 39716,
	// 			end_idx: 41541,
	// 			q_start: 11610.343976473521,
	// 			q_end: 1076.529446753029,
	// 			b: 1.2,
	// 			D_eff: 0.7,
	// 			realized_D_eff_sw: 0.1499999999999998,
	// 		}).q_end
	// 	).toBeCloseTo(1076.529446753029);
	// 	expect(
	// 		arpsModified2.calcQEnd({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 647.2910249971006,
	// 			q_end: 198.9649382566774,
	// 			b: 0.9,
	// 			D_eff: 0.3,
	// 			realized_D_eff_sw: 0.07999999999999996,
	// 		}).q_end
	// 	).toBeCloseTo(198.9649382566774);
	// });

	// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
	// test('ArpsModifiedSegment-calcDeff', () => {
	// 	expect(
	// 		arpsModified1.calcDeff({
	// 			start_idx: 39716,
	// 			end_idx: 41541,
	// 			q_start: 11610.343976473521,
	// 			q_end: 1076.529446753029,
	// 			b: 1.2,
	// 			D_eff: 0.7,
	// 			realized_D_eff_sw: 0.1499999999999998,
	// 		}).D_eff
	// 	).toBeCloseTo(0.7);
	// 	expect(
	// 		arpsModified2.calcDeff({
	// 			start_idx: 41542,
	// 			end_idx: 43367,
	// 			q_start: 647.2910249971006,
	// 			q_end: 198.9649382566774,
	// 			b: 0.9,
	// 			D_eff: 0.3,
	// 			realized_D_eff_sw: 0.07999999999999996,
	// 		}).D_eff
	// 	).toBeCloseTo(0.3);
	// });
});
