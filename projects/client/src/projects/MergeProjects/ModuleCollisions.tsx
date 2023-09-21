import classnames from 'classnames';
import { useCallback } from 'react';

import { Chip, List, ListItem, Typography } from '@/components/v2';
import { toLocalDate } from '@/helpers/dates';

import ExpandableHeaderSection from './ExpandableHeaderSection';
import { MODULE_NAMES } from './constants';
import { getModuleDuplicateName } from './helpers';
import styles from './merge-projects.module.scss';
import { CollisionDetailsModel, ProjectCollisionModuleInfoModel, ProjectToMergeModel } from './models';

const CollisionsInfo = ({
	collisions,
	firstProject,
	secondProject,
	duplicateNamePart,
	duplicateNameModifier,
}: {
	collisions: ProjectCollisionModuleInfoModel[];
	firstProject: ProjectToMergeModel;
	secondProject: ProjectToMergeModel;
	duplicateNamePart: string;
	duplicateNameModifier: string;
}) => (
	<List className={styles['matching-names-list']}>
		<ListItem key='mathing-names-count' className={classnames(!collisions.length ? styles['no-matches'] : '')}>
			<div className={styles['duplicate-description']}>
				<Typography>
					{collisions.length > 0 ? firstProject.project.name : 'No similar names between projects.'}
				</Typography>
			</div>
			{collisions.length > 0 && (
				<div className={styles['duplicate-description']}>
					<Typography>{secondProject.project.name}</Typography>
				</div>
			)}
		</ListItem>
		{collisions.map((c) => {
			const first = c[firstProject.project._id];
			const second = c[secondProject.project._id];

			return (
				<ListItem key={first.name}>
					<div className={styles['duplicate-description']}>
						<Typography>
							{first.name}{' '}
							<Typography className={styles['module-item-details']}>
								{first.createdBy || 'N/A'} @ {first.createdAt ? toLocalDate(first.createdAt) : 'N/A'}
							</Typography>
						</Typography>
						{first.category && (
							<Typography className={styles['module-item-details']}>{first.category}</Typography>
						)}
					</div>
					<div className={styles['duplicate-description']}>
						<Typography>
							{getModuleDuplicateName(second.name, duplicateNamePart, duplicateNameModifier)}{' '}
							<Typography className={styles['module-item-details']}>
								{second.createdBy || 'N/A'} @ {second.createdAt ? toLocalDate(second.createdAt) : 'N/A'}
							</Typography>
						</Typography>
						{second.category && (
							<Typography className={styles['module-item-details']}>{second.category}</Typography>
						)}
					</div>
				</ListItem>
			);
		})}
	</List>
);

const ModuleCollisions = ({
	expanded,
	onToggle,
	identifier,
	collisions = { collisions: [] },
	firstProject,
	secondProject,
	duplicateNamePart,
	duplicateNameModifier,
}: {
	expanded: boolean;
	onToggle: (key: string) => void;
	identifier: string;
	collisions: CollisionDetailsModel;
	firstProject: ProjectToMergeModel;
	secondProject: ProjectToMergeModel;
	duplicateNamePart: string;
	duplicateNameModifier: string;
}) => {
	const collsionsArray = (collisions?.collisions || []) as ProjectCollisionModuleInfoModel[];
	const module = MODULE_NAMES[identifier];

	const toggle = useCallback(() => {
		onToggle(identifier);
	}, [identifier, onToggle]);

	return (
		<ExpandableHeaderSection
			expanded={expanded}
			onToggle={toggle}
			title={module}
			beforeToggle={
				<div className={styles['module-count-info']}>
					<Chip size='small' label={`Project 1: ${collisions?.[firstProject.project._id]?.length}`} />
					<Chip size='small' label={`Project 2: ${collisions?.[secondProject.project._id]?.length}`} />
					<Chip size='small' label={`Matching names: ${collsionsArray.length}`} />
				</div>
			}
		>
			<CollisionsInfo
				collisions={collsionsArray}
				firstProject={firstProject}
				secondProject={secondProject}
				duplicateNamePart={duplicateNamePart}
				duplicateNameModifier={duplicateNameModifier}
			/>
		</ExpandableHeaderSection>
	);
};

export default ModuleCollisions;
