import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Paper } from '@/components/v2';

interface PaddedProps {
	$padded?: boolean | 'small';
}

const paddedProperty = css<PaddedProps>`
	${({ $padded }) => ($padded === 'small' ? `padding: 0.5rem;` : $padded && `padding: 1rem;`)}
`;

const OptionalPaper = styled(({ clean, ...props }) => (clean ? <div {...props} /> : <Paper {...props} />))<PaddedProps>`
	${paddedProperty}
`;

const ColumnLayout = styled.div<PaddedProps>`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	${paddedProperty}
`;

const RowLayout = styled.div<PaddedProps>`
	display: flex;
	flex-direction: row;
	height: 100%;
	width: 100%;
	${paddedProperty}
`;

const Topbar = styled(Paper)<PaddedProps>`
	flex: 0 0 auto;
	min-height: 3rem;
	margin-bottom: 1rem;
	padding: 0.25rem;
	${paddedProperty}
`;

const Sidebar = styled(OptionalPaper)`
	flex: 0 0 auto;
	width: 25%;
	min-width: 15rem;
	margin-right: 1rem;
	overflow: auto;
`;

const Main = styled(OptionalPaper)`
	flex: 1 1 auto;
	overflow: auto;
`;

const FullLayout = styled(OptionalPaper)`
	height: 100%;
	width: 100%;
`;

interface LayoutProps {
	/** @property Add Padding to root container */
	padded?: boolean;
	/** Removes Paper from children container */
	clean?: boolean;
	/** Removes box shadow and padding */
	altTopBarStyle?: boolean;
	topbar?: ReactNode;
	sidebar?: ReactNode;
	children?: ReactNode;
}

function Layout({ padded, clean, topbar, sidebar, altTopBarStyle, children }: LayoutProps) {
	const topBarStyle = altTopBarStyle ? { boxShadow: 'none', padding: '0' } : {};

	if (topbar || sidebar) {
		const main = clean ? (
			children
		) : (
			<Main $padded={padded} clean={clean}>
				{children}
			</Main>
		);
		if (topbar && sidebar) {
			return (
				<ColumnLayout $padded={padded}>
					<Topbar style={topBarStyle}>{topbar}</Topbar>
					<RowLayout>
						<Sidebar $padded={padded}>{sidebar}</Sidebar>
						{main}
					</RowLayout>
				</ColumnLayout>
			);
		}
		if (topbar) {
			return (
				<ColumnLayout $padded={padded}>
					<Topbar style={topBarStyle}>{topbar}</Topbar>
					{main}
				</ColumnLayout>
			);
		}
		if (sidebar) {
			return (
				<RowLayout $padded={padded}>
					<Sidebar $padded>{sidebar}</Sidebar>
					{main}
				</RowLayout>
			);
		}
	}
	const main = clean ? (
		children
	) : (
		<FullLayout $padded={padded} clean={clean}>
			{children}
		</FullLayout>
	);
	if (padded) {
		return (
			<FullLayout $padded={padded} clean>
				{main}
			</FullLayout>
		);
	}

	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{main}</>;
}

export { Layout };
