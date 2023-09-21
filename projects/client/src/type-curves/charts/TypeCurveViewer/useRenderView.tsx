import _ from 'lodash';
import { RefObject, useCallback, useMemo, useRef } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import FitParametersTable from '@/type-curves/TypeCurveFit/FitParametersTable';
import { isValidPDict } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/helpers';
import { getShiftBaseSegments } from '@/type-curves/TypeCurveIndex/fit/helpers';
import { useTypeCurveNormalization } from '@/type-curves/TypeCurveIndex/normalization/TypeCurveNormalization';
import { LinearFitChartRender } from '@/type-curves/TypeCurveNormalization/LinearFitChart';
import { NormalizationMultipliersTableRender } from '@/type-curves/TypeCurveNormalization/MultipliersTable';
import TypeCurveWellsMap from '@/type-curves/shared/TypeCurveWellsMap';

import C4Chart from '../C4Chart';
import CrossPlotChart from '../CrossPlotChart';
import CumChart from '../CumChart';
import EurChart from '../EurChart';
import FitCumChart from '../FitCumChart-v2';
import InitialPeakChart from '../InitialPeakChart';
import ProbitChart from '../ProbitChart';
import RateVsCumChart from '../RateVsCumChart';
import SumChart from '../SumChart';
import ThreePhaseFitChart from '../ThreePhaseFit';
import { ViewerType } from '../graphProperties';
import { useViewerSettings } from './ViewerSettings';

