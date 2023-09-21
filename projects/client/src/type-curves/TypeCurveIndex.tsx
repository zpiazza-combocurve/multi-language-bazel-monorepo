import _ from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';

import { Placeholder } from '@/components';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import ManualEditingProvider from '@/forecasts/manual/ManualEditingContext';
import { assert } from '@/helpers/utilities';
import { showWellFilter } from '@/well-filter/well-filter';

import { getInitToggleState } from './TypeCurveFit/TypeCurveControls/shared/helpers';
import { removeAllTypeCurveFitQueries, useFitInit, useRawBackgroundData, useTcFits } from './TypeCurveFit/api';
import ModeLayout from './TypeCurveIndex/ModeLayout';
import { FitIndexContainer } from './TypeCurveIndex/layout';
import { filterAllArrays } from './TypeCurveIndex/shared/useViewerFilteredWells';
import { FitInitType, FitResolution, Mode, RawBackgroundDataType, WellsByPhaseObject } from './TypeCurveIndex/types';
import { useTypeCurveEur, useTypeCurveStep, useTypeCurveWellHeaders } from './api';
import { LoadingStatuses } from './charts/graphProperties';
import { useTypeCurveInfo } from './shared/useTypeCurveInfo';

const filterOutNonWellData = (rawBackgroundData, allWells) => {
	if (rawBackgroundData) {
		const { wells } = rawBackgroundData;
		const filterMask = _.map(allWells, (wellId) => wells.includes(wellId));
		const retValue = _.cloneDeep(rawBackgroundData);
		filterAllArrays({ filterMask, curValue: retValue, originalArraySize: allWells.length });
		return retValue;
	}
	return null;
};

