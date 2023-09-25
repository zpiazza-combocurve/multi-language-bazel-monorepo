"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("./utilities");
describe('helpers/utilities', () => {
    test('paginator()', () => {
        let paginate = (0, utilities_1.paginator)(1);
        expect(paginate).toBeInstanceOf(Function);
        expect(paginate([])).toEqual([]);
        expect(paginate(['one'])).toEqual([['one']]);
        paginate = (0, utilities_1.paginator)(3);
        expect(paginate(['one', 'two'])).toEqual([['one', 'two']]);
        expect(paginate(['one', 'two', 'three', 'four'])).toEqual([['one', 'two', 'three'], ['four']]);
    });
    test('objectFromKeys()', () => {
        expect((0, utilities_1.objectFromKeys)([], () => null)).toEqual({});
        expect((0, utilities_1.objectFromKeys)([2020], () => false)).toEqual({ 2020: false });
        expect((0, utilities_1.objectFromKeys)(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], (key) => key[0].toUpperCase() + key.slice(1))).toEqual({
            sunday: 'Sunday',
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
        });
        expect((0, utilities_1.objectFromKeys)(['foo', 'bar'], (key, index) => `${key}-${index + 1}`)).toEqual({
            foo: 'foo-1',
            bar: 'bar-2',
        });
    });
    test('mapObjectKeys()', () => {
        expect((0, utilities_1.mapObjectKeys)({}, {})).toEqual({});
        expect((0, utilities_1.mapObjectKeys)({ a: 1, b: 2, c: 3 }, { a: 'x', b: 'y', c: 'z' })).toEqual({ x: 1, y: 2, z: 3 });
        expect((0, utilities_1.mapObjectKeys)({ a: 1, b: 2, c: 3 }, { a: 'x', b: 'y' })).toEqual({ x: 1, y: 2, c: 3 });
    });
    test('convertUtcDateToIdx()', () => {
        expect((0, utilities_1.convertUtcDateToIdx)(new Date('1900-01-01'))).toBe(0);
        expect((0, utilities_1.convertUtcDateToIdx)(new Date('1900-01-02'))).toBe(1);
        expect((0, utilities_1.convertUtcDateToIdx)(new Date('2009-07-08'))).toBe(40000);
        expect((0, utilities_1.convertUtcDateToIdx)(new Date('2020-07-23'))).toBe(44033);
    });
    test('makeLocal()', () => {
        expect((0, utilities_1.makeLocal)(new Date('1900-01-01'))).toStrictEqual(new Date(1900, 0, 1));
        expect((0, utilities_1.makeLocal)(new Date('1900-01-02'))).toStrictEqual(new Date(1900, 0, 2));
        expect((0, utilities_1.makeLocal)(new Date('2009-07-08'))).toStrictEqual(new Date(2009, 6, 8));
        expect((0, utilities_1.makeLocal)(new Date('2020-07-23'))).toStrictEqual(new Date(2020, 6, 23));
    });
});
//# sourceMappingURL=utilities.test.js.map