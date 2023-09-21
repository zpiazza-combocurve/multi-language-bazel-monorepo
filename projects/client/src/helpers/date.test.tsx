import { yearsToIndex } from './date';

describe('helpers/date', () => {
	test('yearsToIndex()', () => {
		expect(yearsToIndex(0)).toEqual(0);
		expect(yearsToIndex(1)).toEqual(365);
		expect(yearsToIndex(50)).toEqual(18263);
		expect(yearsToIndex(200)).toEqual(73050);
	});
});
