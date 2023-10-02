import { IRetryStrategy } from './strategies';

class RetryWrapper<TOutput> {
	private readonly retryStrategy: IRetryStrategy;
	private readonly action: () => Promise<TOutput>;
	private readonly shouldRetry: (response: TOutput | undefined, error: unknown) => boolean;

	constructor(
		target: () => Promise<TOutput>,
		shouldRetry: (response: TOutput | undefined, error: unknown) => boolean,
		timer: IRetryStrategy,
	) {
		this.retryStrategy = timer;
		this.action = target;
		this.shouldRetry = shouldRetry;
	}

	async execute(): Promise<{ response: TOutput | undefined; error: unknown }> {
		let output: TOutput | undefined;
		let error: unknown;

		do {
			try {
				output = await this.action();
				error = null;
			} catch (err) {
				error = err;
			}
		} while (this.shouldRetry(output, error) && (await this.retryStrategy.ShouldTryAgain()));

		return {
			response: output,
			error: error,
		};
	}
}

export { RetryWrapper };
