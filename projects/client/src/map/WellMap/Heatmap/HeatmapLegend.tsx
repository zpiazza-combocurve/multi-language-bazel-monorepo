import styled from 'styled-components';

import { useWellHeaders } from '@/helpers/headers';
import { theme } from '@/helpers/styled';
import MapControl from '@/map/MapboxGL/MapControl';

import { HeatmapOptions } from './shared';

const Legend = styled.ul`
	list-style-type: none;
	margin: 0;
	padding: 0.5rem 1rem;
`;

const LegendTitle = styled.h3`
	font-size: 0.7rem;
	margin-bottom: 0.5rem;
`;

const LegendTitleLine = styled.p`
	margin: 0;
	height: 1.2em;
`;

const LegendColor = styled.li`
	display: flex;
	align-items: center;
	color: ${theme.textColor};
	height: 1.2em;
`;

const ColorBox = styled.div`
	width: 1em;
	height: 1em;
	background: ${({ color }) => color};
	border-style: solid;
	border-width: 1px;
	border-color: ${theme.borderColor};
	margin-right: 0.5rem;
`;

export interface HeatmapLegendProps {
	options: HeatmapOptions;
	legend: Record<string, string>;
}

export function HeatmapLegend({ options, legend }: HeatmapLegendProps) {
	const { wellHeadersLabels } = useWellHeaders({ enableProjectCustomHeaders: true });

	return (
		<Legend>
			<LegendTitle>
				<LegendTitleLine>{wellHeadersLabels[options.header]}</LegendTitleLine>
				<LegendTitleLine>{options.gridCellSize} Mile Grid</LegendTitleLine>
			</LegendTitle>
			{Object.entries(legend).map(([color, value]) => (
				<LegendColor key={color}>
					<ColorBox color={color} /> {value}
				</LegendColor>
			))}
		</Legend>
	);
}

function HeatmapLegendControl(props: HeatmapLegendProps) {
	return (
		<MapControl position='bottom-left' css={{ borderRadius: '4px', background: theme.background, opacity: 0.8 }}>
			<HeatmapLegend {...props} />
		</MapControl>
	);
}

export default HeatmapLegendControl;
