const COLUMN_TEMPLATE = {
	gross_oil_well_head_volume: {
		label: 'Gross Oil Well Head Volume',
		category: 'Gross Well Head',
		unit_key: 'oil',
	},
	gross_gas_well_head_volume: {
		label: 'Gross Gas Well Head Volume',
		category: 'Gross Well Head',
		unit_key: 'gas',
	},
	gross_boe_well_head_volume: {
		label: 'Gross BOE Well Head Volume',
		category: 'Gross Well Head',
		unit_key: 'boe',
	},
	gross_mcfe_well_head_volume: {
		label: 'Gross MCFE Well Head Volume',
		category: 'Gross Well Head',
		unit_key: 'mcfe',
	},
	gross_water_well_head_volume: {
		label: 'Gross Water Well Head Volume',
		category: 'Gross Well Head',
		unit_key: 'water',
	},
	well_count_curve: {
		label: 'Well Count Curve',
		category: 'Gross Well Head',
		unit_key: '',
	},
	gross_oil_sales_volume: {
		label: 'Gross Oil Sales Volume',
		category: 'Gross Sales',
		unit_key: 'oil',
	},
	gross_gas_sales_volume: {
		label: 'Gross Gas Sales Volume',
		category: 'Gross Sales',
		unit_key: 'gas',
	},
	gross_ngl_sales_volume: {
		label: 'Gross NGL Sales Volume',
		category: 'Gross Sales',
		unit_key: 'oil',
	},
	gross_drip_condensate_sales_volume: {
		label: 'Gross Drip Condensate Sales Volume',
		category: 'Gross Sales',
		unit_key: 'oil',
	},
	gross_boe_sales_volume: {
		label: 'Gross BOE Sales Volume',
		category: 'Gross Sales',
		unit_key: 'boe',
	},
	gross_mcfe_sales_volume: {
		label: 'Gross MCFE Sales Volume',
		category: 'Gross Sales',
		unit_key: 'mcfe',
	},
	wi_oil_sales_volume: {
		label: 'WI Oil Sales Volume',
		category: 'WI Sales',
		unit_key: 'oil',
	},
	wi_gas_sales_volume: {
		label: 'WI Gas Sales Volume',
		category: 'WI Sales',
		unit_key: 'gas',
	},
	wi_ngl_sales_volume: {
		label: 'WI NGL Sales Volume',
		category: 'WI Sales',
		unit_key: 'oil',
	},
	wi_drip_condensate_sales_volume: {
		label: 'WI Drip Condensate Sales Volume',
		category: 'WI Sales',
		unit_key: 'oil',
	},
	wi_boe_sales_volume: {
		label: 'WI BOE Sales Volume',
		category: 'WI Sales',
		unit_key: 'boe',
	},
	wi_mcfe_sales_volume: {
		label: 'WI MCFE Sales Volume',
		category: 'WI Sales',
		unit_key: 'mcfe',
	},
	net_oil_sales_volume: {
		label: 'Net Oil Sales Volume',
		category: 'Net Sales',
		unit_key: 'oil',
	},
	net_gas_sales_volume: {
		label: 'Net Gas Sales Volume',
		category: 'Net Sales',
		unit_key: 'gas',
	},
	net_ngl_sales_volume: {
		label: 'Net NGL Sales Volume',
		category: 'Net Sales',
		unit_key: 'oil',
	},
	net_drip_condensate_sales_volume: {
		label: 'Net Drip Condensate Sales Volume',
		category: 'Net Sales',
		unit_key: 'oil',
	},
	net_boe_sales_volume: {
		label: 'Net BOE Sales Volume',
		category: 'Net Sales',
		unit_key: 'boe',
	},
	net_mcfe_sales_volume: {
		label: 'Net MCFE Sales Volume',
		category: 'Net Sales',
		unit_key: 'mcfe',
	},
};

const COLLECTION_TEMPLATE = {
	stitch: { label: 'Stitch' },
	onlyForecast: { label: 'Only Forecast' },
	onlyProduction: { label: 'Only Production' },
};

const RESOLUTION_TEMPLATE = {
	monthly: { label: 'Monthly' },
	daily: { label: 'Daily' },
};

const BY_WELL_TEMPLATE = {
	byWell: { label: 'Publish Volumes By Well to BigQuery' },
};

const ROLL_UP_BATCH_YEAR_LIMIT = 20;
const ONE_DAY = 24 * 60 * 60 * 1000;

export {
	COLUMN_TEMPLATE,
	COLLECTION_TEMPLATE,
	RESOLUTION_TEMPLATE,
	BY_WELL_TEMPLATE,
	ROLL_UP_BATCH_YEAR_LIMIT,
	ONE_DAY,
};
