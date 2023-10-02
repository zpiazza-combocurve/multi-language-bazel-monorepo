import { ForecastSegment } from '@src/models/forecast-data';

export const getEmptySegmentVolumes = (segment: ForecastSegment): Array<number> => {
	const startIndex = segment.start_idx ?? 0;
	const endIndex = segment.end_idx ?? 0;

	return Array(Math.abs(Math.round(endIndex - startIndex)) + 1).fill(0);
};
