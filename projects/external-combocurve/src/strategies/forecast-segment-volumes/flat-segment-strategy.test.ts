import { dateToIndex } from '@src/helpers/dates';
import { ForecastSegment } from '@src/models/forecast-data';

import { getFlatSegmentVolumes } from './flat-segment-strategy';

describe('strategies/forecast-segment-volumes/flat-segment-strategy', () => {
	it.each([
		[new Date('2022-01-01'), new Date('2022-01-31'), 31],
		[new Date('2022-01-01'), new Date('2022-02-01'), 32],
		[new Date('2022-01-01'), new Date('2023-01-01'), 366], // date range is inclusive
		[new Date('1999-03-17'), new Date('2023-03-17'), 8767],
		[new Date('2020-01-01'), new Date('2021-01-01'), 367], // handles leap years
	])('shouldReturnCorrectNumberOfVolumes', (startDate: Date, endDate: Date, expectedDays: number) => {
		const forecastSegment: ForecastSegment = {
			q_start: 123.45,
			start_idx: dateToIndex(startDate),
			end_idx: dateToIndex(endDate),
		};

		const volumes = getFlatSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(expectedDays);
	});

	test('shouldReturnCorrectVolumes', () => {
		const forecastSegment: ForecastSegment = {
			start_idx: dateToIndex(new Date('2022-01-01')),
			end_idx: dateToIndex(new Date('2023-01-01')),
			q_start: 123.45,
		};

		const volumes = getFlatSegmentVolumes(forecastSegment);

		expect(volumes.length).toBe(366);

		for (let i = 0; i < volumes.length; i++) {
			expect(volumes[i]).toBe(123.45);
		}
	});
});
