import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';

import { getLinearSegmentVolumes } from './linear-segment-strategy';

import linearSegmentVolumes from '@test/fixtures/forecast-segment-volumes/linear-segment-volumes.json';

const tolerance = 0.000001;

describe('strategies/forecast-segment-volumes/linear-segment-strategy', () => {
	it.each([
		[new Date('2022-01-01'), new Date('2022-01-31'), 31],
		[new Date('2022-01-01'), new Date('2022-02-01'), 32],
		[new Date('2022-01-01'), new Date('2023-01-01'), 366], // date range is inclusive
		[new Date('1999-03-17'), new Date('2023-03-17'), 8767],
		[new Date('2020-01-01'), new Date('2021-01-01'), 367], // handles leap years
	])('shouldReturnCorrectNumberOfVolumes', (startDate: Date, endDate: Date, expectedDays: number) => {
		const forecastSegment: ForecastSegment = {
			D: 0.0010000269878430348,
			q_start: 57.5,
			q_end: 635,
			name: 'linear',
			start_idx: dateToIndex(startDate),
			end_idx: dateToIndex(endDate),
		};

		const volumes = getLinearSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(expectedDays);
	});

	// sample volumes taken from UI forecast volume export
	test('shouldReturnCorrectVolumes', () => {
		const forecastSegment: ForecastSegment = {
			D: 0.0010000269878430348,
			q_start: 57.5,
			q_end: 635,
			name: 'linear',
			start_idx: dateToIndex(new Date('2020-08-13')),
			end_idx: dateToIndex(new Date('2023-10-12')),
		};

		const volumes = getLinearSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(linearSegmentVolumes.length);

		for (let i = 0; i < volumes.length; i++) {
			expect(Math.abs(volumes[i] - linearSegmentVolumes[i])).toBeLessThan(tolerance);
		}
	});
});
