import { convertDateToIdx } from '../../../helpers/zing';

const TIME_REF_PROPS = {
	// includes ordering
	start: {
		options: ['absolute_idx_start', 'relative_benchmark_start', 'relative_num_start', 'relative_unit_start'],
		label: 'Start',
	},
	end: {
		options: ['absolute_idx_end', 'duration_num', 'duration_unit', 'well_life', 'q_final'],
		label: 'End',
	},
};

const METHOD_OPTIONS = {
	start: {
		default: 'absolute',
		options: [
			{
				label: 'Date',
				value: 'absolute',
			},
			{
				label: 'Relative',
				value: 'relative',
			},
		],
	},
	end: {
		default: 'well_life',
		options: [
			{
				label: 'Date',
				value: 'absolute',
			},
			{
				label: 'Duration',
				value: 'duration',
			},
			{
				label: 'Well Life',
				value: 'well_life',
			},
			{
				label: 'q Final',
				value: 'q_final',
			},
		],
	},
};

const METHOD_FIELDS = {
	start: {
		absolute: {
			absolute_idx_start: {
				default: convertDateToIdx(new Date()) - 1,
				label: 'Date',
				type: Date,
			},
		},
		relative: {
			relative_benchmark_start: {
				default: 'last_seg_start',
				label: 'Relative Start',
				type: String,
				useHeaders: true,
				options: [
					{
						headerValue: 'first_prod_date',
						label: 'First Prod Date',
						value: 'FPD',
					},
					{
						headerValue: 'first_prod_date_monthly_calc',
						label: 'FPD Monthly',
						value: 'FPD_monthly',
					},
					{
						headerValue: 'first_prod_date_daily_calc',
						label: 'FPD Daily',
						value: 'FPD_daily',
					},
					{
						headerValue: 'last_prod_date_monthly',
						label: 'EPD Monthly',
						value: 'EPD_monthly',
					},
					{
						headerValue: 'last_prod_date_daily',
						label: 'EPD Daily',
						value: 'EPD_daily',
					},
					{
						label: 'First Segment Start',
						value: 'first_seg_start',
					},
					{
						label: 'First Segment End',
						value: 'first_seg_end',
					},
					{
						label: 'Last Segment Start',
						value: 'last_seg_start',
					},
					{
						label: 'Last Segment End',
						value: 'last_seg_end',
					},
				],
			},
			relative_num_start: {
				default: 10,
				label: 'Offset',
				min: {
					day: -36525,
					month: -1200,
					year: -100,
				},
				max: {
					day: 36525,
					month: 1200,
					year: 100,
				},
				rangeReliesOn: 'relative_unit_start',
				type: Number,
			},
			relative_unit_start: {
				default: 'month',
				label: 'Units',
				type: String,
				options: [
					{
						value: 'day',
						label: 'Day',
					},
					{
						value: 'month',
						label: 'Month',
					},
					{
						value: 'year',
						label: 'Year',
					},
				],
			},
		},
	},
	end: {
		absolute: {
			absolute_idx_end: {
				default: convertDateToIdx(new Date()) + 30,
				label: 'Date',
				type: Date,
			},
		},
		duration: {
			duration_num: {
				default: 0,
				label: 'Duration',
				min: -Infinity,
				max: Infinity,
				type: Number,
			},
			duration_unit: {
				default: 'month',
				label: 'Duration Units',
				type: String,
				options: [
					{
						value: 'day',
						label: 'Day',
					},
					{
						value: 'month',
						label: 'Month',
					},
					{
						value: 'year',
						label: 'Year',
					},
				],
			},
		},
		well_life: {
			well_life: {
				default: 60,
				label: 'Well Life',
				min: 0,
				max: Infinity,
				type: Number,
				units: { oil: 'Years', gas: 'Years', water: 'Years' },
			},
		},
		q_final: {
			q_final: {
				default: 10,
				label: 'q Final',
				min: 0.1,
				max: Infinity,
				type: Number,
				units: { oil: 'BBL/D', gas: 'MCF/D', water: 'BBL/D' },
			},
		},
	},
};

const MODEL_OPTIONS = {
	arps: ['connect_to_previous', 'match_previous_slope', 'q_start', 'D_eff', 'b'],
	arps_inc: ['connect_to_previous', 'q_start', 'D_eff', 'b'],
	arps_modified: ['connect_to_previous', 'match_previous_slope', 'q_start', 'D_eff', 'b', 'target_D_eff_sw'],
	flat: ['connect_to_previous', 'q_start'],
	empty: ['q_start'],
	exp_inc: ['connect_to_previous', 'q_start', 'D_eff'],
	exp_dec: ['connect_to_previous', 'match_previous_slope', 'q_start', 'D_eff'],

	// will be implemented soon
	// linear: ['connect_to_previous', 'q_start'],
};

const MODEL_VALUES = {
	q_start: {
		default: 50,
		label: 'q Start',
		min: 0.1,
		max: Infinity,
		shouldDisable: 'connect_to_previous',
		type: Number,
		useHeaderUnits: true,
	},
	connect_to_previous: {
		default: true,
		label: 'Connect q',
		type: Boolean,
	},
	match_previous_slope: {
		default: true,
		label: 'Match Slope',
		type: Boolean,
	},
	D_eff: {
		default: { default: 10, exp_inc: -10, arps_inc: -10 },
		defaultValueReliesOn: true,
		label: 'D Effective',
		max: { default: 99.9, exp_inc: -1e-3, arps_inc: -1e-3 },
		min: { default: 1e-3, exp_inc: -Infinity, arps_inc: -Infinity },
		percent: true,
		rangeReliesOn: true,
		shouldDisable: 'match_previous_slope',
		type: Number,
		useHeaderUnits: true,
	},
	b: {
		default: { default: 1.1, arps_inc: -1 },
		defaultValueReliesOn: true,
		invalid: [1, -1],
		label: 'b',
		min: { default: 1e-5, arps_inc: -10 },
		max: { default: 10, arps_inc: -1e-5 },
		shouldDisable: 'match_previous_slope',
		rangeReliesOn: true,
		type: Number,
	},
	target_D_eff_sw: {
		default: 8,
		label: 'D Sw-Eff-Sec',
		min: 0,
		max: 99.9,
		percent: true,
		type: Number,
		shouldDisable: 'match_previous_slope',
		useHeaderUnits: true,
	},
};

export { TIME_REF_PROPS, METHOD_FIELDS, METHOD_OPTIONS, MODEL_OPTIONS, MODEL_VALUES };
