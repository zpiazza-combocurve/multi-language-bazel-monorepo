// TODO use material-ui
import styled from 'styled-components';

export const Header = styled.div`
	display: flex;
	align-items: baseline;
	width: max-content;
	& > *:not(:first-child) {
		margin-left: 1rem;
	}
	position: relative;
`;
