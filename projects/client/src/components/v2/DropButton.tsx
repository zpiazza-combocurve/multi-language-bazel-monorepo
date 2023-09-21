import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';

import IconButton from './IconButton';

// Supposed to mimic src/components/DropButton
interface DropButtonProps {
	children?: JSX.Element | string;
	disabled?: boolean;
	menuItems: { primaryText: string; onClick: () => void }[];
	onClick: () => void;
	primary?: boolean;
}

export const DropButton = ({ disabled = false, menuItems = [], ...props }: DropButtonProps) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<ButtonGroup
			variant='text'
			css={`
				height: 2rem;
				& > button:not(:last-child) {
					border-right: 0;
				}
				& > button,
				button:hover {
					border-radius: 4px;
				}
			`}
		>
			<Button color='primary' {...props} disabled={disabled} />
			<IconButton color='primary' onClick={handleClick}>
				{faChevronDown}
			</IconButton>
			<Menu
				id='basic-menu'
				open={open}
				onClose={handleClose}
				anchorEl={anchorEl}
				getContentAnchorEl={null}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				{menuItems.map(({ primaryText, onClick }) => (
					<MenuItem key={primaryText} onClick={onClick}>
						{primaryText}
					</MenuItem>
				))}
			</Menu>
		</ButtonGroup>
	);
};
