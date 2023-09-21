import styled, { css } from 'styled-components';

import { Checkbox } from '@/components';
import { DEFAULT_CONTROL_TOGGLE_SIZE, DEFAULT_ICON_SIZE } from '@/components/FontIcon';
import sassVars from '@/global-styles/vars.scss?inline';
import { ifProp } from '@/helpers/styled';

const Container = styled.section`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	${ifProp('hidden', 'display: none;')}
`;

const DeterministicPhaseChartContainer = styled(Container)`
	border-radius: 5px;
	box-shadow: ${sassVars.boxShadow1};
	padding: 0.25rem;
	&:hover {
		box-shadow: ${sassVars.boxShadow4};
	}
`;

const DeterministicGridChartContainer = styled(Container)`
	padding-right: 0.5rem;
`;

const ChartContainer = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 100%;
	width: 100%;
	overflow: auto;
`;

const ChartTitle = styled.div`
	align-items: center;
	column-gap: 0.5rem;
	display: flex;
	flex: 1 1 0;
	padding: 0.25rem 0.5rem;
	width: 100%;
	${ifProp('disablePadding', 'padding: unset;')}
`;

const ChartTitleInfo = styled.div`
	-ms-overflow-style: none;
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 3.25rem;
	overflow-y: scroll;
	scroll-bar-width: none;
	width: 100%;
	&::-webkit-scrollbar {
		height: 0;
		width: 0;
	}
`;

const AdditionalChartActions = styled.div`
	align-items: flex-end;
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	justify-self: flex-end;
	margin-left: auto !important;
	padding-right: 0.5rem;
`;

const AdditionalChartActionRow = styled.div`
	align-items: center;
	display: flex;
	justify-content: flex-end;
	& > * {
		margin: 0 0.25rem;
		&:first-child {
			margin-left: 0;
		}
		&:last-child {
			margin-right: 0;
		}
	}
`;

const VerticalChartActions = styled.div`
	align-items: center;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	margin-left: 0.25rem;

	// keep uniform width; all elements should be icons
	min-width: 2rem;
	& > * {
		margin: 0.25rem 0;
		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const ChartAreaContainer = styled.section`
	display: flex;
	flex-grow: 1;
	height: 100%;
	width: 100%;
`;

const ChartArea = styled.div`
	flex-grow: 1;
	width: 100%;
	${ifProp('hidden', 'visibility: hidden;')}
`;

const PaddedFragments = styled.div`
	& > * {
		margin: 0.5rem 0;
		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const SingleChartContainer = styled.section`
	display: flex;
	flex-direction: column;
	height: 100%;
	flex-grow: 1;
	${({ hidden }) => hidden && 'display: none;'}
`;

const SingleChartArea = styled.section`
	align-self: center;
	border-radius: 5px;
	box-shadow: ${sassVars.boxShadow1};
	display: flex;
	flex-grow: 1;
	height: 100%;
	justify-content: center;
	padding: 0.25rem;
	transition: all 0.3s ease;
	width: 100%;
	&:hover {
		box-shadow: ${sassVars.boxShadow4};
	}
`;

const XControlsContainer = styled.section`
	align-items: center;
	display: flex;
	justify-content: space-between;
	padding: 0.25rem 0rem 0.25rem 2.5rem;
`;

const YControlsContainer = styled.section`
	display: flex;
	flex-grow: 1;
	position: relative;
	width: 100%;
	height: 100%;
`;

const YControlsArea = styled.section`
	align-items: baseline;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-width: calc(30px + 0.5rem); // small button is 25px, add an extra 0.5rem
	padding: 3rem 0.25rem 1rem 0.25rem;
	position: relative;
`;

const WarningContainer = styled.div`
	align-items: flex-start;
	display: flex;
	flex-direction: column;
	padding: 0.5rem 1rem;
`;

// maybe share this outside this file; use DEFAULT_ICON_SIZE to determine the same ratio for the control toggle size
const genCheckboxSizeRatio = (size) => (DEFAULT_CONTROL_TOGGLE_SIZE * size) / DEFAULT_ICON_SIZE;

const forceCheckboxSizeStyle = css(
	({ size, paddingRatio = 4 }) => `
	height: ${genCheckboxSizeRatio(size)}px;
	width: ${genCheckboxSizeRatio(size)}px;
	padding: ${genCheckboxSizeRatio(size) / paddingRatio}px;
`
);

const ChartCheckbox = styled(Checkbox)`
	.md-selection-control-toggle {
		${ifProp('size', forceCheckboxSizeStyle)}
	}
`;

export {
	AdditionalChartActionRow,
	AdditionalChartActions,
	ChartArea,
	ChartAreaContainer,
	ChartContainer,
	ChartTitle,
	ChartTitleInfo,
	Container,
	DeterministicGridChartContainer,
	DeterministicPhaseChartContainer,
	PaddedFragments,
	SingleChartArea,
	SingleChartContainer,
	VerticalChartActions,
	WarningContainer,
	XControlsContainer,
	YControlsArea,
	YControlsContainer,
	ChartCheckbox,
};
