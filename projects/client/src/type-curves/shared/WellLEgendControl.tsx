import styled from 'styled-components';

import { InfoIcon } from '@/components/v2/misc';
import { INVALID_COLOR } from '@/forecasts/proximity-forecast/ProximityWellMap';
import { PROXIMITY_TARGET_WELL_COLOR } from '@/helpers/zing';
import MapControl from '@/map/MapboxGL/MapControl';
import { WELL_COLOR } from '@/map/WellMap/WellsSource';

export const Shape = styled.span<{ color: string; borderColor: string }>`
	display: inline-block;
	width: 1rem;
	height: 1rem;
	margin-left: 0.5rem;
	background-color: ${({ color }) => color};
	border: solid 0.15rem ${({ borderColor }) => borderColor};
	border-radius: 50%;
`;

export const Item = styled.div`
	display: flex;
	align-items: center;
	& > *:not(:first-child) {
		margin-left: 0.25rem;
	}
`;

export const Padding = styled.div`
	flex: 1 0 0;
`;

export function WellLegendControl({ proximityWell }) {
	return (
		<MapControl css='padding: 0.5rem' position='bottom-right'>
			<Item>
				<InfoIcon tooltipTitle='Representative wells' />
				<span>Rep</span>
				<Padding />
				<Shape color={WELL_COLOR} borderColor={WELL_COLOR} />
			</Item>
			{!proximityWell && (
				<Item>
					<InfoIcon tooltipTitle='Invalid and Excluded wells' />
					<span>Inv&Exc</span>
					<Padding />
					<Shape color={INVALID_COLOR} borderColor={INVALID_COLOR} />
				</Item>
			)}

			{proximityWell && (
				<Item>
					<InfoIcon tooltipTitle='Target Well' />
					<span>Target Well</span>
					<Padding />
					<Shape color={PROXIMITY_TARGET_WELL_COLOR} borderColor={PROXIMITY_TARGET_WELL_COLOR} />
				</Item>
			)}
		</MapControl>
	);
}
