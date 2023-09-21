import {
	ADDITIONAL_ECON_COLUMNS_AGG_CF,
	ADDITIONAL_ECON_COLUMNS_BY_WELL,
	ADDITIONAL_ECON_COLUMNS_ONE_LINER,
	AGG_HEADERS,
	BY_WELL_HEADERS,
	CUMULATIVE_ECON_COLUMNS,
	MAX_ECON_LIFE,
	MIN_ECON_LIFE,
} from '@/economics/Economics/shared/constants';
import {
	getExportButtonStatus,
	getHeadersByReportType,
	isPeriodInRange,
} from '@/economics/exports/CSVExportDialog/helpers';
import { getColumnsByReportType } from '@/economics/exports/shared/helpers';
import { fields as economicsColumns } from '@/inpt-shared/display-templates/general/economics_columns.json';

import { CashFlowReportType, CashflowOptions, ReportType, SelectedOption } from './types';

const oneLinerOutputColumns = Object.fromEntries(
	Object.keys(economicsColumns)
		.filter((key) => economicsColumns[key]?.options?.one_liner)
		.map((key) => [key, economicsColumns[key].label])
);
const monthlyOutputColumns = Object.fromEntries(
	Object.keys(economicsColumns)
		.filter((key) => economicsColumns[key]?.options?.monthly)
		.map((key) => [key, economicsColumns[key].label])
);
const aggregateOutputColumns = Object.fromEntries(
	Object.keys(economicsColumns)
		.filter((key) => economicsColumns[key]?.options?.monthly)
		.map((key) => [key, economicsColumns[key].label])
);

describe('testing getColumnsByReportType', () => {
	it('returns the correct output for "cashflow-csv" report type', () => {
		const args = {
			reportType: 'cashflow-csv' as ReportType,
			cashflowReporting: 'monthly' as CashFlowReportType,
		};
		const expectedOutput = {
			...ADDITIONAL_ECON_COLUMNS_BY_WELL,
			...monthlyOutputColumns,
			...CUMULATIVE_ECON_COLUMNS,
		};

		expect(getColumnsByReportType(args)).toEqual(expectedOutput);
	});

	it('returns the correct output for "cashflow-agg-csv" report', () => {
		const args = {
			reportType: 'cashflow-agg-csv' as ReportType,
			cashflowReporting: 'monthly' as CashFlowReportType,
		};
		const expectedOutput = {
			...ADDITIONAL_ECON_COLUMNS_AGG_CF,
			...aggregateOutputColumns,
			...CUMULATIVE_ECON_COLUMNS,
		};

		expect(getColumnsByReportType(args)).toEqual(expectedOutput);
	});

	it('returns the correct output for "oneLiner" report type', () => {
		const args = {
			reportType: 'oneLiner' as ReportType,
			cashflowReporting: 'monthly' as CashFlowReportType,
		};
		const expectedOutput = {
			...ADDITIONAL_ECON_COLUMNS_ONE_LINER,
			...oneLinerOutputColumns,
		};

		expect(getColumnsByReportType(args)).toEqual(expectedOutput);
	});

	it('returns the default output for an unknown report type', () => {
		const args = {
			reportType: undefined,
			cashflowReporting: undefined,
		};

		const expectedOutput = {
			...ADDITIONAL_ECON_COLUMNS_ONE_LINER,
			...oneLinerOutputColumns,
		};

		expect(getColumnsByReportType(args)).toEqual(expectedOutput);
	});
});

describe('testing getHeadersByReportType', () => {
	it('returns the correct output for "cashflow-agg-csv" report type', () => {
		const args = {
			reportType: 'cashflow-agg-csv' as ReportType,
		};

		expect(getHeadersByReportType(args)).toEqual(AGG_HEADERS);
	});

	const customWellHeaderLabels = { custom1: 'Custom 1', custom2: 'Custom 2' };

	it('returns the correct output for "oneLiner" report type', () => {
		const args = {
			reportType: 'oneLiner' as ReportType,
			customWellHeaderLabels,
		};

		const expectedOutput = {
			...BY_WELL_HEADERS,
			...customWellHeaderLabels,
		};

		expect(getHeadersByReportType(args)).toEqual(expectedOutput);
	});

	it('returns the correct output for "cashflow-csv" report type', () => {
		const args = {
			reportType: 'cashflow-csv' as ReportType,
			customWellHeaderLabels,
		};

		const expectedOutput = {
			...BY_WELL_HEADERS,
			...customWellHeaderLabels,
		};

		expect(getHeadersByReportType(args)).toEqual(expectedOutput);
	});

	it('returns the default output for any unknown args', () => {
		const args = {
			reportType: undefined,
		};

		const expectedOutput = {
			...BY_WELL_HEADERS,
		};

		expect(getHeadersByReportType(args)).toEqual(expectedOutput);
	});
});

