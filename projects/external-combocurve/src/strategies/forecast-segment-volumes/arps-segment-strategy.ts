import { arpsPrediction } from '@src/helpers/prediction-calculations/arps-prediction';
import { ForecastSegment } from '@src/models/forecast-data';
import { range } from '@src/helpers/array';

export const getArpsSegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;
	const qStart = segment.q_start ?? 0;
	const D = segment.D ?? 0;
	const b = segment.b ?? 0;

	const volumes = arpsPrediction(range(startIndex, endIndex), startIndex, qStart, D, b);

	return volumes;
};

// add a placeholder for arps incline in case logic changes in the future
export const getArpsInclineSegmentVolumes = getArpsSegmentVolumes;
