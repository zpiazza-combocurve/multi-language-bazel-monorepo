/* eslint-disable @typescript-eslint/no-explicit-any */

type FieldMaskFromProjection<T extends Record<string, any>> = {
	[K in keyof T]?: T[K] extends Array<Record<string, any>>
		? FieldMaskFromProjection<T[K][number]>
		: T[K] extends Record<string, any>
		? FieldMaskFromProjection<T[K]> | boolean
		: boolean;
};

/**
 * Build a FieldMask with type safety
 *
 * @example
 * 	type MyResponse = { foo: { bar: string }; baz: string };
 * 	buildFieldMask<MyResponse>({ foo: true }); // ['foo']
 * 	buildFieldMask<MyResponse>({ foo: { bar: true } }); // ['foo.bar']
 * 	buildFieldMask<MyResponse>({ foo: { bar: true }, baz: true }); // ['foo.bar', 'baz']
 * 	buildFieldMask<MyResponse>({ foo: { bar: true }, baz: true, bazzz: true }); // Typescript Error, 'bazzz' is invalid
 */
export function buildFieldMask<T extends Record<string, any>>(obj: FieldMaskFromProjection<T>): string[] {
	const results: string[] = [];

	function rec(obj: FieldMaskFromProjection<any>, prefix = '') {
		for (const key in obj) {
			const value = obj[key];

			if (value === undefined) continue;

			if (typeof value === 'boolean') {
				results.push(`${prefix}${key}`);
			} else {
				rec(value, `${prefix}${key}.`);
			}
		}
	}

	rec(obj);

	return results;
}

/**
 * Creates a FieldMask based on the document
 *
 * @example
 * 	inferFieldMask({ well: 'well-id', foo: { bar: 'baz' } }); // ['well', 'foo.bar']
 */
export function inferFieldMask<T extends Record<string, any>>(doc: T): string[] {
	const results: string[] = [];

	function rec(obj: Record<string, any>, prefix = '') {
		for (const key in obj) {
			const value = obj[key];

			const keyName = `${prefix}${key}`;

			if (value === undefined) continue;

			if (Array.isArray(value)) {
				if (value.length === 0) {
					results.push(`${prefix}${key}`);
				} else if (value[0] === undefined) {
					results.push(`${prefix}${key}`);
				} else if (value[0] === null) {
					results.push(`${prefix}${key}`);
				} else {
					rec(value[0], `${keyName}.`);
				}
				continue;
			}

			if (typeof value === 'object' && value !== null) {
				rec(value, `${keyName}.`);
			} else {
				results.push(keyName);
			}
		}
	}

	rec(doc);

	return results;
}
