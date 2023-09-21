/* eslint react/jsx-key: warn */
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useState } from 'react';

import UserAvatar from '@/access-policies/UserAvatar';
import { Box, Button, Container, List, ListItem, ListItemAvatar, ListItemText, TextField } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';

import { CommentBox, getCommentLabel, useWellCommentLabels, useWellComments, useWellInfo } from './WellComment/index';

// TODO: uncomment on master

// interface IComment {
// 	text: string;
// 	wellId: Inpt.ObjectId<'well'>;
// 	createdAt: Inpt.StringDate;
// 	createdBy: Inpt.User;
// }

// interface IWellComments {
// 	items: IComment[];
// }

export interface WellCommentContext {
	projectId?: string;
	forecastId?: string;
	scenarioId?: string;
}
interface WellCommentProps {
	wellId: string;
	context: WellCommentContext;
}

function WellComment({ wellId, context }: WellCommentProps) {
	const { wellInfo } = useWellInfo(wellId);
	const projectWell = wellInfo?.project;
	const { user } = useAlfa();

	const [currentText, setCurrentText] = useState('');

	const [focus, setFocus] = useState(false);

	const { labels, selectedLabels, selectLabels, filters } = useWellCommentLabels(wellId, context, projectWell);

	const { comments, handleAddComment } = useWellComments(wellId, filters);

	return (
		<Container maxWidth='lg'>
			<List>
				<ListItem css={{ width: '100%' }}>
					<Autocomplete
						multiple
						options={labels}
						fullWidth
						value={selectedLabels}
						getOptionLabel={({ name, key }) => `${getCommentLabel(key)} : ${name}`}
						renderInput={(params) => <TextField {...params} variant='standard' placeholder='Scope' />}
						onChange={(_event, newLabels) => {
							selectLabels(newLabels);
						}}
					/>
				</ListItem>

				<ListItem alignItems='flex-start'>
					<ListItemAvatar>
						<UserAvatar user={user} />
					</ListItemAvatar>
					<ListItemText
						secondary={
							<Box
								css={`
									& > *:not(:first-child) {
										margin-top: 1rem;
									}
								`}
							>
								<TextField
									css={`
										textarea {
											overflow: ${focus ? 'auto' : 'hidden'};
										}
									`}
									margin='dense'
									value={currentText}
									onChange={(ev) => setCurrentText(ev.target.value)}
									multiline
									rows={focus ? 4 : 1}
									placeholder='Write a comment'
									variant='outlined'
									onFocus={() => setFocus(true)}
									fullWidth
								/>
								{focus && (
									<Box
										css={`
											& > *:not(:first-child) {
												margin-left: 1rem;
											}
										`}
									>
										<Button
											color='primary'
											variant='contained'
											disabled={!currentText}
											onClick={() => {
												handleAddComment({
													...filters,
													text: currentText,
												});
												setCurrentText('');
												setFocus(false);
											}}
										>
											Save
										</Button>
										<Button
											onClick={() => {
												setCurrentText('');
												setFocus(false);
											}}
										>
											Cancel
										</Button>
									</Box>
								)}
							</Box>
						}
					/>
				</ListItem>

				{comments.map((comment) => (
					// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
					<CommentBox
						{...comment}
						onFilterLabel={(wellCommentLabel) => selectLabels([...selectedLabels, wellCommentLabel])}
					/>
				))}
			</List>
		</Container>
	);
}

export default WellComment;
