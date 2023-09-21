import { postApi } from '@/helpers/routing';

export function runTypeCurveEcon({ typeCurveId, input }) {
	return postApi(`/type-curve/${typeCurveId}/runEconomics`, input);
}
