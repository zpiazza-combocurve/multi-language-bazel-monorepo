const DATA_SERIES_LABELS = {
	average: 'Wells Average',
};

const DATA_SERIES = ['average'];
const C4_DATA_SERIES = [...DATA_SERIES, 'colAverage', 'colMedian', 'median', 'wellCount'];
const FIT_SERIES = ['P10', 'P50', 'P90', 'best'];

const TOTAL_SERIES = DATA_SERIES.length + FIT_SERIES.length;
const C4_TOTAL_SERIES = C4_DATA_SERIES.length + FIT_SERIES.length;

export { C4_DATA_SERIES, C4_TOTAL_SERIES, DATA_SERIES_LABELS, DATA_SERIES, FIT_SERIES, TOTAL_SERIES };
