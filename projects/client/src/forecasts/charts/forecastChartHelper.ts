import { arpsD2Deff, convertDateToIdx, convertIdxToDate, convertIdxToMilli } from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import { getDaysInMonth } from 'date-fns';
import _ from 'lodash';

import { clone, genDate, numberWithCommas } from '../../helpers/utilities';
import { Phase } from '../forecast-form/automatic-form/types';

const multiSeg = new MultipleSegments();
// constants
const DAYS_IN_YEAR = 365.25;
// plans are to obsolete MTD_DENOM. However, it is required to scale daily rates to monthly rates and keep a smooth curve.
const MTD_DENOM = 30.4375;

const PHASE_UNITS = {
	all: 'BBL/D & MCF/D',
	oil: 'BBL/D',
	gas: 'MCF/D',
	water: 'BBL/D',
};

const visualTimeArr = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segment: any,
	resolution: number,
	finalIdx: number,
	beginIdx: number | null = null
): number[] => {
	const { start_idx, end_idx, name } = segment;
	const parsedResolution = resolution ?? 1;

	let startIdx: number;
	if (Number.isFinite(beginIdx)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		startIdx = Math.max(start_idx, beginIdx!);
	} else {
		startIdx = start_idx;
	}

	const endIdx = Math.min(end_idx, finalIdx);

	let timeArr: number[] = [];

	if (finalIdx > startIdx) {
		switch (name) {
			case 'empty':
				timeArr = [startIdx, endIdx];
				break;
			case 'flat':
				timeArr = [startIdx, endIdx];
				break;
			case 'exp_inc':
				for (let i = startIdx; i < endIdx; i += parsedResolution) {
					timeArr.push(i);
				}
				timeArr.push(endIdx);
				break;
			case 'arps_modified': {
				const { sw_idx } = segment;
				const swIdx = Math.floor(sw_idx);
				for (let i = startIdx; i < endIdx; ) {
					timeArr.push(i);
					const multiplier = Math.ceil((i - startIdx) / 90) + 1;
					const nexti = i + parsedResolution * multiplier;
					if (i < swIdx && swIdx < nexti && swIdx < endIdx) {
						timeArr.push(swIdx);
					}
					i = nexti;
				}
				timeArr.push(endIdx);
				break;
			}
			default:
				for (let i = startIdx; i < endIdx; ) {
					timeArr.push(i);
					const multiplier = Math.ceil((i - startIdx) / 90) + 1;
					i += parsedResolution * multiplier;
				}
				timeArr.push(endIdx);
		}
	}

	return timeArr;
};

const genSeriesData = ({
	beginIdx = 0,
	chartResolution,
	index = false,
	relative = false,
	relativeIdx = null,
	segments,
}: {
	beginIdx: number | null;
	chartResolution: number;
	index: boolean;
	relative: boolean;
	relativeIdx: number | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segments: any[];
}) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let values: any = [];
	const endIdx = segments[segments.length - 1].end_idx;

	for (let i = 0, len = segments.length; i < len; i++) {
		const segment = segments[i];
		const timeArr = visualTimeArr(segment, chartResolution, endIdx, beginIdx);

		const segTemp = multiSeg.predict({ idxArr: timeArr, segments: [segment] });
		values = values.concat(
			timeArr.map((timeVal, j) => {
				let time: number;
				if (index) {
					if (relative && relativeIdx) {
						time = timeVal - relativeIdx;
					} else {
						time = timeVal;
					}
				} else {
					time = convertIdxToMilli(timeVal);
				}

				return [time, segTemp[j]];
			})
		);
	}

	return values;
};

