import { ToggleButton } from '@material-ui/lab';
import styled from 'styled-components';

import { Paper } from '@/components/v2';
import { ifProp } from '@/helpers/styled';

const FitIndexContainer = styled.section`
	display: flex;
	height: 100%;
	padding: 0.75rem;
	width: 100%;
`;

const ModeLayoutContainer = styled.section`
	column-gap: 0.5rem;
	display: flex;
	height: 100%;
	width: 100%;
	& > * {
		height: 100%;
	}
`;

const ControlsContainer = styled(Paper)<{ expanded?: boolean }>`
	display: flex;
	flex-direction: column;
	padding: 0 1rem 0.5rem 1rem;
	row-gap: 0.75rem;
	${ifProp('expanded', 'flex: 1 1 calc(62.5% - 1rem);', 'flex: 1 1 33%;')};
`;

const ControlsLayoutContainer = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	row-gap: 0.5rem;
`;

const ChartGridContainer = styled.section<{ collapsed?: boolean }>`
	display: flex;
	flex-direction: column;
	row-gap: 0.5rem;

	// add 1rem to keep the charts from re-rendering / to keep them the same width
	${ifProp('collapsed', 'flex: 1 1 calc(37.5% + 1rem);', 'flex: 1 1 67%;')};
	& > * {
		width: 100%;
	}
`;

const ChartGridToolbarContainer = styled(Paper)`
	align-items: center;
	display: flex;
	justify-content: space-between;
	height: 3rem;
	padding: 0 0.5rem;
	width: 100%;
	flex-shrink: 0;
`;

// currently always 4 charts
const ChartGridAreaContainer = styled.section`
	column-gap: 0.5rem;
	display: flex;
	flex-grow: 1;
	flex-wrap: wrap;
	row-gap: 0.5rem;
	overflow: auto;
	& > * {
		flex: 1 1 calc(50% - 0.25rem);
	}
`;

const FitToggleButton = styled(ToggleButton)`
	&.Mui-selected {
		color: rgb(25, 118, 210);
		background-color: rgba(25, 118, 210, 0.2);
		&:hover {
			background-color: rgba(25, 118, 210, 0.3);
		}
	}
`;

export {
	ChartGridAreaContainer,
	ChartGridContainer,
	ChartGridToolbarContainer,
	ControlsContainer,
	ControlsLayoutContainer,
	FitIndexContainer,
	FitToggleButton,
	ModeLayoutContainer,
};
