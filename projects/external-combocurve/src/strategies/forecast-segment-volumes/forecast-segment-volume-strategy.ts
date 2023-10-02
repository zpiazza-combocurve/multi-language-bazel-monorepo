import { ForecastSegment } from '@src/models/forecast-data';

export interface ForecastSegmentVolumeStrategy {
	(segment: ForecastSegment): Array<number>;
}
