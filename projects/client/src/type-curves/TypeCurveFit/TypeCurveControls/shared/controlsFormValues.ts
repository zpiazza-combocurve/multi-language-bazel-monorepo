import _ from 'lodash-es';

const bSeriesMenuItems = [
	{ label: 'Well Average', value: 'average' },
	{ label: 'Well Max Bound', value: 'max' },
	{ label: 'Well Min Bound', value: 'min' },
	{ label: 'Well P50', value: 'median' },
	{ label: 'Wells Average No Forecast', value: 'colAverage' },
	{ label: 'Wells P50 No Forecast', value: 'colMedian' },
];

const TC_MODELS = {
	rate: [
		{
			value: 'segment_arps_4_wp',
			label: 'Exp Incline + Arps (b = 2) + M Arps',
			tooltip:
				'Seg 1: Exp incline for build up period; Seg 2: Arps with b=2 for linear flow duration; Seg 3: Modified Arps',
		},
		{
			value: 'segment_arps_inc_arps_4_wp_free_b1',
			label: 'Arps Incline + Arps + M Arps',
			tooltip:
				'Seg 1: Arps incline for build up period; Seg 2: Arps with open b for linear flow duration; Seg 3: Modified Arps',
		},
		{
			value: 'segment_arps_4_wp_free_b1',
			label: 'Exp Incline + Arps + M Arps',
			tooltip:
				'Seg 1: Exp incline for build up period; Seg 2: Arps with open b for linear flow duration; Seg 3: Modified Arps',
		},
		{
			value: 'exp_arps_modified_wp',
			label: 'Exp Incline + M Arps',
			tooltip: 'Seg 1: Exp incline for build up period; Seg 2: Modified Arps',
		},
		{
			value: 'exp_inc_exp_dec',
			label: 'Exp Incline + Exp Decline',
			tooltip: 'Seg 1: Exp incline; Seg 2: Exp decline',
		},
		{
			value: 'flat_arps_modified',
			label: 'Flat + M Arps',
			tooltip: 'Seg 1: Flat; Seg 2: Modified Arps',
		},
	],
	ratio: [
		{ value: 'flat', label: 'Flat' },
		{ value: 'linear', label: 'Linear' },
		{ value: 'exp_decline', label: 'Exp Decline' },
		{ value: 'exp_incline', label: 'Exp Incline' },
		{ value: 'exp_incline_flat', label: 'Exp Incline + Flat' },
		{ value: 'arps_inc', label: 'Arps Incline' },
	],
};

const TC_MODELS_VALUES = _.mapValues(TC_MODELS, (item) => _.map(item, 'value'));

const TC_MODEL_DEFAULTS = { rate: 'segment_arps_4_wp_free_b1', ratio: 'flat' };

const ADD_SERIES_MENU_OPTIONS = {
	rate: [
		{
			value: 'average',
			label: 'Average',
			tooltip: 'Use the average of the well profiles to generate the type curve fit',
			workWithMatchEur: true,
		},
		{
			value: 'collect_prod',
			label: 'Analog Well Set Production Roll-Up',
			tooltip: 'Use the Analog Well Set Production Roll-Up for a history match to generate the type curve fit',
			workWithMatchEur: false,
		},
		{
			value: 'collect_cum',
			label: 'Analog Well Set Cum Production Roll-Up',
			tooltip:
				'Use the Analog Well Set Cum Production Roll-Up for a history match to generate the type curve fit',
			workWithMatchEur: false,
		},
	],
	ratio: [{ value: 'average', label: 'Average' }],
};

const BEST_FIT_Q_PEAK_MENU_OPTIONS = [
	{ value: 'P50', label: 'P50', defaultRange: null, tooltip: 'Same peak as wells P50 in top left chart' },
	{ value: 'average', label: 'Average', defaultRange: null, tooltip: 'Same peak as wells average in top left chart' },
	{ value: 'absolute_range', label: 'Absolute Range', tooltip: 'q peak will fall in specified absolute range' },
	{
		value: 'percentile_range',
		label: 'Percentile Range',
		tooltip: "q peak will fall in specified percentile range of all the wells' peak",
	},
];

const DEFAULT_FORM_VALUES = {
	addSeries: 'average',
	addSeriesFitRange: [new Date(), new Date()],
	b0: [-1.5, -0.5],
	b: [-2, -0.001],
	b1: [0.001, 2],
	b2: [0.001, 2],
	best_fit_q_peak: { method: 'P50', range: [1, 99] },
	buildup: {
		apply_ratio: false,
		apply: true,
		buildup_ratio: 0.1,
		days: 0,
	},
	D_lim_eff: 8,
	D1_eff: [1, 99],
	D2_eff: [1, 99],
	fit_complexity: 'complex',
	minus_t_elf_t_peak: [1, 5000],
	minus_t_peak_t0: [0, 1000],
	minus_t_decline_t_0: [1, 300],
	p1_range: [-10000, 10000],
	q_final: 0.8,
	q_peak: [0, 10000],
	TC_model: 'segment_arps_4_wp_free_b1',
	well_life: 60,
	applySeries: 'average',
	q_flat: 100,
	fitToTargetData: true,
};

const TOOLTIPS = {
	align: 'Align peak production rate of all wells to a common day zero',
	normalize:
		'Normalize the production of profiles and EURs by multiplier calculated from normalization tab. This will affect most of the charts on this page. Fits must be regenerated once applied',
	eurPercentile:
		'Change fits by slight adjustments to q Start and b to match the analog well set EURs (based on SPEE guidelines)',
	resolution: 'Displays actual daily rates if available',
	dailyRange: 'The range to show daily resolution (in days)',
	best_fit_q_peak: {
		addSeriesFitRange: 'The date range over which the fit will be performed',
		method: 'Enforce a value for q Peak',
	},
	q_final: 'Will honor the one that comes first between q Final and Well Life',
	well_life: 'Will honor the one that comes first between q Final and Well Life',
	buildup: {
		apply: 'Turning on allows picking of Exp Incline segment duration',
		apply_ratio:
			'Turning on allows picking the ratio of build up magnitude (q End is fixed to q Start of 2nd segment)',
		buildup_ratio: 'Buildup ratio value, (start rate / end rate) of buildup segment',
		days: 'Number of days to build up',
	},
	fitToTargetData: "Adjust the generated curve to better fit the target well's data.",
	flatPeriodRate:
		'If fitting to target well production, this is the fixed rate during the flat period.  Otherwise, this field is ignored.',
	applySeries: 'Selection determines which series is used to fit against the target well production data.',
};

export {
	ADD_SERIES_MENU_OPTIONS,
	BEST_FIT_Q_PEAK_MENU_OPTIONS,
	bSeriesMenuItems,
	DEFAULT_FORM_VALUES,
	TC_MODEL_DEFAULTS,
	TC_MODELS_VALUES,
	TC_MODELS,
	TOOLTIPS,
};
