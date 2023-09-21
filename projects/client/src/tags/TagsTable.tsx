import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { sortBy } from 'lodash-es';

import { IconButton, Tooltip } from '@/components/v2';
import { toLocalDate } from '@/helpers/dates';
import { getFullName } from '@/helpers/user';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';

import TagChip from './TagChip';

type PopulatedTag = Inpt.Api.Tags.PopulatedTag;

interface Props {
	tags: PopulatedTag[];
	deleteOnClick: (tag: PopulatedTag) => void;
	editOnClick: (tag: PopulatedTag) => void;
	canDeleteTags: boolean;
	canUpdateTags: boolean;
}

const TagsTable = ({ tags, deleteOnClick, editOnClick, canDeleteTags, canUpdateTags }: Props) => {
	return (
		<TableContainer>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Tag</TableCell>
						<TableCell>Description</TableCell>
						<TableCell>Created By</TableCell>
						<TableCell>Created At</TableCell>
						<TableCell style={{ width: '100px' }}>Actions</TableCell>
					</TableRow>
				</TableHead>

				<TableBody>
					{sortBy(tags, ({ name }) => name.toLowerCase()).map((tag) => {
						return (
							<TableRow key={tag._id} hover>
								<TableCell>
									<TagChip tag={tag} />
								</TableCell>
								<TableCell>{tag.description}</TableCell>
								<TableCell>{getFullName(tag.createdBy)}</TableCell>
								<TableCell>{toLocalDate(tag.createdAt)}</TableCell>
								<TableCell>
									<Tooltip title={canUpdateTags ? 'Edit Tag' : PERMISSIONS_TOOLTIP_MESSAGE}>
										<span>
											<IconButton
												size='small'
												disabled={!canUpdateTags}
												onClick={() => editOnClick(tag)}
											>
												{faEdit}
											</IconButton>
										</span>
									</Tooltip>
									<Tooltip title={canDeleteTags ? 'Delete Tag' : PERMISSIONS_TOOLTIP_MESSAGE}>
										<span>
											<IconButton
												size='small'
												disabled={!canDeleteTags}
												onClick={() => deleteOnClick(tag)}
											>
												{faTrash}
											</IconButton>
										</span>
									</Tooltip>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default TagsTable;
