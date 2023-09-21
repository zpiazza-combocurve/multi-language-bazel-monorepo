import {
	arrayToRecord,
	formatValue,
	getAutoIncrementedName,
	getFileNameExtension,
	isObject,
	objectFromKeys,
	sortIndexes,
} from './utilities';

describe('helpers/collections', () => {
	test('isObject()', () => {
		expect(isObject(undefined)).toBe(false);
		expect(isObject(null)).toBe(false);
		expect(isObject(false)).toBe(false);
		expect(isObject('')).toBe(false);
		expect(isObject([])).toBe(false);
		expect(isObject({})).toBe(true);
	});

	test('getAutoIncrementedName()', () => {
		const existing = [
			'Moist Brisket',
			'Turkey Breast',
			'Cole Saw',
			'Beef Sausage_1',
			'Pork Ribs 1',
			'Lean Brisket 1/2lb',
			'Lean Brisket 1 lb',
			'Lean Brisket (double)',
			'Cole Saw 1',
			'Beef Sausage',
			'BBQ Beans 2',
		];
		expect(getAutoIncrementedName('Pulled Pork', existing)).toBe('Pulled Pork');
		expect(getAutoIncrementedName('Moist Brisket', existing)).toBe('Moist Brisket 1');
		expect(getAutoIncrementedName('Moist Brisket', existing, '_')).toBe('Moist Brisket_1');
		expect(getAutoIncrementedName('Beef Sausage', existing, '_')).toBe('Beef Sausage_2');
		expect(getAutoIncrementedName('Cole Saw', existing)).toBe('Cole Saw 2');
		expect(getAutoIncrementedName('Pork Ribs', existing)).toBe('Pork Ribs 2');
		expect(getAutoIncrementedName('BBQ Beans', existing)).toBe('BBQ Beans 3');
		expect(getAutoIncrementedName('Moist Brisket 1/2lb', existing)).toBe('Moist Brisket 1/2lb');
		expect(getAutoIncrementedName('Lean Brisket', existing)).toBe('Lean Brisket');
	});

	test('formatValue', () => {
		expect(formatValue(3.54, 'integer')).toEqual('4');
		expect(formatValue(3, 'number')).toEqual('3.00');
		expect(formatValue(undefined, 'number')).toEqual('N/A');
		expect(formatValue(undefined)).toEqual('N/A');
		expect(formatValue(null)).toEqual('N/A');
		expect(formatValue(3.54334)).toEqual('3.54');
		expect(formatValue('hello')).toEqual('hello');
		expect(formatValue('hello', 'string')).toEqual('hello');
		expect(formatValue(3.678, 'string')).toEqual('3.678');
		expect(formatValue('asdf', 'number')).toEqual('N/A');
		expect(formatValue(3.678, 'small-number')).toEqual('3.6780');
		expect(formatValue(12345678.678)).toEqual('12,345,678.68');
		expect(formatValue(true)).toEqual('Yes');
		expect(formatValue(false)).toEqual('No');
		expect(formatValue(undefined, 'date')).toEqual('N/A');
		expect(formatValue('12/22/2021', 'date')).toEqual('12/22/2021');
		expect(formatValue('string', 'unknown-type')).toEqual('string');

		const now = new Date();
		expect(formatValue(now)).toEqual(now.toLocaleDateString());
	});

	test('arrayToRecord', () => {
		expect(
			arrayToRecord(
				[
					{ id: '1', foo: 'bar' },
					{ id: '2', baz: 'var' },
				],
				'id'
			)
		).toEqual({
			1: { id: '1', foo: 'bar' },
			2: { id: '2', baz: 'var' },
		});
		expect(
			arrayToRecord(
				[
					{ id: '1', foo: 'bar' },
					{ id: '2', foo: 'var' },
				],
				'id',
				'foo'
			)
		).toEqual({
			1: 'bar',
			2: 'var',
		});
	});

	test('objectFromKeys()', () => {
		expect(objectFromKeys([], () => null)).toEqual({});
		expect(objectFromKeys([2020], () => false)).toEqual({ 2020: false });
		expect(
			objectFromKeys(
				['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
				(key) => key[0].toUpperCase() + key.slice(1)
			)
		).toEqual({
			sunday: 'Sunday',
			monday: 'Monday',
			tuesday: 'Tuesday',
			wednesday: 'Wednesday',
			thursday: 'Thursday',
			friday: 'Friday',
			saturday: 'Saturday',
		});
		expect(objectFromKeys(['foo', 'bar'], (key, index) => `${key}-${index + 1}`)).toEqual({
			foo: 'foo-1',
			bar: 'bar-2',
		});
	});

	test('getFileNameExtension()', () => {
		expect(getFileNameExtension('file name.csv')).toStrictEqual({ fileName: 'file name', extension: '.csv' });
		expect(getFileNameExtension('file.name.pdf')).toStrictEqual({ fileName: 'file.name', extension: '.pdf' });
		expect(getFileNameExtension('file name')).toStrictEqual({ fileName: 'file name', extension: '' });
		expect(getFileNameExtension('.csv')).toStrictEqual({ fileName: '', extension: '.csv' });
		expect(getFileNameExtension('')).toStrictEqual({ fileName: '', extension: '' });
	});

	test('sortIndexes()', () => {
		expect(sortIndexes([])).toEqual([]);
		expect(sortIndexes([1])).toEqual([0]);
		expect(sortIndexes([15, 5, 10])).toEqual([1, 2, 0]);
	});
});
