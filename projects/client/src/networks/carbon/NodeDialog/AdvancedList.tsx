import { User } from '@combocurve/types/client';
import { faCheck, faTrash } from '@fortawesome/pro-regular-svg-icons';

import { IconButton, List, ListItem, ListItemText, TextField, Tooltip } from '@/components/v2';
import FontAwesomeSvgIcon from '@/components/v5/FontAwesomeSvgIcon';
import { formatUserInfo } from '@/cost-model/detail-components/EconModelsList';
import { hasNonWhitespace } from '@/helpers/text';

import { SIDEBAR_TEXT_FIELD_PROPS } from './components';

interface AdvancedListProps<T> {
	className?: string;
	items: T[] | null;
	selectedItem: string | null;
	appliedItem: string | null;
	onRename: (item: T, newName: string) => void;
	onDelete: (item: T) => void;
	onSelect: (item: T) => void;
	getName?: (item: T) => string;
	getKey?: (item: T) => string;
	getCreatedBy: (item: T) => User;
	getCreatedAt: (item: T) => Date;
	isLoading: boolean;
	isEditable?: boolean;
}

/**
 * List of items with extended functionality:
 *
 * - Renaming
 * - Deleting
 * - Selecting
 */
function AdvancedList<T>(props: AdvancedListProps<T>) {
	const {
		items,
		onRename,
		onDelete,
		onSelect,
		getName = (item: T) => item as string,
		getKey = (item: T) => item as string,
		getCreatedBy,
		getCreatedAt,
		isLoading,
		isEditable = true,
		selectedItem,
		appliedItem,
	} = props;
	// TODO Improve loading state with mui skeleton
	return (
		<List
			dense
			css={`
				flex: 1;
				overflow-y: auto;
			`}
		>
			{!isLoading &&
				items?.map((item) => (
					<ListItem
						key={getKey(item)}
						onClick={() => onSelect(item)}
						selected={selectedItem === getKey(item)}
					>
						<Tooltip title={getName(item)} placement='top'>
							<ListItemText
								css={`
									flex: 1;
									height: 100%;
								`}
								primary={
									<TextField
										{...SIDEBAR_TEXT_FIELD_PROPS}
										label='Name'
										value={getName(item)}
										variant='outlined'
										fullWidth
										onChange={(e) => {
											if (hasNonWhitespace(e.target.value) && e.target.value !== getName(item)) {
												onRename(item, e.target.value);
												return;
											}
											return false;
										}}
										onFocus={(e) => e.target.select()}
										inputProps={{
											readOnly: !isEditable,
										}}
										nativeOnChange
									/>
								}
								secondary={formatUserInfo(getCreatedBy(item), getCreatedAt(item))}
							/>
						</Tooltip>
						{appliedItem === getKey(item) && (
							<div
								css={`
									display: flex;
									align-items: start;
									margin-top: -1.5rem;
									margin-left: 1rem;
								`}
							>
								<Tooltip title='Applied Model' placement='left'>
									<FontAwesomeSvgIcon>{faCheck}</FontAwesomeSvgIcon>
								</Tooltip>
							</div>
						)}
						<Tooltip
							title='Delete Model'
							placement='left'
							css={`
								height: 100%;
							`}
						>
							<div
								css={`
									display: flex;
									align-items: start;
									margin-top: -1.5rem;
									margin-left: 1rem;
								`}
							>
								<IconButton color='error' edge='end' size='small' onClick={() => onDelete(item)}>
									{faTrash}
								</IconButton>
							</div>
						</Tooltip>
					</ListItem>
				))}
			{isLoading && <ListItemText>Loading...</ListItemText>}
		</List>
	);
}

export default AdvancedList;
