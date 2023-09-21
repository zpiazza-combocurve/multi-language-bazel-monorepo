import { MultipleSegments } from '@combocurve/forecast/models';
import produce from 'immer';
import _, { round } from 'lodash';

import { MTD_DENOM } from '@/forecasts/charts/forecastChartHelper';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { createMatrix, getCumArr, sumMatrixRows } from '@/helpers/math';
import { ADD_SERIES_MENU_OPTIONS } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/controlsFormValues';
import { Align, CalculatedBackgroundDataType, FitPhaseTypes, PhaseData } from '@/type-curves/TypeCurveIndex/types';
import { generatePercentileArr } from '@/type-curves/shared/eurMath';

const multiSeg = new MultipleSegments();

// TODO: define type for well_information_s parameters

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type ResolutionResult = { idx: number[]; data: (number | null)[][]; data_part_idx: Array<[number, number, any]> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const get_align_daily_resolution = (well_information_s: any[], daily_range: number[]): ResolutionResult => {
	if (well_information_s.length === 0) {
		return { idx: [], data: [], data_part_idx: [] };
	}
	const num_month: number = well_information_s[0].monthly_prod.length;
	const well_month_INDEX_s = well_information_s.map((value) => value.indexes.maximum_data.month);
	const bp_month = Math.max(...well_month_INDEX_s);
	const ap_month = num_month - Math.min(...well_month_INDEX_s) - 1;

	const bp_idx = [...Array(bp_month).keys()].map((idx) => round(-MTD_DENOM * (idx + 1))).reverse();
	const ap_idx = [...Array(ap_month).keys()].map((idx) => round(MTD_DENOM * (idx + 1)));

	const align_month_idx = bp_idx.concat([0, ...ap_idx]);
	const align_n_col = align_month_idx.length;

	let n_leading = 0;
	let n_following = 0;

	// will n_leading and n_following always be assigned after this loop?
	for (let i = 0; i < align_month_idx.length; i++) {
		if (align_month_idx[i] >= daily_range[0]) {
			n_leading = i;
			break;
		}
	}
	for (let i = 0; i < align_month_idx.length; i++) {
		if (align_month_idx[align_n_col - i - 1] <= daily_range[1]) {
			n_following = i;
			break;
		}
	}

	const n_middle = daily_range[1] - daily_range[0] + 1;
	const leading_idx = align_month_idx.slice(0, n_leading);
	const middle_idx = [...Array(n_middle).keys()].map((value) => value + daily_range[0]);
	const following_idx = align_month_idx.slice(align_n_col - n_following);
	const idx_arr = leading_idx.concat(middle_idx).concat(following_idx);

	const align_data: (number | null)[][] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data_part_idx: Array<[number, number, any]> = [];
	for (let i = 0; i < well_information_s.length; i++) {
		const well = well_information_s[i];
		const { data, data_month_start_idx, days_in_month_arr, indexes, monthly_prod } = well;

		const well_maximum_month_INDEX = indexes.maximum_data.month;
		const well_last_month_INDEX = indexes.last_data.month;
		const well_start_idx = indexes.first_data.idx;
		const well_maximum_idx = indexes.maximum_data.idx;
		const well_last_idx = indexes.last_data.idx;
		const well_end_idx =
			data_month_start_idx[data_month_start_idx.length - 1] + days_in_month_arr[days_in_month_arr.length - 1];

		const well_first_day = indexes.first_data.day;

		const align_month_start_idx = data_month_start_idx[0] - well_maximum_idx;
		const align_start_idx = well_start_idx - well_maximum_idx;
		const align_last_idx = well_last_idx - well_maximum_idx;
		const align_end_idx = well_end_idx - well_maximum_idx;

		let data_part_left: number;
		let following_value: Array<number>;
		let leading_value: Array<number | null>;
		let middle_left_INDEX: number;
		let middle_right_INDEX: number;
		let middle_value: Array<number | null>;
		let n_month_data: number;
		if (daily_range[0] <= align_start_idx) {
			leading_value = Array(n_leading).fill(null);
			middle_value = Array(align_start_idx - daily_range[0]).fill(null);
			data_part_left = n_leading + (align_start_idx - daily_range[0]);
			middle_left_INDEX = align_start_idx - align_month_start_idx;
		} else {
			const n_leading_None = bp_month - well_maximum_month_INDEX;
			data_part_left = n_leading_None;
			n_month_data = n_leading - n_leading_None;
			leading_value = Array(n_leading_None).fill(null).concat(monthly_prod.slice(0, n_month_data));
			middle_value = [];
			middle_left_INDEX = well_first_day + (daily_range[0] - align_start_idx);
		}

		if (daily_range[1] >= align_end_idx) {
			following_value = Array(n_following).fill(0);
			middle_right_INDEX = align_end_idx - align_month_start_idx;
			middle_value = middle_value.concat(data.slice(middle_left_INDEX, middle_right_INDEX + 1));
			middle_value = middle_value.concat(Array(daily_range[1] - align_end_idx).fill(0));
		} else {
			middle_right_INDEX = daily_range[1] - align_month_start_idx;
			middle_value = middle_value.concat(data.slice(middle_left_INDEX, middle_right_INDEX + 1));

			const n_following_None = ap_month - (num_month - 1 - well_maximum_month_INDEX);
			const n_month = n_following - n_following_None;
			following_value = monthly_prod.slice(num_month - n_month).concat(Array(n_following_None).fill(0));
		}

		const align_well_last_month_INDEX = well_last_month_INDEX - well_maximum_month_INDEX;
		const align_last_month_idx = round(MTD_DENOM * align_well_last_month_INDEX);

		let data_part_right: number;
		if (align_last_idx < daily_range[0]) {
			if (align_last_month_idx <= leading_idx[leading_idx.length - 1]) {
				data_part_right = bp_month + 1 + align_well_last_month_INDEX;
			} else {
				data_part_right = n_leading;
			}
		} else if (align_last_idx > daily_range[1]) {
			if (n_following === 0) {
				data_part_right = n_leading + n_middle;
			} else if (align_last_month_idx >= following_idx[0]) {
				data_part_right = idx_arr.length - (ap_month - align_well_last_month_INDEX);
			} else {
				data_part_right = n_leading + n_middle;
			}
		} else {
			data_part_right = n_leading + (align_last_idx - daily_range[0]) + 1;
		}
		data_part_idx.push([data_part_left, data_part_right, well.has_production]);
		const value_arr = leading_value.concat(middle_value).concat(following_value);
		align_data.push(value_arr);
	}

	return { idx: idx_arr, data: align_data, data_part_idx };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const get_noalign_daily_resolution = (well_information_s: any[], daily_range: number[]): ResolutionResult => {
	if (well_information_s.length === 0) {
		return { idx: [], data: [], data_part_idx: [] };
	}
	const num_month = Math.max(...well_information_s.map(({ monthly_prod }) => monthly_prod.length));
	const noalign_data: (number | null)[][] = [];

	const monthly_idx = [...Array(num_month).keys()].map((idx) => round(MTD_DENOM * idx));
	let n_leading = 0;
	for (let i = 0; i < num_month; i++) {
		if (monthly_idx[i] >= daily_range[0]) {
			n_leading = i;
			break;
		}
	}

	let n_following = 0;
	for (let i = 0; i < num_month; i++) {
		if (monthly_idx[num_month - 1 - i] <= daily_range[1]) {
			n_following = i;
			break;
		}
	}

	const leading_idx = monthly_idx.slice(0, n_leading);

	const middle_idx = [...Array(daily_range[1] - daily_range[0] + 1).keys()].map((value) => value + daily_range[0]);
	const following_idx = monthly_idx.slice(num_month - n_following);
	const idx_arr = leading_idx.concat(middle_idx).concat(following_idx);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data_part_idx: Array<[number, number, any]> = [];
	for (let i = 0; i < well_information_s.length; i++) {
		const well = well_information_s[i];
		const { data, indexes, monthly_prod } = well;

		const fpd_INDEX = indexes.first_data.day;
		const middle_daily_values = data?.slice(daily_range[0] + fpd_INDEX, daily_range[1] + fpd_INDEX + 1);
		const leading_value = monthly_prod.slice(0, n_leading);
		const following_value = monthly_prod.slice(num_month - n_following, monthly_prod.length);
		const value_arr = leading_value.concat(middle_daily_values).concat(following_value);

		noalign_data.push(value_arr);

		const lpd_month_INDEX = indexes.last_data.month;
		const lpd_idx = indexes.last_data.idx;
		const fpd_idx = indexes.first_data.idx;

		let data_part_right: number;
		if (lpd_month_INDEX + 1 <= n_leading) {
			data_part_right = lpd_month_INDEX + 1;
		} else if (num_month - lpd_month_INDEX <= n_following) {
			data_part_right = idx_arr.length - (num_month - lpd_month_INDEX) + 1;
		} else {
			data_part_right = n_leading + (lpd_idx - fpd_idx - daily_range[0]) + 1;
		}
		data_part_idx.push([0, data_part_right, well.has_production]);
	}
	return { idx: idx_arr, data: noalign_data, data_part_idx };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const get_noalign_monthly_resolution = (well_information_s: any[]): ResolutionResult => {
	if (well_information_s.length === 0) {
		return { idx: [], data: [], data_part_idx: [] };
	}

	const num_month = Math.max(...well_information_s.map(({ monthly_prod }) => monthly_prod.length));
	const noalign_data: (number | null)[][] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data_part_idx: Array<[number, number, any]> = [];
	const idx_arr = [...Array(num_month).keys()].map((idx) => round(MTD_DENOM * idx));
	well_information_s.forEach((well) => {
		noalign_data.push(well.monthly_prod);
		data_part_idx.push([0, well.indexes.last_data.month + 1, well.has_production]);
	});

	return { idx: idx_arr, data: noalign_data, data_part_idx };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const get_align_monthly_resolution = (well_information_s: any[]): ResolutionResult => {
	if (well_information_s.length === 0) {
		return { idx: [], data: [], data_part_idx: [] };
	}
	const num_month = well_information_s[0].monthly_prod.length;
	const well_month_INDEX_s = well_information_s.map((value) => value.indexes.maximum_data.month);
	const bp_month = Math.max(...well_month_INDEX_s);
	const ap_month = num_month - Math.min(...well_month_INDEX_s) - 1;

	const bp_idx = [...Array(bp_month).keys()].map((idx) => round(-MTD_DENOM * (idx + 1))).reverse();
	const ap_idx = [...Array(ap_month).keys()].map((idx) => round(MTD_DENOM * (idx + 1)));

	const align_month_idx = bp_idx.concat([0, ...ap_idx]);
	const align_n_col = align_month_idx.length;

	const align_data: (number | null)[][] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data_part_idx: Array<[number, number, any]> = [];
	well_information_s.forEach((well) => {
		const this_data = well.monthly_prod;
		const indexes = well.indexes;
		const delta = bp_month - indexes.maximum_data.month;
		const this_left_range = indexes.first_data.month + delta;
		const this_range = [this_left_range, this_left_range + num_month];
		let this_align_data = Array(this_range[0]).fill(null);
		const this_following_data = Array(align_n_col - this_range[0] - num_month).fill(0);
		this_align_data = this_align_data.concat(this_data).concat(this_following_data);
		// leave this line here for error checking
		// this_align_data.splice(this_range[0], num_month, ...this_data);
		align_data.push(this_align_data);
		data_part_idx.push([this_left_range, indexes.last_data.month + 1 + delta, well.has_production]);
	});
	return { idx: align_month_idx, data: align_data, data_part_idx };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const TC_ratio_predict = (raw_t: any[], ratio_segments: any[], base_TC_segments: any[]): (number | null)[] => {
	if (ratio_segments.length === 0 || base_TC_segments.length === 0) {
		return Array(raw_t.length).fill(0);
	}

	const deltaT = ratio_segments[0].start_idx - base_TC_segments[0].start_idx;
	const align_base_TC_segments = multiSeg.shiftSegmentsIdx({ inputSegments: base_TC_segments, deltaT });

	return multiSeg.predictTimeRatio({
		idxArr: raw_t,
		ratioTSegments: ratio_segments,
		baseSegments: align_base_TC_segments,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		toFill: 0 as any,
	});
};

// to determine if an array of multipliers is 2f, find the first element that has multipliers and if it has both it is 2f
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getNormMethodFromMultipliers = (multipliers: any[]): string | undefined => {
	const multiplierData = multipliers.find(
		(multiplierValues) => Boolean(multiplierValues[0]) || Boolean(multiplierValues[1])
	);

	if (multiplierData?.[0] && multiplierData?.[1]) {
		return 'eurAndQPeak';
	} else if (multiplierData?.[0]) {
		return 'eur';
	} else if (!isNaN(multipliers?.[0])) {
		return 'proximity';
	} else {
		return 'none';
	}
};

// TODO: define type for method parameters
// multipliers should be [eur, qPeak] in normalization array, or simple array of numbers
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const applyNormalization = (data: any[], normalization: any[]) => {
	// Just like python, we'll give access to this function via either objects or arrays.
	const _normalization =
		normalization && normalization.length && (normalization[0].eur || normalization[0].qPeak)
			? normalization.map((norms) => [norms.eur, norms.qPeak])
			: normalization;
	const normMethod = getNormMethodFromMultipliers(_normalization);

	if (!data || data.length === 0 || normMethod === 'none') {
		return data;
	} else if (normMethod === 'eurAndQPeak') {
		// value ** eur * qPeak
		return data.map((d, i) =>
			d.map((v) => (v === null ? null : v ** (_normalization[i][0] ?? 1) * (_normalization[i][1] ?? 1)))
		);
	} else if (normMethod === 'eur') {
		// value * eur
		return data.map((d, i) => d.map((v) => (v === null ? null : v * (_normalization[i][0] ?? 1))));
	} else if (normMethod === 'proximity') {
		// simple array of multipliers
		return data.map((d, i) => d.map((v) => (v === null ? null : v * _normalization[i])));
	} else {
		throw new Error('Only one or two factor normalizations are currently supported.');
	}
};

const getCumData = (backgroundData: CalculatedBackgroundDataType, normalize: boolean) => {
	const { normalization: normArr } = backgroundData;
	const { idx, cum_subind } = backgroundData.cum_dict;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const output: any = { idx, cum_subind, sum: [], cum: [] };

	if (cum_subind.length === 0 || !idx || idx.length === 0) {
		return output;
	}

	const applyNormalize = normalize && normArr.length === cum_subind.length;

	const {
		monthly_prod: { data },
	} = backgroundData;

	let matrix = createMatrix(cum_subind.length, idx.length);
	for (let wellIdx = 0; wellIdx < cum_subind.length; wellIdx++) {
		const [leftIdx, rightIdx] = cum_subind[wellIdx];
		let zeroIdx = 0;
		matrix[wellIdx] = matrix[wellIdx].map((val, colIdx) => {
			if (colIdx >= leftIdx && colIdx < rightIdx) {
				return data[wellIdx][zeroIdx++];
			}

			return val;
		});
	}
	matrix = applyNormalize ? applyNormalization(matrix, normArr) : matrix;

	const sumArr = sumMatrixRows(matrix);
	const cumArr = getCumArr(sumArr);

	output.sum = sumArr;
	output.cum = cumArr;
	return output;
};

const getEurData = (backgroundData: CalculatedBackgroundDataType, normalize: boolean) => {
	const { eur, multipliers } = backgroundData;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const output: any = { eur };
	if (normalize && eur && multipliers && eur.length === multipliers.length) {
		output.eur = eur.map((v, i) => (v === null ? null : v * (multipliers[i].eur ?? 1)));
	}
	output.percentile = generatePercentileArr([...output.eur]);
	return output;
};

const getProdData = (backgroundData: CalculatedBackgroundDataType, normalize: boolean) => {
	const { align, noalign, normalization } = backgroundData;
	const original = { align, noalign };
	if (!normalize) {
		return original;
	}

	return _.mapValues(original, (datum) => ({
		...datum,
		data: datum ? applyNormalization(datum.data, normalization) : datum,
	}));
};

const applyNormToRatioData = (
	backgroundData: CalculatedBackgroundDataType,
	normalize: boolean
): CalculatedBackgroundDataType => {
	// rate phases won't have target_phase
	const targetPhaseData = backgroundData.target_phase;
	if (!normalize || !targetPhaseData) {
		return backgroundData;
	}

	return produce(backgroundData, (draft) => {
		draft.target_phase = _.mapValues(targetPhaseData, (datum) => ({
			...datum,
			data: datum ? applyNormalization(datum.data, backgroundData.normalization) : datum,
		}));
	});
};

const getMonthlyTargetPhaseData = (backgroundData: CalculatedBackgroundDataType, isRate = true, normalize: boolean) => {
	if (!isRate) {
		const noalign_monthly_prod = backgroundData?.targetPhase?.noalign;
		return { align: null, noalign: noalign_monthly_prod };
	}

	const { monthly_prod, normalization, align_monthly_prod } = backgroundData;
	if (!normalize) {
		return { align: align_monthly_prod, noalign: monthly_prod };
	}

	return {
		align: align_monthly_prod
			? {
					...align_monthly_prod,
					data: applyNormalization(align_monthly_prod.data, normalization),
			  }
			: null,
		noalign: {
			...monthly_prod,
			data: applyNormalization(monthly_prod.data, normalization),
		},
	};
};

// TODO: definve fit parameter type
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getProdFit = (fit: any, fitKey: 'after' | 'before' = 'before') => {
	const output = { ...fit.percentile[fitKey] };
	output.best = ADD_SERIES_MENU_OPTIONS.rate
		.map(({ value, workWithMatchEur }) => (workWithMatchEur ? fit?.[value]?.[fitKey] : fit?.[value]))
		.filter((x) => x)[0];

	return output;
};

const getPhaseData = ({
	align,
	calculatedBackgroundData,
	fitPhaseType,
	normalize,
}: {
	align: Align;
	calculatedBackgroundData: Record<Phase, CalculatedBackgroundDataType | null>;
	fitPhaseType: FitPhaseTypes;
	normalize: boolean;
}): PhaseData =>
	_.mapValues(calculatedBackgroundData, (data, dataPhase) => {
		if (data) {
			const phaseType = fitPhaseType?.[dataPhase];
			const { align: alignData, noalign: noalignData } = getMonthlyTargetPhaseData(
				data,
				phaseType === 'rate',
				normalize
			);
			return {
				alignMonthlyTargetPhaseData: alignData,
				cumData: getCumData(data, normalize),
				eurData: getEurData(data, normalize),
				noalignMonthlyTargetProdData: noalignData,
				prodData: getProdData(data, phaseType === 'rate' && normalize)[
					phaseType === 'rate' ? align : 'noalign'
				],
			};
		}
		return null;
	});

export {
	applyNormalization,
	get_align_daily_resolution,
	get_align_monthly_resolution,
	get_noalign_daily_resolution,
	get_noalign_monthly_resolution,
	getCumData,
	getEurData,
	getMonthlyTargetPhaseData,
	getPhaseData,
	getProdData,
	getProdFit,
	applyNormToRatioData,
	TC_ratio_predict,
};
