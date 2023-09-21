import styled from 'styled-components';

import { LargerMUITooltip } from '@/components/tooltipped';

export const TypeCurveFitContainer = styled.section`
	display: flex;
	padding-top: 0.75%;
	height: calc(99.5vh - 65px);
	justify-content: space-between;
	margin: 0 auto;
	width: 98.5vw;
`;

export const ChartAreaContainer = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width: 100%;
`;

export const ChartArea = styled.section`
	align-items: center;
	display: flex;
	flex-grow: 1;
	justify-content: flex-start;
	margin-top: auto;
`;

export const ToggleMaximizeChart = ({ isMaximized, toggleButton }) => (
	<LargerMUITooltip title={isMaximized ? 'Minimize' : 'Maximize'} placement='left'>
		<div>{toggleButton}</div>
	</LargerMUITooltip>
);
