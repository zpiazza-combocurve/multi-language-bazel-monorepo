import { Resolution } from './hooks/useOutputGraph';

export const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });

export const quarterFormatter = (value: number | 'N/A' | null) => {
	switch (value) {
		case 1:
			return 'Q1';
		case 2:
			return 'Q2';
		case 3:
			return 'Q3';
		case 4:
			return 'Q4';
		default:
			return 'N/A';
	}
};

export const scaleXFormatter = (value: string | undefined, resolution: Resolution) => {
	if (resolution === 'month') {
		if (!value) return 'N/A';
		const date = new Date();
		const [month, year] = value.split('-');
		date.setMonth(Number(month) - 1);
		return year ? `${monthFormatter.format(date)} ${year}` : monthFormatter.format(date);
	}

	if (resolution === 'quarter') {
		if (!value) return 'N/A';
		const [quarter, year] = value.split('-');
		return year ? `${quarterFormatter(Number(quarter))} ${year}` : quarterFormatter(Number(quarter));
	}

	if (resolution === 'year') return value;
};

export const getDefaultColorIndex = (limit: number) => {
	let count = -1;

	return function () {
		count++;
		if (count >= limit) {
			count = 0;
		}
		return count;
	};
};

export const getGraphMarks = (periods: string[], resolution: Resolution) =>
	periods.map((period, index) => {
		const numberOfMarksToMiss = periods.length > 10 ? Math.floor(periods.length / 10) : 1;
		const isFirstMark = index === 0;
		const isDivisibleByNumberOfMarksToMiss = index % numberOfMarksToMiss === 0;

		const addLabel = isFirstMark || isDivisibleByNumberOfMarksToMiss;

		return {
			value: index,
			label: addLabel ? scaleXFormatter(period, resolution) : '',
		};
	});
