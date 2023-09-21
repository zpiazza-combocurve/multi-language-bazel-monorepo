import {
	ALL_ADDITIONAL_COLUMNS,
	CUMULATIVE_ECON_COLUMNS,
	PDF_DISCOUNT_DETAILS,
	WELL_COUNT_COLUMNS,
} from '@/economics/Economics/shared/constants';
import { fields as ECON_COLUMNS } from '@/inpt-shared/display-templates/general/economics_columns.json';

import { discountDetails } from './constants/discountDetails';
import { extraHeaders } from './constants/extraHeaders';
import { onelineMetricsLabelsAgg, onelineMetricsLabelsByWell } from './constants/onelineMetrics';
import { reportDetails } from './constants/reportDetails';
import { timeSeriesMetrics } from './constants/timeSeriesMetrics';

export function removeUnits(label) {
	const [, labelWithoutUnit] = label.match(/^(.*) \(\S*\)$/) ?? [null, label];
	return labelWithoutUnit;
}

export const ALL_COLUMNS = {
	...CUMULATIVE_ECON_COLUMNS,
	...ALL_ADDITIONAL_COLUMNS,
	...WELL_COUNT_COLUMNS,
	time: 'Time',
	agg_date: 'Aggregation Date',
	...Object.fromEntries(Object.entries(ECON_COLUMNS).map(([key, { label }]) => [key, label])),
	...PDF_DISCOUNT_DETAILS,
};

const labelToKey = Object.fromEntries(Object.entries(ALL_COLUMNS).map(([key, label]) => [removeUnits(label), key]));

function fromLabels(labels: string[]) {
	return labels.reduce((acc, label) => {
		const labelWithoutUnit = removeUnits(label);
		acc[labelToKey[labelWithoutUnit]] = labelWithoutUnit;
		return acc;
	}, {});
}

export const REPORT_DETAILS = fromLabels(reportDetails);

export const ONELINE_METRICS_BY_WELL = fromLabels(onelineMetricsLabelsByWell);
export const ONELINE_METRICS_AGG = fromLabels(onelineMetricsLabelsAgg);

export const TIME_SERIES_METRICS = fromLabels(timeSeriesMetrics);

export const EXTRA_HEADERS = fromLabels(extraHeaders);

export const DISCOUNT_DETAILS = fromLabels(discountDetails);
