/* eslint-disable @typescript-eslint/no-explicit-any */

import produce from 'immer';
import { noop } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { Floater } from '@/components';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Paper } from '@/components/v2';
import ConfigurationProvider from '@/forecasts/configurations/ConfigurationContext';
import { useAlfa } from '@/helpers/alfa';
import { TypeCurveFitContainer } from '@/type-curves/TypeCurveFit/TypeCurveFitLayout';
import { DEFAULT_DAILY_RANGE } from '@/type-curves/TypeCurveIndex/fit/helpers';
import { createMapByWellId } from '@/type-curves/api';

import { fetchProjectForecasts } from '../api';
import { AxisCombo, Phase } from '../forecast-form/automatic-form/types';
import { ProjectForecastItem } from '../types';
import { TwoPanelLayout } from './CustomComponents';
import ProximityDialogHeader, { useProximityDialogState } from './ProximityDialogHeader';
import { getProjectForecastQuery } from './filter/ForecastSelectionForm';
import useProximityFit, { useCBD } from './fit/useProximityFit';
import { useProximityNormalization } from './normalize/useProximityNormalization';

const UpdatedTypeCurveFitContainer = styled(TypeCurveFitContainer)`
	padding-top: 0;
	height: calc(100% - 48px);
	width: 100%;
`;

const ProximityFloater = styled(Floater)`
	border: none;
	top: 5rem;
	left: 28rem;
	box-shadow: 0rem 0rem 8px 8px rgb(0 0 0 / 10%), 0rem 0rem 8px 8px rgb(0 0 0 / 10%);
	max-height: 93vh;
	overflow-y: auto;

	& > * {
		padding: 0;
	}
`;

const ProximityPaper = styled(Paper)<{ isMinimized: boolean; singleSectionView: boolean }>`
	${({ isMinimized, singleSectionView }) => `
		${!isMinimized && !singleSectionView && 'min-width: 1150px;'};
		width: ${isMinimized || singleSectionView ? '575px' : '65vw'};
		height: ${isMinimized ? '400px' : 'calc(748px + 3rem)'};
`}
	max-width: 1350px;
	border: 1px solid gray;
`;

const EMPTY_OBJ = {};
const EMPTY_MAP = new Map();
const EMPTY_LIST = [];

export const getProximityPhaseRepWells = (proximityData) => {
	return proximityData?.wells ?? EMPTY_LIST;
};

interface ProximityData {
	headersMap: Record<string, any>;
	repInit: any[];
	rawBackgroundData: any;
	fitInit: any;
	tcInfo: any;
	wells: any[];
	wellForecastMap: any;
}

interface ProximityForecastDialogV2Props {
	basePhase: Phase;
	forecastId: string;
	onHide: () => void;
	phase: Phase;
	phaseType: AxisCombo;
	proximityBgData: any;
	proximityRadius: number;
	proximityQuery: { data: ProximityData; isloading: boolean; status: string };
	proximityWellSelection: any;
	resolution: string;
	saveForecast: (forecast) => void;
	setForecastSegmentsCallback: (segments) => void;
	setProximityBgNormalization: (value) => void;
	setProximityMergedStates: (mergedStates) => void;
	targetWellHeaderAndEur: any;
	visible: boolean;
	wellId: string;
}

