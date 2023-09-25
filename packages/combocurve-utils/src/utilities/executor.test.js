// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Executor } = require('./executor');

const asyncValue = (value) => () =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), 100);
	});

const asyncError = (message) => () =>
	new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error(message)), 100);
	});

describe('helpers/excecutor', () => {
	test('series()', async () => {
		expect(await Executor.series([])).toEqual([]);
		expect(await Executor.series([() => Promise.resolve(1)])).toEqual([1]);
		expect(await Executor.series([asyncValue('foo'), asyncValue('bar')])).toEqual(['foo', 'bar']);
		expect(await Executor.series({ foo: asyncValue(1), bar: asyncValue(2) })).toEqual({ foo: 1, bar: 2 });

		try {
			await Executor.series([asyncError('Crashed!')]);
		} catch (error) {
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(error).toBeInstanceOf(Error);
			// eslint-disable-next-line jest/no-conditional-expect -- TODO eslint fix later
			expect(error.message).toEqual('Crashed!');
		}

		const result = await Executor.series([asyncError('Crashed!')], { abort: false });
		expect(result[0]).toBeInstanceOf(Error);
		expect(result[0].message).toEqual('Crashed!');
	});
});
