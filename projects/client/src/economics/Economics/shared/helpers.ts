import { useMemo } from 'react';

import { useDerivedState } from '@/components/hooks';
import { FULL } from '@/economics/EconSettingsDialog';
import { LastGhgRunQuery, LastRunSummaryQuery } from '@/economics/shared/queries';
import { EconErrorDialog } from '@/economics/shared/shared';
import { withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';

import { buildAndDownloadMonthly } from '../../exports/ExportButton/helpers';
import { useEconDownloadDialog as useDownloadFile } from './EconDownloadDialog';

export const econRunHasErrors = (run?: Inpt.EconRun) =>
	!!run &&
	run.status !== 'pending' &&
	!(
		(run.scenarioWellAssignments?.length > 0 || run.econGroups?.length > 0) &&
		(run.outputGroups?.all.length > 0 || !(run.outputParams.runMode === FULL))
	);

export { useDownloadFile };

export function useEconRunQuery(scenarioId) {
	const [askDownloadDialog, askDownload] = useDialog(EconErrorDialog);
	const [fileNameDialog, promptDownload] = useDownloadFile();

	const userRunQuery = LastRunSummaryQuery.useQuery(scenarioId, {
		onSuccess: async ({ run }) => {
			if (econRunHasErrors(run) && (await askDownload())) {
				const result = await promptDownload({ type: 'error' });

				if (!result) {
					return;
				}

				await withLoadingBar(buildAndDownloadMonthly(run, result.fileName, 'monthly'));
			}
		},
	});

	const ghgRunQuery = LastGhgRunQuery.useQuery(scenarioId);

	const [combo, setCombo] = useDerivedState(
		() => userRunQuery.data?.run.outputParams.combos.find((c) => c.selected && !c.invalid)?.name,
		[userRunQuery.data]
	);

	const econRunIds = useMemo(() => {
		if (!userRunQuery.data) {
			return [];
		}
		return userRunQuery.data.econRunData.filter(({ comboName }) => comboName === combo).map(({ _id }) => _id);
	}, [userRunQuery.data, combo]);

	return {
		ghgRunQuery,
		econRunIds,
		userRunQuery,
		askDownloadDialog,
		fileNameDialog,
		promptDownload,
		askDownload,
		combo,
		setCombo,
	};
}
