import { BackoffIncrementTimeStrategy, FibonacciBackoffIncrementTimeStrategy } from './strategies';

describe('BackoffIncrementTimeStrategy', () => {
	it('should respect the max tries', async () => {
		// Arrange
		const strategy = new BackoffIncrementTimeStrategy(100, 5, 100);

		for (let i = 10; i >= 0; i--) {
			// Act
			const actual = await strategy.ShouldTryAgain();

			// Assert
			expect(actual).toBe(i > 5);
		}
	});

	it('should wait the correct time', async () => {
		// Arrange
		const start = Date.now();
		const strategy = new BackoffIncrementTimeStrategy(100, 5, 250);

		// Act
		for (let i = 0; i < 10; i++) {
			await strategy.ShouldTryAgain();
		}

		// Assert
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(3100);
	});
});

describe('FibonacciBackoffIncrementTimeStrategy', () => {
	it('should respect the max tries', async () => {
		// Arrange
		const strategy = new FibonacciBackoffIncrementTimeStrategy(5, 100);

		for (let i = 10; i >= 0; i--) {
			// Act
			const actual = await strategy.ShouldTryAgain();

			// Assert
			expect(actual).toBe(i > 5);
		}
	});

	it('should wait the correct time', async () => {
		// Arrange
		const start = Date.now();
		const strategy = new FibonacciBackoffIncrementTimeStrategy(5, 100);

		// Act
		for (let i = 0; i < 10; i++) {
			await strategy.ShouldTryAgain();
		}

		// Assert
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(3500);
	});
});