const useRenderView = ({
	multipliersTableRef,
	normalizationProps,
	phase,
	selection,
	settingsProps,
	viewerData,
	viewerOption,
	viewerType,
}: {
	multipliersTableRef: RefObject<{ handleDownload(): void }>;
	normalizationProps?: ReturnType<typeof useTypeCurveNormalization>;
	phase: Phase;
	selection: Selection;
	settingsProps: Omit<ReturnType<typeof useViewerSettings>, 'viewerOption' | 'setViewerOption'>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewerData: any;
	viewerOption: string;
	viewerType: ViewerType;
}) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const tableRef = useRef<any>({});

	const wellIds = useMemo(
		() =>
			viewerData.wellFilterWells?.length
				? _.filter(viewerData.phaseRepWells[phase], (wellId) => viewerData.wellFilterWells.includes(wellId))
				: viewerData.phaseRepWells[phase],
		[phase, viewerData.phaseRepWells, viewerData.wellFilterWells]
	);

	const excludedIds = viewerData.phaseExcludedWells[phase];

	const renderDefaultview = useCallback(
		(viewProps) => {
			const {
				align,
				alignAdjustedFitSeries: allAlignAdjustedFitSeries,
				basePhase,
				calculatedBackgroundData,
				calculatedExcludedData,
				eurMap,
				eurs,
				fitSeries: allFitSeries,
				headersMap,
				phaseData,
				excludedPhaseData,
				phaseTypes,
				tcFits,
				typeCurveId,
			} = viewerData;

			const alignAdjustedFitSeries = allAlignAdjustedFitSeries[phase];
			const basePhaseFit = allFitSeries[basePhase];
			const fitSeries = allFitSeries[phase];
			const phaseType = phaseTypes[phase];

			const _getShiftBaseSements = (ratioSegments) =>
				getShiftBaseSegments(ratioSegments, tcFits?.[basePhase]?.P_dict?.best?.segments ?? []);

			const sharedProps = {
				...phaseData[phase],
				...viewProps,
				activeChartSeries: settingsProps.activeChartSeries,
				align: phaseType === 'rate' ? align : 'noalign',
				basePhase,
				basePhaseFit,
				basePhaseSeries: 'best',
				calculatedBackgroundData: calculatedBackgroundData[phase],
				basePhaseBackgroundData: calculatedBackgroundData[basePhase],
				calculatedExcludedData: calculatedExcludedData[phase],
				colorBy: settingsProps.colorBy,
				curPhase: phase,
				eurMap,
				excludedIds,
				excludedPhaseData: excludedPhaseData[phase],
				fitAlign: tcFits?.[phase]?.align ?? 'align',
				fitLoaded: isValidPDict(fitSeries),
				fitSeries,
				getShiftBaseSegments: _getShiftBaseSements,
				headersMap,
				phaseType,
				selection,
				wellIds,
			};

			const viewerKeyMap = {
				c4: (
					<C4Chart
						{...sharedProps}
						{...settingsProps.c4State}
						alignAdjustedFitSeries={alignAdjustedFitSeries}
					/>
				),
				threePhaseFit: (
					<ThreePhaseFitChart {...sharedProps} allAlignAdjustedFitSeries={allAlignAdjustedFitSeries} />
				),
				crossplot: (
					<CrossPlotChart {...sharedProps} {...settingsProps.crossPlotState} typeCurveId={typeCurveId} />
				),
				cum: <CumChart {...sharedProps} />,
				eur: <EurChart {...sharedProps} eurs={eurs} />,
				fitCum: (
					<FitCumChart
						{...sharedProps}
						{...settingsProps.fitCumState}
						alignAdjustedFitSeries={alignAdjustedFitSeries}
					/>
				),
				ip: <InitialPeakChart {...sharedProps} />,
				map: (
					<TypeCurveWellsMap
						phase={phase}
						selection={selection}
						typeCurveId={typeCurveId}
						wellIds={wellIds}
					/>
				),
				paramsTable: <FitParametersTable ref={tableRef} phaseFits={tcFits} />,
				probit: <ProbitChart {...sharedProps} {...settingsProps.probitState} xAxisLabel='' />,
				rateVsCum: (
					<RateVsCumChart
						{...sharedProps}
						{...settingsProps.rateVsCumState}
						alignAdjustedFitSeries={alignAdjustedFitSeries}
					/>
				),
				sum: <SumChart {...sharedProps} />,
			};

			return viewerKeyMap?.[viewerOption] ?? null;
		},
		[
			excludedIds,
			phase,
			selection,
			settingsProps.activeChartSeries,
			settingsProps.c4State,
			settingsProps.colorBy,
			settingsProps.crossPlotState,
			settingsProps.fitCumState,
			settingsProps.probitState,
			settingsProps.rateVsCumState,
			viewerData,
			viewerOption,
			wellIds,
		]
	);

	const renderNormalizationView = useCallback(
		(viewProps) => {
			const {
				eurData,
				headersData,
				normalizationSelection,
				phaseFormProps,
				handleNormalizationMultipliersChange,
			} = normalizationProps ?? {};
			const { phaseTypes } = viewerData;

			const formProps = phaseFormProps?.[phase];
			const phaseSelection = normalizationSelection?.[phase];

			const isRatioPhase = phaseTypes[phase] === 'ratio';
			const eurMultipliers = isRatioPhase ? {} : formProps?.eur?.wellsMultipliers;
			const qPeakMultipliers = isRatioPhase ? {} : formProps?.qPeak?.wellsMultipliers;

			const viewerKeyMap = {
				linearFit: (
					<LinearFitChartRender
						{...viewProps}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						{...(_.pick(formProps?.eur, ['aValue', 'base', 'bValue', 'points', 'targetX', 'type']) as any)}
						eurMap={eurData}
						headersMap={headersData}
						phase={phase}
						selection={phaseSelection}
					/>
				),
				qPeakLinearFit: (
					<LinearFitChartRender
						{...viewProps}
						{...(_.pick(formProps?.qPeak, [
							'aValue',
							'base',
							'bValue',
							'points',
							'targetX',
							'type',
							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						]) as any)}
						eurMap={eurData}
						headersMap={headersData}
						phase={phase}
						selection={phaseSelection}
					/>
				),
				normalizationMultipliersTable: (
					<NormalizationMultipliersTableRender
						{...viewProps}
						eurMultipliers={eurMultipliers}
						qPeakMultipliers={qPeakMultipliers}
						onChangeMultiplier={(key, value, normType) =>
							handleNormalizationMultipliersChange?.({ key, normType, phase, value })
						}
						phase={phase}
						ref={multipliersTableRef}
						selection={selection}
						typeCurveId={viewerData.typeCurveId}
						wellIds={viewerData.phaseRepWells[phase]}
					/>
				),
			};

			return viewerKeyMap?.[viewerOption] ?? null;
		},
		[multipliersTableRef, normalizationProps, phase, selection, viewerData, viewerOption]
	);

	if (viewerType === 'default') {
		return renderDefaultview;
	}
	return renderNormalizationView;
};

export default useRenderView;
