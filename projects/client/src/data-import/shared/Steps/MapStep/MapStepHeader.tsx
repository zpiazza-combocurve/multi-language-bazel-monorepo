import styled from 'styled-components';

import { Paper } from '@/components';

export const MapHeaderTop = styled.div`
	display: flex;
	margin: 0 1rem;
`;

export const FilesContainer = styled.div`
	flex: 1;
`;

export const DataSettingsContainer = styled.div`
	flex: 1;
	display: flex;
	justify-content: flex-end;
`;

export const ActionsContainer = styled(Paper).attrs({ zDepthHover: 1 })`
	display: flex;
	width: 100%;
	justify-content: center;
`;
