import classNames from 'classnames';
import { useCallback, useMemo, useState } from 'react';

import { Divider } from '@/components/v2';

import MergedQualifiers from './MergedQualifiers';
import Qualifiers from './Qualifiers';
import {
	createMergedQualifierFromSingleQualifier,
	createMergedQualifierPart,
	getMergedQualifierPartUniqueKey,
} from './helpers';
import styles from './merge-scenarios.module.scss';
import { AssumptionWithQualifiers, MergedQualifier } from './models';

const MergeAssumptionQualifiersWorkspace = ({
	assumptionDetails,
	mergedScenarioName,
	order,
	mergedScenarioQualifiers,
	addMergedQualifiers,
	updateMergedQualifier,
	deleteMergedQualifier,
}: {
	assumptionDetails: AssumptionWithQualifiers;
	mergedScenarioName: string;
	order: string[];
	mergedScenarioQualifiers: MergedQualifier[];
	addMergedQualifiers: (updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[]) => void;
	updateMergedQualifier: (assumption: string, updatedQualifier: MergedQualifier) => void;
	deleteMergedQualifier: (assumption: string, key: string) => void;
}) => {
	const [qualifierKeysToHighlight, setQualifierKeysToHighlight] = useState<string[]>([]);

	const usedInMergeQualifiers = useMemo(() => {
		const qualifiers: { key: string; color: string }[] = [];

		mergedScenarioQualifiers.forEach((q) => {
			q.qualifiers.forEach((qq) => {
				qualifiers.push({
					key: qq.key,
					color: q.color,
				});
			});
		});

		return qualifiers;
	}, [mergedScenarioQualifiers]);

	const usedInMergeQualifierKeys = useMemo(() => {
		return usedInMergeQualifiers.map((q) => q.key);
	}, [usedInMergeQualifiers]);

	const firstScenario =
		order[0] === assumptionDetails.firstScenario._id
			? assumptionDetails.firstScenario
			: assumptionDetails.secondScenario;
	const secondScenario =
		order[1] === assumptionDetails.firstScenario._id
			? assumptionDetails.firstScenario
			: assumptionDetails.secondScenario;

	const onAddQualifier = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(scenario: any, qualifier: any) => {
			const qualifierToAdd = createMergedQualifierFromSingleQualifier(scenario, assumptionDetails.key, qualifier);

			addMergedQualifiers([{ assumption: assumptionDetails.key, qualifiersToAdd: [qualifierToAdd] }]);
		},
		[addMergedQualifiers, assumptionDetails.key]
	);

	const bringAllScenarioQualifiers = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(scenario: any) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const qualifiers: any[] = [];

			scenario.qualifiers.forEach((q) => {
				if (
					usedInMergeQualifierKeys.indexOf(
						getMergedQualifierPartUniqueKey(scenario._id, assumptionDetails.key, q.key)
					) < 0
				) {
					qualifiers.push(createMergedQualifierFromSingleQualifier(scenario, assumptionDetails.key, q));
				}
			});

			if (qualifiers.length > 0) {
				addMergedQualifiers([{ assumption: assumptionDetails.key, qualifiersToAdd: qualifiers }]);
			}
		},
		[addMergedQualifiers, assumptionDetails.key, usedInMergeQualifierKeys]
	);

	const onMergeQualifiersByName = useCallback(() => {
		const qualifiers: MergedQualifier[] = [];

		firstScenario.qualifiers.forEach((q1) => {
			secondScenario.qualifiers.forEach((q2) => {
				if (q1.name === q2.name) {
					const qualifierPart1 = createMergedQualifierPart(q1, firstScenario, assumptionDetails.key, true);
					const qualifierPart2 = createMergedQualifierPart(q2, secondScenario, assumptionDetails.key, false);

					if (
						usedInMergeQualifierKeys.indexOf(qualifierPart1.key) < 0 &&
						usedInMergeQualifierKeys.indexOf(qualifierPart2.key) < 0
					) {
						qualifiers.push({
							key: `${qualifierPart1.key}-${qualifierPart2.key}_${Date.now()}`,
							name: q1.name,
							assumption: assumptionDetails.key,
							color: '',
							qualifiers: [qualifierPart1, qualifierPart2],
						});
					}
				}
			});
		});

		if (qualifiers.length > 0) {
			addMergedQualifiers([{ assumption: assumptionDetails.key, qualifiersToAdd: qualifiers }]);
		}
	}, [addMergedQualifiers, assumptionDetails.key, firstScenario, secondScenario, usedInMergeQualifierKeys]);

	const onDeleteMergedQualifier = (key: string) => {
		deleteMergedQualifier(assumptionDetails.key, key);
	};

	const onUpdateMergedQualifier = useCallback(
		(qualifier: MergedQualifier) => {
			updateMergedQualifier(assumptionDetails.key, qualifier);
		},
		[assumptionDetails.key, updateMergedQualifier]
	);

	const onMergedQualifierMouseEnter = (usedQualifiers: string[]) => {
		setQualifierKeysToHighlight(usedQualifiers);
	};

	const onMergedQualifierMouseLeave = () => {
		setQualifierKeysToHighlight([]);
	};

	const onAddQualifierToMerged = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(mergedQualifier: MergedQualifier, qualifier: any) => {
			const scenario = [firstScenario, secondScenario].find((s) => s._id === qualifier.scenarioId);

			const qualifierPart = createMergedQualifierPart(qualifier, scenario, assumptionDetails.key, false);

			const newQualifierParts = [...mergedQualifier.qualifiers];
			newQualifierParts.push(qualifierPart);

			onUpdateMergedQualifier({ ...mergedQualifier, qualifiers: newQualifierParts });
		},
		[firstScenario, assumptionDetails.key, secondScenario, onUpdateMergedQualifier]
	);

	const isMergeByNameEnabled = useMemo(() => {
		for (let i = 0; i < firstScenario.qualifiers.length; ++i) {
			const q1 = firstScenario.qualifiers[i];

			for (let j = 0; j < secondScenario.qualifiers.length; ++j) {
				const q2 = secondScenario.qualifiers[j];

				if (q1.name === q2.name) {
					const q1Key = getMergedQualifierPartUniqueKey(firstScenario._id, assumptionDetails.key, q1.key);
					const q2Key = getMergedQualifierPartUniqueKey(secondScenario._id, assumptionDetails.key, q2.key);

					if (usedInMergeQualifierKeys.indexOf(q1Key) < 0 && usedInMergeQualifierKeys.indexOf(q2Key) < 0) {
						return true;
					}
				}
			}
		}

		return false;
	}, [
		firstScenario._id,
		firstScenario.qualifiers,
		assumptionDetails.key,
		secondScenario._id,
		secondScenario.qualifiers,
		usedInMergeQualifierKeys,
	]);

	const isCreateByDropEnabled = useMemo(() => {
		for (let i = 0; i < firstScenario.qualifiers.length; ++i) {
			const q1 = firstScenario.qualifiers[i];

			const q1Key = getMergedQualifierPartUniqueKey(firstScenario._id, assumptionDetails.key, q1.key);

			if (usedInMergeQualifierKeys.indexOf(q1Key) < 0) {
				return true;
			}
		}

		for (let j = 0; j < secondScenario.qualifiers.length; ++j) {
			const q2 = secondScenario.qualifiers[j];

			const q2Key = getMergedQualifierPartUniqueKey(secondScenario._id, assumptionDetails.key, q2.key);

			if (usedInMergeQualifierKeys.indexOf(q2Key) < 0) {
				return true;
			}
		}

		return false;
	}, [
		firstScenario._id,
		firstScenario.qualifiers,
		assumptionDetails.key,
		secondScenario._id,
		secondScenario.qualifiers,
		usedInMergeQualifierKeys,
	]);

	return (
		<div
			css={`
				display: ${assumptionDetails.expanded ? 'block' : 'none'};
			`}
			className={styles['merge-workspace']}
		>
			<div className={styles.columns}>
				<div className={styles['qualifiers-list-wrapper']}>
					<Qualifiers
						assumption={assumptionDetails.key}
						onAddQualifier={onAddQualifier}
						bringAllScenarioQualifiers={bringAllScenarioQualifiers}
						scenario={firstScenario}
						usedInMergeQualifiers={usedInMergeQualifiers}
						qualifierKeysToHighlight={qualifierKeysToHighlight}
					/>
					<Divider orientation='vertical' />
				</div>
				<div className={styles['qualifiers-list-wrapper']}>
					<Qualifiers
						assumption={assumptionDetails.key}
						onAddQualifier={onAddQualifier}
						bringAllScenarioQualifiers={bringAllScenarioQualifiers}
						scenario={secondScenario}
						usedInMergeQualifiers={usedInMergeQualifiers}
						qualifierKeysToHighlight={qualifierKeysToHighlight}
					/>
					<Divider orientation='vertical' />
				</div>
				<div className={classNames(styles['qualifiers-list-wrapper'], styles['merged-qualifiers-wrapper'])}>
					<MergedQualifiers
						assumption={assumptionDetails.key}
						scenarioName={mergedScenarioName}
						onAddQualifier={onAddQualifier}
						qualifiers={mergedScenarioQualifiers}
						onAddQualifierToMerged={onAddQualifierToMerged}
						onDeleteQualifier={onDeleteMergedQualifier}
						onUpdateQualifier={onUpdateMergedQualifier}
						onMergeQualifiersByName={onMergeQualifiersByName}
						onMergedQualifierMouseEnter={onMergedQualifierMouseEnter}
						onMergedQualifierMouseLeave={onMergedQualifierMouseLeave}
						mergeByNameEnabled={isMergeByNameEnabled}
						createByDropEnabled={isCreateByDropEnabled}
					/>
				</div>
			</div>
		</div>
	);
};

export default MergeAssumptionQualifiersWorkspace;
