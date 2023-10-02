import { BackoffIncrementTimeStrategy, FibonacciBackoffIncrementTimeStrategy } from './strategies';
import { RetryWrapper } from './wrapper';

/**
 * Create a fibonacci incremental backoff retry
 * This retry will perform the wait between the retries using the fibonacci sequence 1,2,3,5,8...
 * @example	maxTries: 5, jumpMS: 100ms
 *	Wait 100ms
 * 	Wait 200ms
 *	Wait 300ms
 * 	Wait 500ms
 *  Wait 800ms
 *  Stop!
 * @param maxTries times that wrapper will try to perform the target action
 * @param jumpMS microseconds jump for each try
 * @param target target action
 * @param shouldRetry function decides based on output and error with should retry
 * @returns the retry wrapper
 */
function buildFibonacciRetry<TOutput>(
	maxTries: number,
	jumpMS: number,
	target: () => Promise<TOutput>,
	shouldRetry: (response: TOutput | undefined, error: unknown) => boolean,
): RetryWrapper<TOutput> {
	const strategy = new FibonacciBackoffIncrementTimeStrategy(maxTries, jumpMS);
	const retry = new RetryWrapper<TOutput>(target, shouldRetry, strategy);

	return retry;
}

/**
 * Create a incremental backoff retry
 * This retry will perform the wait between the retries incrementing the 'incrementTime' for each try
 * @example baseWaitTime: 100ms, maxTries: 5, incrementTime: 100ms
 * Wait 100ms
 * Wait 200ms
 * Wait 300ms
 * Wait 400ms
 * Wait 500ms
 * Stop!
 * @param baseWaitTime the start time
 * @param maxTries times that wrapper will try to perform the target action
 * @param incrementTime microseconds will be add for each try
 * @param target target action
 * @param shouldRetry function decides based on output and error with should retry
 * @returns the retry wrapper
 */
function buildIncrementRetry<TOutput>(
	baseWaitTime: number,
	maxTries: number,
	incrementTime: number,
	target: () => Promise<TOutput>,
	shouldRetry: (response: TOutput | undefined, error: unknown) => boolean,
): RetryWrapper<TOutput> {
	const strategy = new BackoffIncrementTimeStrategy(baseWaitTime, maxTries, incrementTime);
	const retry = new RetryWrapper<TOutput>(target, shouldRetry, strategy);

	return retry;
}

export { buildFibonacciRetry, buildIncrementRetry };
