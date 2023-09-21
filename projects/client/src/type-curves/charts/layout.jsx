import styled from 'styled-components';

import { SelectField } from '@/components';

const StyledSelectField = styled(SelectField)`
	width: 50%;
`;

const FitViewerChartTitle = styled.span`
	align-items: center;
	align-self: center;
	display: flex;
	justify-content: space-between;
	padding: 0 0.25rem;
	width: 100%;
`;

const ChartOptionsMenuContainer = styled.div`
	margin-left: 0.5rem;
	.chart-options-menu__list {
		border-radius: 5px;
		max-height: 340px;
		min-width: 250px;
		padding: 0.5rem !important;
	}
`;

const MenuListContainer = styled.section`
	align-items: center;
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	padding: 0.5rem 0;
	width: 100%;
`;

export { StyledSelectField, FitViewerChartTitle, ChartOptionsMenuContainer, MenuListContainer };
