import { ForecastSegment } from '@src/models/forecast-data';
import { linearPrediction } from '@src/helpers/prediction-calculations/linear-prediction';
import { range } from '@src/helpers/array';

export const getLinearSegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;
	const qStart = segment.q_start ?? 0;
	const qEnd = segment.q_end ?? 0;

	const k = segment.k ?? getK(startIndex, endIndex, qEnd, qStart);

	return linearPrediction(range(startIndex, endIndex), qStart, startIndex, k);
};

function getK(startIndex: number, endIndex: number, qEnd: number, qStart: number) {
	// guard against divide by zero
	if (startIndex == endIndex) {
		return 0;
	}

	return (qEnd - qStart) / (endIndex - startIndex);
}
