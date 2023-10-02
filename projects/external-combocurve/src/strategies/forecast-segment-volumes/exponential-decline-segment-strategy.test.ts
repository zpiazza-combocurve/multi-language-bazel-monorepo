import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';

import { getExponentialDeclineSegmentVolumes } from './exponential-decline-segment-strategy';

import exponentialDeclineSegmentVolumes from '@test/fixtures/forecast-segment-volumes/exponential-decline-segment-volumes.json';

const tolerance = 0.000001;

describe('strategies/forecast-segment-volumes/exponential-decline-segment-strategy', () => {
	it.each([
		[new Date('2022-01-01'), new Date('2022-01-31'), 31],
		[new Date('2022-01-01'), new Date('2022-02-01'), 32],
		[new Date('2022-01-01'), new Date('2023-01-01'), 366], // date range is inclusive
		[new Date('1999-03-17'), new Date('2023-03-17'), 8767],
		[new Date('2020-01-01'), new Date('2021-01-01'), 367], // handles leap years
	])('shouldReturnCorrectNumberOfVolumes', (startDate: Date, endDate: Date, expectedDays: number) => {
		const forecastSegment: ForecastSegment = {
			D: 0.0010000000000000002,
			q_start: 1199.4376469835497,
			name: 'exp_dec',
			start_idx: dateToIndex(startDate),
			end_idx: dateToIndex(endDate),
		};

		const volumes = getExponentialDeclineSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(expectedDays);
	});

	// sample volumes taken from UI forecast volume export
	test('shouldReturnCorrectVolumes', () => {
		const forecastSegment: ForecastSegment = {
			D: 0.0010000000000000002,
			q_start: 1199.4376469835497,
			name: 'exp_dec',
			start_idx: dateToIndex(new Date('2020-08-23')),
			end_idx: dateToIndex(new Date('2023-11-21')),
		};

		const volumes = getExponentialDeclineSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(exponentialDeclineSegmentVolumes.length);

		for (let i = 0; i < volumes.length; i++) {
			expect(Math.abs(volumes[i] - exponentialDeclineSegmentVolumes[i])).toBeLessThan(tolerance);
		}
	});
});
