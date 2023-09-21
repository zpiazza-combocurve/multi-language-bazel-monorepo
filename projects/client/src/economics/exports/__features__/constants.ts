/**
 * INFO: this is here to detect when the export parameters unintentionally change.\
 * Update only after verifying each of these export work
 *
 * Should match file://./../ExportButton/api.ts
 */

export const loadMultipleExport = {
	'Core Headers': {
		reportType: 'oneLiner',
		fileName: 'Well_Oneline',
		_id: 'oneLiner-Core Headers',
		type: 'oneLiner',
		cashFlowReport: null,
	},
	'By Well': {
		reportType: 'cashflow-csv',
		fileName: 'Well_Cash_Flow',
		_id: 'cashflow-csv-By Well',
		type: 'cashflow-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'monthly',
		},
	},
	'Aggregate Monthly': {
		reportType: 'cashflow-agg-csv',
		fileName: 'Aggregate_Cash_Flow',
		_id: 'cashflow-agg-csv-Aggregate Monthly',
		type: 'cashflow-agg-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'monthly',
		},
	},
	'Well Oneline Cash Flow (CSV)': {
		reportType: 'oneLiner',
		fileName: 'Well_Oneline',
		_id: 'oneLiner-Core Headers',
		type: 'oneLiner',
		cashFlowReport: null,
	},
	'Well Monthly Cash Flow (CSV)': {
		reportType: 'cashflow-csv',
		fileName: 'Well_Cash_Flow',
		_id: 'cashflow-csv-By Well',
		type: 'cashflow-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'monthly',
		},
	},
	'Well Yearly Cash Flow (CSV)': {
		reportType: 'cashflow-csv',
		fileName: 'Well_Cash_Flow',
		_id: 'cashflow-csv-By Well',
		type: 'cashflow-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'yearly',
		},
	},
	'Aggregate Monthly Cash Flow (CSV)': {
		reportType: 'cashflow-agg-csv',
		fileName: 'Aggregate_Cash_Flow',
		_id: 'cashflow-agg-csv-Aggregate Monthly',
		type: 'cashflow-agg-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'monthly',
		},
	},
	'Aggregate Yearly Cash Flow (CSV)': {
		reportType: 'cashflow-agg-csv',
		fileName: 'Aggregate_Cash_Flow',
		_id: 'cashflow-agg-csv-Aggregate Yearly',
		type: 'cashflow-agg-csv',
		cashFlowReport: {
			hybridOptions: {
				months: null,
				yearType: null,
			},
			timePeriods: null,
			type: 'yearly',
		},
	},
};
export const buildByWellEconReport = {
	'Well Cash Flow (PDF)': {
		fileName: 'Well_Econ_Report',
		bfitReport: false,
		afitReport: false,
	},
};
export const buildEconReport = {
	'Aggregate Cash Flow (PDF)': {
		cashFlowReport: undefined,
		fileName: 'Econ_Report',
		bfitReport: false,
		afitReport: false,
	},
};

export const buildGhgReport = {
	'Well Carbon Report (CSV)': {
		fileName: 'Well_Carbon_Report',
	},
};
