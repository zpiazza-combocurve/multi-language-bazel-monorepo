import { BackoffIncrementTimeStrategy } from './strategies';
import { RetryWrapper } from './wrapper';

describe('RetryWrapper', () => {
	const infinityStrategy = new BackoffIncrementTimeStrategy(1, 99999, 1);

	let callsCount = 0;
	let retryCount = 0;
	let retryLimit = 0;

	const configCounts = (limit = 0, calls = 0, retry = 0) => {
		callsCount = calls;
		retryCount = retry;
		retryLimit = limit;
	};

	const targetFn = () => {
		callsCount++;
		return Promise.resolve(callsCount);
	};

	// eslint-disable-next-line
	const shouldRetry = (response: number | undefined, error: unknown) => {
		retryCount++;
		return retryCount <= retryLimit;
	};

	it('should call targetFunction', async () => {
		// Arrange
		configCounts();
		const retry = new RetryWrapper<number>(targetFn, shouldRetry, infinityStrategy);

		// Act
		retry.execute();

		// Assert
		expect(callsCount).toBe(1);
	});

	it('should call "targetFunction: until "shouldFuntion" returns true', async () => {
		// Arrange
		configCounts(3);
		const retry = new RetryWrapper<number>(targetFn, shouldRetry, infinityStrategy);

		// Act
		await retry.execute();

		// Assert
		expect(callsCount).toBe(4);
	});

	it('should call "targetFunction" until "strategy" returns true', async () => {
		// Arrange
		configCounts(999);
		const strategy = new BackoffIncrementTimeStrategy(1, 3, 1);
		const retry = new RetryWrapper<number>(targetFn, shouldRetry, strategy);

		// Act
		await retry.execute();

		// Assert
		expect(callsCount).toBe(4);
	});
});
