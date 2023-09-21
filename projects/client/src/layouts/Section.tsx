import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

const backgroundStyles = css`
	background: ${({ theme }) => theme.palette.background.default};
`;

export const SectionHeader = styled.div<{ opaque?: boolean }>`
	${({ opaque }) => (opaque ? 'background-color: var(--background-opaque);' : backgroundStyles)}
`;

export const SectionFooter = styled.div`
	${backgroundStyles}
`;

export const SectionActions = styled(SectionFooter)`
	display: flex;
	justify-content: space-between;
	padding: 0.5rem;
	width: 100%;
`;

export const SectionContent = styled.div<{ disableOverflow?: boolean }>`
	flex-grow: 1;
	overflow-y: ${({ disableOverflow }) => (disableOverflow ? 'hidden' : 'auto')};
	height: 100%;
`;

const AltSectionStyles = css`
	height: initial;
	overflow: initial;
	min-height: 100%;
	& > ${SectionHeader}, & > ${SectionFooter} {
		position: sticky;
	}
	& > ${SectionHeader} {
		top: 0;
	}
	& > ${SectionFooter} {
		bottom: 0;
	}
	& > ${SectionContent} {
		overflow: initial;
	}
`;

export const Section = styled.div<{ disableOverflow?: boolean; fullPage?: boolean; ref? }>`
	flex-direction: column;
	height: 100%;
	width: 100%;
	display: flex;
	overflow: ${({ disableOverflow }) => (disableOverflow ? 'none' : 'auto')};
	${({ fullPage }) => fullPage && AltSectionStyles}
`;

interface SectionAIOProps {
	className?: string;
	header?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
	disableOverflow?: boolean;
	fullPage?: boolean;
	opaque?: boolean;
}

export function SectionAIO({
	header = undefined,
	footer = undefined,
	children,
	disableOverflow,
	opaque,
	...props
}: SectionAIOProps) {
	return (
		<Section disableOverflow={disableOverflow} {...props}>
			{header && <SectionHeader opaque={opaque}>{header}</SectionHeader>}
			<SectionContent disableOverflow={disableOverflow}>{children}</SectionContent>
			{footer && <SectionFooter>{footer}</SectionFooter>}
		</Section>
	);
}
