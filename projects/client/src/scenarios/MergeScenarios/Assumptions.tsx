import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Divider, Icon, List, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

import { MAX_NUMBER_OF_WELLS_IN_SCENARIO } from '../constants';
import AssumptionDetails from './AssumptionDetails';
import { MAX_NUMBER_OF_MERGED_QUALIFIERS } from './constants';
import {
	createMergedQualifierFromSingleQualifier,
	createMergedQualifierPart,
	getMergedQualifierPartUniqueKey,
} from './helpers';
import styles from './merge-scenarios.module.scss';
import { AssumptionWithQualifiers, MergeScenariosModel, MergedQualifier } from './models';

const Assumptions = ({
	total,
	firstScenario,
	secondScenario,
	mergedModel,
	addMergedQualifiers,
	updateMergedQualifier,
	deleteMergedQualifier,
	onReset,
	setUniqueAssumptionsForMergedScenario,
	mergeScenarios,
	isMergeInProgress,
}: {
	total: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	firstScenario: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	secondScenario: any;
	mergedModel: MergeScenariosModel;
	addMergedQualifiers: (updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[]) => void;
	updateMergedQualifier: (assumption: string, updatedQualifier: MergedQualifier) => void;
	deleteMergedQualifier: (assumption: string, key: string) => void;
	onReset: () => void;
	setUniqueAssumptionsForMergedScenario: (keys: string[]) => void;
	mergeScenarios: () => Promise<void>;
	isMergeInProgress: boolean;
}) => {
	const [assumptions, setAssumptions] = useState<AssumptionWithQualifiers[]>([]);

	const usedInMergeQualifierKeys = useMemo(() => {
		const qualifiers: string[] = [];

		Object.keys(mergedModel.assumptions).forEach((key) => {
			mergedModel.assumptions[key].qualifiers.forEach((q) => {
				q.qualifiers.forEach((qq) => {
					qualifiers.push(qq.key);
				});
			});
		});

		return qualifiers;
	}, [mergedModel.assumptions]);

	const { bringAllFromFirstDisabled, bringAllFromSecondDisabled, mergeAllByNameDisabled, resetAllDisabled } =
		useMemo(() => {
			let bringAllFromFirstDisabled = true;
			let bringAllFromSecondDisabled = true;
			let mergeAllByNameDisabled = true;
			const resetAllDisabled = !usedInMergeQualifierKeys.length;

			for (let i = 0; i < assumptions.length; ++i) {
				const assumptionData = assumptions[i];

				const firstScenarioOrdered =
					assumptionData.firstScenario._id === mergedModel.scenarios[0]
						? assumptionData.firstScenario
						: assumptionData.secondScenario;

				const secondScenarioOrdered =
					assumptionData.firstScenario._id === mergedModel.scenarios[1]
						? assumptionData.firstScenario
						: assumptionData.secondScenario;

				for (let q1Iterator = 0; q1Iterator < firstScenarioOrdered.qualifiers.length; ++q1Iterator) {
					const q1 = firstScenarioOrdered.qualifiers[q1Iterator];
					const q1UniqueKey = getMergedQualifierPartUniqueKey(
						firstScenarioOrdered._id,
						assumptionData.key,
						q1.key
					);

					if (bringAllFromFirstDisabled && usedInMergeQualifierKeys.indexOf(q1UniqueKey) < 0) {
						bringAllFromFirstDisabled = false;
					}

					for (let q2Iterator = 0; q2Iterator < secondScenarioOrdered.qualifiers.length; ++q2Iterator) {
						const q2 = secondScenarioOrdered.qualifiers[q2Iterator];
						const q2UniqueKey = getMergedQualifierPartUniqueKey(
							secondScenarioOrdered._id,
							assumptionData.key,
							q2.key
						);

						if (bringAllFromSecondDisabled && usedInMergeQualifierKeys.indexOf(q2UniqueKey) < 0) {
							bringAllFromSecondDisabled = false;
						}

						if (
							mergeAllByNameDisabled &&
							q1.name === q2.name &&
							usedInMergeQualifierKeys.indexOf(q1UniqueKey) < 0 &&
							usedInMergeQualifierKeys.indexOf(q2UniqueKey) < 0
						) {
							mergeAllByNameDisabled = false;
						}

						if (!bringAllFromFirstDisabled && !bringAllFromSecondDisabled && !mergeAllByNameDisabled) {
							break;
						}
					}

					if (!bringAllFromFirstDisabled && !bringAllFromSecondDisabled && !mergeAllByNameDisabled) {
						break;
					}
				}
			}

			return {
				bringAllFromFirstDisabled,
				bringAllFromSecondDisabled,
				mergeAllByNameDisabled,
				resetAllDisabled,
			};
		}, [assumptions, mergedModel.scenarios, usedInMergeQualifierKeys]);

	useEffect(() => {
		if (firstScenario && secondScenario && assumptions.length === 0) {
			const firstScenarioAssumptions = Object.keys(firstScenario.columns);
			const secondScenarioAssumptions = Object.keys(secondScenario.columns);
			let uniqueAssumptions = [...new Set([...firstScenarioAssumptions, ...secondScenarioAssumptions])];
			uniqueAssumptions = uniqueAssumptions.filter((ua) => Object.keys(QUALIFIER_FIELDS).indexOf(ua) > -1);

			const assumptionsWithQualifiers: AssumptionWithQualifiers[] = [];

			uniqueAssumptions.forEach((ua) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const firstScenarioQualifiers: any[] = [];
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const secondScenarioQualifiers: any[] = [];

				if (firstScenario.columns[ua]?.qualifiers) {
					Object.keys(firstScenario.columns[ua].qualifiers).forEach((k) => {
						firstScenarioQualifiers.push({
							key: k,
							...firstScenario.columns[ua].qualifiers[k],
						});
					});
				}

				if (secondScenario.columns[ua]?.qualifiers) {
					Object.keys(secondScenario.columns[ua].qualifiers).forEach((k) => {
						secondScenarioQualifiers.push({
							key: k,
							...secondScenario.columns[ua].qualifiers[k],
						});
					});
				}

				assumptionsWithQualifiers.push({
					key: ua,
					wasExpanded: false,
					expanded: false,
					firstScenario: {
						_id: firstScenario._id,
						name: firstScenario.name,
						qualifiers: firstScenarioQualifiers,
					},
					secondScenario: {
						_id: secondScenario._id,
						name: secondScenario.name,
						qualifiers: secondScenarioQualifiers,
					},
				});
			});

			setAssumptions(assumptionsWithQualifiers);
			setUniqueAssumptionsForMergedScenario(uniqueAssumptions);
		}
	}, [firstScenario, secondScenario, setUniqueAssumptionsForMergedScenario, assumptions]);

	const toggleAssumption = (expanded: boolean, assumption = '') => {
		setAssumptions(
			produce((draft: AssumptionWithQualifiers[]) => {
				draft.forEach((ua) => {
					if (assumption) {
						if (assumption === ua.key) {
							ua.expanded = expanded;
							ua.wasExpanded = ua.wasExpanded || expanded;
						}
					} else {
						ua.expanded = expanded;
						ua.wasExpanded = ua.wasExpanded || expanded;
					}
				});
			})
		);
	};

	const onExpand = (assumption = '') => {
		toggleAssumption(true, assumption);
	};

	const onCollapse = (assumption = '') => {
		toggleAssumption(false, assumption);
	};

	const canMergeScenarios = (): boolean => {
		if (!mergedModel.name) {
			return false;
		}

		for (let i = 0; i < assumptions.length; ++i) {
			const assumption = mergedModel.assumptions[assumptions[i].key];

			if (assumption.qualifiers.length > MAX_NUMBER_OF_MERGED_QUALIFIERS) {
				return false;
			}

			if (assumption.qualifiers.find((q) => !q.name)) {
				return false;
			}

			if (_.uniq(assumption.qualifiers.map((q) => q.name)).length !== assumption.qualifiers.length) {
				return false;
			}
		}

		return true;
	};

	const onBringAllScenarioQualifiers = useCallback(
		(orderIndex: number) => {
			const scenarioId = mergedModel.scenarios[orderIndex];

			const updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[] = [];

			assumptions.forEach((assumptionData, i) => {
				const scenario =
					assumptionData.firstScenario._id === scenarioId
						? assumptionData.firstScenario
						: assumptionData.secondScenario;

				updates.push({ assumption: assumptionData.key, qualifiersToAdd: [] });

				scenario.qualifiers.forEach((q) => {
					if (
						usedInMergeQualifierKeys.indexOf(
							getMergedQualifierPartUniqueKey(scenario._id, assumptionData.key, q.key)
						) < 0
					) {
						updates[i].qualifiersToAdd.push(
							createMergedQualifierFromSingleQualifier(scenario, assumptionData.key, q)
						);
					}
				});
			});

			addMergedQualifiers(updates);
		},
		[addMergedQualifiers, assumptions, mergedModel.scenarios, usedInMergeQualifierKeys]
	);

	const onMergeAllByNameAndBringRest = useCallback(() => {
		const updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[] = [];

		assumptions.forEach((assumptionData, i) => {
			const firstScenarioOrdered =
				assumptionData.firstScenario._id === mergedModel.scenarios[0]
					? assumptionData.firstScenario
					: assumptionData.secondScenario;

			const secondScenarioOrdered =
				assumptionData.firstScenario._id === mergedModel.scenarios[1]
					? assumptionData.firstScenario
					: assumptionData.secondScenario;

			updates.push({ assumption: assumptionData.key, qualifiersToAdd: [] });

			const usedInMergeByNameQualifierKeys: string[] = [];

			firstScenarioOrdered.qualifiers.forEach((q1) => {
				secondScenarioOrdered.qualifiers.forEach((q2) => {
					if (q1.name === q2.name) {
						const qualifierPart1 = createMergedQualifierPart(
							q1,
							firstScenarioOrdered,
							assumptionData.key,
							true
						);
						const qualifierPart2 = createMergedQualifierPart(
							q2,
							secondScenarioOrdered,
							assumptionData.key,
							false
						);

						if (
							usedInMergeQualifierKeys.indexOf(qualifierPart1.key) < 0 &&
							usedInMergeQualifierKeys.indexOf(qualifierPart2.key) < 0
						) {
							updates[i].qualifiersToAdd.push({
								key: `${qualifierPart1.key}-${qualifierPart2.key}_${Date.now()}`,
								name: q1.name,
								assumption: assumptionData.key,
								color: '',
								qualifiers: [qualifierPart1, qualifierPart2],
							});

							usedInMergeByNameQualifierKeys.push(qualifierPart1.key);
							usedInMergeByNameQualifierKeys.push(qualifierPart2.key);
						}
					}
				});
			});

			firstScenarioOrdered.qualifiers.forEach((q1) => {
				const q1UniqueKey = getMergedQualifierPartUniqueKey(
					firstScenarioOrdered._id,
					assumptionData.key,
					q1.key
				);

				if (
					usedInMergeQualifierKeys.indexOf(q1UniqueKey) < 0 &&
					usedInMergeByNameQualifierKeys.indexOf(q1UniqueKey) < 0
				) {
					updates[i].qualifiersToAdd.push(
						createMergedQualifierFromSingleQualifier(firstScenarioOrdered, assumptionData.key, q1)
					);
				}
			});

			secondScenarioOrdered.qualifiers.forEach((q2) => {
				const q2UniqueKey = getMergedQualifierPartUniqueKey(
					secondScenarioOrdered._id,
					assumptionData.key,
					q2.key
				);

				if (
					usedInMergeQualifierKeys.indexOf(q2UniqueKey) < 0 &&
					usedInMergeByNameQualifierKeys.indexOf(q2UniqueKey) < 0
				) {
					updates[i].qualifiersToAdd.push(
						createMergedQualifierFromSingleQualifier(secondScenarioOrdered, assumptionData.key, q2)
					);
				}
			});
		});

		addMergedQualifiers(updates);
	}, [addMergedQualifiers, assumptions, mergedModel.scenarios, usedInMergeQualifierKeys]);

	if (assumptions.length > 0) {
		const expandAllDisabled = assumptions.filter((a) => a.expanded).length === assumptions.length;
		const collapseAllDisabled = assumptions.filter((a) => !a.expanded).length === assumptions.length;
		const resultingWellsCountExceeded = total > MAX_NUMBER_OF_WELLS_IN_SCENARIO;
		const mergeButtonDisabled = !canMergeScenarios() || isMergeInProgress || resultingWellsCountExceeded;

		return (
			<div className={styles['assumptions-container']}>
				<div className={styles['customize-qualifiers']}>
					<div className={styles['description-with-buttons']}>
						<Typography>Customize Qualifiers</Typography>
						<Icon
							fontSize='small'
							tooltipTitle='Choose and prioritize qualifiers to merge from each scenario'
						>
							{faInfoCircle}
						</Icon>
						<Button
							css={!expandAllDisabled ? `color: ${theme.secondaryColor};` : undefined}
							className={styles['toggle-all']}
							disabled={expandAllDisabled}
							onClick={() => onExpand()}
						>
							Expand all
						</Button>
						<Button
							css={!collapseAllDisabled ? `color: ${theme.secondaryColor};` : undefined}
							className={styles['toggle-all']}
							disabled={collapseAllDisabled}
							onClick={() => onCollapse()}
						>
							Collapse all
						</Button>
						<Divider orientation='vertical' />
						<Button
							css={!bringAllFromFirstDisabled ? `color: ${theme.secondaryColor};` : undefined}
							className={styles['mass-update']}
							disabled={bringAllFromFirstDisabled}
							onClick={() => onBringAllScenarioQualifiers(0)}
						>
							Bring all from scenario 1
						</Button>
						<Button
							css={!bringAllFromSecondDisabled ? `color: ${theme.secondaryColor};` : undefined}
							className={styles['mass-update']}
							disabled={bringAllFromSecondDisabled}
							onClick={() => onBringAllScenarioQualifiers(1)}
						>
							Bring all from scenario 2
						</Button>
						<Button
							css={!mergeAllByNameDisabled ? `color: ${theme.secondaryColor};` : undefined}
							className={styles['mass-update']}
							disabled={
								mergeAllByNameDisabled && 'No available qualifiers left that can be merged by name'
							}
							onClick={onMergeAllByNameAndBringRest}
						>
							Bring all and merge duplicates
						</Button>
						<Button
							css={!resetAllDisabled ? `color: ${theme.warningColor};` : undefined}
							className={styles['mass-update']}
							disabled={resetAllDisabled}
							onClick={onReset}
						>
							Reset
						</Button>
					</div>
					<Button
						color='secondary'
						variant='contained'
						disabled={mergeButtonDisabled}
						onClick={mergeScenarios}
					>
						Merge
					</Button>
				</div>
				<Divider />
				<List className={styles['assumptions-list']}>
					{assumptions.map((a) => (
						<AssumptionDetails
							key={a.key}
							assumptionDetails={a}
							mergedModel={mergedModel}
							onExpand={onExpand}
							onCollapse={onCollapse}
							addMergedQualifiers={addMergedQualifiers}
							updateMergedQualifier={updateMergedQualifier}
							deleteMergedQualifier={deleteMergedQualifier}
						/>
					))}
				</List>
			</div>
		);
	}

	return null;
};

export default Assumptions;