const getCumProd = (
	production: Record<string, Array<number | null>> | null,
	phase: Phase,
	resolution = 'monthly'
): number => {
	const values = production?.[phase];
	if (values) {
		if (resolution === 'daily') {
			return _.sum(values);
		}

		// if monthly, use days in that month to determine monthly cum
		const timeArr = production?.index;
		if (timeArr?.length) {
			return _.reduce(
				timeArr,
				(acc, timeIdx, index) => {
					const curVal = values[index];
					return timeIdx && curVal ? acc + getDaysInMonth(convertIdxToDate(timeIdx)) * curVal : acc;
				},
				0
			);
		}
	}

	return 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getEndDataIdx = (production: Record<string, any> | null): number => {
	if (production) {
		const { index } = production;
		return index[index.length - 1];
	}

	// apply negative endDataIdx for fit on fit-tc; 100,000 days is safe enough
	return -100000;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getEurProps = (production: Record<string, any> | null, phase: Phase, resolution = 'monthly') => {
	const cum_data = production ? getCumProd(production, phase, resolution) : 0;
	const end_data_idx = production ? getEndDataIdx(production) : 0;
	return { cum_data, end_data_idx, value: 0 };
};

const getLPD = (production: { index?: Array<number> }) => {
	const index = production?.index;
	return index?.length ? index[index.length - 1] : 0;
};

const calcWellLifeVal = ({
	production,
	segments,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segments?: any[];
}): { total: number; remaining: number } => {
	const todayIndex = convertDateToIdx(new Date());
	if (production && segments?.length) {
		const right_idx = Math.max(getLPD(production), segments[segments.length - 1].end_idx);
		return {
			total: (right_idx - production.index[0]) / DAYS_IN_YEAR,
			remaining: Math.max(right_idx - todayIndex, 0) / DAYS_IN_YEAR,
		};
	}
	if (!production && segments?.length) {
		const left_idx = segments[0].start_idx;
		const right_idx = segments[segments.length - 1].end_idx;
		return {
			total: (right_idx - left_idx) / DAYS_IN_YEAR,
			remaining: Math.max(right_idx - todayIndex, 0) / DAYS_IN_YEAR,
		};
	}
	if (!segments?.length && production) {
		const right_idx = getLPD(production);
		return {
			total: (right_idx - production.index[0]) / DAYS_IN_YEAR,
			remaining: Math.max(right_idx - todayIndex, 0) / DAYS_IN_YEAR,
		};
	}
	return { total: 0, remaining: 0 };
};

const validBFactorModels = ['arps_modified', 'arps', 'arps_inc'];

const defaultBFactor = {
	arps_modified: { min: 1e-5, max: Infinity, default: 0.9 },
	arps: { min: 1e-5, max: Infinity, default: 0.9 },
	arps_inc: { min: -Infinity, max: -1e-5, default: -0.9 },
};

const defaultD = {
	arps_modified: 0.001,
	arps: 0.001,
	arps_inc: -0.001,
	exp_dec: 0.001,
	exp_inc: -0.001,
	linear: 0.5,
};

const generateDefaultParams = ({
	segmentName,
	refIdx,
	q_ref,
	years = 5,
	addToEnd = true,
	b: bIn = null,
	D: Din = null,
}: {
	segmentName: string;
	refIdx: number;
	q_ref: number;
	years: number;
	addToEnd?: boolean;
	b?: number | null;
	D?: number | null;
}) => {
	let start_idx: number;
	let end_idx: number;

	// refIdx is either the start_idx of the first segment or the end_idx of the last segment
	if (addToEnd) {
		start_idx = refIdx + 1;
		end_idx = refIdx + (365 * years + 1);
	} else {
		start_idx = refIdx - (365 * years + 1);
		end_idx = refIdx - 1;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const common: any = { start_idx, end_idx, name: segmentName };
	if (addToEnd) {
		// immediately connects the q values if adding to the end of the series
		common.q_start = q_ref;
	} else {
		common.q_start = q_ref + 50;
	}

	const b = validBFactorModels.includes(segmentName) ? bIn ?? defaultBFactor[segmentName]?.default : null;
	const D = Din ?? defaultD?.[segmentName];
	const bases = {
		arps_modified: { ...common, D_eff: arpsD2Deff(Math.abs(D), b), b, target_D_eff_sw: 0.06 },
		arps: { ...common, D_eff: arpsD2Deff(Math.abs(D), b), b },
		arps_inc: { ...common, D_eff: arpsD2Deff(-Math.abs(D), -b), b },
		empty: { ...common },
		exp_dec: { ...common, D: Math.abs(D) },
		exp_inc: { ...common, D: -Math.abs(D) },
		flat: { ...common, c: q_ref },
		linear: { ...common, k: D },
	};

	return bases[segmentName];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getPrevQValue = (series: any[], direction: 1 | -1 = 1): number => {
	if (direction !== 1 && direction !== -1) {
		throw new Error('Direction must be 1 or -1');
	}

	const isPositive = direction > 0;
	const defaultQ = isPositive ? 100 : 1;
	if (series?.length) {
		let curIdx = direction < 0 ? series.length - 1 : 0;
		let prev = series[curIdx];

		while (prev && prev.name === 'empty') {
			curIdx += direction;
			prev = series[curIdx];
		}
		const prevVal = isPositive ? prev?.q_start : prev?.q_end;
		return prev ? prevVal : defaultQ;
	}

	return defaultQ;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getPrevBFactor = (name: string, series?: any[], direction: 1 | -1 = 1): number | null => {
	if (direction !== 1 && direction !== -1) {
		throw new Error('Direction must be 1 or -1');
	}

	if (validBFactorModels.includes(name) && series?.length) {
		let curIdx = direction < 0 ? series.length - 1 : 0;
		let prev = series[curIdx];

		while (prev && !validBFactorModels.includes(prev.name)) {
			curIdx += direction;
			prev = series[curIdx];
		}

		const { min, max, default: defaultValue } = defaultBFactor[name];

		const prevB = prev?.b;
		return prevB > min && prevB < max ? prevB : defaultValue;
	}

	return null;
};

const seriesSlopes = {
	arps: -1,
	arps_modified: -1,
	exp_dec: -1,
	arps_inc: 1,
	exp_inc: 1,
	flat: 0,
	empty: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getPrevD = (name: string, series?: any[]) => {
	if (series?.length) {
		const {
			segmentObjects: [prevSeg],
		} = new MultipleSegments([series[series.length - 1]]);
		if (name === 'linear') {
			return prevSeg.firstDerivative([prevSeg.segment.end_idx])[0];
		}
		if (seriesSlopes?.[name] === prevSeg.segment.slope) {
			return prevSeg.firstDerivative([prevSeg.segment.end_idx])[0] / prevSeg.segment.q_end;
		}
	}
	return null;
};

const generateFirstSegment = ({
	name,
	series,
	years = 0.25,
	relativeTime = false,
}: {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	series?: any[];
	years?: number;
	relativeTime?: boolean;
}) => {
	if (series?.length) {
		const firstStartIdx = series[0].start_idx;
		const q_ref = getPrevQValue(series, 1);
		const b = getPrevBFactor(name, series, 1);
		return multiSeg.generateDefaultSegment(
			generateDefaultParams({
				segmentName: name,
				refIdx: firstStartIdx,
				q_ref,
				years,
				addToEnd: false,
				b,
			}),
			relativeTime
		);
	}

	return multiSeg.generateDefaultSegment(
		generateDefaultParams({
			segmentName: name,
			refIdx: convertDateToIdx(new Date()),
			q_ref: 500,
			years,
			addToEnd: false,
		}),
		relativeTime
	);
};

const generateNextSegment = ({
	name,
	series,
	years = 5,
	relativeTime = false,
}: {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	series?: any[];
	years?: number;
	relativeTime?: boolean;
}) => {
	if (series?.length) {
		const lastEndIdx = series[series.length - 1].end_idx;
		const q_ref = getPrevQValue(series, -1);
		const b = getPrevBFactor(name, series, -1);
		const D = getPrevD(name, series);
		return multiSeg.generateDefaultSegment(
			generateDefaultParams({
				segmentName: name,
				refIdx: lastEndIdx,
				q_ref,
				years,
				b,
				D,
			}),
			relativeTime
		);
	}

	return multiSeg.generateDefaultSegment(
		generateDefaultParams({
			segmentName: name,
			refIdx: relativeTime ? 0 : convertDateToIdx(new Date()),
			q_ref: 500,
			years,
		}),
		relativeTime
	);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const scaleSeries = (series: any[], eur_ratio: any, paramKey = 'segments') => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const output: any = {};
	Object.keys(eur_ratio).forEach((p) => {
		output[p] = { diagnostics: {} };
		output[p][paramKey] = series.map((segment) => {
			const seg = clone(segment);
			Object.keys(seg).forEach((param) => {
				if (param === 'c' || param === 'q_start' || param === 'q_end' || param === 'q_sw') {
					seg[param] *= eur_ratio[p];
				}
			});

			return seg;
		});
	});

	return output;
};

const genViewValue = (type: string, value: number, round?: number, idxDate = false): string => {
	let output: string;
	if (!Number.isFinite(value)) {
		return 'N/A';
	}

	switch (type) {
		case 'Number':
			output = numberWithCommas(value.toFixed(round));
			break;
		case 'Percent':
			output = `${numberWithCommas((value * 100).toFixed(round))}`;
			break;
		case 'Date':
			output = idxDate
				? `${numberWithCommas(value.toFixed(round))}`
				: genDate(convertIdxToDate(Math.floor(value)), { convertToLocal: false });
			break;
		default:
			output = 'N/A';
	}

	return output;
};

const genFallbackSeries = (startIdx: number | null = null, relativeTime = false) => {
	const segment = multiSeg.generateDefaultSegment(
		{
			...generateDefaultParams({
				segmentName: 'arps_modified',
				refIdx: startIdx === null ? convertDateToIdx(new Date()) : startIdx - 1,
				q_ref: 1000,
				years: 60,
			}),
			name: 'arps_modified',
		},
		relativeTime
	);

	return [segment];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getSwPlaceIndex = (timeArr: number[], segment: any): number | null => {
	if (segment?.name !== 'arps_modified') {
		return null;
	}
	const swIdx = Math.floor(segment.sw_idx);

	const index = timeArr.findIndex((x) => x === swIdx);
	return index < 0 ? null : index;
};

export {
	calcWellLifeVal,
	DAYS_IN_YEAR,
	generateDefaultParams,
	generateFirstSegment,
	generateNextSegment,
	genFallbackSeries,
	genSeriesData,
	genViewValue,
	getSwPlaceIndex,
	getCumProd,
	getEndDataIdx,
	getEurProps,
	MTD_DENOM,
	PHASE_UNITS,
	scaleSeries,
	visualTimeArr,
};
