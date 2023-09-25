"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferFieldMask = exports.buildFieldMask = void 0;
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
function buildFieldMask(obj) {
    const results = [];
    function rec(obj, prefix = '') {
        for (const key in obj) {
            const value = obj[key];
            if (value === undefined)
                continue;
            if (typeof value === 'boolean') {
                results.push(`${prefix}${key}`);
            }
            else {
                rec(value, `${prefix}${key}.`);
            }
        }
    }
    rec(obj);
    return results;
}
exports.buildFieldMask = buildFieldMask;
/**
 * Creates a FieldMask based on the document
 *
 * @example
 * 	inferFieldMask({ well: 'well-id', foo: { bar: 'baz' } }); // ['well', 'foo.bar']
 */
function inferFieldMask(doc) {
    const results = [];
    function rec(obj, prefix = '') {
        for (const key in obj) {
            const value = obj[key];
            const keyName = `${prefix}${key}`;
            if (value === undefined)
                continue;
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    results.push(`${prefix}${key}`);
                }
                else if (value[0] === undefined) {
                    results.push(`${prefix}${key}`);
                }
                else if (value[0] === null) {
                    results.push(`${prefix}${key}`);
                }
                else {
                    rec(value[0], `${keyName}.`);
                }
                continue;
            }
            if (typeof value === 'object' && value !== null) {
                rec(value, `${keyName}.`);
            }
            else {
                results.push(keyName);
            }
        }
    }
    rec(doc);
    return results;
}
exports.inferFieldMask = inferFieldMask;
