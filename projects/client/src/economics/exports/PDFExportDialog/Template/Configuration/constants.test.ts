import {
	ALL_COLUMNS,
	DISCOUNT_DETAILS,
	EXTRA_HEADERS,
	ONELINE_METRICS_AGG,
	ONELINE_METRICS_BY_WELL,
	REPORT_DETAILS,
	TIME_SERIES_METRICS,
	removeUnits,
} from './constants';
import { discountDetails } from './constants/discountDetails';
import { extraHeaders } from './constants/extraHeaders';
import { onelineMetricsLabelsAgg, onelineMetricsLabelsByWell } from './constants/onelineMetrics';
import { reportDetails } from './constants/reportDetails';
import { timeSeriesMetrics } from './constants/timeSeriesMetrics';

const allLabelsWithoutUnits = Object.values(ALL_COLUMNS).map(removeUnits);

test('oneline metrics have expected labels', () => {
	for (const header of onelineMetricsLabelsByWell) {
		expect(allLabelsWithoutUnits).toContain(removeUnits(header));
		expect(Object.values(ONELINE_METRICS_BY_WELL)).toContain(removeUnits(header));
	}

	for (const header of onelineMetricsLabelsAgg) {
		expect(Object.values(ONELINE_METRICS_AGG)).toContain(removeUnits(header));
	}
});

test('report details have expected labels', () => {
	for (const header of reportDetails) {
		expect(allLabelsWithoutUnits).toContain(removeUnits(header));
		expect(Object.values(REPORT_DETAILS)).toContain(removeUnits(header));
	}
});

test('time series metrics have expected labels', () => {
	for (const header of timeSeriesMetrics) {
		expect(allLabelsWithoutUnits).toContain(removeUnits(header));
		expect(Object.values(TIME_SERIES_METRICS)).toContain(removeUnits(header));
	}
});

test('extra headers have expected labels', () => {
	for (const header of extraHeaders) {
		expect(allLabelsWithoutUnits).toContain(removeUnits(header));
		expect(Object.values(EXTRA_HEADERS)).toContain(removeUnits(header));
	}
});

test('discount details have expected labels', () => {
	for (const header of discountDetails) {
		expect(allLabelsWithoutUnits).toContain(removeUnits(header));
		expect(Object.values(DISCOUNT_DETAILS)).toContain(removeUnits(header));
	}
});
