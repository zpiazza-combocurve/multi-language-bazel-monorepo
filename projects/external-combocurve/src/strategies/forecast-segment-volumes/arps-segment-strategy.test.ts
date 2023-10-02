import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';

import { getArpsSegmentVolumes } from './arps-segment-strategy';

import arpsSegmentVolumes from '@test/fixtures/forecast-segment-volumes/arps-segment-volumes.json';

const tolerance = 0.000001;

describe('strategies/forecast-segment-volumes/arps-segment-strategy', () => {
	it.each([
		[new Date('2022-01-01'), new Date('2022-01-31'), 31],
		[new Date('2022-01-01'), new Date('2022-02-01'), 32],
		[new Date('2022-01-01'), new Date('2023-01-01'), 366], // date range is inclusive
		[new Date('1999-03-17'), new Date('2023-03-17'), 8767],
		[new Date('2020-01-01'), new Date('2021-01-01'), 367], // handles leap years
	])('shouldReturnCorrectNumberOfVolumes', (startDate: Date, endDate: Date, expectedDays: number) => {
		const forecastSegment: ForecastSegment = {
			b: 0.9,
			D: 0.0010000269878430348,
			q_start: 708.1403909250193,
			name: 'arps',
			start_idx: dateToIndex(startDate),
			end_idx: dateToIndex(endDate),
		};

		const volumes = getArpsSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(expectedDays);
	});

	// sample volumes taken from UI forecast volume export
	test('shouldReturnCorrectVolumes', () => {
		const forecastSegment: ForecastSegment = {
			b: 0.9,
			D: 0.0010000269878430348,
			q_start: 708.1403909250193,
			name: 'arps',
			start_idx: dateToIndex(new Date('2020-01-31')),
			end_idx: dateToIndex(new Date('2023-03-11')),
		};

		const volumes = getArpsSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(arpsSegmentVolumes.length);

		for (let i = 0; i < volumes.length; i++) {
			expect(Math.abs(volumes[i] - arpsSegmentVolumes[i])).toBeLessThan(tolerance);
		}
	});
});
