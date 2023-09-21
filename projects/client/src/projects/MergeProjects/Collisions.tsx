import { useCallback } from 'react';

import ModuleCollisions from './ModuleCollisions';
import styles from './merge-projects.module.scss';
import { CollisionsModel, ModulesExpandStateModel, ProjectToMergeModel } from './models';

const Collisions = ({
	firstProject,
	secondProject,
	collisions,
	modulesExpandState,
	duplicateNamePart,
	duplicateNameModifier,
	expandModule,
	collapseModule,
}: {
	firstProject: ProjectToMergeModel;
	secondProject: ProjectToMergeModel;
	collisions: CollisionsModel | null;
	modulesExpandState: ModulesExpandStateModel;
	duplicateNamePart: string;
	duplicateNameModifier: string;
	expandModule: (key?: string) => void;
	collapseModule: (key?: string) => void;
}) => {
	const onToggle = useCallback(
		(key: string) => (modulesExpandState[key] ? collapseModule(key) : expandModule(key)),
		[collapseModule, expandModule, modulesExpandState]
	);

	if (!collisions) {
		return null;
	}

	return (
		<div className={styles.collisions}>
			{Object.keys(collisions).map((module) => {
				return (
					<ModuleCollisions
						key={module}
						expanded={modulesExpandState[module]}
						onToggle={onToggle}
						firstProject={firstProject}
						secondProject={secondProject}
						identifier={module}
						collisions={collisions[module]}
						duplicateNamePart={duplicateNamePart}
						duplicateNameModifier={duplicateNameModifier}
					/>
				);
			})}
		</div>
	);
};

export default Collisions;