const ProximityForecastDialogV2 = ({
	basePhase,
	forecastId,
	onHide,
	phase,
	phaseType,
	proximityBgData,
	proximityQuery,
	proximityRadius,
	proximityWellSelection: _proximityWellSelection,
	resolution,
	saveForecast,
	setForecastSegmentsCallback,
	setProximityBgNormalization,
	setProximityMergedStates,
	targetWellHeaderAndEur,
	visible,
	wellId,
}: ProximityForecastDialogV2Props) => {
	const proximityWellSelection = _proximityWellSelection?.selection;

	const [hasRun, setHasRun] = useDerivedState(proximityQuery?.status === 'success');

	const dialogProps = useProximityDialogState(hasRun);

	const {
		// @ts-expect-error ts-migrate(2339) FIXME: Property '_id' does not exist on type '{}'.
		project: { _id: projectId },
	} = useAlfa();

	const { data: projectForecasts = [] } = useQuery(getProjectForecastQuery(projectId), () =>
		fetchProjectForecasts(projectId)
	);
	const activeSelectedForecastRef = useRef<(ProjectForecastItem | undefined)[]>([]);

	// set active forecast to be current forecast
	useEffect(() => {
		if (projectForecasts.length) {
			const currentForecast = projectForecasts.find(({ _id }) => _id === forecastId);
			activeSelectedForecastRef.current = [currentForecast];
		}
	}, [forecastId, projectForecasts]);

	const { data: proximityData, isloading } = proximityQuery;
	const [rawBackgroundData, setRawBackgroundData] = useDerivedState(proximityData?.rawBackgroundData ?? null);
	const fitInit = proximityData?.fitInit ?? EMPTY_OBJ;
	const phaseRepWells = getProximityPhaseRepWells(proximityData);

	const headersMap = useMemo(() => {
		if (!proximityData?.headersMap) {
			return EMPTY_MAP;
		}

		return createMapByWellId(
			Object.entries(proximityData?.headersMap).map(([key, value]) => {
				value.well_id = key;
				return value;
			})
		);
	}, [proximityData?.headersMap]);

	const repInitWellsMap = useMemo(() => {
		if (!proximityData?.repInit) {
			return EMPTY_MAP;
		}
		return createMapByWellId(proximityData?.repInit);
	}, [proximityData?.repInit]);

	const [normalize, _setNormalize] = useState(false);
	const [fitSeries, setFitSeries] = useState({});

	useEffect(() => {
		setFitSeries({});
		setHasRun(false);
	}, [phase, basePhase, phaseType, wellId, setHasRun]);

	const targetBGData = useMemo(() => {
		if (!proximityBgData?.index?.length) {
			return null;
		}
		const value = phaseType === 'rate' ? proximityBgData?.[phase] : proximityBgData?.[`${phase}/${basePhase}`];
		return { index: proximityBgData?.index, value };
	}, [basePhase, phase, phaseType, proximityBgData]);

	const [phaseLoaded, setPhaseLoaded] = useState(false);

	const [dailyRange, setDailyRange] = useState({
		align: [...DEFAULT_DAILY_RANGE],
		noalign: [...DEFAULT_DAILY_RANGE],
	});

	const { calculatedBackgroundData, eurs, phaseData } = useCBD({
		baseSegments: null,
		dailyRange,
		fitPhaseTypes: null,
		fitSeries,
		getShiftBaseSegments: noop,
		normalize,
		phase,
		phaseLoaded,
		resolution,
		phaseType,
		proximitySelection: proximityWellSelection,
		rawBackgroundData,
	});

	const setNormalize = useCallbackRef(() => {
		_setNormalize(
			produce((oldNdormVal) => {
				const newNorm = !oldNdormVal;
				setProximityBgNormalization(newNorm ? calculatedBackgroundData?.normalization : null);
				return newNorm;
			})
		);
	});

	const proximityProps = useMemo(
		() => ({
			proximityWellSelection: _proximityWellSelection,
			forecastId,
			proximityRadius,
			repInitWellsMap,
			saveForecast,
			setProximityBgNormalization,
			targetBGData,
			targetWellHeaderAndEur,
			wellForecastMap: proximityData?.wellForecastMap ?? EMPTY_OBJ,
			wellId,
		}),
		[
			_proximityWellSelection,
			forecastId,
			proximityData?.wellForecastMap,
			proximityRadius,
			repInitWellsMap,
			saveForecast,
			setProximityBgNormalization,
			targetBGData,
			targetWellHeaderAndEur,
			wellId,
		]
	);

	const normalizationProps = useProximityNormalization({
		phase,
		phaseType,
		phaseRepWells,
		proximityProps,
		rawBackgroundData,
		selection: proximityWellSelection,
		setRawBackgroundData,
	});

	const _fitProps = useProximityFit({
		basePhase,
		dailyRange,
		fitInit,
		fitPhaseTypes: fitInit?.phaseType,
		fitSeries,
		headersMap,
		loadingInitialization: isloading,
		normalize,
		phase,
		phaseRepWells,
		phaseType,
		projectId,
		rawBackgroundData,
		resolution,
		setDailyRange,
		setFitSeries,
		setNormalize,
		setPhaseLoaded,
		tcFits: EMPTY_OBJ, // TODO: prepare tcFits from manualDeterministicForecast, ratio phase does not have EUR
		tcId: null,
		tcInfo: proximityData?.tcInfo ?? EMPTY_OBJ,
		proximityProps,
		selection: proximityWellSelection,
	});

	const fitProps = useMemo(
		() => ({
			..._fitProps,
			...phaseData,
			eurs,
			calculatedBackgroundData,
			normalize,
			proximityProps,
			setNormalize,
		}),
		[_fitProps, calculatedBackgroundData, eurs, normalize, phaseData, proximityProps, setNormalize]
	);

	if (!visible) {
		return null;
	}

	const handleId = 'proxHandle';

	return (
		<ProximityFloater detached disableToolbar minimal={false} handle={handleId} onToggle={noop}>
			<ProximityPaper isMinimized={dialogProps.isMinimized} singleSectionView={dialogProps.isCollapsed}>
				<ProximityDialogHeader {...dialogProps} handle_id={handleId} hasRun={hasRun} onHide={onHide} />

				<ConfigurationProvider configurationKey='tcFitC4Chart' configurationTitle='Chart Configurations'>
					<UpdatedTypeCurveFitContainer>
						<TwoPanelLayout
							{...dialogProps}
							activeSelectedForecastRef={activeSelectedForecastRef}
							fitProps={fitProps}
							forecastId={forecastId}
							normalizationProps={normalizationProps}
							setForecastSegmentsCallback={setForecastSegmentsCallback}
							setHasRun={setHasRun}
							setProximityMergedStates={setProximityMergedStates}
							wellId={wellId}
						/>
					</UpdatedTypeCurveFitContainer>
				</ConfigurationProvider>
			</ProximityPaper>
		</ProximityFloater>
	);
};

export default ProximityForecastDialogV2;
