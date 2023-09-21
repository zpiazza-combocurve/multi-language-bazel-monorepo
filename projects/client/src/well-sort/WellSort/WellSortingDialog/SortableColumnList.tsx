import { faGripVertical, faTrashAlt } from '@fortawesome/pro-regular-svg-icons';
import {
	Box,
	Chip,
	FormControlLabel,
	List,
	ListItem,
	ListItemAvatar,
	Radio,
	RadioGroup,
	TextField,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { produce } from 'immer';
import styled from 'styled-components';

import { Sortable } from '@/components/Sortable';
import { Checkbox, Divider, IconButton } from '@/components/v2';
import { withTooltip } from '@/components/v2/helpers';
import { theme } from '@/helpers/styled';
import { titleize } from '@/helpers/text';

const TooltippedCheckbox = withTooltip(Checkbox);

export const ColumnType = {
	number: 'number',
	string: 'string',
	boolean: 'boolean',
	date: 'date',
};

export const SortDirection = {
	down: 1,
	up: -1,
};

const STANDARD_SIZE = '50%';

const LARGE_SIZE = '85%';

const SMALL_SIZE = '15%';

const ActionContainer = styled.div`
	flex-basis: ${STANDARD_SIZE};
	font-size: 1.25rem;
	text-align: center;
`;
function SortableColumnGrouping({ index, setGroup, group }) {
	return (
		<FormControlLabel
			control={
				<Checkbox
					checked={group}
					onChange={(event) => {
						setGroup(index, event.target.checked);
					}}
				/>
			}
			label='Group'
		/>
	);
}

function SortableColumnDirection({ setDirection, index, direction = SortDirection.down, type }) {
	const directions = [SortDirection.down, SortDirection.up];
	function getLetters() {
		if (type === ColumnType.number || type === ColumnType.date) {
			return ['0', '9'];
		}
		if (type === ColumnType.boolean) {
			return ['No', 'Yes'];
		}
		return ['A', 'Z'];
	}
	function getSortLabel(dir) {
		const alphabet = getLetters();
		const [fromIndex, toIndex] = dir === SortDirection.down ? [0, 1] : [1, 0];
		return `${alphabet[fromIndex]} -> ${alphabet[toIndex]}`;
	}
	return (
		<RadioGroup
			css={`
				margin-left: 1rem;
			`}
			row
			value={direction}
		>
			{directions.map((value) => (
				<FormControlLabel
					key={value}
					value={value}
					control={<Radio color='secondary' />}
					label={getSortLabel(value)}
					onChange={() => setDirection(index, value)}
				/>
			))}
		</RadioGroup>
	);
}

function SortableColumn({
	additionalRender,
	availableColumnsKey,
	canDelete,
	changeColumnField,
	columns,
	deleteColumn,
	direction,
	dragRef,
	dropRef,
	field,
	group,
	index,
	onSelect,
	selectable,
	selected,
	selectTooltipLabel,
	setDirection,
	setGroup,
	type,
	usesDirections,
	usesGrouping,
}) {
	return (
		<ListItem css='margin-top: 0.5rem;' ref={dropRef}>
			<Box display='flex' flexDirection='column' width='100%'>
				<Box alignItems='center' display='flex' width='100%'>
					<ListItemAvatar ref={dragRef}>
						<IconButton>{faGripVertical}</IconButton>
					</ListItemAvatar>

					<Box
						alignItems='center'
						display='flex'
						flexBasis={selectTooltipLabel ? STANDARD_SIZE : LARGE_SIZE}
						marginRight='1rem'
					>
						<Box display='flex' flexGrow={1} flexShrink={1}>
							<Autocomplete
								options={availableColumnsKey}
								getOptionLabel={(columnKey) => columns?.[columnKey]?.label ?? ''}
								renderOption={(columnKey) => {
									const { label = '', headerType } = columns?.[columnKey] ?? {};
									if (!headerType) {
										return label;
									}
									return (
										<>
											{label}{' '}
											<Chip css='margin-left: 0.5rem;' label={titleize(`From ${headerType}`)} />
										</>
									);
								}}
								renderInput={(params) => <TextField {...params} variant='outlined' />}
								disableClearable
								value={field}
								fullWidth
								onChange={(_event, newValue) => {
									changeColumnField(index, newValue);
								}}
							/>
						</Box>

						{usesDirections && (
							<Box flexGrow={0} flexShrink={0}>
								<SortableColumnDirection
									direction={direction}
									setDirection={setDirection}
									index={index}
									type={type}
								/>
							</Box>
						)}
						{usesGrouping && (
							<Box flexGrow={0} flexShrink={0}>
								<SortableColumnGrouping group={group} index={index} setGroup={setGroup} />
							</Box>
						)}
					</Box>

					<Box flexBasis={selectTooltipLabel ? STANDARD_SIZE : SMALL_SIZE}>
						<Box display='flex' justifyContent='space-around' alignItems='center'>
							<ActionContainer>
								{selectable && (
									<TooltippedCheckbox
										checked={selected}
										onChange={(event) => onSelect(index, event.target.checked)}
									/>
								)}
							</ActionContainer>

							<ActionContainer>
								<IconButton disabled={!canDelete} onClick={() => deleteColumn(index)}>
									{faTrashAlt}
								</IconButton>
							</ActionContainer>
						</Box>
					</Box>
				</Box>

				{additionalRender}
			</Box>
		</ListItem>
	);
}

export function SortableColumnList({
	sortedColumns,
	setSortedColumns,
	columns,
	availableColumnsKey: _availableColumnsKey,
	getAvailableColumnsKey,
	allowEmpty = false,
	usesDirections = true,
	usesGrouping = false,
	selectable = false,
	selectTooltipLabel = undefined,
	headersLabel = 'Headers',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sortedColumns: { field: string; direction: -1 | 1; selected?: boolean; group?: boolean; additionalRender?: any }[];
	setSortedColumns;
	columns;
	availableColumnsKey?: string[];
	getAvailableColumnsKey?: (index: number) => string[];
	allowEmpty?: boolean;
	usesDirections?: boolean;
	usesGrouping?: boolean;
	selectable?: boolean;
	selectTooltipLabel?: boolean | string;
	headersLabel?: string | JSX.Element;
}) {
	const deleteColumn = (index) =>
		setSortedColumns(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft.splice(index, 1);
			})
		);
	const setDirection = (index, direction) => {
		setSortedColumns(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft[index].direction = direction;
			})
		);
	};
	const changeColumnField = (index, field) =>
		setSortedColumns(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft[index].field = field;
			})
		);
	const onSelect = (index, checked) => {
		setSortedColumns(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft[index].selected = checked;
			})
		);
	};

	const setGroup = (index, group) => {
		setSortedColumns(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft[index].group = group;
			})
		);
	};

	return (
		<List dense>
			<ListItem>
				<ListItemAvatar>
					<IconButton disabled>{faGripVertical}</IconButton>
				</ListItemAvatar>

				<Box
					display='flex'
					flexBasis={selectTooltipLabel ? STANDARD_SIZE : LARGE_SIZE}
					fontSize='1.25rem'
					marginRight='1rem'
				>
					{headersLabel}
				</Box>

				<Box flexBasis={selectTooltipLabel ? STANDARD_SIZE : SMALL_SIZE}>
					<Box display='flex' justifyContent='space-around' alignItems='center'>
						<ActionContainer>{selectable && selectTooltipLabel}</ActionContainer>
						<ActionContainer>Delete</ActionContainer>
					</Box>
				</Box>
			</ListItem>

			<Divider />

			<Sortable
				getKey={({ field }) => field}
				items={sortedColumns}
				onSort={(newSortedColumns) => setSortedColumns(newSortedColumns)}
				renderItem={({
					item: { field, direction, selected, group, additionalRender },
					dragRef,
					dropRef,
					index,
					isDragging,
				}) => {
					const availableColumnsKey = getAvailableColumnsKey
						? [field, ...getAvailableColumnsKey(index)]
						: [field, ...(_availableColumnsKey ?? [])];
					return (
						<SortableColumn
							css={`
								${isDragging ? `border: 1px dashed ${theme.textColor};` : 'border: 1px dashed inherit;'}
							`}
							additionalRender={additionalRender}
							availableColumnsKey={availableColumnsKey}
							canDelete={allowEmpty || sortedColumns.length > 1}
							changeColumnField={changeColumnField}
							columns={columns}
							deleteColumn={deleteColumn}
							direction={direction}
							dragRef={dragRef}
							dropRef={dropRef}
							field={field}
							group={group}
							index={index}
							key={field}
							onSelect={onSelect}
							selectable={selectable}
							selected={selected}
							selectTooltipLabel={selectTooltipLabel}
							setDirection={setDirection}
							setGroup={setGroup}
							type={columns[field]?.type}
							usesDirections={usesDirections}
							usesGrouping={usesGrouping}
						/>
					);
				}}
			/>
		</List>
	);
}
