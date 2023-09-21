import { slugify } from './slugify';

test('should work', () => {
	expect(slugify('hello - world - 12/03/20')).toBe('hello_world_12_03_20');
});

test('should work with preslugified string', () => {
	expect(slugify('hello _____- world - 12/03/20')).toBe('hello_world_12_03_20');
});

test('should work replace # with _', () => {
	expect(slugify('Caerus Piceance #1')).toBe('Caerus_Piceance_1');
});