// get all type-curve related queries here; pass shared props to all mode render components
function TypeCurveIndex({ typeCurveId }: { typeCurveId: string }) {
	const fitConfigProps = useConfigurationDialog({
		applyDefaultAsActive: false,
		key: 'tcFitForm',
		title: 'Type Curve Fit Configurations',
		enableSharedConfigs: true,
	});

	const { activeConfig, defaultConfig } = fitConfigProps;

	const { data: tcFitsData, isLoading: tcFitsIsLoading } = useTcFits(typeCurveId);

	const [tcFits, setTcFits] = useDerivedState(tcFitsData);

	const resetTcFits = useCallbackRef(() => {
		setTcFits(tcFitsData);
	});

	const [wellFilterWells, setWellFilterWells] = useState<Array<string> | null>(null);
	const [mode, setMode] = useState<Mode>('view');
	const [resolution, setResolution] = useDerivedState<FitResolution>(
		(curValue) =>
			getInitToggleState({ activeConfig, curValue, defaultConfig, savedFit: tcFitsData, key: 'resolution' }),
		[activeConfig, defaultConfig, Boolean(_.keys(tcFitsData).length)]
	);

	const { data: headersMap, isLoading: headersMapIsLoading } = useTypeCurveWellHeaders(typeCurveId);
	const { data: eurMap, isLoading: eurDataIsLoading } = useTypeCurveEur(typeCurveId);

	const {
		query: { data: fitInit, isLoading: fitInitIsLoading },
	} = useFitInit(typeCurveId);

	// restructure query to send back phaseRepWell structure
	const { phaseWellsInfo, loading: tcInfoLoading, wellIds } = useTypeCurveInfo(typeCurveId);

	const [phaseRepWells, phaseExcludedWells]: [WellsByPhaseObject, WellsByPhaseObject] = useMemo(() => {
		if (tcInfoLoading) {
			return [
				{ oil: [], gas: [], water: [] },
				{ oil: [], gas: [], water: [] },
			];
		}

		assert(phaseWellsInfo);

		const repWells = _.mapValues(phaseWellsInfo, (phaseWellInfo) => phaseWellInfo?.repWells ?? []);
		const excludedWells = _.mapValues(phaseWellsInfo, (phaseWellInfo) => phaseWellInfo?.excludedWells ?? []);

		return [repWells, excludedWells];
	}, [phaseWellsInfo, tcInfoLoading]);

	const [allOilWells, allGasWells, allWaterWells]: [string[], string[], string[]] = useMemo(() => {
		const oil = phaseWellsInfo.oil.repAndExcludedWells;
		const gas = phaseWellsInfo.gas.repAndExcludedWells;
		const water = phaseWellsInfo.water.repAndExcludedWells;
		return [oil, gas, water];
	}, [
		phaseWellsInfo.gas.repAndExcludedWells,
		phaseWellsInfo.oil.repAndExcludedWells,
		phaseWellsInfo.water.repAndExcludedWells,
	]);

	const handleWellFilter = useCallbackRef(async () => {
		const wells = await showWellFilter({
			isFiltered: false,
			type: 'filter',
			wells: wellIds,
		});

		if (wells) {
			setWellFilterWells(wells);
		}
	});

	const handleOnQuickWellFilter = useCallbackRef(async (wells) => {
		setWellFilterWells(wells);
	});

	const resetWellFilter = useCallbackRef(() => setWellFilterWells(null));

	const { data: oilRawBackgroundData, isLoading: oilRawBackgroundIsLoading } = useRawBackgroundData({
		enabled: !tcFitsIsLoading,
		phase: 'oil',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		phaseTypes: (fitInit as any)?.phaseType,
		resolution,
		tcId: typeCurveId,
		wells: allOilWells,
	});

	const { data: gasRawBackgroundData, isLoading: gasRawBackgroundIsLoading } = useRawBackgroundData({
		enabled: !tcFitsIsLoading,
		phase: 'gas',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		phaseTypes: (fitInit as any)?.phaseType,
		resolution,
		tcId: typeCurveId,
		wells: allGasWells,
	});

	const { data: waterRawBackgroundData, isLoading: waterRawBackgroundIsLoading } = useRawBackgroundData({
		enabled: !tcFitsIsLoading,
		phase: 'water',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		phaseTypes: (fitInit as any)?.phaseType,
		resolution,
		tcId: typeCurveId,
		wells: allWaterWells,
	});

	const rawBackgroundData = useMemo(
		() => ({
			oil: filterOutNonWellData(oilRawBackgroundData, allOilWells),
			gas: filterOutNonWellData(gasRawBackgroundData, allGasWells),
			water: filterOutNonWellData(waterRawBackgroundData, allWaterWells),
		}),
		[allGasWells, allOilWells, allWaterWells, gasRawBackgroundData, oilRawBackgroundData, waterRawBackgroundData]
	) as Record<Phase, RawBackgroundDataType>;

	const rawBackgroundIsLoading =
		oilRawBackgroundIsLoading || gasRawBackgroundIsLoading || waterRawBackgroundIsLoading;

	const { isLoading: basesIsLoading } = useTypeCurveStep(typeCurveId);

	const loadingStatuses: LoadingStatuses = useMemo(
		() => ({
			basesIsLoading,
			eurDataIsLoading,
			fitInitIsLoading,
			headersMapIsLoading,
			rawBackgroundIsLoading,
			repInitLoading: tcInfoLoading,
			tcFitsIsLoading,
		}),
		[
			basesIsLoading,
			eurDataIsLoading,
			fitInitIsLoading,
			headersMapIsLoading,
			rawBackgroundIsLoading,
			tcFitsIsLoading,
			tcInfoLoading,
		]
	);

	useEffect(() => {
		return () => {
			removeAllTypeCurveFitQueries();
		};
	}, []);

	const loading = fitInitIsLoading || basesIsLoading || tcFitsIsLoading || eurDataIsLoading || headersMapIsLoading;
	return (
		<FitIndexContainer>
			<Placeholder loading={loading} loadingText='Loading Type Curve...' main minShow={50} minHide={500}>
				<ManualEditingProvider>
					<ModeLayout
						activeFitConfig={activeConfig}
						allWellIds={wellFilterWells ?? wellIds}
						defaultFitConfig={defaultConfig}
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						eurMap={eurMap!}
						fitConfigProps={fitConfigProps}
						fitInit={fitInit as FitInitType}
						handleOnQuickWellFilter={handleOnQuickWellFilter}
						handleWellFilter={handleWellFilter}
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						headersMap={headersMap!}
						loadingStatuses={loadingStatuses}
						mode={mode}
						phaseExcludedWells={phaseExcludedWells}
						phaseRepWells={phaseRepWells}
						rawBackgroundData={rawBackgroundData}
						resetTcFits={resetTcFits}
						resetWellFilter={resetWellFilter}
						resolution={resolution}
						setMode={setMode}
						setResolution={setResolution}
						setTcFits={setTcFits}
						tcFits={tcFits}
						tcFitsQueryData={tcFitsData}
						typeCurveId={typeCurveId}
						wellFilterActive={!!wellFilterWells}
						wellFilterWells={wellFilterWells}
					/>
				</ManualEditingProvider>
			</Placeholder>
		</FitIndexContainer>
	);
}

export default TypeCurveIndex;
