import { MultipleSegments } from '@combocurve/forecast/models';
import { get } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { useDerivedState } from '@/components/hooks';
import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { alerts } from '@/components/v2';
import { useForecastBucket } from '@/forecasts/api';
import {
	GRAPH_MONTHLY_UNIT_RESOLUTION,
	VALID_PHASES,
	VALID_PLL_SERIES,
} from '@/forecasts/charts/components/graphProperties';
import { WarningContainer } from '@/forecasts/charts/components/gridChartLayout';
import { DAYS_IN_YEAR } from '@/forecasts/charts/forecastChartHelper';
import { toggleBucket } from '@/forecasts/shared/gridHelpers';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { putApi } from '@/helpers/routing';
import { difference, intersection, isSuperset, union } from '@/helpers/sets';
import { capitalize } from '@/helpers/text';
import { getConvertFunc } from '@/helpers/units';
import { formatValue } from '@/helpers/utilities';
import { TEAL_1, convertIdxToMilli, convertMilliToIdx, zingchart } from '@/helpers/zing';
import { fields as dailyUnitTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { useCurrentProject } from '@/projects/api';

import { AxisValue } from './AxisControlSelection';

const multiSeg = new MultipleSegments();

interface ForecastWarning {
	[key: string]: string | null;
}

interface ForecastProduction {
	index: number[];
	oil: number[];
	gas: number[];
	water: number[];
}

// ----------------- boundary logic start -----------------
/**
 * - Undefined boundary value is the default for Zing modules
 *
 *   - Undefined min or max boundaries will default the chart axis min/max to the min/max values of the series on the chart
 *   - Although absolute value isn't implemented in the UI for now (@ArmandParadis said to exclude it), if an absolute value
 *       is given to any boundary function, it will override any additional settings
 *   - The boundary has a hierarchy, absolute value --> padding --> yearsBefore/yearsPast --> undefined
 */

const getXMaxBoundary = ({
	maxProdTime,
	value,
	xType,
	yearsPast,
}: {
	maxProdTime?: number;
	value?: number;
	xType?: string;
	yearsPast?: number;
}) => {
	if (Number.isFinite(value)) {
		return value;
	}
	if (
		typeof maxProdTime === 'number' &&
		typeof yearsPast === 'number' &&
		Number.isFinite(yearsPast) &&
		Number.isFinite(maxProdTime)
	) {
		if (xType === 'time') {
			const maxIndex = convertMilliToIdx(maxProdTime);
			const maxTime = maxIndex + Math.floor(yearsPast * DAYS_IN_YEAR);
			return convertIdxToMilli(maxTime);
		}
		if (xType === 'relativeTime') {
			return maxProdTime + Math.floor(yearsPast * DAYS_IN_YEAR);
		}
	}
	return undefined;
};

const getXMinBoundary = ({
	maxProdTime,
	value,
	xType,
	yearsBefore,
}: {
	maxProdTime?: number;
	value?: number;
	xType?: string;
	yearsBefore?: number;
}) => {
	if (Number.isFinite(value)) {
		return value;
	}
	if (
		typeof maxProdTime === 'number' &&
		typeof yearsBefore === 'number' &&
		Number.isFinite(yearsBefore) &&
		Number.isFinite(maxProdTime)
	) {
		if (xType === 'time') {
			const maxIndex = convertMilliToIdx(maxProdTime);
			const maxTime = maxIndex - Math.floor(yearsBefore * DAYS_IN_YEAR);
			return convertIdxToMilli(maxTime);
		}
		if (xType === 'relativeTime') {
			return maxProdTime - Math.floor(yearsBefore * DAYS_IN_YEAR);
		}
	}
	return undefined;
};

const getYMaxBoundary = ({ value }: { value?: number }) => {
	if (Number.isFinite(value)) {
		return value;
	}
	return undefined;
};

const getYMinBoundary = ({ value }: { value?: number }) => (Number.isFinite(value) ? value : undefined);

const getAxisBoundary = ({
	axis,
	boundary,
	axisProps,
}: {
	axis: string;
	boundary: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	axisProps: Record<string, any>;
}) => {
	if (axis === 'x') {
		if (boundary === 'min') {
			return getXMinBoundary(axisProps);
		}
		if (boundary === 'max') {
			return getXMaxBoundary(axisProps);
		}
	}
	if (axis === 'y') {
		if (boundary === 'min') {
			return getYMinBoundary(axisProps);
		}
		if (boundary === 'max') {
			return getYMaxBoundary(axisProps);
		}
	}

	throw new Error('Invalid axis or boundary parameter');
};

const getAllAxesBoundaries = (axisProps) => {
	const xMin = getAxisBoundary({ axis: 'x', boundary: 'min', axisProps });
	const xMax = getAxisBoundary({ axis: 'x', boundary: 'max', axisProps });
	const yMin = getAxisBoundary({ axis: 'y', boundary: 'min', axisProps });
	const yMax = getAxisBoundary({ axis: 'y', boundary: 'max', axisProps });

	return { xMin, xMax, yMin, yMax };
};

const getProdXAxisRanges = (dataTable, seriesItems) => {
	const prodRanges = [
		...seriesItems.reduce((curSet, item) => {
			const { collection, x } = item;
			if (collection !== 'forecast') {
				// have to filter out Infinity and -Infinity since it breaks the chart
				const range = dataTable?.[collection]?.ranges?.[x];

				// check to see if either value in the range is not a number or is not finite
				const areAllNumbersAndFinite = range?.every((value) => Number.isFinite(value));
				if (areAllNumbersAndFinite) {
					curSet.add(dataTable[collection].ranges[x]);
				}
			}
			return curSet;
		}, new Set()),
	].flat();

	// if production exists
	if (prodRanges?.length) {
		return prodRanges;
	}

	// if production doesn't exist, return the lowest time value for the available forecast collections
	const lowestForecastTimeIndex = seriesItems.reduce((curTime, item) => {
		const { collection, x } = item;
		if (collection === 'forecast') {
			const minValue = dataTable?.[collection]?.[x]?.[0];

			// get the lower value of the range
			if (Number.isFinite(minValue) && minValue < curTime) {
				return minValue;
			}
		}

		return curTime;
	}, Infinity);

	return Number.isFinite(lowestForecastTimeIndex) ? [lowestForecastTimeIndex] : [];
};

const getChartConvert = (baseConvert, pllEnabled, headerPll) => (origNum) => {
	const converted = baseConvert(origNum);
	if (pllEnabled) {
		if (!Number.isFinite(converted) || !Number.isFinite(headerPll) || headerPll <= 0) {
			return null;
		}
		return converted / headerPll;
	}
	return converted;
};

const getProdYAxisRanges = ({ dataTable, seriesItems, enablePll = false, headerPll }) =>
	[
		...seriesItems.reduce((curSet, item) => {
			const { collection, y } = item;
			const pllEnabled = enablePll && VALID_PLL_SERIES.includes(y);
			const parsedY = pllEnabled ? `${y}/pll` : y;
			if (collection !== 'forecast' && dataTable?.[collection]?.ranges?.[y]) {
				const baseConvert = getConvertFunc(dailyUnitTemplate[parsedY], defaultUnitTemplate[parsedY]);
				const thisConvert = getChartConvert(baseConvert, pllEnabled, headerPll);
				curSet.add(dataTable[collection].ranges[y].map((value) => thisConvert(value)));
			}
			return curSet;
		}, new Set()),
	].flat();

// ----------------- boundary logic end -----------------

const getSelectionMinMax = (ev) => {
	const { id, poly } = ev;
	let minX = Number.MAX_VALUE;
	let maxX = -Number.MAX_VALUE;
	let minY = Number.MAX_VALUE;
	let maxY = -Number.MAX_VALUE;
	for (let i = 0; i < poly.length; i++) {
		minX = Math.min(minX, poly[i][0]);
		maxX = Math.max(maxX, poly[i][0]);
		minY = Math.min(minY, poly[i][1]);
		maxY = Math.max(maxY, poly[i][1]);
	}
	const minInfo = zingchart.exec(id, 'getxyinfo', {
		x: minX,
		y: minY,
	});
	const maxInfo = zingchart.exec(id, 'getxyinfo', {
		x: maxX,
		y: maxY,
	});

	const reduceInfoK = function (ret, curValue) {
		if (curValue.infotype === 'key-scale' && curValue.plotidx === 0) {
			return curValue.scalenumvalue;
		}
		return ret;
	};

	minX = minInfo.reduce(reduceInfoK, null);
	maxX = maxInfo.reduce(reduceInfoK, null);
	// In case minY/maxY is needed
	//
	// const reduceInfoV = function (ret, curValue) {
	// 	if (curValue.infotype === 'value-scale' && curValue.plotidx === 0) {
	// 		return curValue.scalevalue;
	// 	}
	// 	return ret;
	// };
	// minY = minInfo.reduce(reduceInfoV, null);
	// maxY = maxInfo.reduce(reduceInfoV, null);

	return Object.assign([minX, maxX], { minX, maxX });
};

const getHistoricalSegments = (datum) => datum?.P_dict?.best?.segments ?? [];

export const apply_operation = (item1, item2, operation = '/') =>
	item1.map((value, idx) => {
		const val_1 = value;
		const val_2 = item2[idx];
		if (operation === '*') {
			if (val_1 === null || val_2 === null) {
				return null;
			}
			return val_1 * val_2;
		}

		if (val_1 === null || val_2 === null || val_2 === 0) {
			return null;
		}
		return val_1 / val_2;
	});

const calculatedColumns = (all_columnsIn: string[], startIn, data) => {
	const all_columns = new Set(all_columnsIn);
	const main = new Set(VALID_PHASES);
	const ratio = new Set(['oil/gas', 'gas/oil', 'water/oil', 'oil/water', 'gas/water', 'water/gas']);
	const calculation: { target: string; item1: string; item2: string; operation: string }[] = [];

	let valid = new Set(startIn);
	let invalid = difference(all_columns, valid);

	const get_add_valid = () => {
		const add_valid = new Set();
		const invalid_main = intersection(invalid, main);
		const invalid_ratio = intersection(invalid, ratio);

		invalid_main.forEach((main_value) => {
			const diffSet = difference(main, new Set(main_value));
			let completed = false;
			diffSet.forEach((base_phase) => {
				const this_ratio = `${main_value}/${base_phase}`;
				if (completed) {
					return;
				}
				if (isSuperset(valid, new Set([base_phase, this_ratio]))) {
					add_valid.add(main_value);
					calculation.push({ target: main_value, item1: base_phase, item2: this_ratio, operation: '*' });
					completed = true;
				}
			});
		});

		invalid_ratio.forEach((ratio_value) => {
			const ratio_main_s = ratio_value.split('/');
			const ratio_main_s_set = new Set(ratio_main_s);
			if (isSuperset(valid, ratio_main_s_set)) {
				add_valid.add(ratio_value);
				calculation.push({
					target: ratio_value,
					item1: ratio_main_s[0],
					item2: ratio_main_s[1],
					operation: '/',
				});
			}
		});

		return add_valid;
	};

	const get_all_valid = () => {
		const add_valid = get_add_valid();
		valid = union(valid, add_valid);
		invalid = difference(all_columns, valid);
		// leave the comment here in case we want to get it back
		// while (add_valid.size > 0) {
		// 	valid = union(valid, add_valid);
		// 	invalid = difference(all_columns, valid);
		// 	add_valid = get_add_valid();
		// }
		return { valid, invalid };
	};

	const fill_values = () => {
		const output = { ...data };
		calculation.forEach((value) => {
			const { target, item1, item2, operation } = value;
			output[target] = apply_operation(output[item1], output[item2], operation);
		});

		return output;
	};

	return {
		get_add_valid,
		get_all_valid,
		fill_values,
	};
};

const calcProdCum = (obj, phase, production, resolution, index) => {
	const retObj = { ...obj };
	if (production?.[phase]) {
		retObj[`cumsum_${phase}`] = multiSeg.cumFromT({
			idxArr: index,
			production,
			series: [],
			phase,
			dataFreq: resolution,
		});
	} else {
		retObj[`cumsum_${phase}`] = null;
	}

	return retObj;
};

const dataInit = (data, validColumns, startArr) => {
	const prodFuncs = calculatedColumns(validColumns, startArr, data);
	const { valid, invalid } = prodFuncs.get_all_valid();
	const values = { ...prodFuncs.fill_values(), time: data.index.map((value) => convertIdxToMilli(value)) };
	valid.add('time');
	return { ...values, valid, invalid };
};

const useLegendItemClick = (chartId: string) => {
	const legendItemClick = useCallbackRef((p) => {
		zingchart.exec(chartId, 'toggleplot', {
			plotid: `marker-${p.plotid}`,
		});

		zingchart.exec(chartId, 'toggleplot', {
			plotid: `sw-${p.plotid}`,
		});
	});

	return legendItemClick;
};

const useToggleManualSelection = ({ forecastId, wellId }: { forecastId?: string; wellId?: string }) => {
	const { query: bucketQuery, queryKey } = useForecastBucket(forecastId);
	const { data: bucket, isLoading } = bucketQuery;

	const { mutateAsync: toggleManualSelect, isLoading: isSelecting } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ checked, wellId: inputWellId }: any) => {
			const editWellId = inputWellId ?? wellId;
			if (!(forecastId && editWellId)) {
				return;
			}

			try {
				const newBucket = new Set(bucket);
				if (checked) {
					newBucket.add(editWellId);
				} else {
					newBucket.delete(editWellId);
				}

				queryClient.setQueryData(queryKey, newBucket);

				await putApi(`/forecast/${forecastId}/${checked ? 'add-to-manual' : 'remove-from-manual'}`, {
					wellIds: [editWellId],
				});
			} catch (error) {
				genericErrorAlert(error);
				queryClient.setQueryData(queryKey, bucket);
			}
		}
	);

	const { mutateAsync: setManualSelect, isLoading: isSettingBucket } = useMutation(
		async ({ wellIds, idType }: { wellIds?: string[]; idType?: string }) => {
			if (!forecastId || !wellIds?.length) return;
			const { bucket } = await putApi(`/forecast/${forecastId}/set-manual`, {
				wellIds,
				idType,
			});
			queryClient.setQueryData(queryKey, new Set(Object.values(bucket)));
			queryClient.invalidateQueries(queryKey);
		}
	);

	const { mutateAsync: toggleAll, isLoading: isSelectingAll } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ checked, wellIds, suppressConfirmation = false }: any) => {
			const { bucket: newBucket } = await toggleBucket({
				checked,
				editBucket: bucket,
				forecastId,
				wellIds,
				suppressConfirmation,
			});
			queryClient.setQueryData(queryKey, newBucket);
		}
	);

	return {
		bucket,
		inEdit: bucket?.has(wellId),
		isLoading: isLoading || isSelecting || isSelectingAll || isSettingBucket,
		isSettingBucket,
		setManualSelect,
		toggleAll,
		toggleManualSelect,
	};
};

