import * as React from 'react';
import styled from 'styled-components';

import { Centered } from '@/components';
import { Box } from '@/components/v2';

export const ActionsContainer = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-auto-rows: 1fr;
	& > * {
		margin: auto;
		margin-bottom: 0.5rem;
	}
`;

export const Header = ({ className, children }: { children: React.ReactNode; className?: string }) => (
	<Centered horizontal className={className} as='h2'>
		{children}
	</Centered>
);

export function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignContent=''
			my='0.25rem'
			component='label'
			alignItems='center'
		>
			<span>{label}:</span>
			<div>{children}</div>
		</Box>
	);
}
