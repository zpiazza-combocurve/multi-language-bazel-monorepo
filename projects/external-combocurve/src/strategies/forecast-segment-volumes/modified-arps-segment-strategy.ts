import { arpsPrediction, arpsSinglePrediction } from '@src/helpers/prediction-calculations/arps-prediction';
import { D_eff_to_D } from '@src/helpers/prediction-calculations/exponential-decline';
import { exponentialPrediction } from '@src/helpers/prediction-calculations/exponential-prediction';
import { ForecastSegment } from '@src/models/forecast-data';
import { range } from '@src/helpers/array';

// eslint-disable-next-line complexity
export const getArpsModifiedSegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;
	const swIndex = segment.sw_idx ?? 0;
	const qStart = segment.q_start ?? 0;
	const D = segment.D ?? 0;
	const b = segment.b ?? 0;

	const qsw = segment.q_sw ?? arpsSinglePrediction(swIndex, startIndex, qStart, D, b);
	const D_exp = segment.D_exp ?? D_eff_to_D(segment.realized_D_eff_sw ?? 0);

	const volumes = arpsPrediction(
		range(startIndex, swIndex > endIndex ? endIndex : swIndex),
		startIndex,
		qStart,
		D,
		b,
	);

	return volumes
		.concat(exponentialPrediction(range(swIndex + 1, endIndex), swIndex, qsw, D_exp))
		.slice(0, endIndex - startIndex + 1);
};
