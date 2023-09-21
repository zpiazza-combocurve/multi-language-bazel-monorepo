import { Typography } from '@material-ui/core';

import { Divider } from '@/components/v2';
import { Card as CardLayout } from '@/layouts/CardsLayout';

type CardProps = {
	children: React.ReactElement;
	title?: string;
	fullWidth?: boolean;
	leftHeader?: React.ReactElement;
	rightHeader?: React.ReactElement;
	forceHideToggleButton?: boolean;
};

export const Card = ({ children, title, fullWidth, leftHeader, rightHeader, forceHideToggleButton }: CardProps) => {
	return (
		<CardLayout
			leftHeader={
				<>
					{!!title && (
						<Typography
							css={`
								margin-left: 0.5rem;
							`}
							variant='subtitle2'
						>
							{title}
						</Typography>
					)}
					{!!title && !!leftHeader && <Divider css='margin: 0 1px 0 1rem;' orientation='vertical' flexItem />}
					{leftHeader}
				</>
			}
			rightHeader={
				<>
					{rightHeader}
					{!!rightHeader && !forceHideToggleButton && (
						<Divider css='margin: 0 0.5rem 0 1px;' orientation='vertical' flexItem />
					)}
				</>
			}
			forceHideToggleButton={forceHideToggleButton}
			opaque
			iconsColor='default'
			iconsSize='small'
			toolbarCss={`
				min-height: unset;
				margin-bottom: 0.5rem;
			`}
			css={fullWidth ? 'grid-column: 1 / -1' : ''}
		>
			{children}
		</CardLayout>
	);
};
