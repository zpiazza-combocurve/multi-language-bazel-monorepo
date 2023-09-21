import MUICard from '@mui/material/Card';
import MUICardContent from '@mui/material/CardContent';
import React from 'react';

import { Box, Typography } from '@/components/v2';

type SidebarCard = {
	label?: React.ReactNode;
	title: string;
};

const Action = ({ children }) => (
	<Box
		sx={{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingBottom: 16,
			margin: 0,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			//@ts-expect-error
			'&:nth-child(odd)': { borderBottom: '1px solid #404040' },
			marginBottom: '16px',
		}}
	>
		{children}
	</Box>
);

const Card: React.FC<SidebarCard> = ({ children, title, label }) => (
	<MUICard sx={{ bgcolor: '#40404066', marginBottom: '16px' }}>
		<MUICardContent
			sx={{ margin: '8px', padding: '0px', '&:last-child': { paddingBottom: '0' }, color: 'var(--text-color)' }}
		>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
				<Typography variant='subtitle2'>{title}</Typography>
				{label}
			</Box>
			<Typography component='div' variant='body2'>
				{children}
			</Typography>
		</MUICardContent>
	</MUICard>
);

export const DetailSidebar = ({ children }) => {
	const list = React.Children.toArray(children) as React.ReactNode[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const actions = list.filter((el: any) => el?.type === Action);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const cards = list.filter((el: any) => el?.type === Card);

	return (
		<Box>
			<Box>{actions}</Box>
			<Box sx={{ marginTop: 30 }}>{cards}</Box>
		</Box>
	);
};

DetailSidebar.Action = Action;
DetailSidebar.Card = Card;
