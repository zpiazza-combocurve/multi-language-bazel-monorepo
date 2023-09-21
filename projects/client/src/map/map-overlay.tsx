import { MenuButton } from 'react-md';
import styled from 'styled-components';

import { theme } from '@/helpers/styled';

const MapOverlayContainer = styled.div<{ mapOverlayPosition: number; menuWidth?: string }>`
	position: absolute;

	.map-overlay-toggle {
		z-index: 5;
		background-color: white;
		position: relative;
		top: ${({ mapOverlayPosition = 0 }) => mapOverlayPosition * 40 + 10}px;
		left: 10px;
		width: 30px;
		min-width: 30px;
		height: 30px;
		padding: 0;
		border-radius: 4px;

		svg {
			color: black;
		}

		&:hover {
			background-color: #f2f2f2;
		}
	}

	h3 {
		color: ${({ theme }) => theme.palette.text.primary}; // HACK for map mui theme
	}

	.map-overlay-menu-list {
		background-color: ${({ theme }) => theme.palette.background.default};
		top: ${({ mapOverlayPosition = 0 }) => mapOverlayPosition * 40 + 10}px;
		left: calc(100% + 15px);
		border-radius: 4px;
		${({ menuWidth }) => (menuWidth ? `width: ${menuWidth};` : '')}
		padding: 0.25rem 1rem 0.25rem 0.25rem;
	}
`;

export function MapOverlayMenuButton<T extends { mapOverlayPosition: number; menuWidth?: string }>({
	mapOverlayPosition,
	menuWidth,
	...props
}: T) {
	return (
		<MapOverlayContainer mapOverlayPosition={mapOverlayPosition} menuWidth={menuWidth}>
			<MenuButton
				flat
				className='map-overlay-toggle'
				listClassName='map-overlay-menu-list'
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				position={MenuButton.Positions.BELOW}
				{...props}
			/>
		</MapOverlayContainer>
	);
}

const SimpleMapOverlayTopContainer = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
`;
const SimpleMapOverlayIntermediateContainer = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
`;
const SimpleMapOverlayInnerContainer = styled.div`
	position: absolute;
	left: 10px;
	bottom: 75px;
	z-index: 5;
	border-radius: 4px;
	background: ${theme.background};
	opacity: 0.8;
`;

export function BottomMapOverlay({ children }) {
	return (
		<SimpleMapOverlayTopContainer>
			<SimpleMapOverlayIntermediateContainer>
				<SimpleMapOverlayInnerContainer>{children}</SimpleMapOverlayInnerContainer>
			</SimpleMapOverlayIntermediateContainer>
		</SimpleMapOverlayTopContainer>
	);
}
