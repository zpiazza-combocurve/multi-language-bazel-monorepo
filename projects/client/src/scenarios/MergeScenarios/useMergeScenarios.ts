import produce from 'immer';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import theme from '@/helpers/styled';
import { ModuleBasicInfo } from '@/module-list/Merge/models';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { mergeScenarios } from '@/scenarios/api';
import { URLS } from '@/urls';

import { Assumptions, MergeScenariosModel, MergedQualifier } from './models';

const useMergeScenarios = (firstScenarioId: string, secondScenarioId: string) => {
	const [name, setName] = useState<string>('');
	const [assumptions, setAssumptions] = useState<Assumptions>({});
	const { project } = useAlfa(['project']);
	const [scenarios, setScenarios] = useState<string[]>([firstScenarioId, secondScenarioId]);
	const navigate = useNavigate();
	const [isMergeInProgress, setIsMergeInProgress] = useState<boolean>(false);

	const sortScenarios = useCallback((sorted: ModuleBasicInfo[]) => {
		setScenarios(sorted.map((p) => p.id));
	}, []);

	const setUniqueAssumptions = useCallback(
		(keys: string[]) => {
			if (Object.keys(assumptions).length === 0) {
				const updatedAssumptions: Assumptions = {};

				keys.forEach((k) => {
					updatedAssumptions[k] = {
						qualifiers: [],
					};
				});

				setAssumptions(updatedAssumptions);
			}
		},
		[assumptions]
	);

	const addQualifiers = useCallback((updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[]) => {
		setAssumptions(
			produce((draft: Assumptions) => {
				updates.forEach((update) => {
					if (update.qualifiersToAdd.length > 0) {
						update.qualifiersToAdd.forEach((q) => {
							q.color = q.qualifiers.length > 1 ? theme.primaryColorRGB : theme.secondaryColorRGB;
						});

						draft[update.assumption].qualifiers = [
							...draft[update.assumption].qualifiers,
							...update.qualifiersToAdd,
						];
					}
				});
			})
		);
	}, []);

	const updateQualifier = useCallback((assumption: string, updatedQualifier: MergedQualifier) => {
		setAssumptions(
			produce((draft: Assumptions) => {
				const newQualifiers = draft[assumption].qualifiers;

				for (let i = 0; i < newQualifiers.length; ++i) {
					if (newQualifiers[i].key === updatedQualifier.key) {
						newQualifiers[i] = {
							...updatedQualifier,
							color:
								updatedQualifier.qualifiers.length > 1
									? theme.primaryColorRGB
									: theme.secondaryColorRGB,
						};
						draft[assumption].qualifiers = newQualifiers;

						break;
					}
				}
			})
		);
	}, []);

	const deleteQualifier = useCallback((assumption: string, key: string) => {
		setAssumptions(
			produce((draft: Assumptions) => {
				if (key) {
					draft[assumption].qualifiers = draft[assumption].qualifiers.filter((q) => q.key !== key);
				} else {
					draft[assumption].qualifiers = [];
				}
			})
		);
	}, []);

	const reset = useCallback(() => {
		setAssumptions(
			produce((draft: Assumptions) => {
				Object.keys(draft).forEach((assumption) => {
					draft[assumption].qualifiers = [];
				});
			})
		);
	}, []);

	const model = useMemo<MergeScenariosModel>(() => {
		return {
			name,
			projectId: project?._id as string,
			scenarios,
			assumptions,
		};
	}, [name, project?._id, scenarios, assumptions]);

	const mergeScenariosNotificationCallback = useCallback(
		(notification) => {
			const scenarios = notification.extra?.body?.scenarios;

			if (
				scenarios?.length > 1 &&
				((scenarios[0] === firstScenarioId && scenarios[1] === secondScenarioId) ||
					(scenarios[1] === firstScenarioId && scenarios[0] === secondScenarioId))
			) {
				if (notification.status === TaskStatus.COMPLETED) {
					if (project?._id) {
						navigate(URLS.project(project?._id).scenarios);
					} else {
						navigate(URLS.scenarios);
					}
				} else if (notification.status === TaskStatus.FAILED) {
					setIsMergeInProgress(false);
				}
			}
		},
		[firstScenarioId, navigate, secondScenarioId, project?._id]
	);
	useUserNotificationCallback(NotificationType.MERGE_SCENARIOS, mergeScenariosNotificationCallback);

	const mergeChosenScenarios = useCallback(async () => {
		const body = {
			scenarios: model.scenarios,
			name: model.name,
			projectId: model.projectId,
			assumptions: {},
		};

		Object.keys(model.assumptions).forEach((assumption) => {
			body.assumptions[assumption] = {
				qualifiers: [],
			};

			model.assumptions[assumption].qualifiers.forEach((q, i) => {
				body.assumptions[assumption].qualifiers.push({
					name: q.name,
					qualifiers: [],
				});

				q.qualifiers.forEach((qq) => {
					body.assumptions[assumption].qualifiers[i].qualifiers.push({
						originalKey: qq.originalKey,
						prior: qq.prior,
						scenarioId: qq.scenarioId,
					});
				});
			});
		});

		setIsMergeInProgress(true);

		try {
			await mergeScenarios(body);
		} catch (error) {
			genericErrorAlert(error);
			setIsMergeInProgress(false);
		}
	}, [model]);

	return {
		setName,
		sortScenarios,
		model,
		addQualifiers,
		updateQualifier,
		deleteQualifier,
		reset,
		setUniqueAssumptions,
		mergeScenarios: mergeChosenScenarios,
		isMergeInProgress,
	};
};

export default useMergeScenarios;
