import { MultipleSegments } from '@combocurve/forecast/models';
import { round } from 'lodash-es';
import { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { Centered, Placeholder } from '@/components';
import { useWellHeaderValues } from '@/forecasts/charts/components/deterministic/grid-chart/api';
import { paramsToConvert, useForecastConvertFunc } from '@/forecasts/manual/shared/conversionHelper';
import { ifProp, theme } from '@/helpers/styled';
import { capitalize } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import { fields as segModelsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { fields as segParamsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

import { Phase } from '../forecast-form/automatic-form/types';
import { calcWellLifeVal, genViewValue, getCumProd, getEndDataIdx } from './forecastChartHelper';

import './segmentComponents.scss';

const multiSeg = new MultipleSegments();

const ViewSegmentContainer = styled.section<{ smaller?: boolean }>`
	margin-top: 0;
	overflow-y: auto;
	${ifProp('smaller', 'font-size: 0.8rem;')}
`;

const ViewSegmentTitle = styled.span<{ smaller?: boolean }>`
	display: flex;
	font-size: 1.5rem;
	justify-content: center;
	padding: 0.5rem 0;
	width: 100%;
	${ifProp('smaller', 'font-size: 1.2rem')};
`;

const SegmentItemContainer = styled.div`
	border-bottom: 1px solid ${theme.grayColorAccent};
	display: flex;
	height: 1.5rem;
	justify-content: space-between;
	margin: 0.25rem 0;
	width: 100%;
`;

const SegmentItemLabel = styled.span<{ smaller?: boolean }>`
	${ifProp('smaller', 'font-size: 0.8rem')};
`;

const SegmentItemValue = styled.span<{ smaller?: boolean }>`
	font-weight: 800;
	${ifProp('smaller', 'font-size: 0.8rem')};
`;

const SegmentItemUnits = styled.span<{ smaller?: boolean }>`
	color: ${theme.textUnitColor};
	font-size: 0.75rem;
	margin-left: 0.25rem;
	${ifProp('smaller', 'font-size: 0.6rem')};
`;

const SegmentItem = ({
	label,
	smaller,
	value,
	units = null,
	showLabel = true,
}: {
	label: string;
	smaller: boolean;
	value: string | number;
	units?: string | null;
	showLabel?: boolean;
}) => {
	return (
		<SegmentItemContainer>
			<div>
				{showLabel && <SegmentItemLabel smaller={smaller}>{label}</SegmentItemLabel>}
				{units && showLabel && <SegmentItemUnits smaller={smaller}>{`(${units})`}</SegmentItemUnits>}
				{units && !showLabel && <SegmentItemUnits smaller={smaller}>{units}</SegmentItemUnits>}
			</div>

			<SegmentItemValue smaller={smaller}>{value}</SegmentItemValue>
		</SegmentItemContainer>
	);
};

export const SegmentDescription = ({
	basePhase = null,
	disableTitle,
	forecastType = 'rate',
	idxDate = false,
	phase,
	segment, // current segment
	showLabels = true,
	smaller = false,
	viewOrder, // []
}: {
	basePhase?: Phase | null;
	disableTitle?: boolean;
	forecastType?: 'rate' | 'ratio';
	idxDate?: boolean;
	phase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segment: any;
	showLabels?: boolean;
	smaller?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewOrder?: any[];
}) => {
	const forecastConvertFunc = useForecastConvertFunc({
		phase,
		basePhase: forecastType === 'ratio' && basePhase !== phase ? basePhase : null,
	});

	const { q: qConversion, k: kConversion, loaded: forecastConversionLoaded } = forecastConvertFunc;

	if (!forecastConversionLoaded) {
		return <Placeholder loading loadingText='Loading Segment...' />;
	}
	if (!segment) {
		return (
			<Centered as='h4' horizontal>
				No Segment To Display...
			</Centered>
		);
	}

	return (
		<ViewSegmentContainer>
			{!disableTitle && <ViewSegmentTitle smaller={smaller}>Segment Parameters</ViewSegmentTitle>}
			{/* TODO: hard-coded parameter for now (may need to move to display-template and onto the forecast-data document) */}
			<SegmentItem
				label='Duration'
				showLabel={showLabels}
				smaller={smaller}
				value={segment.end_idx - segment.start_idx + 1}
				units='Days'
			/>

			{(viewOrder ?? segModelsTemplate[segment?.name]?.viewOrder ?? [])
				.map((param) => {
					const { idx_label, label, round: roundTo, type } = segParamsTemplate?.[param] || {};
					const paramValue = segment[param];
					let value;
					let units;
					if (param === 'k') {
						value = genViewValue(
							type,
							paramsToConvert.includes(param) ? kConversion.toView(paramValue) : paramValue,
							roundTo,
							idxDate
						);
						units = paramsToConvert.includes(param)
							? kConversion.viewUnits
							: segParamsTemplate?.[param]?.units?.[phase];
					} else {
						value = genViewValue(
							type,
							paramsToConvert.includes(param) ? qConversion.toView(paramValue) : paramValue,
							roundTo,
							idxDate
						);

						units = paramsToConvert.includes(param)
							? qConversion.viewUnits
							: segParamsTemplate?.[param]?.units?.[phase];
					}

					return (
						<SegmentItem
							key={segParamsTemplate[param].label}
							label={idxDate && idx_label ? idx_label : label}
							showLabel={showLabels}
							smaller={smaller}
							units={units}
							value={value}
						/>
					);
				})
				.filter((val) => val !== null)}
		</ViewSegmentContainer>
	);
};

type DeterministicSeriesDescriptionProps = {
	forecastType?: 'rate' | 'ratio';
	basePhase?: Phase | null; // Only used for ratio forecast
	forecastDataFreq?: 'daily' | 'monthly';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	segments: any[];
	phase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any> | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	baseSegments?: any; // Only for deterministic
	disableTitle?: boolean; // Default is `'false'`
	smaller?: boolean; // Default is `'false'`
	showLabels?: boolean;
	wellId?: string;
	passedEur?: number | null;
	isTC: boolean;
};

export const DeterministicSeriesDescription = ({
	basePhase = null,
	baseSegments = null,
	dailyProduction = null,
	disableTitle = false,
	forecastDataFreq = 'monthly',
	forecastType = 'rate',
	isTC,
	monthlyProduction = null,
	passedEur,
	phase,
	segments = [],
	showLabels = true,
	smaller = false,
	wellId,
}: DeterministicSeriesDescriptionProps) => {
	const wellHeaderQuery = useWellHeaderValues(wellId, 'all');
	const { data: wellHeaders } = wellHeaderQuery;

	const forecastConvertFunc = useForecastConvertFunc({
		phase,
		basePhase: forecastType === 'ratio' && basePhase !== phase ? basePhase : null,
	});
	const { cumsum: cumSumConversion, eur: eurConversion, loaded: forecastConversionLoaded } = forecastConvertFunc;

	const dailyCum = useMemo(() => getCumProd(dailyProduction, phase, 'daily'), [dailyProduction, phase]);
	const monthlyCum = useMemo(() => getCumProd(monthlyProduction, phase, 'monthly'), [monthlyProduction, phase]);
	const forecastCalcs = useMemo(() => {
		const isRate = forecastType === 'rate';
		const cumData = forecastDataFreq === 'monthly' ? monthlyCum : dailyCum;
		const production = forecastDataFreq === 'monthly' ? monthlyProduction : dailyProduction;

		// get totalWellLife
		const { total: totalWellLife, remaining: remainingWellLife } = calcWellLifeVal({ production, segments });

		// calculate time positioning
		const endDataIdx = getEndDataIdx(production);
		const leftIdx = segments[0]?.start_idx ?? endDataIdx;
		const rightIdx = segments[segments.length - 1]?.end_idx ?? 0;

		let eur: number;
		if (Number.isFinite(passedEur)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			eur = passedEur!;
		} else {
			eur = isRate
				? multiSeg.rateEur({
						cumData,
						endDataIdx,
						leftIdx,
						rightIdx,
						forecastSegments: segments,
						dataFreq: forecastDataFreq,
				  })
				: multiSeg.ratioEurInterval({
						cumData,
						endDataIdx,
						leftIdx,
						rightIdx,
						ratioTSegments: segments,
						baseSegments,
						dataFreq: forecastDataFreq,
				  });
		}

		const rur = eur - cumData;

		return { eur, totalWellLife, remainingWellLife, rur };
	}, [
		baseSegments,
		dailyCum,
		dailyProduction,
		forecastDataFreq,
		forecastType,
		monthlyCum,
		monthlyProduction,
		segments,
		passedEur,
	]);

	const { eur, totalWellLife, remainingWellLife, rur } = forecastCalcs;

	const parseNumber = useCallback(
		(value) => (Number.isFinite(value) ? numberWithCommas(round(value, 2)) : 'N/A'),
		[]
	);

	return forecastConversionLoaded ? (
		<ViewSegmentContainer>
			{!disableTitle && (
				<ViewSegmentTitle smaller={smaller}>{`${capitalize(phase)} Parameters`}</ViewSegmentTitle>
			)}

			{monthlyProduction && (
				<SegmentItem
					label='Monthly Cum-Prod'
					showLabel={showLabels}
					smaller={smaller}
					units={cumSumConversion.viewUnits}
					value={parseNumber(cumSumConversion.toView(monthlyCum))}
				/>
			)}

			{dailyProduction && (
				<SegmentItem
					label='Daily Cum-Prod'
					showLabel={showLabels}
					smaller={smaller}
					units={cumSumConversion.viewUnits}
					value={parseNumber(cumSumConversion.toView(dailyCum))}
				/>
			)}

			{!isTC && (
				<SegmentItem
					label='RUR'
					showLabel={showLabels}
					smaller={smaller}
					units={eurConversion.viewUnits}
					value={parseNumber(eurConversion.toView(rur))}
				/>
			)}

			<SegmentItem
				label='EUR'
				showLabel={showLabels}
				smaller={smaller}
				units={eurConversion.viewUnits}
				value={parseNumber(eurConversion.toView(eur))}
			/>

			{wellHeaders?.perf_lateral_length && Number.isFinite(eur) && (
				<SegmentItem
					label='EUR / FT'
					showLabel={showLabels}
					smaller={smaller}
					units={`${eurConversion.calcUnits} / FT`}
					value={parseNumber(eur / wellHeaders.perf_lateral_length)}
				/>
			)}

			<SegmentItem
				label='Well Life'
				showLabel={showLabels}
				smaller={smaller}
				value={parseNumber(totalWellLife)}
				units='Years'
			/>

			{!isTC && (
				<SegmentItem
					label='Rem. Well Life'
					showLabel={showLabels}
					smaller={smaller}
					value={parseNumber(remainingWellLife)}
					units='Years'
				/>
			)}
		</ViewSegmentContainer>
	) : (
		<Placeholder loading={!forecastConversionLoaded} loadingText='Loading Series Description...' />
	);
};

export const SegmentMenuItems = ({ render, segments }) =>
	render(
		segModelsTemplate
			? segments.map((s, i) => {
					return {
						value: i,
						label: `${i + 1}. ${segModelsTemplate[s.name].label}`,
					};
			  })
			: []
	);
