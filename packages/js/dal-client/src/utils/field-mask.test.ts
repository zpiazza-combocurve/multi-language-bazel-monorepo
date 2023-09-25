import { buildFieldMask, inferFieldMask } from './field-mask';

describe('buildFieldMask', () => {
	test('basic functionality', () => {
		type MyResponse = { foo: { bar: string }; baz: number; basz: string };

		expect(buildFieldMask<MyResponse>({ foo: { bar: true }, baz: true })).toStrictEqual(['foo.bar', 'baz']);
	});
	test('undefined should be skipped', () => {
		type MyResponse = { foo: { bar: string }; baz: number; basz: string };

		expect(buildFieldMask<MyResponse>({ foo: undefined })).toStrictEqual([]);
	});
	test('schema with array', () => {
		type MyResponse = { array: { foo: string }[]; object: { bar: number }; literal: string };
		expect(
			buildFieldMask<MyResponse>({ array: { foo: true }, object: { bar: true }, literal: true })
		).toStrictEqual(['array.foo', 'object.bar', 'literal']);
	});
});

describe('inferFieldMask', () => {
	test('basic functionality', () => {
		expect(inferFieldMask({ well: 'well-id', foo: { bar: 'baz' } })).toStrictEqual(['well', 'foo.bar']);
	});
	test('null values', () => {
		expect(inferFieldMask({ foo: null })).toStrictEqual(['foo']);
	});
	test('undefined values', () => {
		expect(inferFieldMask({ foo: undefined })).toStrictEqual([]);
	});
	describe('arrays', () => {
		// Arrays will only consider first element if exist for performance reasons
		test('infer based on only first element of array', () => {
			expect(inferFieldMask({ foo: [{ bar: 'baz' }] })).toStrictEqual(['foo.bar']);
		});
		test('infer everything if first element of array is empty', () => {
			expect(inferFieldMask({ foo: [] })).toStrictEqual(['foo']);
		});
		test('array[0] === undefined', () => {
			expect(inferFieldMask({ foo: [undefined] })).toStrictEqual(['foo']);
		});
		test('array[0] === null', () => {
			expect(inferFieldMask({ foo: [null] })).toStrictEqual(['foo']);
		});
	});
});
