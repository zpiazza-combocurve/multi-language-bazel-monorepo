// TODO: Look into finding a way to combine these methods for ease of use

export const exponentialSinglePrediction = (t: number, t0: number, q0: number, D_exp: number): number => {
	return q0 * Math.exp(-D_exp * (t - t0));
};

export const exponentialPrediction = (ts: Array<number>, t0: number, q0: number, D_exp: number): Array<number> => {
	return ts.map((t) => exponentialSinglePrediction(t, t0, q0, D_exp));
};
