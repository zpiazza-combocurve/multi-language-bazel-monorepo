import { faSlidersH } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import styled from 'styled-components';

import { Centered, Divider, Floater } from '@/components';
import {
	DeterministicSeriesDescription,
	SegmentDescription,
	SegmentMenuItems,
} from '@/forecasts/charts/segmentComponents';
import {
	ControlFieldContainer,
	ControlFieldLabel,
	ControlsSectionContainer,
	InlineLabeled,
	StyledSelectField,
} from '@/forecasts/deterministic/manual/layout';
import { theme } from '@/helpers/styled';
import { forecastSeries, phases } from '@/helpers/zing';

const ParameterFloater = styled(Floater)`
	right: 2rem;
	top: 2rem;
`;

/**
 * Forecast Description Floating Panel
 *
 * @typedef Props
 * @property {Phase} phase
 * @property {(newPhase: Phase) => void} onChangePhase Optional if wants to show the phase selector when detached
 * @property {Segment[]} segments
 * @property {Segment[]} baseSegments Only used for ratio
 * @property {number} segIdx Current segment index
 * @property {(newIdx: number) => void} onChangeSegIdx
 * @property {WellProduction} [dailyProduction]
 * @property {WellProduction} [monthlyProduction]
 * @property {Frequency} dataFreq
 * @property {ForecastType} forecastType
 * @property {Phase} basePhase Only used for ratio
 * @param {Props} props
 */
export function ForecastDescriptionPanel({
	phase,
	segments = [],
	baseSegments = [],
	segIdx,
	onChangeSegIdx,
	series,
	onChangeSeries,
	wellId,
	// optional production
	dailyProduction = null,
	monthlyProduction = null,
	// forecast data
	onChangePhase = null,
	dataFreq,
	forecastType,
	enableSeriesField = !!onChangeSeries,
	enableSegmentField = !!onChangeSegIdx,
	basePhase = null,
}) {
	const [detached, setDetached] = useState(false);

	return (
		<ParameterFloater
			color={theme.grayColorAccent}
			detached={detached}
			detachIcon={faSlidersH}
			onToggle={() => setDetached((p) => !p)}
			width='25rem'
		>
			{detached && !!onChangePhase && (
				<InlineLabeled label='Phase'>
					<StyledSelectField menuItems={phases} onChange={(value) => onChangePhase(value)} value={phase} />
				</InlineLabeled>
			)}

			{enableSeriesField && !!segments?.length && (
				<InlineLabeled label='Series'>
					<StyledSelectField
						menuItems={forecastSeries}
						onChange={(value) => onChangeSeries(value)}
						value={series}
					/>
				</InlineLabeled>
			)}

			{enableSegmentField && !!segments?.length && (
				<>
					<ControlsSectionContainer>
						<ControlFieldContainer>
							<ControlFieldLabel>Segment:</ControlFieldLabel>
							<SegmentMenuItems
								render={(menuItems) => (
									<StyledSelectField
										menuItems={menuItems}
										onChange={(value) => onChangeSegIdx(value)}
										value={segIdx}
									/>
								)}
								segments={segments}
							/>
						</ControlFieldContainer>
					</ControlsSectionContainer>
					<Divider />
				</>
			)}

			<ControlsSectionContainer>
				<DeterministicSeriesDescription
					basePhase={basePhase}
					baseSegments={forecastType === 'ratio' ? baseSegments : []}
					dailyProduction={dailyProduction}
					disableTitle
					forecastDataFreq={dataFreq}
					forecastType={forecastType}
					monthlyProduction={monthlyProduction}
					phase={phase}
					isTC={false}
					segments={segments ?? []}
					wellId={wellId}
				/>
			</ControlsSectionContainer>

			<Divider />

			<ControlsSectionContainer>
				{segments?.length ? (
					<SegmentDescription
						basePhase={basePhase}
						disableTitle
						forecastType={forecastType}
						phase={phase}
						segment={segments?.[segIdx] ?? null}
					/>
				) : (
					<Centered horizontal as='h3'>
						No Forecast To Display
					</Centered>
				)}
			</ControlsSectionContainer>
		</ParameterFloater>
	);
}
