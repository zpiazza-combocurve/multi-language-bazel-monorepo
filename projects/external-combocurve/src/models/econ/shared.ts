export const CALCULATION = [
	'wi',
	'nri',
	'lease_nri',
	'one_minus_wi',
	'one_minus_nri',
	'one_minus_lease_nri',
	'wi_minus_one',
	'nri_minus_one',
	'lease_nri_minus_one',
	'100_pct_wi',
] as const;

export const ROWS_CALCULATION_METHOD = ['monotonic', 'non_monotonic'];

export const RATE_TYPES = ['gross_well_head', 'gross_sales', 'net_sales'] as const;
export const SHRINKAGE = ['unshrunk', 'shrunk'] as const;
export const YES_NO = ['yes', 'no'];
export type Calculation = (typeof CALCULATION)[number];
export type RateTypes = (typeof RATE_TYPES)[number];
export type RowsCalculationMethod = (typeof ROWS_CALCULATION_METHOD)[number];
export type Shrinkage = (typeof ROWS_CALCULATION_METHOD)[number];
export type YesNo = (typeof ROWS_CALCULATION_METHOD)[number];
