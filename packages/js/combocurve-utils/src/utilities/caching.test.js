// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { memoizeAsync } = require('./caching');

const sleep = (ms) =>
	new Promise((resolve) => {
		setTimeout(() => resolve(), ms);
	});

let fnState = 0;

const asyncImpureGreet = async (who) => {
	await sleep(250);
	fnState++;
	return `hi ${who}`;
};

describe('caching', () => {
	test('memoizeAsync()', async () => {
		const memoFn = memoizeAsync(asyncImpureGreet);
		let prevState;

		// original function behavior
		expect(await memoFn('john')).toEqual('hi john');

		// original function behavior, with different key
		expect(await memoFn('jane')).toEqual('hi jane');

		// cached function behavior
		prevState = fnState;

		expect(await memoFn('john')).toEqual('hi john');
		expect(fnState).toEqual(prevState);

		prevState = fnState;

		expect(await memoFn('jane')).toEqual('hi jane');
		expect(fnState).toEqual(prevState);
	});
});
