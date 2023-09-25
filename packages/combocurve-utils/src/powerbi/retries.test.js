// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { RetriableError, retry } = require('./retries');

const TIMEOUT_MS = 15000;

const alwaysSuccess = () => Promise.resolve('Success');

const alwaysFail = () => Promise.reject(new Error('Fail'));

const createRetriableFailure = (failTimes = 1) => {
	let failed = 0;

	return () => {
		if (failed >= failTimes) {
			return Promise.resolve('Success');
		}
		failed += 1;

		return Promise.reject(new RetriableError('Fail'));
	};
};

describe('powerbi/retries', () => {
	test('RetriableError', async () => {
		class OneSubClass extends RetriableError {}

		const instance = new OneSubClass('Something went wrong');

		expect(instance.name).toEqual('OneSubClass');
		expect(instance.message).toEqual('Something went wrong');
		expect(instance.retry).toEqual(true);
	});

	test('retry() when caller succeeds', async () => {
		await expect(retry(alwaysSuccess)).resolves.toEqual('Success');
	});

	test('retry() when caller always fails', async () => {
		await expect(retry(alwaysFail)).rejects.toThrow(new Error('Fail'));
	});

	test(
		'retry() when caller fails but later succeeds',
		async () => {
			const failFirst = createRetriableFailure(1);
			const result = retry(failFirst);

			await expect(result).resolves.toEqual('Success');
		},
		TIMEOUT_MS
	);
});
