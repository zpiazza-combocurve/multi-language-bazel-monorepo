const HEADER_FPD_VALUES = ['first_prod_date', 'first_prod_date_daily_calc', 'first_prod_date_monthly_calc'];

const HEADER_FPDS = [
	{ value: 'first_prod_date', label: 'First Prod Date', fpd_source: 'wells' },
	{
		value: 'first_prod_date_daily_calc',
		label: 'First Prod Date Daily',
		fpd_source: 'first_prod_date_daily_calc',
	},
	{
		value: 'first_prod_date_monthly_calc',
		label: 'First Prod Date Monthly',
		fpd_source: 'first_prod_date_monthly_calc',
	},
];

const SCHEDULE_SOURCE = { value: 'schedule', label: 'Scheduling', fpd_source: 'schedule' };

const FIXED_SOURCE = { value: 'fixed', label: 'Fixed Date', fpd_source: 'fixed' };

const FPD_SOURCES = [...HEADER_FPDS, SCHEDULE_SOURCE, FIXED_SOURCE];

const TC_REGRESSION_TYPES = [
	{ label: 'Rate', value: 'rate' },
	{ label: 'Cumulative', value: 'cum' },
];

const TC_TYPES = [
	{ label: 'Rate', value: 'rate' },
	{ label: 'Ratio', value: 'ratio' },
];

const WELL_VALIDATION_OPTIONS = [
	{ label: 'Production Volumes AND a Forecast', value: 'must_have_prod_and_forecast' },
	{ label: 'Production Volumes', value: 'must_have_prod' },
	{ label: 'Forecast', value: 'must_have_forecast' },
	{ label: 'Production Volumes OR a Forecast', value: 'either_have_prod_or_forecast' },
];

export {
	FIXED_SOURCE,
	FPD_SOURCES,
	HEADER_FPD_VALUES,
	HEADER_FPDS,
	TC_REGRESSION_TYPES,
	SCHEDULE_SOURCE,
	TC_TYPES,
	WELL_VALIDATION_OPTIONS,
};
