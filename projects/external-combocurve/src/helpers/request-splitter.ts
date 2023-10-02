export interface ISplitRequest<T> {
	(skip: number, take: number): Promise<T>;
}

export interface ISplicedRequest<T> {
	(): Promise<T>;
}

export function splitPaginatedRequest<T>(
	request: ISplitRequest<T>,
	skip: number,
	take: number,
	concurrency: number,
): ISplicedRequest<T>[] {
	const queries = Array<ISplicedRequest<T>>();

	let currentSkip = skip;
	let totalTaken = 0;
	const takePerRequest = Math.max(Math.floor(take / concurrency), 1);

	for (let i = 0; i < concurrency; i++) {
		let currentTake = takePerRequest;

		if (totalTaken > 0 && totalTaken >= take) {
			break;
		}

		if (i == concurrency - 1) {
			currentTake = take - totalTaken;
		}

		const captureSkip = currentSkip;
		const captureTake = currentTake;

		queries.push(() => request(captureSkip, captureTake));

		currentSkip += currentTake;
		totalTaken += currentTake;
	}

	return queries;
}
