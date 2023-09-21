import {
	Chip,
	Divider,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	MenuItem as MUIMenuItem,
	Typography,
} from '@/components/v2';
import { REPORT_TYPE_OPTIONS } from '@/economics/Economics/shared/constants';

import { getExportTaggingProp } from '../helpers';
import { CustomMenuItem } from '../types';

export function MenuItem({ id, disabled, separator, isNew, annotation, label, icon, onClick }: CustomMenuItem) {
	if (id) {
		return (
			<MUIMenuItem
				id={`${id}-menu-item`}
				disabled={disabled}
				onClick={() => {
					onClick?.();
				}}
				{...getExportTaggingProp(id)}
			>
				{icon && (
					<ListItemIcon
						css={`
							min-width: 2rem;
						`}
					>
						{icon}
					</ListItemIcon>
				)}
				<ListItemText>{label ?? REPORT_TYPE_OPTIONS[id]}</ListItemText>
				{annotation && (
					<Typography
						css={`
							margin-left: 1rem;
						`}
						variant='caption'
						color='textSecondary'
					>
						{annotation}
					</Typography>
				)}
				{isNew && <Chip label='New' color='primary' size='small' />}
			</MUIMenuItem>
		);
	}
	return (
		<div>
			<Divider />
			{typeof separator === 'string' && (
				<ListSubheader
					css={`
						height: 2rem;
						line-height: 2rem;
						background: ${({ theme }) => theme.palette.background.default};
					`}
				>
					{separator}
				</ListSubheader>
			)}
		</div>
	);
}
