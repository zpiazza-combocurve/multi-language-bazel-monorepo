import styled from 'styled-components';

import { InfoTooltipWrapperProps } from '@/components/v2/misc/InfoIcon';

export interface MenuItem {
	value: string;
	label: string;
	disabled?: boolean | undefined;
	tooltipInfo?: InfoTooltipWrapperProps | undefined;
}

export const StyledInputFieldContainer = styled.div`
	padding-bottom: 24px;
`;
