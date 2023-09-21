import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useScenario } from '@/scenarios/api';

import QualifierImportDialog from './QualifierImportDialog';
import QualifierManageDialog from './QualifierManageDialog';
import QualifierMergeDialog from './QualifierMergeDialog';
import QualifierSaveDialog from './QualifierSaveDialog';
import { generateDefaultName } from './helpers';

export function useQualifiers({ scenarioId, qualifierColumns, reload, selectedAssignmentIds }) {
	const reloadQualifiers = useCallback((assumptionKey) => reload(undefined, [assumptionKey]), [reload]);

	const [createDialog, showCreateDialog] = useDialog(QualifierSaveDialog);
	const [manageDialog, showManageDialog] = useDialog(QualifierManageDialog);
	const [mergeDialog, showMergeDialog] = useDialog(QualifierMergeDialog);
	const [importDialog, showImportDialog] = useDialog(QualifierImportDialog);
	const qualifierDialogs = (
		<>
			{createDialog}
			{manageDialog}
			{mergeDialog}
			{importDialog}
		</>
	);

	const { partialUpdate: updateScenario } = useScenario(scenarioId);

	const { mutateAsync: createQualifier } = useMutation(async ({ assumptionKey }: { assumptionKey: string }) => {
		const name = await showCreateDialog({
			initialName: generateDefaultName(
				assumptionKey,
				Object.values(qualifierColumns?.[assumptionKey]?.qualifiers || {})
			),
		});
		if (!name) {
			return;
		}
		const { scenario: newScenario } = await withLoadingBar(
			postApi(`/scenarios/${scenarioId}/createQualifier`, {
				activate: true,
				column: assumptionKey,
				name,
			})
		);
		updateScenario({ columns: newScenario.columns });
		reloadQualifiers(assumptionKey);
		confirmationAlert(`Qualifier "${name}" was created.`);
	});

	const { mutateAsync: manageQualifiers } = useMutation(async ({ assumptionKey }: { assumptionKey: string }) => {
		showManageDialog({
			initialColumn: assumptionKey,
			scenarioId,
			updateScenario,
		});
		reloadQualifiers(assumptionKey);
	});
	const { mutateAsync: mergeQualifiers } = useMutation(async ({ assumptionKey }: { assumptionKey: string }) => {
		const result = await showMergeDialog({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			qualifiers: Object.entries<any>(qualifierColumns[assumptionKey].qualifiers).map(([key, qual]) => ({
				...qual,
				key,
			})),
			columnKey: assumptionKey,
			scenarioId,
		});
		if (!result) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const [partials] = result as [any]; // TODO: use scenario type here
		const { columns } = partials || {};

		if (columns) {
			updateScenario({ columns });
			reloadQualifiers(assumptionKey);
		}
	});

	const importQualifier = useCallback(
		async ({ assumptionKey }) => {
			await showImportDialog({
				scenarioId,
				column: assumptionKey,
				selectedAssignmentIds,
				qualifiers: qualifierColumns?.[assumptionKey]?.qualifiers,
			});
		},
		[showImportDialog, qualifierColumns, selectedAssignmentIds, scenarioId]
	);

	const { mutateAsync: changeQualifier } = useMutation(
		async ({ assumptionKey, qualifierKey }: { assumptionKey: string; qualifierKey: string }) => {
			const { columns } = await withLoadingBar(
				postApi(`/scenarios/${scenarioId}/activateQualifier`, {
					column: assumptionKey,
					key: qualifierKey,
				})
			);
			updateScenario({ columns });
			reloadQualifiers(assumptionKey);
			confirmationAlert(`Qualifier applied successfully.`);
		}
	);

	const importQualifierNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.targetScenarioId === scenarioId &&
				notification.extra?.body?.column
			) {
				const { columns } = await withLoadingBar(getApi(`/scenarios/getScenario/${scenarioId}`)); // TODO
				updateScenario({ columns });
				const assumptionKey = notification.extra.body.column;
				reloadQualifiers(assumptionKey);
			}
		},
		[reloadQualifiers, scenarioId, updateScenario]
	);
	useUserNotificationCallback(NotificationType.IMPORT_QUALIFIER, importQualifierNotificationCallback);

	return {
		qualifierDialogs,
		createQualifier,
		manageQualifiers,
		mergeQualifiers,
		importQualifier,
		changeQualifier,
	};
}
