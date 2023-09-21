import { Avatar, Box, Chip } from '@material-ui/core';

import { Tooltip } from '@/components/v2';
import { numberToHex } from '@/helpers/color';

interface ITagChipProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tag: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onClick?: any;
}
const TagChip = ({ tag, onClick }: ITagChipProps) => {
	if (!tag) {
		return null;
	}

	const { name, color } = tag;

	return (
		<Tooltip title={name}>
			<Chip
				css={`
					margin-right: 4px;
				`}
				onClick={onClick}
				avatar={
					<Avatar
						css={{
							backgroundColor: numberToHex(color),
							width: '14px !important',
							height: '14px !important',
						}}
					>
						{' '}
					</Avatar>
				}
				size='small'
				label={
					<Box
						css={{
							maxWidth: '5rem',
						}}
						component='div'
						overflow='hidden'
						textOverflow='ellipsis'
					>
						{name}
					</Box>
				}
			/>
		</Tooltip>
	);
};

export default TagChip;
