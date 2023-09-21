import styled from 'styled-components';

import { Paper } from '@/components/v2';

export const ToolbarPaper = styled(Paper)`
	padding: 0.5rem;
	display: flex;
	gap: 1rem;
	align-items: center;
	background-color: var(--background-opaque);
	span {
		text-transform: capitalize;
	}
`;
