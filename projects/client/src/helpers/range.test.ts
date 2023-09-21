import { rangesHaveOverlap } from './range';

const empty = [undefined, undefined];
const bothPresent1 = [1, 10];
const onlyLower1 = [1, undefined];
const onlyUpper1 = [undefined, 10];
const bothPresent2 = [11, 20];
const onlyLower2 = [11, undefined];
const onlyUpper2 = [undefined, 20];
const bothPresent3 = [6, 15];
const onlyLower3 = [6, undefined];
const onlyUpper3 = [undefined, 15];

describe('helpers/range', () => {
	test('rangesHaveOverlap()', () => {
		expect(rangesHaveOverlap(empty[0], empty[1], empty[0], empty[1])).toEqual(true);

		expect(rangesHaveOverlap(empty[0], empty[1], onlyLower1[0], onlyLower1[1])).toEqual(false);
		expect(rangesHaveOverlap(onlyLower1[0], onlyLower1[1], empty[0], empty[1])).toEqual(false);

		expect(rangesHaveOverlap(empty[0], empty[1], onlyUpper1[0], onlyUpper1[1])).toEqual(false);
		expect(rangesHaveOverlap(onlyUpper1[0], onlyUpper1[1], empty[0], empty[1])).toEqual(false);

		expect(rangesHaveOverlap(empty[0], empty[1], bothPresent1[0], bothPresent1[1])).toEqual(false);
		expect(rangesHaveOverlap(bothPresent1[0], bothPresent1[1], empty[0], empty[1])).toEqual(false);

		expect(rangesHaveOverlap(bothPresent1[0], bothPresent1[1], bothPresent2[0], bothPresent2[1])).toEqual(false);
		expect(rangesHaveOverlap(bothPresent2[0], bothPresent2[1], bothPresent1[0], bothPresent1[1])).toEqual(false);

		expect(rangesHaveOverlap(onlyLower1[0], onlyLower1[1], onlyLower2[0], onlyLower2[1])).toEqual(true);
		expect(rangesHaveOverlap(onlyLower2[0], onlyLower2[1], onlyLower1[0], onlyLower1[1])).toEqual(true);

		expect(rangesHaveOverlap(onlyUpper1[0], onlyUpper1[1], onlyUpper2[0], onlyUpper2[1])).toEqual(true);
		expect(rangesHaveOverlap(onlyUpper2[0], onlyUpper2[1], onlyUpper1[0], onlyUpper1[1])).toEqual(true);

		expect(rangesHaveOverlap(bothPresent1[0], bothPresent1[1], bothPresent3[0], bothPresent3[1])).toEqual(true);
		expect(rangesHaveOverlap(bothPresent3[0], bothPresent3[1], bothPresent1[0], bothPresent1[1])).toEqual(true);

		expect(rangesHaveOverlap(bothPresent1[0], bothPresent1[1], onlyLower3[0], onlyLower3[1])).toEqual(true);
		expect(rangesHaveOverlap(onlyLower3[0], onlyLower3[1], bothPresent1[0], bothPresent1[1])).toEqual(true);

		expect(rangesHaveOverlap(bothPresent1[0], bothPresent1[1], onlyUpper3[0], onlyUpper3[1])).toEqual(true);
		expect(rangesHaveOverlap(onlyUpper3[0], onlyUpper3[1], bothPresent1[0], bothPresent1[1])).toEqual(true);

		expect(rangesHaveOverlap(onlyUpper1[0], onlyUpper1[1], onlyLower2[0], onlyLower2[1])).toEqual(false);
		expect(rangesHaveOverlap(onlyLower2[0], onlyLower2[1], onlyUpper1[0], onlyUpper1[1])).toEqual(false);

		expect(rangesHaveOverlap(onlyUpper2[0], onlyUpper2[1], onlyLower1[0], onlyLower1[1])).toEqual(true);
		expect(rangesHaveOverlap(onlyLower1[0], onlyLower1[1], onlyUpper2[0], onlyUpper2[1])).toEqual(true);

		expect(rangesHaveOverlap(onlyLower1[0], onlyLower1[1], bothPresent2[0], bothPresent2[1])).toEqual(true);
		expect(rangesHaveOverlap(bothPresent2[0], bothPresent2[1], onlyLower1[0], onlyLower1[1])).toEqual(true);
	});
});