const DEFAULT_FORECAST_WARNINGS = { oil: null, gas: null, water: null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getForecastWarnings = (forecast: { [key: string]: any }) =>
	forecast
		? Object.entries(forecast).reduce(
				(obj, [key, value]) => {
					const { warning } = value;
					if (warning?.status) {
						return { ...obj, [key]: warning?.message };
					}
					return obj;
				},
				{ ...DEFAULT_FORECAST_WARNINGS }
		  )
		: { ...DEFAULT_FORECAST_WARNINGS };

const showChartWarning = async ({
	forecastId,
	wellId,
	warnings,
	canRemoveWarning,
}: {
	forecastId: string;
	wellId: string;
	warnings: ForecastWarning;
	canRemoveWarning: boolean;
}) => {
	try {
		const confirmed = await alerts.confirm({
			title: 'Forecast Warning',
			confirmText: 'Acknowledge?',
			children: (
				<WarningContainer>
					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
					{Object.entries(warnings).reduce((messageEl: any[], [warningPhase, warningValue]) => {
						if (warningValue) {
							return [
								...messageEl,
								<span key={`${warningPhase}-warning`}>{`${capitalize(
									warningPhase
								)}: ${warningValue}`}</span>,
							];
						}

						return messageEl;
					}, [])}
				</WarningContainer>
			),
			hideConfirmButton: !canRemoveWarning,
		});

		if (!confirmed) {
			return false;
		}

		const { message: resultMessage } = await putApi(`/forecast/${forecastId}/acknowledgeWarning/${wellId}`, {
			phase: VALID_PHASES,
		});

		confirmationAlert(resultMessage);
	} catch (error) {
		genericErrorAlert(error);
	}

	return true;
};

const useForecastChartWarning = ({
	forecastData,
	queryData,
	forecastId,
	forecastPath = 'forecast',
	refetch,
	wellId,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecastData: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	queryData: any;
	forecastId: string;
	forecastPath?: string;
	isUsingDep?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	refetch: any;
	queryKey: string | Array<string>;
	wellId: string;
}) => {
	const { project } = useCurrentProject();
	const { canUpdate: canRemoveWarning } = usePermissions(SUBJECTS.Forecasts, project?._id);
	const [warnings] = useDerivedState<ForecastWarning>(getForecastWarnings(get(forecastData, forecastPath)), [
		forecastData,
	]);
	const [warningsNew] = useDerivedState<ForecastWarning>(getForecastWarnings(get(queryData, forecastPath)), [
		queryData,
	]);
	const [warns, setWarns] = useState<ForecastWarning>(warnings);

	useEffect(() => {
		setWarns(warnings);
	}, [warnings]);

	const hasWarning = useMemo(() => warns && Object.values(warns).find((value) => value !== null), [warns]);

	const showWarning = useCallback(async () => {
		const result = await showChartWarning({ forecastId, warnings, wellId, canRemoveWarning });
		if (result) {
			setWarns(warningsNew);
			await refetch();
		}
	}, [forecastId, refetch, warningsNew, warnings, wellId, canRemoveWarning]);

	return { warnings: warns, showWarning, hasWarning };
};

const getOperations = (dataTable, xAxis) => {
	const getOperationsArr = (xAxisArr, operations) =>
		xAxisArr.reduce((arr, value, idx) => {
			if (!operations[idx]) {
				return arr;
			}

			arr.push({
				alpha: 1,
				lineColor: TEAL_1,
				lineStyle: 'dashed',
				lineWidth: '3px',
				placement: 'top',
				range: [value],
				type: 'line',
				valueRange: true,
				tooltip: {
					visible: true,
					// backgroundColor: 'transparent',
					'font-size': '20',
					text: formatValue(operations[idx]),
					textAlign: 'left',
					// padding: 0,
				},
			});

			return arr;
		}, []);

	const monthlyXAxis = dataTable?.monthly?.[xAxis];
	const { operational_tag: monthlyOperations = [] } = dataTable?.monthly ?? {};

	const dailyXAxis = dataTable?.daily?.[xAxis];
	const { operational_tag: dailyOperations = [] } = dataTable?.daily ?? {};

	return {
		monthly: monthlyXAxis ? getOperationsArr(monthlyXAxis, monthlyOperations) : [],
		daily: dailyXAxis ? getOperationsArr(dailyXAxis, dailyOperations) : [],
	};
};

const getUnitResolutionConversion = ({ headerPll, parsedY, pllEnabled, unitResolution = 'daily' }) => {
	const displayUnitTemplate = unitResolution === 'monthly' ? GRAPH_MONTHLY_UNIT_RESOLUTION : defaultUnitTemplate;
	const baseConvert = getConvertFunc(dailyUnitTemplate[parsedY], displayUnitTemplate[parsedY]);

	return { convert: getChartConvert(baseConvert, pllEnabled, headerPll), displayUnitTemplate };
};

// ------------- helpers for old probabilistic charts -------------
const getProbXBoundaries = ({
	absoluteMax,
	absoluteMin,
	maxProdTime,
	production,
	xLogScale,
	xType: xTypeIn,
	yearsBefore,
	yearsPast,
}: {
	absoluteMax?: number;
	absoluteMin?: number;
	maxProdTime?: number;
	production?: Pick<ForecastProduction, 'index'>;
	xLogScale?: boolean;
	xType?: string;
	yearsBefore?: AxisValue;
	yearsPast?: AxisValue;
}) => {
	const xType = xTypeIn ?? (xLogScale ? 'relativeTime' : 'time');
	const getMaxProdTime = () => {
		if (production) {
			const { index: prodIndex } = production;
			const minProdIndex = prodIndex[0];
			const maxProdIndex = prodIndex[prodIndex.length - 1];
			return xLogScale || xTypeIn === 'relativeTime'
				? maxProdIndex - minProdIndex
				: convertIdxToMilli(maxProdIndex);
		}

		return null;
	};

	const min = getAxisBoundary({
		axis: 'x',
		boundary: 'min',
		axisProps: { maxProdTime: getMaxProdTime() ?? maxProdTime, value: absoluteMin, yearsBefore, xType },
	});

	const max = getAxisBoundary({
		axis: 'x',
		boundary: 'max',
		axisProps: { maxProdTime: getMaxProdTime() ?? maxProdTime, value: absoluteMax, yearsPast, xType },
	});

	return Object.assign([min, max], { min, max });
};

function getLongestIncreasingSubsequence(arr: Array<number>): Array<number | null> {
	// Find the indicies of the maximum length increasing subsequence.
	const subseqIdxx: Array<Array<number>> = [];
	let subseqIdxxMax: Array<number> = [];
	for (let i = 0; i < arr.length; i++) {
		let subseqIdxxCandidateBest: Array<number> = [];
		for (let j = 0; j < i; j++) {
			const subseqIdxxCandidateCurr = subseqIdxx[j];
			if (arr[j] < arr[i] && subseqIdxxCandidateCurr.length > subseqIdxxCandidateBest.length) {
				subseqIdxxCandidateBest = subseqIdxxCandidateCurr;
			}
		}

		subseqIdxx[i] = subseqIdxxCandidateBest.concat();
		subseqIdxx[i].push(i);

		if (subseqIdxx[i].length > subseqIdxxMax.length) {
			subseqIdxxMax = subseqIdxx[i];
		}
	}

	// Return new array that's all null except for the elements of the largest
	// increasing subsequence.
	let subseqIdxxMaxIdx = 0;
	const result = arr.reduce((acc: Array<number | null>, curr: number, i: number) => {
		if (subseqIdxxMax[subseqIdxxMaxIdx] === i) {
			acc.push(curr);
			subseqIdxxMaxIdx++;
			return acc;
		}
		acc.push(null);
		return acc;
	}, []);
	return result;
}

export {
	calcProdCum,
	calculatedColumns,
	dataInit,
	getAllAxesBoundaries,
	getAxisBoundary,
	getChartConvert,
	getForecastWarnings,
	getHistoricalSegments,
	getLongestIncreasingSubsequence,
	getOperations,
	getProbXBoundaries,
	getProdXAxisRanges,
	getProdYAxisRanges,
	getSelectionMinMax,
	getUnitResolutionConversion,
	showChartWarning,
	useForecastChartWarning,
	useLegendItemClick,
	useToggleManualSelection,
};
