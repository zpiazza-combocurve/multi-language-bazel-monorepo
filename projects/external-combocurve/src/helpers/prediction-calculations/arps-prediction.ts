export const arpsSinglePrediction = (t: number, t0: number, q0: number, D: number, b: number): number => {
	return q0 * (1 + b * D * (t - t0)) ** (-1 / b);
};

export const arpsPrediction = (ts: Array<number>, t0: number, q0: number, D: number, b: number): Array<number> => {
	return ts.map((t) => arpsSinglePrediction(t, t0, q0, D, b));
};
