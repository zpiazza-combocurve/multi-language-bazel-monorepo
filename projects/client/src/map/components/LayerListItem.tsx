import { faArrowAltDown, faArrowAltUp } from '@fortawesome/pro-regular-svg-icons';

import { IconButton, ListItem, ListItemIcon, ListItemText, Switch, Tooltip } from '@/components/v2';

export interface LayerListItemProps {
	name: string;
	active: boolean;
	selected?: boolean;
	disableToggle?: boolean | string;
	disableClick?: boolean | string;
	disableMoveUp?: boolean;
	disableMoveDown?: boolean;
	onToggle: (newValue: boolean) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onClick?: () => void;
}
export function LayerListItem({
	name,
	active,
	selected,
	disableToggle,
	disableClick,
	disableMoveUp,
	disableMoveDown,
	onToggle,
	onMoveUp,
	onMoveDown,
	onClick,
}: LayerListItemProps) {
	return (
		<Tooltip title={disableClick || ''}>
			<div>
				<ListItem
					disabled={!!disableClick}
					button={!!onClick as true}
					onClick={disableClick ? undefined : onClick}
					selected={selected}
				>
					<ListItemText css={{ 'overflow-wrap': 'break-word' }}>{name}</ListItemText>

					{onMoveDown && (
						<ListItemIcon>
							<IconButton
								disabled={disableMoveDown}
								onClick={(ev) => {
									ev.stopPropagation();
									onMoveDown();
									return false;
								}}
							>
								{faArrowAltDown}
							</IconButton>
						</ListItemIcon>
					)}
					{onMoveUp && (
						<ListItemIcon>
							<IconButton
								disabled={disableMoveUp}
								onClick={(ev) => {
									ev.stopPropagation();
									onMoveUp();
									return false;
								}}
							>
								{faArrowAltUp}
							</IconButton>
						</ListItemIcon>
					)}
					{onToggle && (
						<Tooltip title={disableToggle || ''}>
							<ListItemIcon>
								<Switch
									disabled={!!disableToggle}
									checked={active}
									onChange={disableToggle ? undefined : (ev) => onToggle(ev.target.checked)}
								/>
							</ListItemIcon>
						</Tooltip>
					)}
				</ListItem>
			</div>
		</Tooltip>
	);
}
