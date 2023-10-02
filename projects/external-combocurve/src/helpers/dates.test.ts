import {
	dateToIndex,
	getNextMonthStartIndex,
	getStartIndexDaily,
	getStartIndexDailyDate,
	getStartIndexMonthly,
	getStartIndexMonthlyDate,
	indexToDate,
} from './dates';

describe('helpers/dates', () => {
	test('indexToDate()', () => {
		expect(indexToDate(0).getTime()).toBe(new Date('1900-01-01').getTime());
		expect(indexToDate(1).getTime()).toBe(new Date('1900-01-02').getTime());
		expect(indexToDate(40000).getTime()).toBe(new Date('2009-07-08').getTime());
		expect(indexToDate(44033).getTime()).toBe(new Date('2020-07-23').getTime());
	});

	test('dateToIndex()', () => {
		expect(dateToIndex(new Date('1900-01-01'))).toBe(0);
		expect(dateToIndex(new Date('1900-01-02'))).toBe(1);
		expect(dateToIndex(new Date('2009-07-08'))).toBe(40000);
		expect(dateToIndex(new Date('2020-07-23'))).toBe(44033);
	});

	test('getStartIndexDaily()', () => {
		expect(getStartIndexDaily(dateToIndex(new Date('1900-01-01')))).toBe(0);
		expect(getStartIndexDaily(dateToIndex(new Date('1900-01-02')))).toBe(0);
		expect(getStartIndexDaily(dateToIndex(new Date('1900-01-31')))).toBe(0);
		expect(getStartIndexDaily(dateToIndex(new Date('1900-02-15')))).toBe(31);
		expect(getStartIndexDaily(dateToIndex(new Date('2009-07-08')))).toBe(dateToIndex(new Date('2009-07-01')));
		expect(getStartIndexDaily(dateToIndex(new Date('2020-07-23')))).toBe(dateToIndex(new Date('2020-07-01')));
	});

	test('getStartIndexDailyDate()', () => {
		expect(getStartIndexDailyDate(new Date('1900-01-01'))).toBe(0);
		expect(getStartIndexDailyDate(new Date('1900-01-02'))).toBe(0);
		expect(getStartIndexDailyDate(new Date('1900-01-31'))).toBe(0);
		expect(getStartIndexDailyDate(new Date('1900-02-15'))).toBe(31);
		expect(getStartIndexDailyDate(new Date('2009-07-08'))).toBe(dateToIndex(new Date('2009-07-01')));
		expect(getStartIndexDailyDate(new Date('2020-07-23'))).toBe(dateToIndex(new Date('2020-07-01')));
	});

	test('getStartIndexMonthly()', () => {
		expect(getStartIndexMonthly(dateToIndex(new Date('1900-01-01')))).toBe(0);
		expect(getStartIndexMonthly(dateToIndex(new Date('1900-01-02')))).toBe(0);
		expect(getStartIndexMonthly(dateToIndex(new Date('1900-01-31')))).toBe(0);
		expect(getStartIndexMonthly(dateToIndex(new Date('1900-02-15')))).toBe(0);
		expect(getStartIndexMonthly(dateToIndex(new Date('1901-01-01')))).toBe(365);
		expect(getStartIndexMonthly(dateToIndex(new Date('2009-07-08')))).toBe(dateToIndex(new Date('2009-01-01')));
		expect(getStartIndexMonthly(dateToIndex(new Date('2020-07-23')))).toBe(dateToIndex(new Date('2020-01-01')));
	});

	test('getStartIndexMonthlyDate()', () => {
		expect(getStartIndexMonthlyDate(new Date('1900-01-01'))).toBe(0);
		expect(getStartIndexMonthlyDate(new Date('1900-01-02'))).toBe(0);
		expect(getStartIndexMonthlyDate(new Date('1900-01-31'))).toBe(0);
		expect(getStartIndexMonthlyDate(new Date('1900-02-15'))).toBe(0);
		expect(getStartIndexMonthlyDate(new Date('1901-01-01'))).toBe(365);
		expect(getStartIndexMonthlyDate(new Date('2009-07-08'))).toBe(dateToIndex(new Date('2009-01-01')));
		expect(getStartIndexMonthlyDate(new Date('2020-07-23'))).toBe(dateToIndex(new Date('2020-01-01')));
	});

	test('getNextMonthStartIndex()', () => {
		expect(getNextMonthStartIndex(dateToIndex(new Date('2020-01-01')))).toBe(dateToIndex(new Date('2020-02-01')));
		expect(getNextMonthStartIndex(dateToIndex(new Date('2020-02-15')))).toBe(dateToIndex(new Date('2020-03-01')));
		expect(getNextMonthStartIndex(dateToIndex(new Date('2020-12-31')))).toBe(dateToIndex(new Date('2021-01-01')));
		expect(getNextMonthStartIndex(dateToIndex(new Date('2020-02-28')))).toBe(dateToIndex(new Date('2020-03-01')));
		expect(getNextMonthStartIndex(dateToIndex(new Date('2020-02-29')))).toBe(dateToIndex(new Date('2020-03-01')));
	});
});
