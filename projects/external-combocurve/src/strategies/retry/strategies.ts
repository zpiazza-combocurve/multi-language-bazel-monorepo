interface IRetryStrategy {
	ShouldTryAgain: () => Promise<boolean>;
}

class BackoffIncrementTimeStrategy implements IRetryStrategy {
	private maxTries: number;
	private currentWaitTime: number;
	private readonly incrementTime: number;

	constructor(baseWaitTime: number, maxTries: number, incrementTime: number) {
		this.maxTries = maxTries;
		this.incrementTime = incrementTime;
		this.currentWaitTime = baseWaitTime;
	}

	public async ShouldTryAgain(): Promise<boolean> {
		if (this.maxTries <= 0) {
			return false;
		}

		await new Promise((resolve) => setTimeout(resolve, this.currentWaitTime));
		this.currentWaitTime = this.currentWaitTime + this.incrementTime;
		this.maxTries -= 1;

		return true;
	}
}

class FibonacciBackoffIncrementTimeStrategy implements IRetryStrategy {
	private currentDelay = 1;
	private nextDelay = 1;

	private jumpMs: number;
	private maxTries: number;

	constructor(maxTries: number, jumpMS = 100) {
		this.maxTries = maxTries;
		this.jumpMs = jumpMS;
	}

	public async ShouldTryAgain(): Promise<boolean> {
		if (this.maxTries <= 0) {
			return false;
		}

		const result = this.currentDelay;

		this.currentDelay = this.nextDelay;
		this.nextDelay = result + this.currentDelay;

		await new Promise((resolve) => setTimeout(resolve, this.currentDelay * this.jumpMs));
		this.maxTries--;

		return true;
	}
}

export { IRetryStrategy, BackoffIncrementTimeStrategy, FibonacciBackoffIncrementTimeStrategy };
