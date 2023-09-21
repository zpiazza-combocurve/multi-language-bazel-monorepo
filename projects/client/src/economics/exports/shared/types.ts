export type ReportType = 'oneLiner' | 'cashflow-csv' | 'cashflow-agg-csv';

export type outputColumnType = 'one_liner' | 'monthly' | 'aggregate';

export interface ColumnsByReportTypeArgs {
	reportType: ReportType;
}
