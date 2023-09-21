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
import { useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useQuery } from 'react-query';

import { Sortable } from '@/components/Sortable';
import { Divider, IconButton, ListItem, TextField, Tooltip, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';
import { hasNonWhitespace } from '@/helpers/text';
import { getWellsByQualifier } from '@/qualifiers/QualifierMergeDialog';

import { MAX_NUMBER_OF_SCENARIOS_TO_MERGE } from './constants';
import { getQualifierDnDType } from './helpers';
import styles from './merge-scenarios.module.scss';
import { MergedQualifier as MergedQualifierModel, Qualifier } from './models';

const NAME_MAX_LENGTH = 16;

const MergedQualifierPartValue = ({
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
	wellsValues,
}: {
	part: Qualifier;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dragRef: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dropRef: any;
	wellsValues: { label: string; value: number }[];
}) => {
	return (
		<div ref={dropRef} key={part.key} className={styles['merged-qualifier-part']}>
			<div className={styles.names}>
				{dragRef && (
					<div ref={dragRef}>
						<IconButton className={styles.drag} size='small'>
							{faGripVertical}
						</IconButton>
					</div>
				)}
				<MergedQualifierPartValue
					label={part.name}
					value={part.scenarioName}
					labelHighlighted={part.prior}
					names
				/>
			</div>
			<div className={styles['wells-values']}>
				{wellsValues.map((w) => (
					<MergedQualifierPartValue
						key={w.label}
						label={w.label}
						value={w.value}
						labelHighlighted={false}
						names={false}
					/>
				))}
			</div>
		</div>
	);
};

const MergedQualifier = ({
	qualifier,
	onChangeName,
	onDelete,
	onUpdateQualifier,
	onAddQualifierToMerged,
	onMouseEnter,
	onMouseLeave,
	hasUniqueName,
}: {
	qualifier: MergedQualifierModel;
	onChangeName: (key: string, name: string) => void;
	onDelete: (key: string) => void;
	onUpdateQualifier: (qualifierObj: MergedQualifierModel) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifierToMerged: (mergedQualifierObj: MergedQualifierModel, qualifierObj: any) => void;
	onMouseEnter: (usedQualifiers: string[]) => void;
	onMouseLeave: () => void;
	hasUniqueName: boolean;
}) => {
	const [name, setName] = useState<string>(qualifier.name);
	const [editingName, setEditingName] = useState<boolean>(false);
	const [expanded, setExpanded] = useState<boolean>(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const inputRef = useRef<any>();
	const error = useMemo(() => {
		if (!name || !hasNonWhitespace(name)) {
			return 'Name is required';
		}
		if (name.length > NAME_MAX_LENGTH) {
			return 'Name is too long';
		}
		return '';
	}, [name]);

	const changed = name !== qualifier.name;
	const actionRequired = error || editingName || changed || !hasUniqueName;

	const isMerge = qualifier.qualifiers.length > 1;
	const assumption = qualifier.assumption;
	const firstScenarioId = qualifier.qualifiers[0].scenarioId;
	const secondScenarioId = isMerge ? qualifier.qualifiers[1].scenarioId : undefined;

	const [{ isOver, canDrop }, drop] = useDrop({
		accept: getQualifierDnDType(assumption),
		canDrop: () => {
			return qualifier.qualifiers.length < MAX_NUMBER_OF_SCENARIOS_TO_MERGE;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		drop: (item: { type: string; qualifier: any }) => {
			onAddQualifierToMerged(qualifier, item.qualifier);
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
			canDrop: !!monitor.canDrop(),
		}),
	});

	const { data: wellsByFirstQualifierPart } = useQuery(
		[firstScenarioId, 'qualifiers-assignments', assumption],
		() => {
			return getWellsByQualifier(firstScenarioId, assumption);
		},
		{ enabled: isMerge }
	);

	const { data: wellsBySecondQualifierPart } = useQuery(
		[secondScenarioId, 'qualifiers-assignments', assumption],
		() => {
			return getWellsByQualifier(secondScenarioId, assumption);
		},
		{ enabled: isMerge }
	);

	const qualifierPartsSortedByPriority = [...qualifier.qualifiers].sort((a, b) => {
		const sortByFirstPrior = a.prior ? -1 : 1;
		return a.prior === b.prior ? 0 : sortByFirstPrior;
	});

	const sortedSameAsOriginal = qualifierPartsSortedByPriority[0].key === qualifier.qualifiers[0].key;

	const assignmentsTillQualifier = useMemo(() => {
		const qualifiersUniqueData: { assignmentIds: string[]; allUnique: string[] }[] = [];
		qualifierPartsSortedByPriority.forEach(({ originalKey: qualifierKey }, index) => {
			const originalSortWells = index === 0 ? wellsByFirstQualifierPart : wellsBySecondQualifierPart;
			const prioritySortWells = index === 0 ? wellsBySecondQualifierPart : wellsByFirstQualifierPart;
			const assignmentIds = (sortedSameAsOriginal ? originalSortWells : prioritySortWells)?.[qualifierKey] || [];

			qualifiersUniqueData[index] = {
				assignmentIds,
				allUnique: [
					...new Set([...assignmentIds, ...(index ? qualifiersUniqueData[index - 1].allUnique : [])]),
				],
			};
		});

		return qualifiersUniqueData;
	}, [wellsByFirstQualifierPart, wellsBySecondQualifierPart, qualifierPartsSortedByPriority, sortedSameAsOriginal]);

	const changePriority = (sortedQualifiers) => {
		const updatedQualifiers = [...qualifier.qualifiers];

		updatedQualifiers.forEach((q) => {
			q.prior = q.key === sortedQualifiers[0].key;
		});

		onUpdateQualifier({
			...qualifier,
			qualifiers: updatedQualifiers,
		});
	};

	const mergedQualifierLabel = isMerge ? 'Merged' : qualifier.qualifiers[0].scenarioName;
	const color = `rgb(${qualifier.color})`;

	return (
		<ListItem
			css={isOver && canDrop ? `box-shadow: 0 0 3px 1px ${color} !important;` : undefined}
			ref={drop}
			onMouseEnter={() => onMouseEnter(qualifier.qualifiers.map((q) => q.key))}
			onMouseLeave={onMouseLeave}
			className={`${styles.qualifier} ${styles['merged-qualifier']}`}
			key={qualifier.key}
		>
			<div className={`${styles['qualifier-element']} ${styles['merged-qualifier-input']}`}>
				<TextField
					variant='outlined'
					inputRef={inputRef}
					error={!!error || !hasUniqueName}
					helperText={error}
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
											onClick={() => onChangeName(qualifier.key, name)}
											color='secondary'
											size='small'
											disabled={!!error}
										>
											{faCheck}
										</IconButton>
										<IconButton key='cancel' onClick={() => setName(qualifier.name)} size='small'>
											{faTimes}
										</IconButton>
										<IconButton
											key='delete'
											onMouseDown={() => onDelete(qualifier.key)}
											size='small'
										>
											{faTrashAlt}
										</IconButton>
									</>
								) : (
									<>
										<Chip
											css={`
												background-color: ${color};
												max-width: 100px;
												overflow: hidden;
											`}
											key='label'
											label={mergedQualifierLabel}
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
										<IconButton key='delete' onClick={() => onDelete(qualifier.key)} size='small'>
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
							onChangeName(qualifier.key, name);
							inputRef.current.blur();
							event.preventDefault();
						}
					}}
				/>
			</div>
			{expanded && (
				<div className={styles['merged-qualifier-details']}>
					<p>Drag to the top to change priority</p>
					<Sortable
						items={qualifierPartsSortedByPriority}
						onSort={changePriority}
						renderItem={({ item: part, dragRef, dropRef, index }) => {
							const wells = assignmentsTillQualifier[index].assignmentIds.length;
							const ending = assignmentsTillQualifier[index].allUnique.length;
							const starting = (index ? assignmentsTillQualifier[index - 1].allUnique : []).length;
							const added = ending - starting;
							const overlap = assignmentsTillQualifier[index].assignmentIds.length - added;

							return (
								<MergedQualifierPart
									key={part.key}
									part={part}
									dragRef={dragRef}
									dropRef={dropRef}
									wellsValues={[
										{ label: 'Wells', value: wells },
										{ label: 'Starting', value: starting },
										{ label: 'Overlap', value: overlap },
										{ label: 'Added', value: added },
										{ label: 'Ending', value: ending },
									]}
								/>
							);
						}}
					/>
				</div>
			)}
		</ListItem>
	);
};

export default MergedQualifier;
