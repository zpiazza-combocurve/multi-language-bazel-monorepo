import {
	faCheck,
	faChevronDown,
	faChevronUp,
	faGripVertical,
	faPen,
	faTimes,
	faTrashAlt,
} from '@fortawesome/pro-regular-svg-icons';
import { Chip, InputAdornment } from '@material-ui/core';
import { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';

import { Sortable } from '@/components/Sortable';
import { Divider, IconButton, ListItem, TextField, Tooltip, Typography } from '@/components/v2';
import { ProjectCustomHeader as PCHModel } from '@/helpers/project-custom-headers';
import { theme } from '@/helpers/styled';

import { MAX_NUMBER_OF_PROJECTS_TO_MERGE } from './constants';
import { getCustomHeaderDnDType } from './helpers';
import styles from './merge-projects.module.scss';
import { MergedProjectCustomHeaderModel, ProjectCustomHeaderModel } from './models';

const MergedCustomHeaderPartValue = ({
	label,
	value,
	labelHighlighted,
	names,
}: {
	label: string;
	value: string | number;
	labelHighlighted: boolean;
	names: boolean;
}) => {
	const textColor = names ? theme.textColorOpaque : theme.textColor;

	return (
		<div className={styles['part-value']}>
			<Tooltip title={label}>
				<Typography
					noWrap={names}
					css={`
						color: ${labelHighlighted ? theme.secondaryColor : textColor};
						max-width: 105px;
					`}
				>
					{label}
				</Typography>
			</Tooltip>
			<Typography
				css={`
					font-weight: ${names ? 'normal' : 'bold'};
					color: ${textColor};
				`}
			>
				{value}
			</Typography>
		</div>
	);
};

const MergedQualifierPart = ({
	part,
	dragRef,
	dropRef,
}: {
	part: ProjectCustomHeaderModel;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dragRef: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dropRef: any;
}) => {
	return (
		<div ref={dropRef} key={part.key} className={styles['merged-custom-header-part']}>
			<div className={styles.names}>
				{dragRef && (
					<div ref={dragRef}>
						<IconButton className={styles.drag} size='small'>
							{faGripVertical}
						</IconButton>
					</div>
				)}
				<MergedCustomHeaderPartValue
					label={part.name}
					value={part.projectName}
					labelHighlighted={part.prior}
					names
				/>
			</div>
		</div>
	);
};

const MergedProjectCustomHeader = ({
	header,
	onChangeName,
	onDelete,
	onUpdate,
	onAddToMerged,
	onMouseEnter,
	onMouseLeave,
	hasUniqueName,
}: {
	header: MergedProjectCustomHeaderModel;
	onChangeName: (key: string, name: string) => void;
	onDelete: (key: string) => void;
	onUpdate: (header: MergedProjectCustomHeaderModel) => void;
	onAddToMerged: (mergedHeader: MergedProjectCustomHeaderModel, header: PCHModel) => void;
	onMouseEnter: (usedHeaders: string[]) => void;
	onMouseLeave: () => void;
	hasUniqueName: boolean;
}) => {
	const [name, setName] = useState<string>(header.name);
	const [editingName, setEditingName] = useState<boolean>(false);
	const [expanded, setExpanded] = useState<boolean>(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const inputRef = useRef<any>();

	const changed = name !== header.name;
	const error = name === '';
	const actionRequired = error || editingName || changed || !hasUniqueName;

	const isMerge = header.headers.length > 1;

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: getCustomHeaderDnDType(header.headers[0].type),
		canDrop: () => {
			return header.headers.length < MAX_NUMBER_OF_PROJECTS_TO_MERGE;
		},
		drop: (item: { type: string; header: PCHModel }) => {
			onAddToMerged(header, item.header);
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
			canDrop: !!monitor.canDrop(),
		}),
	});

	const changePriority = (sortedHeaders: ProjectCustomHeaderModel[]) => {
		const updatedHeaders = [...header.headers];

		updatedHeaders.forEach((h) => {
			h.prior = h.key === sortedHeaders[0].key;
		});

		onUpdate({
			...header,
			headers: updatedHeaders,
		});
	};

	const mergedHeaderPartsSortedByPriority = [...header.headers].sort((a, b) => {
		const sortByFirstPrior = a.prior ? -1 : 1;
		return a.prior === b.prior ? 0 : sortByFirstPrior;
	});

	const mergedCustomHeaderLabel = isMerge ? 'Merged' : header.headers[0].projectName;
	const color = `rgb(${header.color})`;

	return (
		<ListItem
			css={isOver && canDrop ? `box-shadow: 0 0 3px 1px ${color} !important;` : undefined}
			ref={drop}
			onMouseEnter={() => onMouseEnter(header.headers.map((h) => h.key))}
			onMouseLeave={onMouseLeave}
			className={`${styles['custom-header']} ${styles['merged-custom-header']}`}
			key={header.key}
		>
			<div className={`${styles['custom-header-element']} ${styles['merged-custom-header-input']}`}>
				<TextField
					variant='outlined'
					inputRef={inputRef}
					error={error || !hasUniqueName}
					onFocus={() => setEditingName(true)}
					onBlur={() => setEditingName(false)}
					InputProps={{
						disableUnderline: !actionRequired,
						endAdornment: (
							<InputAdornment position='end'>
								{actionRequired ? (
									<>
										<IconButton
											key='save'
											onClick={() => onChangeName(header.key, name)}
											color='secondary'
											size='small'
										>
											{faCheck}
										</IconButton>
										<IconButton key='cancel' onClick={() => setName(header.name)} size='small'>
											{faTimes}
										</IconButton>
										<IconButton key='delete' onMouseDown={() => onDelete(header.key)} size='small'>
											{faTrashAlt}
										</IconButton>
									</>
								) : (
									<>
										<Chip
											css={`
												max-width: 100px;
												overflow: hidden;
												margin-right: 4px;
											`}
											key='type'
											label={header.headers[0].type}
										/>
										<Chip
											css={`
												background-color: ${color};
												max-width: 100px;
												overflow: hidden;
											`}
											key='label'
											label={mergedCustomHeaderLabel}
										/>
										<IconButton
											key='edit'
											onClick={() => {
												inputRef.current.focus();
											}}
											size='small'
										>
											{faPen}
										</IconButton>
										<IconButton key='delete' onClick={() => onDelete(header.key)} size='small'>
											{faTrashAlt}
										</IconButton>
										{isMerge && (
											<>
												<Divider className={styles['chevron-divider']} orientation='vertical' />
												<IconButton
													key='toggle'
													onClick={() => setExpanded(!expanded)}
													size='small'
												>
													{expanded ? faChevronUp : faChevronDown}
												</IconButton>
											</>
										)}
									</>
								)}
							</InputAdornment>
						),
					}}
					onChange={(e) => setName(e.target.value)}
					value={name}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !error) {
							onChangeName(header.key, name);
							inputRef.current.blur();
							event.preventDefault();
						}
					}}
				/>
			</div>
			{expanded && (
				<div className={styles['merged-custom-header-details']}>
					<p>Drag to the top to change priority</p>
					<Sortable
						items={mergedHeaderPartsSortedByPriority}
						onSort={changePriority}
						renderItem={({ item: part, dragRef, dropRef }) => {
							return (
								<MergedQualifierPart key={part.key} part={part} dragRef={dragRef} dropRef={dropRef} />
							);
						}}
					/>
				</div>
			)}
		</ListItem>
	);
};

export default MergedProjectCustomHeader;
