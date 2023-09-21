import { useCallbackRef } from '@/components/hooks';
import { genericErrorAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';

import CCExportDialog from './CCExportDialog';
import { USES_DEFAULT } from './ExportToCsvDialog';

export const useCCExport = () => {
	const [ccExportDialog, showCCExportDialog] = useDialog(CCExportDialog);

	const ccExportOnClick = useCallbackRef(
		async ({ selectedAssignmentIds, tableHeaders, scenarioId, scenarioName, assumptionName, assumptionKey }) => {
			const needsDialog = USES_DEFAULT.includes(assumptionKey);

			let includeDefault = false;

			if (needsDialog) {
				const dialogResult = await showCCExportDialog({ assumptionName });

				if (!dialogResult) {
					return;
				}

				({ includeDefault } = dialogResult);
			}

			try {
				await postApi('/file-imports/cc-cc-export', {
					scenarioId,
					scenarioName,
					assumptionKey,
					assumptionName,
					selectedAssignmentIds,
					includeDefault,
					tableHeaders,
				});
			} catch (e) {
				genericErrorAlert(e);
			}
		}
	);

	return [ccExportDialog, ccExportOnClick] as const;
};

export default useCCExport;
