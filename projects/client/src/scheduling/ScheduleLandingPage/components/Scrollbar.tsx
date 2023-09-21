import { css } from 'styled-components';

const Scrollbar = css`
	&::-webkit-scrollbar {
		width: 18px;
	}

	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.palette.action.selected};
		background-clip: padding-box;
		border: 4px solid rgba(0, 0, 0, 0);
		border-radius: 10px;
	}
`;

export const VerticalScrollbar = css`
	overflow-y: auto;
	${Scrollbar}
`;

export const HorizontalScrollbar = css`
	overflow-x: auto;
	${Scrollbar}
`;
