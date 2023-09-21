import { hexToNumber, numberToHex } from '@/helpers/color';

const TEST_COLORS = {
	'#000000': 0,
	'#0000FF': 255,
	'#00FFFF': 65535,
	'#FFFFFF': 16777215,
};

describe.each(Object.entries(TEST_COLORS))('%s', (key, value) => {
	test('numberToHex', () => {
		expect(numberToHex(value)).toEqual(key);
	});

	test('hexToNumber', () => {
		expect(hexToNumber(key)).toEqual(value);
	});
});
