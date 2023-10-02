import { removeNilProperties } from './typing';

interface SomeType {
	id: number;
	name?: string | null;
	description?: string | null;
}

describe('helpers/typing', () => {
	describe('removeNilProperties', () => {
		test('should remove nil properties from anonymous objects', () => {
			const item = {
				prop1: 'test1',
				prop2: 'test2',
				nullProp: null,
				undefinedProp: undefined,
			};

			const expectedResult = {
				prop1: 'test1',
				prop2: 'test2',
			};

			const result = removeNilProperties(item);

			expect(result).toStrictEqual(expectedResult);
		});

		test('should remove nil properties from typed objects', () => {
			const item: SomeType = {
				id: 1,
				name: null,
				description: undefined,
			};

			const expectedResult: SomeType = {
				id: 1,
			};

			const result = removeNilProperties(item);

			expect(result).toStrictEqual(expectedResult);
		});
	});
});
