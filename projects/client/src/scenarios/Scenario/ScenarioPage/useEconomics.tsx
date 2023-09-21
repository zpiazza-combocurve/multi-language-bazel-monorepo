import { useCallback, useState } from 'react';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { useLocalStorageState } from '@/components/hooks';
import { EconSettingsDialog } from '@/economics/EconSettingsDialog';
import { LastGhgRunQuery, LastRunSummaryQuery } from '@/economics/shared/queries';
import { ECON_RUN_CACHE_RESET_FLAG, clearEconRunOutputCache } from '@/economics/shared/shared';
import { genericErrorAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { TaskByKindIdQuery, taskIsPending } from '@/helpers/task';
import { pluralize } from '@/helpers/text';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useEconGroups } from '@/scenarios/api';

export function useEconomics({ project, scenario, maxCombos }) {
	const [economicsVisibility, setEconomicsVisibility] = useState<'visible' | 'expanded' | 'hidden'>('hidden');
	const [runEconomicsStarted, setRunEconomicsStarted] = useState<boolean>(false);

	const [shouldResetEconCache, setShouldResetEconCache] = useLocalStorageState(ECON_RUN_CACHE_RESET_FLAG, false);

	const [econSettingsDialog, promptEconSettingsDialog] = useDialog(EconSettingsDialog, {
		setShouldResetEconCache,
		maxCombos,
	});

	const track = useTrackAnalytics();

	const runQuery = LastRunSummaryQuery.useQuery(scenario._id);
	const ghgRunQuery = LastGhgRunQuery.useQuery(scenario._id);

	const taskQuery = TaskByKindIdQuery.useQuery(runQuery.data?.run?._id as string, {
		enabled: !!runQuery.data?.run?._id,
	});

	const economicsNotificationCallback = useCallback(
		(notificationUpdate) => {
			if (notificationUpdate.extra?.body?.scenarioId === scenario?._id) {
				const isNotificationGhg = !!notificationUpdate.extra?.body?.isGhg;
				const invalidate = () => {
					const taskId = isNotificationGhg ? ghgRunQuery.data?._id : runQuery.data?.run?._id;
					TaskByKindIdQuery.invalidate(taskId as string);
					if (isNotificationGhg) {
						LastGhgRunQuery.invalidate(scenario._id);
					} else {
						LastRunSummaryQuery.invalidate(scenario._id);
					}
				};
				if (notificationUpdate.status === TaskStatus.FAILED) {
					setRunEconomicsStarted(false);
					setShouldResetEconCache(false);
					invalidate();
				} else if (notificationUpdate.status === TaskStatus.COMPLETED) {
					if (shouldResetEconCache) {
						clearEconRunOutputCache();
						setShouldResetEconCache(false);
					}
					setRunEconomicsStarted(false);
					setEconomicsVisibility('visible');
					invalidate();
				}
			}
		},
		[
			ghgRunQuery.data?._id,
			runQuery.data?.run?._id,
			scenario._id,
			shouldResetEconCache,
			setShouldResetEconCache,
			setRunEconomicsStarted,
		]
	);

	useUserNotificationCallback(NotificationType.ECONOMICS, economicsNotificationCallback);

	const { econGroups } = useEconGroups(scenario._id);

	const runEconomics = async (
		scenarioWellAssignmentIds: Inpt.ObjectId<'scenario-well-assignment'>[],
		econGroupIds?: string[]
	) => {
		if (!project || !scenario) {
			return;
		}

		const wellsPluralizedText =
			(!!scenarioWellAssignmentIds?.length &&
				pluralize(scenarioWellAssignmentIds?.length ?? 0, 'well', 'wells')) ||
			'';
		const econGroupsPluralizedText =
			(!!econGroupIds?.length && pluralize(econGroupIds?.length ?? 0, 'group', 'groups')) || '';
		const wellsAndGroups = (wellsPluralizedText && econGroupsPluralizedText) || '';
		const wellsAndGroupsText = `${wellsPluralizedText}${wellsAndGroups ? ', ' : ''}${econGroupsPluralizedText}`;
		const econRunText = `Run Scenario (${wellsAndGroupsText})`;

		const scenarioWellAssignmentIdsSet = new Set(scenarioWellAssignmentIds);
		const wellsInGroup = econGroups.some(({ assignments }) =>
			assignments.some((assignmentId) => scenarioWellAssignmentIdsSet.has(assignmentId.toString()))
		);
		const hasGroups = wellsInGroup || econGroupIds?.length;

		const result = await promptEconSettingsDialog({
			scenarioId: scenario._id,
			runText: econRunText,
			wellsAmount: scenarioWellAssignmentIds.length + (econGroupIds?.length ?? 0),
			hasGroups,
		});

		if (!result) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const { runMode, suggestedHeaders, prodAnalyticsType, runModels, ...setting } = result as any;
		setRunEconomicsStarted(true);

		const payload = {
			project: project._id,
			runMode,
			suggestedHeaders,
			prodAnalyticsType,
			scenarioWellAssignmentIds,
			setting,
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			runModels,
			econGroupIds,
		};

		try {
			await postApi(`/economics/runMultiEcon/${scenario._id}`, payload);
			track(EVENTS.scenario.run, { runModels });
		} catch (err) {
			setRunEconomicsStarted(false);
			genericErrorAlert(err, 'Economics run failed');
		}
	};

	const runningEconomics =
		runEconomicsStarted ||
		taskQuery.isLoading ||
		(taskQuery.data && taskIsPending(taskQuery.data)) ||
		runQuery.data?.run?.status === 'pending';

	return {
		economicsVisibility,
		setEconomicsVisibility,
		runEconomics,
		dialog: econSettingsDialog,
		runningEconomics,
	};
}
