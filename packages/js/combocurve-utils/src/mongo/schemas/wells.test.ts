import { getGeoHash } from './wells';

describe('getGeoHash', () => {
	it.each([
		[-95.72349866, 29.92641169, '9v7fjzbmbz6p'],
		[-96.4210781, 30.1866043, '9v77tzk3dnch'],
		[-96.3363044, 30.2389115, '9v7kpbf43msv'],
		[100, 80, 'ynpp5e9cbbuk'],
		[-96.4610796, 30.1360507, '9v77kyp5jzjb'],
		[-96.4838582, 30.1032742, '9v77k2ns71hc'],
		[-96.3221862, 30.2063255, '9v7eb4ukd7hq'],
		[-96.1860705, 30.3885346, '9v7sghp6n17t'],
		[-96.3984485, 30.1888469, '9v77wrsyc2fy'],
		[-96.3389789, 30.3123105, '9v7kry0n504x'],
	])('getGeoHash(%i, %i) == %s', (a, b, expected) => {
		expect(getGeoHash({ location: { coordinates: [a, b] } })).toBe(expected);
	});
});