describe('testing isPeriodInRange', () => {
	it('returns false if timePeriod is null', () => {
		expect(isPeriodInRange(null, 1, 10)).toBe(false);
	});

	it('returns false if timePeriod is undefined', () => {
		expect(isPeriodInRange(undefined, 1, 10)).toBe(false);
	});

	it('returns false if timePeriod is less than the minimum value', () => {
		expect(isPeriodInRange(0, 1, 10)).toBe(false);
	});

	it('returns false if timePeriod is greater than the maximum value', () => {
		expect(isPeriodInRange(11, 1, 10)).toBe(false);
	});

	it('returns true if timePeriod is within the min and max range', () => {
		expect(isPeriodInRange(5, 1, 10)).toBe(true);
	});

	it('returns true if timePeriod is equal to the min value', () => {
		expect(isPeriodInRange(1, 1, 10)).toBe(true);
	});

	it('returns true if timePeriod is equal to the max value', () => {
		expect(isPeriodInRange(10, 1, 10)).toBe(true);
	});

	it('handles negative numbers correctly', () => {
		expect(isPeriodInRange(-5, -10, 0)).toBe(true);
		expect(isPeriodInRange(-15, -10, 0)).toBe(false);
		expect(isPeriodInRange(5, -10, 0)).toBe(false);
	});
});

describe('testing getExportButtonStatus', () => {
	const selectedItems = [
		{
			key: 'itemKey',
			label: 'Item Label',
			selected: true,
			keyType: 'header',
		} as SelectedOption,
		{
			key: 'itemKey2',
			label: 'Item Label 2',
			selected: false,
			keyType: 'column',
		} as SelectedOption,
	];

	it('should return `Please select at least one column` if no items are selected', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: 5,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, [])).toBe('Please select at least one column');
	});

	it('should return empty string for "oneLiner" report type', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: 5,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('oneLiner', cashflowOptions, selectedItems)).toBe('');
	});

	it('should return `Please select a cash flow report type` if cashflowOptions type is undefined', () => {
		const cashflowOptions = {
			timePeriods: 5,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please select a cash flow report type'
		);
	});

	it('should return empty string if useTimePeriods is false', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: MIN_ECON_LIFE - 1,
			useTimePeriods: false,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe('');
	});

	it('should return empty string if timePeriods is equal to min value', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: MIN_ECON_LIFE,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe('');
	});

	it('should return true if `Please select a valid time period` is lower than the min', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: MIN_ECON_LIFE - 1,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please select a valid time period'
		);
	});

	it('should return `Please select a valid time period` if timePeriods is higher than max', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: MAX_ECON_LIFE + 1,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please select a valid time period'
		);
	});

	it('should return `Please select valid hybrid reporting options` if type is "hybrid" and hybridOptions are missing', () => {
		const cashflowOptions = {
			type: 'hybrid',
			timePeriods: 5,
			useTimePeriods: true,
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please select valid hybrid reporting options'
		);
	});

	it('should return `Please enter a valid number of months` if type is "hybrid" and hybridOptions month number is lower than min', () => {
		const cashflowOptions = {
			type: 'hybrid',
			timePeriods: 5,
			useTimePeriods: true,
			hybridOptions: {
				months: MIN_ECON_LIFE - 100,
				yearType: 'calendar',
			},
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please enter a valid number of months'
		);
	});

	it('should return `Please enter a valid number of months` if type is "hybrid" and hybridOptions month number is higher than max', () => {
		const cashflowOptions = {
			type: 'hybrid',
			timePeriods: 5,
			useTimePeriods: true,
			hybridOptions: {
				months: MAX_ECON_LIFE + 10,
				yearType: 'calendar',
			},
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe(
			'Please enter a valid number of months'
		);
	});

	it('should return empty string if all conditions are met', () => {
		const cashflowOptions = {
			type: 'monthly',
			timePeriods: 5,
			useTimePeriods: true,
			hybridOptions: {
				months: 5,
				yearType: 'calendar',
			},
		} as CashflowOptions;

		expect(getExportButtonStatus('cashflow-csv', cashflowOptions, selectedItems)).toBe('');
	});
});
