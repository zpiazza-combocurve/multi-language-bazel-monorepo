import { MultipleSegments } from '@combocurve/forecast/models';
import _ from 'lodash';

import { MenuItem } from '@/components/v2/misc/SelectField';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';

import { BKey, PhaseType } from '../types';

export const DEFAULT_DAILY_RANGE = [0, 2000];

const multiSeg = new MultipleSegments();

export type TypeCurveMenuItem = MenuItem & { tooltip?: string };

export const getSeriesInfo = (savedFit, phaseType) => {
	if (!savedFit) {
		return { series: {}, validSeries: false };
	}
	const { P_dict, ratio_P_dict } = savedFit;
	const series = phaseType === 'rate' ? P_dict : ratio_P_dict;

	// HACK: enforcing 4 series for now; subject to change, needs discussion
	const validSeries = series && isValidPDict(series);
	return { series: _.cloneDeep(series), validSeries };
};

export const getShiftBaseSegments = (ratioSegments, baseSegments) => {
	if (ratioSegments?.length && baseSegments?.length) {
		const deltaT = ratioSegments[0].start_idx - baseSegments[0].start_idx;
		return multiSeg.shiftSegmentsIdx({ inputSegments: baseSegments, deltaT });
	}
	return baseSegments;
};

export const bSeriesMenuItems: Array<Pick<TypeCurveMenuItem, 'label' | 'tooltip'> & { value: BKey }> = [
	{ label: 'Well Average', value: 'average' },
	{ label: 'Well Max Bound', value: 'max' },
	{ label: 'Well Min Bound', value: 'min' },
	{ label: 'Well P50', value: 'median' },
	{ label: 'Wells Average No Forecast', value: 'colAverage' },
	{ label: 'Wells P50 No Forecast', value: 'colMedian' },
];

export const TC_MODELS: { [x in PhaseType]: Array<TypeCurveMenuItem> } = {
	rate: [
		{
			value: 'segment_arps_4_wp',
			label: 'Exp Incline + Arps (b = 2) + M Arps',
			tooltip:
				'Seg 1: Exp incline for build up period; Seg 2: Arps with b=2 for linear flow duration; Seg 3: Modified Arps',
		},
		{
			value: 'segment_arps_4_wp_free_b1',
			label: 'Exp Incline + Arps + M Arps',
			tooltip:
				'Seg 1: Exp incline for build up period; Seg 2: Arps with open b for linear flow duration; Seg 3: Modified Arps',
		},
		{
			value: 'segment_arps_inc_arps_4_wp_free_b1',
			label: 'Arps Incline + Arps + M Arps',
			tooltip:
				'Seg 1: Arps incline for build up period; Seg 2: Arps with open b for linear flow duration; Seg 3: Modified Arps',
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

export const ADD_SERIES_MENU_OPTIONS: { [x in PhaseType]: Array<TypeCurveMenuItem & { workWithMatchEur?: boolean }> } =
	{
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
				tooltip:
					'Use the Analog Well Set Production Roll-Up for a history match to generate the type curve fit',
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

export const BEST_FIT_Q_PEAK_MENU_OPTIONS: Array<TypeCurveMenuItem> = [
	{ value: 'P50', label: 'P50', tooltip: 'Same peak as wells P50 in top left chart' },
	{ value: 'average', label: 'Average', tooltip: 'Same peak as wells average in top left chart' },
	{ value: 'absolute_range', label: 'Absolute Range', tooltip: 'q peak will fall in specified absolute range' },
	{
		value: 'percentile_range',
		label: 'Percentile Range',
		tooltip: "q peak will fall in specified percentile range of all the wells' peak",
	},
];

export const TOOLTIPS = {
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
};
