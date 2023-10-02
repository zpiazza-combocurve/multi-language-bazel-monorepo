import { NamingTypes } from '../common';

import { containsField, sourceFieldLookup } from './field-lookup';

describe('field-lookup', () => {
	describe('sourceFieldLookup', () => {
		it('should return undefined when not exists', () => {
			const source = { test: 'test' };
			const result = sourceFieldLookup(source, 'test2', NamingTypes.All);

			expect(result).toBeUndefined();
		});

		it('should return the property when exists', () => {
			const source = { test: 'test_value' };
			const result = sourceFieldLookup(source, 'test', NamingTypes.ExactlyEqual);

			expect(result).toBeDefined();
			expect(result?.name).toBe('test');
			expect(result?.value).toBe('test_value');
		});

		it('should accept pascal case', () => {
			const source = { TestProperty: 'test_value' };
			const result = sourceFieldLookup(source, 'testProperty', NamingTypes.PascalCase);

			expect(result).toBeDefined();
			expect(result?.name).toBe('TestProperty');
			expect(result?.value).toBe('test_value');
		});

		it('should accept snake case', () => {
			const source = { test_property: 'test_value' };
			const result = sourceFieldLookup(source, 'testProperty', NamingTypes.SnakeCase);

			expect(result).toBeDefined();
			expect(result?.name).toBe('test_property');
			expect(result?.value).toBe('test_value');
		});

		it('should accept both when all', () => {
			const source = { test_property: 'test_value' };
			let result = sourceFieldLookup(source, 'testProperty', NamingTypes.All);

			expect(result).toBeDefined();
			expect(result?.name).toBe('test_property');
			expect(result?.value).toBe('test_value');

			const source2 = { TestProperty: 'test_value' };
			result = sourceFieldLookup(source2, 'testProperty', NamingTypes.All);

			expect(result).toBeDefined();
			expect(result?.name).toBe('TestProperty');
			expect(result?.value).toBe('test_value');
		});
	});

	describe('containsField', () => {
		it('should return false when not exists', () => {
			expect(containsField(['test'], 'tESt', NamingTypes.All)).toBeFalsy();
			expect(containsField(['test'], 'test1', NamingTypes.All)).toBeFalsy();
			expect(containsField(['test'], 'testy', NamingTypes.All)).toBeFalsy();
		});

		it('should return true when exists', () => {
			expect(containsField(['test'], 'test', NamingTypes.ExactlyEqual)).toBeTruthy();
		});

		it('should accept pascal case', () => {
			expect(containsField(['testProperty'], 'TestProperty', NamingTypes.PascalCase)).toBeTruthy();
		});

		it('should accept snake case', () => {
			expect(containsField(['testProperty'], 'test_property', NamingTypes.SnakeCase)).toBeTruthy();
		});

		it('should accept both when all', () => {
			expect(containsField(['testProperty'], 'TestProperty', NamingTypes.All)).toBeTruthy();
			expect(containsField(['testProperty'], 'test_property', NamingTypes.All)).toBeTruthy();
		});
	});
});
