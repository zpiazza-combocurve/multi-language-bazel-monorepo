import styled from 'styled-components';

import { Divider as DividerV2 } from '@/components/v2';

export const Divider = styled(DividerV2)`
	margin: 1rem 0;
`;

export const Subtitle = styled.h4`
	font-size: 14px;
`;

export const SettingList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	margin-bottom: 0.5rem;
`;

export const SettingButton = styled.div<{ selected: boolean; isDraft: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;

	height: 48px;
	padding: 0 1rem;

	background: ${({ theme }) => (theme.palette.type === 'light' ? '#EEE' : '#292929')}};

	border: 1px solid  ${({ theme }) => (theme.palette.type === 'light' ? '#C8C8C8' : '#404040')}};
	border-radius: 4px;
	border-color: ${(props) => {
		if (props.selected)
			return props.isDraft ? props.theme.palette.warning.main : props.theme.palette.secondary.main;
	}};

	text-transform: capitalize;

	cursor: pointer;
`;
