import { Collapse, useTheme, withTheme } from '@material-ui/core';
import { ReactNode, useMemo } from 'react';
import styled, { css } from 'styled-components';

import { Floater } from '@/components';
import { withTooltip } from '@/components/v2/helpers';
import { useAlfa } from '@/helpers/alfa';
import { ifProp } from '@/helpers/styled';

export const scrollBarStyles = ({ theme, width }) => css`
	::-webkit-scrollbar {
		width: ${width};
	}
	::-webkit-scrollbar-track {
		background: ${theme.palette.type === 'light' ? '#F5F5F5' : '#242427'};
		border-radius: 10px;
	}
	::-webkit-scrollbar-thumb {
		background: ${theme.palette.action.selected};
		border-radius: 10px;
	}
`;

export const FormToolbar = styled.section`
	align-items: flex-start;
	cursor: move;
	display: flex;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

export const FormHeader = styled.section<{ asRow?: boolean }>`
	column-gap: 1rem;
	display: flex;
	flex-grow: 0;
	padding-right: 0.5rem;
	${({ asRow }) =>
		asRow
			? css`
					align-items: center;
			  `
			: css`
					flex-direction: column;
					row-gap: 0.5rem;
			  `}
`;

export const TabsContainer = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	row-gap: 0.5rem;
`;

export const FormContent = styled.section`
	column-gap: 1rem;
	display: flex;
	flex-grow: 1;
	justify-content: space-between;
	overflow: hidden;
	width: 100%;
`;

export const ProximityFormContent = styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	overflow: hidden;
	row-gap: 1rem;
	width: 100%;
`;

export const ScrolledContent = withTheme(styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	height: 1rem;
	overflow-y: auto;
	padding: 0 0.5rem 1rem 0;
	row-gap: 0.5rem;
	${({ theme }) => scrollBarStyles({ theme, width: '10px' })}
`);

export const FormFooter = styled.section`
	align-items: flex-end;
	display: flex;
	flex-grow: 0;
	justify-content: space-between;
	padding-top: 0.5rem;
`;

export const SectionContainer = styled.section<{ columns?: number }>`
	align-items: center;
	column-gap: 1rem;
	display: grid;
	row-gap: 0.5rem;
	width: 100%;
	${({ columns = 2 }) => `grid-template-columns: repeat(${columns}, minmax(0, 1fr))`};
`;

export const FieldsContainer = styled.section`
	display: flex;
	flex-direction: column;
	row-gap: 0.5rem;
`;

export const FormCollapse = styled(Collapse).attrs({ timeout: 0 })`
	min-height: unset !important;
	${ifProp('in', '', 'display: none;')}
`;

export const StyledFloater = styled(Floater)<{ visible?: boolean }>`
	height: 85vh;
	left: 2rem;
	padding-top: 1rem;
	top: 4rem;
	transition: width 0.2s ease-in-out;
	visibility: ${ifProp('visible', 'visible', 'hidden')};
`;

export const ConfigurationLabel = withTooltip(
	withTheme(styled.span`
		background-color: ${({ theme }) => theme.palette.secondary.main};
		border-radius: 1rem;
		color: ${({ theme }) => theme.palette.secondary.contrastText};
		font-size: 0.75rem;
		font-weight: bold;
		padding: 4px 8px;
		margin-left: 0.5rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	`)
);

export const ChipLabel = withTooltip(
	withTheme(styled.span`
		background-color: ${({ theme }) => theme.palette.action.selected};
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 4px 8px;
	`)
);

export function FieldLabel({ type, children }: { type?: string; children: ReactNode }) {
	const { theme: alfaTheme } = useAlfa();
	const theme = useTheme();

	const color = useMemo(() => {
		if (type === 'boolean') {
			return theme.palette.text.primary;
		}
		if (alfaTheme === 'light') {
			return 'rgba(0, 0, 0, 0.75)';
		}
		return theme.palette.text.secondary;
	}, [alfaTheme, theme.palette.text.primary, theme.palette.text.secondary, type]);

	return (
		<span
			css={`
				align-items: center;
				color: ${color};
				display: flex;
				font-size: ${type === 'boolean' ? '0.75rem' : '11px'};
				height: 1.25rem;
			`}
		>
			{children}
		</span>
	);
}
