// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { BASE_SERIES } = require('./forecasts');

const BASIC_SERIES = ['oil', 'gas', 'water'];
const RATIO_SERIES = ['gas/oil', 'oil/water', 'oil/gas', 'water/gas', 'gas/water', 'water/oil'];
const PRESSURE_SERIES = [
	'bottom_hole_pressure',
	'gas_lift_injection_pressure',
	'tubing_head_pressure',
	'flowline_pressure',
	'casing_head_pressure',
	'vessel_separator_pressure',
];
const CUM_SERIES = ['cumsum_oil', 'cumsum_gas', 'cumsum_water'];
const CUSTOM_SERIES = ['customNumber0', 'customNumber1', 'customNumber2', 'customNumber3', 'customNumber4'];

const ForecastExportSettings = {
	include: Boolean,
	start: Date,
	end: Date,
	pSeries: [{ type: String, enum: BASE_SERIES }],
	mergeWithProduction: Boolean,
};

const ProductionExportSettings = {
	include: Boolean,
	start: Date,
	end: Date,
	exportPressure: Boolean,
};

const ChartsExportSettings = {
	include: Boolean,
	documentFormat: { type: String, enum: ['pdf', 'pptx'] },
	includeParameters: Boolean,
	includeComments: Boolean,
	aries: {
		include: Boolean,
		startDate: Date,
		selectedIdKey: {
			type: String,
			enum: [
				'inptID',
				'api10',
				'api12',
				'api14',
				'chosenID',
				'aries_id',
				'phdwin_id',
				'well_name',
				'well_name_well_number',
			],
		},
		endingCondition: { type: String, enum: ['years', 'months', 'absolute_date', 'ending_rate'] },
		forecastUnit: { type: String, enum: ['per_day', 'per_month'] },
		toLife: { type: String, enum: ['yes', 'no'] },
		dataResolution: { type: String, enum: ['same_as_forecast', 'daily', 'monthly'] },
		includeOriginalForecast: Boolean,
	},
	dataSettings: {
		xAxis: { type: String, enum: ['time', 'relativeTime', 'cumsum_oil', 'cumsum_gas', 'cumsum_water'] },
		monthly: [
			{
				type: String,
				enum: [...BASIC_SERIES, ...CUM_SERIES, ...RATIO_SERIES, ...CUSTOM_SERIES],
			},
		],
		daily: [
			{
				type: String,
				enum: [...BASIC_SERIES, ...CUM_SERIES, ...RATIO_SERIES, ...PRESSURE_SERIES, ...CUSTOM_SERIES],
			},
		],
		forecast: [
			{
				type: String,
				enum: [...BASIC_SERIES, ...CUM_SERIES, ...RATIO_SERIES],
			},
		],
	},
	graphSettings: {
		enableLegend: Boolean,
		numOfCharts: { type: Number, min: 1, max: 8 }, // valid values are 1, 2, 4, 6 and 8; everything else is ignored and it defaults to 4
		xLogScale: Boolean,
		xPadding: Number,
		yLogScale: Boolean,
		yMax: Schema.Types.Mixed, // number | "all"
		yMaxPadding: Number,
		yMin: Schema.Types.Mixed, // number | "all"
		yPadding: Number,
		chartResolution: Number,
		yearsBefore: Schema.Types.Mixed, // number | "all"
		yearsPast: Schema.Types.Mixed, // number | "all"
		cumMin: Schema.Types.Mixed, // number | "all"
		cumMax: Schema.Types.Mixed, // number | "all"
	},
	headers: [String],
	projectHeaders: [String],
};

const ForecastExportSchema = new Schema(
	{
		forecast: { type: Schema.ObjectId, ref: 'forecasts', required: true, immutable: true, index: true },
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true },
		wells: { type: [{ type: Schema.ObjectId, ref: 'wells' }], immutable: true },
		description: String,
		productionMonthly: {
			file: { type: Schema.ObjectId, ref: 'files' },
			settings: ProductionExportSettings,
		},
		productionDaily: {
			file: { type: Schema.ObjectId, ref: 'files' },
			settings: ProductionExportSettings,
		},
		forecastMonthly: {
			file: { type: Schema.ObjectId, ref: 'files' },
			settings: ForecastExportSettings,
		},
		forecastDaily: {
			file: { type: Schema.ObjectId, ref: 'files' },
			settings: ForecastExportSettings,
		},
		charts: {
			file: { type: Schema.ObjectId, ref: 'files' },
			settings: ChartsExportSettings,
		},
		status: { type: String, enum: ['pending', 'complete', 'failed'] },
		createdBy: { type: Schema.ObjectId, ref: 'users', immutable: true },
	},
	{ timestamps: true }
);

module.exports = { ForecastExportSchema };
