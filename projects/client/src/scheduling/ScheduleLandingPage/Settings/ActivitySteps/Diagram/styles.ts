import styled from 'styled-components';

import { IconButton } from '@/components/v2';
import theme from '@/helpers/styled';

export const ZoomContainer = styled.div`
	position: absolute;
	right: 0px;
	display: flex;
	flex-direction: column;
	border-radius: 4px;
	margin: 8px;
	border: 1px solid #565556;
	background: ${theme.background};
	z-index: 1;
`;

export const ZoomIcon = styled(IconButton)`
	width: 32px;
	height: 32px;
`;
