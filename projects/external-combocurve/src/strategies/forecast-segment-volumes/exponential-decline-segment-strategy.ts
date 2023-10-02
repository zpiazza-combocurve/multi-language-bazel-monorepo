import { exponentialPrediction } from '@src/helpers/prediction-calculations/exponential-prediction';
import { ForecastSegment } from '@src/models/forecast-data';
import { range } from '@src/helpers/array';

export const getExponentialDeclineSegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;
	const qStart = segment.q_start ?? 0;
	const D = segment.D ?? 0;

	const volumes = exponentialPrediction(range(startIndex, endIndex), startIndex, qStart, D);

	return volumes;
};

// add a placeholder for exponential incline in case logic changes in the future
export const getExponentialInclineSegmentVolumes = getExponentialDeclineSegmentVolumes;
