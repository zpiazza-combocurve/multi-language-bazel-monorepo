import styled from 'styled-components';

import theme from '@/helpers/styled';

const InfoMenuItem = styled.div`
	background-color: ${theme.secondaryColorOpaque};
	color: ${theme.secondaryColor};
	display: flex;
	font-size: 0.75rem;
	font-weight: 500;
	justify-content: center;
	line-height: 2rem;
	min-width: 15rem;
	width: 100%;
`;

export default InfoMenuItem;
