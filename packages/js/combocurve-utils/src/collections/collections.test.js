const {
	difference,
	get,
	groupBy,
	has,
	intersection,
	invert,
	mapKeys,
	mapValues,
	omit,
	pick,
	sortBy,
	take,
	uniq,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./collections');

describe('collections', () => {
	test('get()', () => {
		expect(get(null, 'status')).toBe(undefined);
		expect(get(undefined, 'status')).toBe(undefined);
		expect(get(null, 'status', 'pending')).toBe('pending');
		expect(get({ status: null }, 'status', 'pending')).toBe(null);
		expect(get({ status: undefined }, 'status', 'pending')).toBe('pending');
		expect(get({ status: 'active' }, 'status')).toBe('active');
		expect(get({ createdBy: { email: 'john@inpt.com' } }, 'createdBy.email')).toBe('john@inpt.com');
		expect(get({ createdBy: { email: 'john@inpt.com' } }, 'updatedBy.email')).toBe(undefined);
		expect(get({ createdBy: { email: 'john@inpt.com' } }, 'updatedBy.email', '')).toBe('');
	});

	test('has()', () => {
		expect(has({}, 'toString')).toBe(false);
		expect(has(null, 'toString')).toBe(false);
		expect(has({ foo: 'bar' }, 'foo')).toBe(true);
	});

	test('pick()', () => {
		expect(pick(null, ['foo'])).toBeInstanceOf(Object);
		expect(pick({ foo: true }, ['foo'])).toHaveProperty('foo', true);
		expect(pick({ foo: true, bar: false }, ['foo'])).not.toHaveProperty('bar');
		expect(pick({ foo: true, bar: false }, 'bar')).toHaveProperty('bar');
	});

	test('omit()', () => {
		expect(omit(null, ['foo'])).toBeInstanceOf(Object);
		expect(omit({ foo: true }, ['foo'])).not.toHaveProperty('foo', true);
		expect(omit({ foo: true, bar: false }, ['foo'])).toHaveProperty('bar');
		expect(omit({ foo: true, bar: false }, 'bar')).not.toHaveProperty('bar');
	});

	test('mapValues()', () => {
		expect(mapValues(null, (value) => value)).toBeInstanceOf(Object);
		expect(mapValues({}, (value) => value)).toBeInstanceOf(Object);
		expect(mapValues({ foo: 'Foo!', bar: 'Bar!' }, (value) => value.toUpperCase())).toEqual({
			foo: 'FOO!',
			bar: 'BAR!',
		});
	});

	test('mapKeys()', () => {
		expect(mapKeys(null, (value) => value)).toBeInstanceOf(Object);
		expect(mapKeys({}, (value) => value)).toBeInstanceOf(Object);
		expect(mapKeys({ foo: 'Foo!', bar: 'Bar!' }, (value, key) => key.toUpperCase())).toEqual({
			FOO: 'Foo!',
			BAR: 'Bar!',
		});
	});

	test('invert()', () => {
		expect(invert(null, (value) => value)).toBeInstanceOf(Object);
		expect(invert({}, (value) => value)).toBeInstanceOf(Object);
		expect(invert({ foo: 'Foo', bar: 'Bar' })).toEqual({ Foo: 'foo', Bar: 'bar' });
	});

	test('groupBy()', () => {
		expect(groupBy([], 'status')).toBeInstanceOf(Object);
		expect(
			groupBy(
				[
					{ status: 'pending', type: 'economics' },
					{ status: 'failed', type: 'economics' },
				],
				'status'
			)
		).toHaveProperty('pending', [{ status: 'pending', type: 'economics' }]);
		expect(
			groupBy(
				[
					{ status: 'pending', type: 'economics' },
					{ status: 'failed', type: 'economics' },
				],
				(element) => element.status
			)
		).toHaveProperty('pending', [{ status: 'pending', type: 'economics' }]);
	});

	test('uniq()', () => {
		expect(uniq([])).toEqual([]);
		expect(uniq(['Monday', 'Wednesday', 'Friday'])).toEqual(['Monday', 'Wednesday', 'Friday']);
		expect(uniq(['January', 'January', 'February', 'January'])).toEqual(['January', 'February']);
	});

	test('difference()', () => {
		expect(difference([], ['foo'])).toEqual([]);
		expect(difference(['foo', 'bar', 'bar', 'baz'], ['bar'])).toEqual(['foo', 'baz']);
		expect(difference(['foo', 'bar', 'bar', 'baz'], ['foo', 'baz'])).toEqual(['bar', 'bar']);
	});

	test('intersection()', () => {
		expect(intersection([], [])).toEqual([]);
		expect(intersection([1], [2])).toEqual([]);
		expect(intersection([4, 1, 3, 6], [3, 2, 1, 7])).toEqual([1, 3]);
	});

	test('sortBy()', () => {
		expect(sortBy([])).toEqual([]);
		expect(sortBy([4, 1, 2])).toEqual([1, 2, 4]);

		const users = [
			{ name: 'Sansa', age: 27 },
			{ name: 'Bran', age: 22 },
			{ name: 'Jon', age: 27 },
			{ name: 'Arya', age: 18 },
		];
		expect(sortBy(users, (user) => user.age)).toEqual([
			{ name: 'Arya', age: 18 },
			{ name: 'Bran', age: 22 },
			{ name: 'Sansa', age: 27 },
			{ name: 'Jon', age: 27 },
		]);
		expect(sortBy(users, ['age', 'name'])).toEqual([
			{ name: 'Arya', age: 18 },
			{ name: 'Bran', age: 22 },
			{ name: 'Jon', age: 27 },
			{ name: 'Sansa', age: 27 },
		]);
	});

	test('take()', () => {
		expect(take(null)).toEqual([]);
		expect(take([])).toEqual([]);
		expect(take([2020])).toEqual([2020]);
		expect(take([2020, 2021])).toEqual([2020]);
		expect(take([2020, 2021], 2)).toEqual([2020, 2021]);
		expect(take([2020, 2021], -1)).toEqual([]);
		expect(take([2020, 2021], 0)).toEqual([]);
		expect(take([2020, 2021], 3)).toEqual([2020, 2021]);
	});
});
