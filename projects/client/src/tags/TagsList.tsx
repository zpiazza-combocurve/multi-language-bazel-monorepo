/* eslint react/jsx-key: warn */
import { Box, IconButton, Popover, Typography } from '@material-ui/core';
import _ from 'lodash';
import { useState } from 'react';

import TagChip from '@/tags/TagChip';
import { useGetAllTags } from '@/tags/queries';

interface ITagsListProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	tags: any;
	visible?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onTagClick?: any;
}
const TagsList = ({ tags, visible = 1, onTagClick }: ITagsListProps) => {
	const { data: allTags } = useGetAllTags();

	const [anchorEl, setAnchorEl] = useState(null);

	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;

	if (!(allTags && tags && tags.length)) {
		return null;
	}

	const allTagsMap = _.keyBy(allTags ?? [], '_id');

	return (
		<>
			{tags.slice(0, visible).map((tag) => (
				<TagChip key={tag} tag={allTagsMap[tag]} onClick={() => onTagClick(tag)} />
			))}
			{tags.length > visible && (
				<>
					<IconButton
						css={`
							padding: 0;
						`}
						size='small'
						component='span'
						onClick={handleClick}
					>
						<Typography variant='button'>{tags.length - visible}+</Typography>
					</IconButton>
					<Popover
						id={id}
						open={open}
						anchorEl={anchorEl}
						onClose={handleClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
					>
						<div
							css={`
								flex-direction: row;
								margin: 0.5rem;
								justify-content: end;
								display: flex;
								flex-wrap: wrap;
								max-width: 30rem;
							`}
						>
							{tags.slice(visible).map((tagId) => (
								<Box css={{ display: 'inline-flex', margin: '2px' }} key={tagId}>
									<TagChip
										tag={allTagsMap[tagId]}
										onClick={() => onTagClick(tagId)}
										css={`
											cursor: ${onTagClick ? 'normal' : 'pointer'};
										`}
									/>
								</Box>
							))}
						</div>
					</Popover>
				</>
			)}
		</>
	);
};

export default TagsList;
