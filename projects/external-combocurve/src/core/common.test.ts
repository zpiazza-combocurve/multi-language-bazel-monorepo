import { camelToPascal, camelToSnake } from './common';

describe('common', () => {
	describe('camelToPascal should convert camelCase to PascalCase', () => {
		function test(input: string, expected: string) {
			const actual = camelToPascal(input);
			expect(actual).toBe(expected);
		}

		it('multiple examples', () => {
			test('camelCase', 'CamelCase');
			test('onepiece', 'Onepiece');
			test('testHere', 'TestHere');
		});
	});

	describe('camelToSnake should convert camelCase to PascalCase', () => {
		function test(input: string, expected: string) {
			const actual = camelToSnake(input);
			expect(actual).toBe(expected);
		}

		it('multiple examples', () => {
			test('camelCase', 'camel_case');
			test('onePiece', 'one_piece');
			test('testHere', 'test_here');
		});
	});
});
