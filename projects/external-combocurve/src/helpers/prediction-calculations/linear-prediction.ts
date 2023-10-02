// TODO: Look into finding a way to combine these methods for ease of use

export const linearSinglePrediction = (t: number, q0: number, t0: number, k: number): number => {
	return k * (t - t0) + q0;
};

export const linearPrediction = (ts: Array<number>, q0: number, t0: number, k: number): Array<number> => {
	return ts.map((t) => linearSinglePrediction(t, q0, t0, k));
};
