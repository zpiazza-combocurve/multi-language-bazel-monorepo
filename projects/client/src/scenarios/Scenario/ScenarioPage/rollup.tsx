import { useCallback } from 'react';

import { useDialog } from '@/helpers/dialog';
import { useRollup } from '@/scenarios/api';
import RollUpChartDialog from '@/scenarios/roll-up-chart/RollUpChartDialog';
import RollUpDialog from '@/scenarios/roll-up-chart/RollUpDialog';

export function useRollupData(
	scenarioId: string,
	selectedAssignmentIds: string[],
	{ scenarioName, projectName }: { scenarioName: string; projectName: string }
) {
	const { rollUp, reload } = useRollup(scenarioId);

	const [rollupDialog, promptRollup] = useDialog(RollUpDialog, {
		scenarioId,
		scenarioWellAssignments: selectedAssignmentIds,
	});

	const viewRollUp = useCallback(async () => {
		const curTask = await promptRollup();
		if (curTask) {
			reload();
		}
	}, [promptRollup, reload]);

	const [rollupChart, viewRollUpChart] = useDialog(({ onHide, ...props }) => (
		<RollUpChartDialog
			{...props}
			data={{ ...rollUp?.data, scenarioName }}
			scenarioId={scenarioId}
			scenarioWellAssignments={selectedAssignmentIds}
			hideDialog={onHide}
			close={onHide}
			rollUpType='scenario'
			runId={rollUp?._id}
			titleItems={[
				`Project: ${projectName}`,
				`Scenario: ${scenarioName}`,
				`Last Run: ${new Date(rollUp?.runDate).toLocaleString()}`,
			]}
		/>
	));

	return {
		rollUpData: rollUp?.data,
		viewRollUp,
		viewRollUpChart,
		rollupDialog,
		rollupChart,
		reload,
	};
}
