/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseApiReservesCategory } from './validation';

const fakeObjectId = '641de2bef473bc00120fd714';

function getValidReservesCategory(): Record<string, any> {
	return {
		id: '641de2bef473bc00120fd714',
		name: 'own1 1',
		unique: false,
		reservesCategory: {
			prmsClass: 'reserves',
			prmsCategory: 'proved',
			prmsSubCategory: 'producing',
		},
	};
}

describe('v1/reserves-categories/validation/parseApiReservesCategory', () => {
	describe('base econ fields', () => {
		test('should parse valid ownership reversion', () => {
			const input = getValidReservesCategory();

			const result = parseApiReservesCategory(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on missing name field', () => {
			const input = getValidReservesCategory();

			delete input.name;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('Missing required field: `name`');
		});

		test('should throw validation exception on missing unique field', () => {
			const input = getValidReservesCategory();

			delete input.unique;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('Missing required field: `unique`');
		});

		test('should not throw validation exception on missing id field', () => {
			const input = getValidReservesCategory();

			delete input.id;

			const result = parseApiReservesCategory(input, 1);

			expect(result).not.toBeNull();
		});

		test('should not throw validation exception on missing well field when not unique', () => {
			const input = getValidReservesCategory();

			delete input.well;

			const result = parseApiReservesCategory(input, 1);

			expect(result).not.toBeNull();
		});

		test('should not throw validation exception on missing scenario field when not unique', () => {
			const input = getValidReservesCategory();

			delete input.scenario;

			const result = parseApiReservesCategory(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on missing well field when unique', () => {
			const input = getValidReservesCategory();

			input.unique = true;
			input.scenario = fakeObjectId;

			delete input.well;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('Missing required field: `well`');
		});

		test('should throw validation exception on missing scenario field when unique', () => {
			const input = getValidReservesCategory();

			input.unique = true;
			input.well = fakeObjectId;

			delete input.scenario;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('Missing required field: `scenario`');
		});

		test('should throw validation exception on invalid id field', () => {
			const input = getValidReservesCategory();

			input.id = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow('`asdf` is not a valid ObjectId');
		});

		test('should throw validation exception on invalid well field', () => {
			const input = getValidReservesCategory();

			input.unique = true;
			input.scenario = fakeObjectId;
			input.well = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow('`asdf` is not a valid ObjectId');
		});

		test('should throw validation exception on invalid scenario field', () => {
			const input = getValidReservesCategory();

			input.unique = true;
			input.well = fakeObjectId;
			input.scenario = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow('`asdf` is not a valid ObjectId');
		});

		test('should throw validation exception on unexpected property', () => {
			const input = getValidReservesCategory();

			input.invalidProperty = true;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});
	});

	describe('reservesCategory', () => {
		test('should throw validation exception on unexpected property', () => {
			const input = getValidReservesCategory();

			input.reservesCategory.invalidProperty = true;

			expect(() => parseApiReservesCategory(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing prmsClass field', () => {
			const input = getValidReservesCategory();

			delete input.reservesCategory.prmsClass;

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'Missing required field: `reservesCategory.prmsClass`',
			);
		});

		test('should throw validation exception on missing prmsCategory field', () => {
			const input = getValidReservesCategory();

			delete input.reservesCategory.prmsCategory;

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'Missing required field: `reservesCategory.prmsCategory`',
			);
		});

		test('should throw validation exception on missing prmsSubCategory field', () => {
			const input = getValidReservesCategory();

			delete input.reservesCategory.prmsSubCategory;

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'Missing required field: `reservesCategory.prmsSubCategory`',
			);
		});

		test('should throw validation exception on invalid prmsClass field', () => {
			const input = getValidReservesCategory();

			input.reservesCategory.prmsClass = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'`reservesCategory.prmsClass` must be one of the following values: reserves, contingent, prospective',
			);
		});

		test('should throw validation exception on invalid prmsCategory field', () => {
			const input = getValidReservesCategory();

			input.reservesCategory.prmsCategory = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'`reservesCategory.prmsCategory` must be one of the following values: proved, probable, possible, c1, c2, c3',
			);
		});

		test('should throw validation exception on invalid prmsSubCategory field', () => {
			const input = getValidReservesCategory();

			input.reservesCategory.prmsSubCategory = 'asdf';

			expect(() => parseApiReservesCategory(input, 1)).toThrow(
				'`reservesCategory.prmsSubCategory` must be one of the following values: producing, non_producing, shut_in, temp_aband, p&a, behind_pipe, injection, undeveloped, need_workover',
			);
		});

		it.each([['reserves'], ['contingent'], ['prospective']])(
			'should not throw exception on valid prmsClass',
			async (inputValue: string) => {
				const input = getValidReservesCategory();

				input.reservesCategory.prmsClass = inputValue;

				const result = parseApiReservesCategory(input, 1);

				expect(result).not.toBeNull();
			},
		);

		it.each([['proved'], ['probable'], ['possible'], ['c1'], ['c2'], ['c3']])(
			'should not throw exception on valid prmsCategory',
			async (inputValue: string) => {
				const input = getValidReservesCategory();

				input.reservesCategory.prmsCategory = inputValue;

				const result = parseApiReservesCategory(input, 1);

				expect(result).not.toBeNull();
			},
		);

		it.each([
			['producing'],
			['non_producing'],
			['shut_in'],
			['temp_aband'],
			['p&a'],
			['behind_pipe'],
			['injection'],
			['undeveloped'],
			['need_workover'],
		])('should not throw exception on valid prmsSubCategory', async (inputValue: string) => {
			const input = getValidReservesCategory();

			input.reservesCategory.prmsSubCategory = inputValue;

			const result = parseApiReservesCategory(input, 1);

			expect(result).not.toBeNull();
		});
	});
});
