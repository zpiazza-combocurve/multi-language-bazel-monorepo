import { ForecastSegment } from '@src/models/forecast-data';

export const getFlatSegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;
	const qStart = segment.q_start ?? 0;

	return Array(endIndex - startIndex + 1).fill(qStart);
};
