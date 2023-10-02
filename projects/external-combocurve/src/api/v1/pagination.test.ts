import { getPaginationData, getPaginationDataWithTotal } from './pagination';

describe('v1/pagination', () => {
	test('getPaginationData', () => {
		expect(
			getPaginationData({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, true),
		).toEqual({
			skip: 0,
			take: 25,
			next: 'http://test.com/test?skip=25&take=25',
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationData({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 25, 25, true),
		).toEqual({
			skip: 25,
			take: 25,
			next: 'http://test.com/test?skip=50&take=25',
			prev: 'http://test.com/test?skip=0&take=25',
			first: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationData({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, false),
		).toEqual({
			skip: 0,
			take: 25,
			next: undefined,
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationData({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 30, 10, true),
		).toEqual({
			skip: 30,
			take: 10,
			next: 'http://test.com/test?skip=40&take=10',
			prev: 'http://test.com/test?skip=20&take=10',
			first: 'http://test.com/test?skip=0&take=10',
		});

		expect(
			getPaginationData({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 10, 25, true),
		).toEqual({
			skip: 10,
			take: 25,
			next: 'http://test.com/test?skip=35&take=25',
			prev: 'http://test.com/test?skip=0&take=25',
			first: 'http://test.com/test?skip=0&take=25',
		});
	});

	test('getPaginationDataWithTotal', () => {
		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 50),
		).toEqual({
			skip: 0,
			take: 25,
			total: 50,
			next: 'http://test.com/test?skip=25&take=25',
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=25&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 48),
		).toEqual({
			skip: 0,
			take: 25,
			total: 48,
			next: 'http://test.com/test?skip=25&take=25',
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=25&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 10),
		).toEqual({
			skip: 0,
			take: 25,
			total: 10,
			next: undefined,
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 0),
		).toEqual({
			skip: 0,
			take: 25,
			total: 0,
			next: undefined,
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 25),
		).toEqual({
			skip: 0,
			take: 25,
			total: 25,
			next: undefined,
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=0&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 0, 25, 26),
		).toEqual({
			skip: 0,
			take: 25,
			total: 26,
			next: 'http://test.com/test?skip=25&take=25',
			prev: undefined,
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=25&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 25, 25, 51),
		).toEqual({
			skip: 25,
			take: 25,
			total: 51,
			next: 'http://test.com/test?skip=50&take=25',
			prev: 'http://test.com/test?skip=0&take=25',
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=50&take=25',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 30, 10, 45),
		).toEqual({
			skip: 30,
			take: 10,
			total: 45,
			next: 'http://test.com/test?skip=40&take=10',
			prev: 'http://test.com/test?skip=20&take=10',
			first: 'http://test.com/test?skip=0&take=10',
			last: 'http://test.com/test?skip=40&take=10',
		});

		expect(
			getPaginationDataWithTotal({ protocol: 'http', host: 'test.com', pathname: 'test', query: {} }, 10, 25, 99),
		).toEqual({
			skip: 10,
			take: 25,
			total: 99,
			next: 'http://test.com/test?skip=35&take=25',
			prev: 'http://test.com/test?skip=0&take=25',
			first: 'http://test.com/test?skip=0&take=25',
			last: 'http://test.com/test?skip=85&take=25',
		});
	});
});
