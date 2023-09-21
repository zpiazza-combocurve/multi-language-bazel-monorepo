import { ICellRendererParams } from 'ag-grid-community';
import { useMemo } from 'react';

import { getItem } from '@/components/ContextMenu';
import { AssumptionKey } from '@/inpt-shared/constants';

import CellRenderer from './CellRenderer';

export function HeaderCellRenderer(params: ICellRendererParams) {
	const {
		node: { data: assignment },
		context: { canUpdateScenario, chooseModel, showWellDialog },
	} = params;

	const text = assignment?.isWellsCollectionCase ? 'View Wells Collection' : 'View Well';

	const items = useMemo(() => {
		return [
			getItem(text, () => showWellDialog(assignment)),
			getItem(
				'Edit Econ',
				() => chooseModel({ assumptionKey: AssumptionKey.reservesCategory, assignment }),
				!canUpdateScenario
			),
		];
	}, [chooseModel, canUpdateScenario, showWellDialog, assignment, text]);

	return <CellRenderer {...params} items={assignment.isGroupCase ? null : items} />;
}
