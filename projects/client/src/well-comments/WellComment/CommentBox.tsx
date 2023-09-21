/* eslint react/jsx-key: warn */
import { Chip, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import { map, pick } from 'lodash-es';

import UserAvatar from '@/access-policies/UserAvatar';
import { fullNameAndLocalDate } from '@/helpers/user';

import { getCommentLabel } from './shared';

function CommentBoxHeader({ createdAt, createdBy, onFilterLabel, tags }) {
	return (
		<div
			css={`
				& > *:not(:first-child) {
					margin-left: 1rem;
				}
			`}
		>
			<span>{fullNameAndLocalDate(createdBy, createdAt)}</span>
			{tags?.map((wellCommentLabel) => {
				const { name, key } = wellCommentLabel;
				return (
					// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
					<Chip
						size='small'
						label={`${getCommentLabel(key)} : ${name}`}
						onClick={() => onFilterLabel(wellCommentLabel)}
					/>
				);
			})}
		</div>
	);
}
function CommentBoxBody({ text }: { text: string }) {
	return (
		<>
			{text.split('\n').map((line) => (
				<>
					{line}
					<br />
				</>
			))}
		</>
	);
}

export const CommentBox = ({ createdBy, text, createdAt, onFilterLabel, ...rest }) => {
	const tags = map(pick(rest, 'project', 'scenario', 'forecast'), (value, key) => ({
		...value,
		key,
	})).filter((value) => value?.name);

	return (
		<ListItem alignItems='flex-start'>
			<ListItemAvatar>
				<UserAvatar user={createdBy} />
			</ListItemAvatar>
			<ListItemText
				primary={
					<CommentBoxHeader
						createdAt={createdAt}
						createdBy={createdBy}
						onFilterLabel={onFilterLabel}
						tags={tags}
					/>
				}
				secondary={<CommentBoxBody text={text} />}
			/>
		</ListItem>
	);
};
