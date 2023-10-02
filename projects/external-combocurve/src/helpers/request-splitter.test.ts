import { splitPaginatedRequest } from './request-splitter';

describe('helpers/request-splitter', () => {
	it.each([
		[0, 0, 1, [{ resultSkip: 0, resultTake: 0 }]],
		[0, 1, 1, [{ resultSkip: 0, resultTake: 1 }]],
		[1, 0, 1, [{ resultSkip: 1, resultTake: 0 }]],
		[1, 1, 1, [{ resultSkip: 1, resultTake: 1 }]],
		[0, 1, 2, [{ resultSkip: 0, resultTake: 1 }]], // not enough take values to require extra parallel request
		[
			0,
			2,
			2,
			[
				{ resultSkip: 0, resultTake: 1 },
				{ resultSkip: 1, resultTake: 1 },
			],
		],
		[
			0,
			100,
			2,
			[
				{ resultSkip: 0, resultTake: 50 },
				{ resultSkip: 50, resultTake: 50 },
			],
		],
		[
			0,
			99,
			2,
			[
				{ resultSkip: 0, resultTake: 49 },
				{ resultSkip: 49, resultTake: 50 },
			],
		],
		[
			0,
			101,
			2,
			[
				{ resultSkip: 0, resultTake: 50 },
				{ resultSkip: 50, resultTake: 51 },
			],
		],
		[
			0,
			499,
			10,
			[
				{ resultSkip: 0, resultTake: 49 },
				{ resultSkip: 49, resultTake: 49 },
				{ resultSkip: 98, resultTake: 49 },
				{ resultSkip: 147, resultTake: 49 },
				{ resultSkip: 196, resultTake: 49 },
				{ resultSkip: 245, resultTake: 49 },
				{ resultSkip: 294, resultTake: 49 },
				{ resultSkip: 343, resultTake: 49 },
				{ resultSkip: 392, resultTake: 49 },
				{ resultSkip: 441, resultTake: 58 },
			],
		],
	])(
		'getSplitRequestPromises',
		async (
			skip: number,
			take: number,
			concurrency: number,
			expectedPromises: { resultSkip: number; resultTake: number }[],
		) => {
			const requests = splitPaginatedRequest(
				(resultSkip, resultTake) => Promise.resolve({ resultSkip, resultTake }),
				skip,
				take,
				concurrency,
			);

			const result = await Promise.all(requests.map((m) => m()));

			expect(result).toEqual(expectedPromises);
		},
	);
});
