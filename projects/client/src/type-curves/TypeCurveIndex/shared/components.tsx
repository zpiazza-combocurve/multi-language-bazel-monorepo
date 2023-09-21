import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { Dispatch, SetStateAction } from 'react';
import { useTheme } from 'styled-components';

import { MenuButton, MenuItem } from '@/components/v2';
import { TooltipWrapper } from '@/components/v2/helpers';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { phaseColors, phases } from '@/helpers/zing';
import { NormalizationViewerOptions, ViewerOptions } from '@/type-curves/charts/graphProperties';
import { useTypeCurveInfo } from '@/type-curves/shared/useTypeCurveInfo';

export function PhaseSelectField({ phase, setPhase }: { phase: Phase; setPhase: Dispatch<SetStateAction<Phase>> }) {
	return (
		<MenuButton
			label={<span css='text-transform: none !important;'>{_.capitalize(phase)}</span>}
			endIcon={faChevronDown}
			hideMenuOnClick
		>
			{_.map(phases, ({ value, label }) => (
				<MenuItem key={value} onClick={() => setPhase(value)}>
					{label}
				</MenuItem>
			))}
		</MenuButton>
	);
}

export function PhaseWellCountLabel({
	count,
	enableLabel,
	normRepCount,
	phase,
	viewerOption,
	typeCurveId,
}: {
	count: string | number;
	enableLabel?: boolean;
	normRepCount?: number;
	phase: Phase;
	viewerOption?: ViewerOptions | NormalizationViewerOptions;
	typeCurveId?: string;
}) {
	const theme = useTheme();
	const { phaseWellsInfo } = useTypeCurveInfo(typeCurveId);
	const { total, invalid, rep, excluded } = phaseWellsInfo[phase].count;
	return (
		<TooltipWrapper
			tooltipTitle={
				<span
					css={`
						display: flex;
						flex-direction: column;
						row-gap: 0.25rem;
					`}
				>
					<span>Total: {total}</span>
					{(viewerOption === 'linearFit' || viewerOption === 'qPeakLinearFit') &&
						Number.isFinite(normRepCount) && <span>Norm Rep: {normRepCount}</span>}
					<span>Rep: {rep}</span>
					<span>Excluded: {excluded}</span>
					<span>Invalid: {invalid}</span>
				</span>
			}
		>
			<span
				css={`
					background-color: ${phaseColors[phase]};
					border-radius: 1rem;
					color: ${theme.palette.type === 'light' ? '#FFF' : '#223'};
					cursor: pointer;
					font-size: 0.75rem;
					font-weight: bold;
					padding: 4px 8px;
				`}
			>
				{`${enableLabel ? 'Well Count: ' : ''}${count}`}
			</span>
		</TooltipWrapper>
	);
}
