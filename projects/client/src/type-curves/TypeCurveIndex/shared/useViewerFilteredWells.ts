import _ from 'lodash';
import { useMemo } from 'react';

import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { EurResult } from '@/type-curves/api';
import { applyNormToRatioData, getPhaseData } from '@/type-curves/shared/fit-tc/daily-helpers';
import { TypeCurveWellHeaders } from '@/type-curves/types';

import { Align, CalculatedBackgroundDataType, FitPhaseTypes, PhaseData } from '../types';

// @note: currently working through each array recursively; if better performance is needed, then iterate through each key explicitly
export const filterAllArrays = ({ filterMask, curValue, path = '', originalArraySize }) => {
	if (_.isArray(curValue)) {
		if (curValue.length === originalArraySize) _.remove(curValue, (_value, idx) => !filterMask[idx]);
		return;
	}
	if (_.isObject(curValue)) {
		_.forEach(curValue, (value, key) => {
			filterAllArrays({
				curValue: value,
				filterMask,
				originalArraySize,
				path: path.length ? `${path}.${key}` : key,
			});
		});
	}
};

const useViewerFilteredWells = ({
	align,
	calculatedBackgroundData,
	eurMap,
	fitPhaseType,
	headersMap,
	normalize,
	phaseWellFilterWells,
}: {
	align: Align;
	calculatedBackgroundData: Record<Phase, CalculatedBackgroundDataType | null>;
	eurMap: EurResult;
	fitPhaseType: FitPhaseTypes;
	headersMap: Map<string, TypeCurveWellHeaders>;
	normalize: boolean;
	phaseWellFilterWells: Record<Phase, null | Array<string>>;
}) => {
	const viewerCalculatedData = useMemo(
		() =>
			_.mapValues(calculatedBackgroundData, (data, phase) => {
				if (data?.wells) {
					if (!phaseWellFilterWells?.[phase]) {
						return applyNormToRatioData(data, normalize);
					}
					const { wells } = data;
					const filterMask = _.map(wells, (wellId) => phaseWellFilterWells[phase].includes(wellId));
					const retValue = _.cloneDeep(data);
					filterAllArrays({ filterMask, curValue: retValue, originalArraySize: wells.length });
					return applyNormToRatioData(retValue, normalize);
				}
				return null;
			}),
		[calculatedBackgroundData, normalize, phaseWellFilterWells]
	) as Record<Phase, CalculatedBackgroundDataType | null>;

	const viewerPhaseData = useMemo(
		() =>
			getPhaseData({
				calculatedBackgroundData: viewerCalculatedData,
				align,
				fitPhaseType,
				normalize,
			}),
		[align, viewerCalculatedData, fitPhaseType, normalize]
	) as PhaseData;

	const allWellsInPhaseFilters = _.union(
		phaseWellFilterWells?.gas,
		phaseWellFilterWells?.water,
		phaseWellFilterWells?.oil
	);

	const viewerEurMap = useMemo(
		() =>
			allWellsInPhaseFilters?.length
				? _.reduce(
						allWellsInPhaseFilters,
						(thisMap, wellId) => {
							thisMap.set(wellId, eurMap.get(wellId));
							return thisMap;
						},
						new Map()
				  )
				: eurMap,
		[eurMap, allWellsInPhaseFilters]
	);

	const viewerHeadersMap = useMemo(
		() =>
			allWellsInPhaseFilters?.length
				? _.reduce(
						allWellsInPhaseFilters,
						(thisMap, wellId) => {
							thisMap.set(wellId, headersMap.get(wellId));
							return thisMap;
						},
						new Map()
				  )
				: headersMap,
		[headersMap, allWellsInPhaseFilters]
	);

	const uniqueHeaderValueCounts: Record<Phase, Record<string, number>> = useMemo(() => {
		if (!viewerCalculatedData) {
			return { oil: {}, gas: {}, water: {} };
		}

		return _.reduce(
			viewerCalculatedData,
			(acc, value, phase) => {
				if (value) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					const { wells } = value as any;
					_.forEach(wells, (well) => {
						_.forEach(viewerHeadersMap.get(well), (value, header) => {
							if (!acc[phase]?.[header]) {
								acc[phase][header] = new Set();
							}
							acc[phase][header].add(value);
						});
					});

					acc[phase] = _.mapValues(acc[phase], (valueSet: Set<string>) => valueSet.size);
				}
				return acc;
			},
			{ oil: {}, gas: {}, water: {} }
		);
	}, [viewerCalculatedData, viewerHeadersMap]);

	return {
		uniqueHeaderValueCounts,
		viewerCalculatedData,
		viewerEurMap,
		viewerHeadersMap,
		viewerPhaseData,
	};
};

export default useViewerFilteredWells;
