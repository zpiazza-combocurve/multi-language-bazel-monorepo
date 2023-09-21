import { faGripVertical } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { isNil } from 'lodash';
import { ReactNode, useRef, useState } from 'react';

import { Sortable } from '@/components/Sortable';
import { Divider, IconButton, List, ListItem, TextField, Tooltip, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';
import { MAX_WELLS_COLLECTIONS_PER_MODULE } from '@/inpt-shared/constants';

import styles from './merge.module.scss';
import { ModuleBasicInfo } from './models';

const totalWellsCountExceededCSS = `color: ${theme.warningColor} !important; font-weight: bold !important;`;

const MergeModuleItemsSidebar = ({
	items,
	onNameChange,
	onSortModuleItems = null,
	maxNumberOfWellsInMerged = -1,
	moduleName,
	titleDescription,
	wellsCountLabel,
	total,
	overlap,
	totalWellsCollections,
	beforeWells = null,
	additionalInfo = null,
}: {
	items: ModuleBasicInfo[];
	onSortModuleItems?: ((sorted: ModuleBasicInfo[]) => void) | null;
	onNameChange: (name: string) => void;
	maxNumberOfWellsInMerged?: number;
	moduleName: string;
	titleDescription: string;
	wellsCountLabel?: ReactNode;
	total: number;
	overlap: number;
	totalWellsCollections?: number;
	beforeWells?: ReactNode;
	additionalInfo?: ReactNode;
}) => {
	const [mergedName, setMergedName] = useState<string>('');
	const errorInName = !mergedName;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const mergedNameInputRef = useRef<any>();
	const resultingWellsCountExceeded = maxNumberOfWellsInMerged >= 0 && total > maxNumberOfWellsInMerged;
	const resultingWellsCollectionsCountExceeded =
		!isNil(totalWellsCollections) && totalWellsCollections > MAX_WELLS_COLLECTIONS_PER_MODULE;

	if (items?.length > 1) {
		return (
			<div className={styles['merge-sidebar']}>
				<div className={styles['merge-sidebar-block']}>
					<div className={classNames(styles['merge-sidebar-block-header'], styles.main)}>
						<Typography>Merge {moduleName}s</Typography>
						<Typography>{titleDescription}</Typography>
					</div>
					<Divider />
					<List className={styles['merge-list']}>
						<Sortable
							items={items}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
							// @ts-expect-error
							onSort={onSortModuleItems}
							renderItem={({ item: part, dragRef, dropRef, index }) => {
								return (
									<ListItem
										ref={dropRef}
										key={part.name}
										className={classNames(styles['merge-item'], styles.bordered)}
									>
										{dragRef && onSortModuleItems && (
											<div ref={dragRef}>
												<IconButton className={styles.dragger} size='small'>
													{faGripVertical}
												</IconButton>
											</div>
										)}
										<div className={styles['merge-item-info']}>
											<span>
												<Typography>{part.name}</Typography>
												<Typography>
													{moduleName} {index + 1}
												</Typography>
											</span>
											<span>
												<Typography>{part.wells}</Typography>
												<Typography>Wells</Typography>
											</span>
										</div>
									</ListItem>
								);
							}}
						/>
					</List>
				</div>
				<div className={styles['merge-sidebar-block']}>
					<div className={classNames(styles['merge-sidebar-block-header'], styles.main)}>
						<Typography>Merged {moduleName}</Typography>
						<Typography>Provide the additional information for the new {moduleName}</Typography>
					</div>
					<Divider />
					<TextField
						className={styles['merged-name']}
						inputRef={mergedNameInputRef}
						error={errorInName}
						label={`New ${moduleName} Name *`}
						value={mergedName}
						onBlur={() => {
							onNameChange(mergedName);
						}}
						onChange={(e) => setMergedName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !errorInName) {
								mergedNameInputRef.current?.blur();
								onNameChange(mergedName);
								e.preventDefault();
							}
						}}
						variant='outlined'
					/>
					{additionalInfo}
				</div>
				{beforeWells && <div className={styles['merge-sidebar-block']}>{beforeWells}</div>}
				<div className={styles['merge-sidebar-block']}>
					<div className={styles['merge-sidebar-block-header']}>
						<Typography>Merged {moduleName} Well Count</Typography>
						{wellsCountLabel && (
							<Typography
								css={
									resultingWellsCountExceeded || resultingWellsCollectionsCountExceeded
										? totalWellsCountExceededCSS
										: undefined
								}
							>
								{wellsCountLabel}
							</Typography>
						)}
					</div>
					<Divider />
					<List className={styles['merge-list']}>
						<ListItem className={styles['merge-item']}>
							<div className={styles['merge-item-info']}>
								<span>
									<Typography>Overlapping</Typography>
								</span>
								<span>
									<Typography className={styles['wells-count']}>{overlap}</Typography>
								</span>
							</div>
						</ListItem>
						<ListItem className={styles['merge-item']}>
							<div className={styles['merge-item-info']}>
								<span>
									<Typography>Merged {moduleName} Final</Typography>
								</span>
								<span>
									<Tooltip
										enterDelay={0}
										title={
											resultingWellsCountExceeded
												? `Limit is ${maxNumberOfWellsInMerged} wells`
												: ''
										}
									>
										<Typography
											css={resultingWellsCountExceeded ? totalWellsCountExceededCSS : undefined}
											className={styles['wells-count']}
										>
											{total}
										</Typography>
									</Tooltip>
								</span>
							</div>
						</ListItem>
						{!isNil(totalWellsCollections) && (
							<ListItem className={styles['merge-item']}>
								<div className={styles['merge-item-info']}>
									<span>
										<Typography>Merged Wells Collections Final</Typography>
									</span>
									<span>
										<Tooltip
											enterDelay={0}
											title={
												resultingWellsCollectionsCountExceeded
													? `Limit is ${MAX_WELLS_COLLECTIONS_PER_MODULE} wells collections`
													: ''
											}
										>
											<Typography
												css={
													resultingWellsCollectionsCountExceeded
														? totalWellsCountExceededCSS
														: undefined
												}
												className={styles['wells-count']}
											>
												{totalWellsCollections}
											</Typography>
										</Tooltip>
									</span>
								</div>
							</ListItem>
						)}
					</List>
				</div>
			</div>
		);
	}

	return null;
};

export default MergeModuleItemsSidebar;
