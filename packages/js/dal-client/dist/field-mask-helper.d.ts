type FieldMaskFromProjection<T extends Record<string, any>> = {
    [K in keyof T]?: T[K] extends Array<Record<string, any>> ? FieldMaskFromProjection<T[K][number]> : T[K] extends Record<string, any> ? FieldMaskFromProjection<T[K]> | boolean : boolean;
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
export declare function buildFieldMask<T extends Record<string, any>>(obj: FieldMaskFromProjection<T>): string[];
/**
 * Creates a FieldMask based on the document
 *
 * @example
 * 	inferFieldMask({ well: 'well-id', foo: { bar: 'baz' } }); // ['well', 'foo.bar']
 */
export declare function inferFieldMask<T extends Record<string, any>>(doc: T): string[];
export {};
