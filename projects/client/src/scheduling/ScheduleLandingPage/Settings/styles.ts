import styled from 'styled-components';

import { Tabs } from '@/components/v2';

export const ScheduleSettingsTabs = styled(Tabs)`
	border-bottom: 1px solid ${({ theme }) => theme.palette.grey.A700};
	margin-bottom: 1rem;

	.MuiButtonBase-root {
		min-width: 0;
		padding: 0;
		margin-right: 1.5rem;
		text-transform: capitalize;
	}
`;
