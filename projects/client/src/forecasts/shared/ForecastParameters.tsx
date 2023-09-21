import { faSlidersH, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { noop } from 'lodash';
import _ from 'lodash-es';
import { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { useDerivedState } from '@/components/hooks';
import { Box, Divider, IconButton, Tab as MUITab, TextField as MUITextField, MenuItem, Tabs } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { getHistoricalSegments } from '@/forecasts/charts/components/helpers';
import {
	DeterministicSeriesDescription,
	SegmentDescription,
	SegmentMenuItems,
} from '@/forecasts/charts/segmentComponents';
import { ControlsSectionContainer } from '@/forecasts/deterministic/manual/layout';
import { FORECAST_FLOATER_HANDLE } from '@/forecasts/shared/ForecastFloater';
import { theme } from '@/helpers/styled';
import { forecastSeries, phases } from '@/helpers/zing';

import { ForecastType, Phase } from '../forecast-form/automatic-form/types';

const phaseShortName = phases.reduce((acc, phase) => {
	acc[phase.value] = phase.short;
	return acc;
}, {} as Record<Phase, string>);

const getPhaseLabel = (phase, basePhase, phaseTypes) =>
	phaseTypes?.[phase.value] === 'ratio' && VALID_PHASES.includes(basePhase)
		? `${phase.short} / ${phaseShortName[basePhase]}`
		: phase.label;

const Tab = styled(MUITab)`
	min-width: unset !important;
`;

const ParametersTitleWithSubtext = ({
	fontSize = '1rem',
	maxCharacters = 15,
	maxWidth,
	subText,
	title,
}: {
	fontSize?: string;
	maxCharacters?: number;
	maxWidth?: string;
	subText: string;
	title: string;
}) => (
	<div
		css={`
			display: flex;
			flex-direction: column;
		`}
		title={title}
	>
		<span
			css={`
				font-size: ${fontSize};
				font-weight: 800;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				max-width: ${maxWidth};
			`}
			title={title}
		>
			{_.truncate(title, { length: maxCharacters })}
		</span>

		<span
			css={`
				color: ${theme.textUnitColor};
				font-size: 0.75rem;
			`}
		>
			{subText}
		</span>
	</div>
);

const getForecastParameterProps = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: Record<string, any>,
	phase: Phase,
	inputType?: ForecastType
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): Record<string, any> => {
	const phaseData = data?.[phase];
	if (phaseData) {
		const { forecastType, P_dict, ratio, type: phaseType } = phaseData;

		const type = inputType ?? phaseType ?? 'probabilistic';
		const commonProps = {
			forecastType,
			type,
		};

		if (type === 'deterministic') {
			if (forecastType === 'ratio') {
				const { segments, basePhase } = ratio;
				const baseSegments = getHistoricalSegments(data?.[basePhase] ?? {});
				return {
					...commonProps,
					basePhase,
					baseSegments,
					segments,
				};
			}

			const segments = getHistoricalSegments(phaseData);
			return {
				...commonProps,
				segments,
			};
		}

		return {
			...commonProps,
			forecastType: 'rate',
			pDict: P_dict,
		};
	}

	return {};
};

type ForecastParametersProps = {
	basePhase?: Phase | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	baseSegments?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any> | null;
	enablePhaseSelection?: boolean;
	forcePSeriesOffset?: boolean;
	forecastType?: 'rate' | 'ratio';
	handleToggle?: () => void;
	idxDate?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any> | null;
	parentResolution?: 'daily' | 'monthly';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	passedEurs?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	pDict?: any;
	phase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	phaseTypes?: any;
	pKey?: string;
	segIdx?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segments?: any[];
	setFloaterColor?: () => void;
	setPhase: (phase: Phase) => void;
	setPKey?: (pKey: string) => void;
	setSegIdx?: (segIdx: number) => void;
	showLabels?: boolean;
	title?: JSX.Element;
	type?: ForecastType;
	useHandle?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewOrder?: any[];
};
const ForecastParameters = (props: ForecastParametersProps) => {
	const {
		basePhase,
		baseSegments,
		dailyProduction,
		enablePhaseSelection = true,
		forcePSeriesOffset,
		forecastType,
		handleToggle,
		idxDate,
		monthlyProduction,
		parentResolution,
		passedEurs,
		pDict,
		phase,
		phaseTypes,
		pKey: parentPKey = 'best',
		segIdx: parentSegIdx = 0,
		segments: parentSegments,
		setFloaterColor = noop,
		setPhase: parentSetPhase,
		setPKey: parentSetPKey,
		setSegIdx: parentSetSegIdx,
		showLabels = true,
		title,
		type = 'deterministic',
		useHandle,
		viewOrder,
	} = props;

	const [pKey, _setPKey] = useDerivedState(parentPKey);
	const [segIdx, _setSegIdx] = useDerivedState(parentSegIdx);

	const setPKey = useCallback((value) => (parentSetPKey ?? _setPKey)(value), [_setPKey, parentSetPKey]);
	const setSegIdx = useCallback((value) => (parentSetSegIdx ?? _setSegIdx)(value), [_setSegIdx, parentSetSegIdx]);

	const hasTitleOrPhaseSelection = title || enablePhaseSelection;

	const segments = useMemo(() => {
		if (type === 'deterministic' && !pDict) {
			return parentSegments ?? [];
		}

		return pDict?.[pKey]?.segments ?? [];
	}, [pDict, pKey, parentSegments, type]);

	const phaseSelectionRender = useMemo(
		() =>
			enablePhaseSelection ? (
				<Tabs
					indicatorColor='secondary'
					onChange={(_ev, newValue) => parentSetPhase(newValue)}
					textColor='secondary'
					value={phase}
				>
					{phases.map((phase) => (
						<Tab
							value={phase.value}
							label={getPhaseLabel(phase, basePhase, phaseTypes)}
							key={phase.value}
						/>
					))}
				</Tabs>
			) : null,
		[basePhase, enablePhaseSelection, parentSetPhase, phase, phaseTypes]
	);

	const toggleButtonRender = useMemo(
		() =>
			handleToggle && (
				<IconButton
					css={`
						align-self: ${title ? 'flex-start' : 'center'};
						margin-left: auto;
					`}
					onClick={handleToggle}
					size='small'
				>
					{faTimes}
				</IconButton>
			),
		[handleToggle, title]
	);

	useEffect(() => {
		if (!parentSetSegIdx && segments.length) {
			setSegIdx(0);
		}
	}, [parentSetSegIdx, segments, setSegIdx]);

	useEffect(() => {
		setFloaterColor(theme[`${phase}Color`]);
	}, [phase, setFloaterColor]);

	return (
		<>
			<div
				css={`
					display: flex;
					justify-content: space-bewteen;
				`}
			>
				{title ? (
					<span
						css={`
							align-self: baseline;
							padding-top: 6px;
							width: ${useHandle ? 'unset' : '100%'};
						`}
					>
						{title}
					</span>
				) : (
					phaseSelectionRender
				)}

				{useHandle && hasTitleOrPhaseSelection && (
					<div
						id={FORECAST_FLOATER_HANDLE}
						css={`
							cursor: grab;
							flex-grow: 1;
							height: 2.75rem;
							&:active {
								cursor: grabbing;
							}
						`}
					/>
				)}

				{hasTitleOrPhaseSelection && toggleButtonRender}
			</div>

			{title && phaseSelectionRender}

			{hasTitleOrPhaseSelection ? (
				<Divider css='margin-top: -0.5rem;' />
			) : (
				<span
					css={`
						display: flex;
						justify-content: flex-end;
						margin: -0.5rem 0;
						width: 100%;
					`}
				>
					<IconButton onClick={handleToggle} size='small'>
						{faSlidersH}
					</IconButton>
				</span>
			)}

			<div
				css={`
					display: flex;
					flex-direction: column;
					margin-top: 0.5rem;
					row-gap: 0.5rem;
				`}
			>
				<Box height={type !== 'deterministic' || forcePSeriesOffset ? '3.25rem' : '0'}>
					{type !== 'deterministic' && (
						<MUITextField
							disabled={forecastType === 'ratio' && 'P Series disabled for ratio'}
							fullWidth
							label='P-Series'
							onChange={(ev) => setPKey(ev.target.value)}
							select
							size='small'
							value={pKey}
						>
							{forecastSeries.map(({ label, value }) => (
								<MenuItem key={value} value={value}>
									{label}
								</MenuItem>
							))}
						</MUITextField>
					)}
				</Box>

				<Box height='3.25rem'>
					<SegmentMenuItems
						render={(menuItems) => (
							<MUITextField
								disabled={!segments?.length}
								fullWidth
								label='Segments'
								onChange={(ev) => setSegIdx(ev.target.value)}
								select
								size='small'
								value={segments?.length ? segIdx : ''}
							>
								{menuItems?.map(({ label, value }) => (
									<MenuItem key={value} value={value}>
										{label}
									</MenuItem>
								))}
							</MUITextField>
						)}
						segments={segments ?? []}
					/>
				</Box>

				<ControlsSectionContainer noPadding>
					<DeterministicSeriesDescription
						basePhase={basePhase}
						baseSegments={baseSegments}
						dailyProduction={dailyProduction}
						disableTitle
						isTC={!!idxDate}
						forecastDataFreq={parentResolution}
						forecastType={forecastType}
						monthlyProduction={monthlyProduction}
						passedEur={passedEurs?.[phase]?.[pKey]}
						phase={phase}
						segments={segments ?? []}
						showLabels={showLabels}
						smaller
					/>
				</ControlsSectionContainer>

				<ControlsSectionContainer noPadding>
					<SegmentDescription
						basePhase={basePhase}
						disableTitle
						forecastType={forecastType}
						idxDate={idxDate}
						phase={phase}
						segment={segments[segIdx]}
						showLabels={showLabels}
						smaller
						viewOrder={viewOrder}
					/>
				</ControlsSectionContainer>
			</div>
		</>
	);
};

export default ForecastParameters;
export { getForecastParameterProps, ParametersTitleWithSubtext };
