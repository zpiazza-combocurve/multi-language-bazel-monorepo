import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';

import { getArpsModifiedSegmentVolumes } from './modified-arps-segment-strategy';

import modifiedArpsSegmentVolumes from '@test/fixtures/forecast-segment-volumes/modified-arps-segment-volumes.json';

const tolerance = 0.000001;

describe('strategies/forecast-segment-volumes/modified-arps-segment-strategy', () => {
	it.each([
		[new Date('2022-01-01'), new Date('2022-01-15'), new Date('2022-01-31'), 31],
		[new Date('2022-01-01'), new Date('2022-01-01'), new Date('2022-01-31'), 31], // sw date same as start date
		[new Date('2022-01-01'), new Date('2022-01-31'), new Date('2022-01-31'), 31], // sw date same as end date
		[new Date('2022-01-01'), new Date('2022-01-15'), new Date('2022-02-01'), 32],
		[new Date('2022-01-01'), new Date('2022-01-15'), new Date('2023-01-01'), 366], // date range is inclusive
		[new Date('1999-03-17'), new Date('2022-01-15'), new Date('2023-03-17'), 8767],
		[new Date('2020-01-01'), new Date('2020-01-15'), new Date('2021-01-01'), 367], // handles leap years
		[new Date('2022-01-01'), new Date('2099-01-15'), new Date('2022-01-31'), 31], // handles sw date outside of range
	])('shouldReturnCorrectNumberOfVolumes', (startDate: Date, swDate: Date, endDate: Date, expectedDays: number) => {
		const forecastSegment: ForecastSegment = {
			b: 0.9,
			D: 0.0010000269878430348,
			q_start: 657.3885407616236,
			name: 'arps_modified',
			start_idx: dateToIndex(startDate),
			sw_idx: dateToIndex(swDate),
			end_idx: dateToIndex(endDate),
		};

		const volumes = getArpsModifiedSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(expectedDays);
	});

	// sample volumes taken from UI forecast volume export
	test('shouldReturnCorrectVolumes', () => {
		const forecastSegment: ForecastSegment = {
			b: 0.9,
			D: 0.0010000269878430348,
			q_start: 657.3885407616236,
			sw_idx: dateToIndex(new Date('2035-09-16')),
			name: 'arps_modified',
			start_idx: dateToIndex(new Date('2020-10-17')),
			end_idx: dateToIndex(new Date('2024-05-29')),
		};

		const volumes = getArpsModifiedSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(modifiedArpsSegmentVolumes.length);

		for (let i = 0; i < volumes.length; i++) {
			expect(Math.abs(volumes[i] - modifiedArpsSegmentVolumes[i])).toBeLessThan(tolerance);
		}
	});
});
