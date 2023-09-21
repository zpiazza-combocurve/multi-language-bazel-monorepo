import styled from 'styled-components';

import { theme } from '@/helpers/styled';

const warnBackground = theme.warningColorOpaque;

const Banner = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${theme.spaceMd};
	font-size: 1.2rem;
	text-align: center;
	& > :not(:first-child) {
		margin-left: 0.5rem;
	}
`;

export const WarnBanner = styled(Banner)`
	background-color: ${warnBackground};
	color: ${theme.textColor};
`;
