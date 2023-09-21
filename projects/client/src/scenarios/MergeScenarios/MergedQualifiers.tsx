import { Button, List, Typography } from '@/components/v2';
import { pluralize } from '@/helpers/text';

import CreateMergedQualifierDropPlaceholder from './CreateMergedQualifierDropPlaceholder';
import MergedQualifier from './MergedQualifier';
import styles from './merge-scenarios.module.scss';
import { MergedQualifier as MergedQualifierModel } from './models';

const MergedQualifiers = ({
	assumption,
	scenarioName,
	qualifiers,
	onAddQualifier,
	onAddQualifierToMerged,
	onUpdateQualifier,
	onDeleteQualifier,
	onMergedQualifierMouseEnter,
	onMergedQualifierMouseLeave,
	onMergeQualifiersByName,
	mergeByNameEnabled,
	createByDropEnabled,
}: {
	assumption: string;
	scenarioName: string;
	qualifiers: MergedQualifierModel[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifier: (scenarioObj: any, qualifier: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifierToMerged: (mergedQualifierObj: MergedQualifierModel, qualifierObj: any) => void;
	onUpdateQualifier: (qualifier: MergedQualifierModel) => void;
	onDeleteQualifier: (key: string) => void;
	onMergedQualifierMouseEnter: (usedQualifiers: string[]) => void;
	onMergedQualifierMouseLeave: () => void;
	onMergeQualifiersByName: () => void;
	mergeByNameEnabled: boolean;
	createByDropEnabled: boolean;
}) => {
	const onChangeName = (key: string, name: string) => {
		const qualifier = qualifiers.find((q) => q.key === key);

		if (qualifier) {
			onUpdateQualifier({
				...qualifier,
				name,
			});
		}
	};

	return (
		<>
			<div className={`${styles['qualifiers-header']} ${styles['merged-qualifiers-header']}`}>
				<Typography css='font-weight: bold; font-size: 14px;'>
					{scenarioName} ({pluralize(qualifiers.length, 'qualifier', 'qualifiers')})
				</Typography>
				<Button
					onClick={onMergeQualifiersByName}
					disabled={!mergeByNameEnabled && 'No available qualifiers left that can be merged by name'}
				>
					Merge duplicates
				</Button>
			</div>
			<List>
				{qualifiers.map((q) => {
					const hasUniqueName = !qualifiers.find((x) => x.key !== q.key && x.name === q.name);

					return (
						<MergedQualifier
							key={q.key}
							qualifier={q}
							onChangeName={onChangeName}
							onDelete={onDeleteQualifier}
							onUpdateQualifier={onUpdateQualifier}
							onAddQualifierToMerged={onAddQualifierToMerged}
							onMouseEnter={onMergedQualifierMouseEnter}
							onMouseLeave={onMergedQualifierMouseLeave}
							hasUniqueName={hasUniqueName}
						/>
					);
				})}
				{createByDropEnabled && (
					<CreateMergedQualifierDropPlaceholder assumption={assumption} onAddQualifier={onAddQualifier} />
				)}
			</List>
		</>
	);
};

export default MergedQualifiers;
