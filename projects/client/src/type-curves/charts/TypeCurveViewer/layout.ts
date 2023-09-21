import styled from 'styled-components';

const TitleContainer = styled.section`
	align-items: center;
	column-gap: 0.5rem;
	display: flex;
	height: 3rem;
	justify-content: space-between;
	padding: 0 0.5rem;
	width: 100%;
`;

const ChartContainer = styled.section`
	flex-grow: 1;
	width: 100%;
	height: calc(100% - 3rem);
`;

const EurSubtitleContainer = styled.section`
	display: flex;
	font-size: 0.75rem;
	margin: 0 0.5rem -0.75rem 0.5rem;
	padding-left: calc(26px + 0.75rem);

	& > *:not(:last-child) {
		margin-right: 0.5rem;
	}
`;

export { ChartContainer, TitleContainer, EurSubtitleContainer };
