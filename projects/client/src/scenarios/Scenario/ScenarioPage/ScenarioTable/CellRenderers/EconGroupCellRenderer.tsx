import { ICellRendererParams } from 'ag-grid-community';
import { useMemo } from 'react';

import { getItem } from '@/components/ContextMenu';
import { GroupDialogMode } from '@/scenarios/Scenario/ScenarioPage/groups/CreateGroupDialog/types';

import CellRenderer from './CellRenderer';

export function EconGroupCellRenderer(params: ICellRendererParams & { canUpdateScenario: boolean }) {
	const {
		node: { data: assignment },
		context: { showGroupDialog, handleUpdateEconGroup },
		canUpdateScenario,
	} = params;

	const items = useMemo(() => {
		return assignment?.isGroupCase
			? [
					getItem(
						'Edit Group Properties',
						async () => {
							handleUpdateEconGroup(
								await showGroupDialog({
									mode: GroupDialogMode.edit,
									currentGroupData: assignment.econGroup,
								})
							);
						},
						!canUpdateScenario
					),
			  ]
			: undefined;
	}, [assignment.econGroup, assignment?.isGroupCase, handleUpdateEconGroup, showGroupDialog, canUpdateScenario]);

	return <CellRenderer {...params} items={items} />;
}
